import { useState, useEffect, useCallback } from 'react';
import { captureException } from '@sentry/react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  where,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db, getStorageInstance, serverTimestamp } from '../utils/firebaseConfig';
import { compressImage, createThumbnail } from '../utils/imageCompression';
import { fetchCurrentWeather } from '../utils/weatherAPI';
import { resolveMunicipality } from '../utils/geoFencing';
import { FEED_PAGE_SIZE } from '../utils/constants';
import { checkLimit, formatResetTime } from '../utils/rateLimiter';
import { logAuditEvent, AuditEvent, AuditEventType } from '../utils/auditLogger';

const ADMIN_ROLES = ['superadmin_provincial'];

function isAdminRole(role = '') {
  return ADMIN_ROLES.includes(role) || role.startsWith('admin_') || role.endsWith('_admin');
}

function safeFileName(name = '') {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

export function useReports(filters = {}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    let q = query(
      collection(db, 'reports'),
      where('verification.status', '!=', 'resolved'),
      orderBy('timestamp', 'desc'),
      limit(FEED_PAGE_SIZE)
    );

    if (filters.municipality && filters.municipality !== 'all') {
      q = query(
        collection(db, 'reports'),
        where('verification.status', '!=', 'resolved'),
        where('location.municipality', '==', filters.municipality),
        orderBy('timestamp', 'desc'),
        limit(FEED_PAGE_SIZE)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        setReports(docs);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length >= FEED_PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        captureException(err, { tags: { component: 'useReports', action: 'onSnapshot' } });
        setError('Unable to load reports. Please check your connection or sign in again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters.municipality]);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !hasMore) return;

    try {
      const constraints = [
        collection(db, 'reports'),
        where('verification.status', '!=', 'resolved'),
        ...(filters.municipality && filters.municipality !== 'all'
          ? [where('location.municipality', '==', filters.municipality)]
          : []),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(FEED_PAGE_SIZE),
      ];

      const q = query(...constraints);

      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));

      setReports((prev) => [...prev, ...newDocs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length >= FEED_PAGE_SIZE);
    } catch (err) {
      setError(err?.message ?? 'Failed to load more reports');
    }
  }, [lastDoc, hasMore, filters.municipality]);

  return { reports, loading, error, loadMore, hasMore };
}

/**
 * Uploads image and video files to Firebase Storage.
 * Each file fails independently; failures are surfaced via uploadErrors.
 *
 * @param {File[]} imageFiles - Image files to upload
 * @param {File[]} videoFiles - Video files to upload
 * @param {object} storageInstance - Firebase storage instance
 * @param {object} storageModule - Firebase storage module (imported)
 * @returns {{ photoUrls: string[], thumbnailUrls: string[], videoUrls: string[], skippedFiles: number, uploadErrors: object[] }}
 */
export async function uploadMediaFiles(imageFiles, videoFiles, storageInstance, storageModule) {
  const { ref, uploadBytes, getDownloadURL } = storageModule;

  const imageResultsPromise = Promise.all(
    imageFiles.map(async (photo) => {
      try {
        const [compressed, thumbnail] = await Promise.all([
          compressImage(photo),
          createThumbnail(photo),
        ]);

        const uniqueId = crypto.randomUUID();
        const safeName = safeFileName(photo.name);
        const photoRef = ref(storageInstance, `reports/${uniqueId}_${safeName}`);
        const thumbRef = ref(storageInstance, `reports/thumbs/${uniqueId}_${safeName}`);

        await Promise.all([uploadBytes(photoRef, compressed), uploadBytes(thumbRef, thumbnail)]);

        const [photoUrl, thumbUrl] = await Promise.all([
          getDownloadURL(photoRef),
          getDownloadURL(thumbRef),
        ]);

        return { photoUrl, thumbUrl };
      } catch (err) {
        console.warn('Image upload failed, skipping:', photo.name, err);
        return null;
      }
    })
  );

  const videoUrlsPromise = Promise.all(
    videoFiles.map(async (video) => {
      try {
        const uniqueId = crypto.randomUUID();
        const safeName = safeFileName(video.name);
        const videoRef = ref(storageInstance, `reports/videos/${uniqueId}_${safeName}`);
        await uploadBytes(videoRef, video);
        return await getDownloadURL(videoRef);
      } catch (err) {
        console.warn('Video upload failed, skipping:', video.name, err);
        return null;
      }
    })
  );

  const [imageResults, videoUrls] = await Promise.all([imageResultsPromise, videoUrlsPromise]);

  const successfulImages = imageResults.filter(Boolean);
  const photoUrls = successfulImages.map((r) => r.photoUrl);
  const thumbnailUrls = successfulImages.map((r) => r.thumbUrl);
  const successfulVideos = videoUrls.filter(Boolean);
  const skippedFiles =
    imageFiles.length - successfulImages.length + (videoFiles.length - successfulVideos.length);

  const uploadErrors = [];
  imageResults.forEach((result, index) => {
    if (!result) {
      uploadErrors.push({ filename: imageFiles[index]?.name, type: 'image', index });
    }
  });
  videoUrls.forEach((result, index) => {
    if (!result) {
      uploadErrors.push({ filename: videoFiles[index]?.name, type: 'video', index });
    }
  });

  return { photoUrls, thumbnailUrls, videoUrls: successfulVideos, skippedFiles, uploadErrors };
}

/**
 * Fetches weather context for a given coordinate.
 * Errors fall back to an empty object.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Weather context object
 */
export async function fetchWeatherContext(lat, lng) {
  return fetchCurrentWeather(lat, lng).catch((e) => {
    console.warn('Could not fetch weather context:', e);
    return {};
  });
}

/**
 * Builds the Firestore report document shape.
 *
 * @param {object} reportData - Raw report form data
 * @param {{ photoUrls: string[], thumbnailUrls: string[], videoUrls: string[] }} media - Uploaded media URLs
 * @param {object} weatherContext - Weather context object
 * @param {object} user - Authenticated user object
 * @param {string} municipality - Resolved municipality name
 * @param {string} municipalityDetectionMethod - How municipality was detected
 * @returns {object} Firestore document shape
 */
export function buildReportDocument(
  reportData,
  { photoUrls, thumbnailUrls, videoUrls },
  weatherContext,
  user,
  municipality,
  municipalityDetectionMethod
) {
  return {
    timestamp: serverTimestamp(),
    reportType: reportData.reportType || 'situation',
    location: {
      lat: reportData.location.lat,
      lng: reportData.location.lng,
      municipality: municipality,
      barangay: reportData.location.barangay || '',
      street: reportData.location.street || '',
      accuracy: reportData.location.accuracy || 0,
      municipalityDetectionMethod,
    },
    disaster: {
      type: reportData.disaster.type,
      severity: reportData.disaster.severity,
      description: reportData.disaster.description,
      tags: reportData.disaster.tags || [],
    },
    media: {
      photos: photoUrls,
      videos: videoUrls,
      thumbnails: thumbnailUrls,
    },
    reporter: {
      userId: user.uid,
      name: user.isAnonymous ? 'Anonymous' : user.displayName || 'Anonymous',
      isAnonymous: user.isAnonymous ?? false,
      isVerifiedUser: false,
    },
    verification: {
      status: 'pending',
      verifiedBy: null,
      verifiedAt: null,
      verifierRole: null,
      notes: '',
      resolution: {
        resolvedBy: null,
        resolvedAt: null,
        evidencePhotos: [],
        resolutionNotes: '',
        actionsTaken: '',
        resourcesUsed: '',
      },
    },
    engagement: {
      views: 0,
      upvotes: 0,
      commentCount: 0,
      shares: 0,
    },
    weatherContext,
  };
}

export async function submitReport(reportData, evidenceFiles, user) {
  if (!user?.uid) {
    throw new Error('Authentication required to submit reports. Please sign in and try again.');
  }

  const rateLimitStatus = checkLimit('report_submission');
  if (!rateLimitStatus.allowed) {
    const error = new Error(
      `Rate limit exceeded. Please wait ${formatResetTime(rateLimitStatus.resetTime)} before submitting another report.`
    );
    error.code = 'rate_limited';
    error.resetTime = rateLimitStatus.resetTime;
    throw error;
  }

  // Detect municipality (sync, run first)
  const resolved = resolveMunicipality(
    reportData.location.lat,
    reportData.location.lng,
    reportData.location.municipality || 'Unknown'
  );
  const municipality = resolved.municipality;
  const municipalityDetectionMethod = resolved.method;

  // Separate images and videos
  const imageFiles = evidenceFiles.filter((f) => f.type.startsWith('image/'));
  const videoFiles = evidenceFiles.filter((f) => f.type.startsWith('video/'));

  // Lazy-load storage SDK alongside the instance
  const [storageModule, storageInstance] = await Promise.all([
    import('firebase/storage'),
    getStorageInstance(),
  ]);

  // Upload media and fetch weather context in parallel
  const [mediaResult, weatherContext] = await Promise.all([
    uploadMediaFiles(imageFiles, videoFiles, storageInstance, storageModule),
    fetchWeatherContext(reportData.location.lat, reportData.location.lng),
  ]);

  // Build report document using resolved municipality
  const report = buildReportDocument(
    reportData,
    mediaResult,
    weatherContext,
    user,
    municipality,
    municipalityDetectionMethod
  );

  // Atomically update server-side rate limit and create the report.
  // Firestore rules enforce a 60-second cooldown — if the user submits
  // within the window the transaction will be rejected by the server.
  const reportsRef = collection(db, 'reports');
  const rateLimitRef = doc(db, 'rateLimits', user.uid);

  const docRef = await runTransaction(db, async (transaction) => {
    // Update rate limit document with server timestamp (enforced by Firestore rules)
    transaction.set(rateLimitRef, { lastReportAt: serverTimestamp() }, { merge: true });
    // Create the new report and return its reference
    const newDocRef = doc(reportsRef);
    transaction.set(newDocRef, report);
    return newDocRef;
  });

  logAuditEvent(
    new AuditEvent({
      eventType: AuditEventType.REPORT_CREATE,
      userId: user.uid,
      userEmail: user.email || null,
      targetType: 'report',
      targetId: docRef.id,
      metadata: {
        reportType: reportData.reportType || 'situation',
        disasterType: reportData.disaster?.type,
        severity: reportData.disaster?.severity,
        municipality,
      },
    })
  );

  return {
    id: docRef.id,
    skippedFiles: mediaResult.skippedFiles,
    uploadErrors: mediaResult.uploadErrors,
  };
}
export async function upvoteReport(reportId, userId) {
  if (!userId) throw new Error('Authentication required to upvote.');

  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const reportRef = doc(db, 'reports', reportId);
  const rateLimitRef = doc(db, 'rateLimits', userId);

  await runTransaction(db, async (transaction) => {
    transaction.set(rateLimitRef, { lastEngageAt: serverTimestamp() }, { merge: true });
    // Check if already upvoted
    const upvoteDoc = await transaction.get(upvoteRef);
    if (upvoteDoc.exists()) return; // already upvoted

    const reportDoc = await transaction.get(reportRef);
    if (!reportDoc.exists()) throw new Error('Report not found.');

    // Create subcollection doc
    transaction.set(upvoteRef, { votedAt: serverTimestamp() });
    // Increment counter on parent
    transaction.update(reportRef, { 'engagement.upvotes': increment(1) });
  });
}

export async function removeUpvote(reportId, userId) {
  if (!userId) throw new Error('Authentication required to remove upvote.');

  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const reportRef = doc(db, 'reports', reportId);
  const rateLimitRef = doc(db, 'rateLimits', userId);

  await runTransaction(db, async (transaction) => {
    transaction.set(rateLimitRef, { lastEngageAt: serverTimestamp() }, { merge: true });
    const upvoteDoc = await transaction.get(upvoteRef);
    if (!upvoteDoc.exists()) return; // not upvoted

    const reportDoc = await transaction.get(reportRef);
    if (!reportDoc.exists()) throw new Error('Report not found.');

    // Delete subcollection doc
    transaction.delete(upvoteRef);
    // Decrement counter on parent
    transaction.update(reportRef, { 'engagement.upvotes': increment(-1) });
  });
}

export async function hasUpvoted(reportId, userId) {
  if (!userId) return false;
  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const snap = await getDoc(upvoteRef);
  return snap.exists();
}

export async function verifyReport(
  reportId,
  adminId,
  adminRole,
  notes = '',
  disasterType = null,
  severity = null
) {
  if (!adminId || !isAdminRole(adminRole)) {
    throw new Error('Admin privileges required to verify reports.');
  }

  const reportRef = doc(db, 'reports', reportId);
  const updateData = {
    'verification.status': 'verified',
    'verification.verifiedBy': adminId,
    'verification.verifiedAt': serverTimestamp(),
    'verification.verifierRole': adminRole,
    'verification.notes': notes,
  };

  if (disasterType) {
    updateData['disaster.type'] = disasterType;
  }

  if (severity) {
    updateData['disaster.severity'] = severity;
  }

  await updateDoc(reportRef, updateData);
}

export async function rejectReport(reportId, adminId, adminRole, notes = '') {
  if (!adminId || !isAdminRole(adminRole)) {
    throw new Error('Admin privileges required to reject reports.');
  }

  const reportRef = doc(db, 'reports', reportId);
  await updateDoc(reportRef, {
    'verification.status': 'rejected',
    'verification.verifiedBy': adminId,
    'verification.verifiedAt': serverTimestamp(),
    'verification.verifierRole': adminRole,
    'verification.notes': notes,
  });
}

export async function resolveReport(
  reportId,
  adminId,
  evidencePhotos,
  actionsTaken,
  resolutionNotes = '',
  resourcesUsed = '',
  adminRole = ''
) {
  if (!adminId || !isAdminRole(adminRole)) {
    throw new Error('Admin privileges required to resolve reports.');
  }

  // Lazy-load storage for evidence upload
  const [storageMod, storageInst] = await Promise.all([
    import('firebase/storage'),
    getStorageInstance(),
  ]);

  // Upload evidence photos in parallel
  const evidenceUrls = await Promise.all(
    evidencePhotos.map(async (photo, _index) => {
      const compressed = await compressImage(photo);
      const safeName = safeFileName(photo.name);
      const photoRef = storageMod.ref(storageInst, `evidence/${crypto.randomUUID()}_${safeName}`);
      await storageMod.uploadBytes(photoRef, compressed);
      return storageMod.getDownloadURL(photoRef);
    })
  );

  const reportRef = doc(db, 'reports', reportId);
  await updateDoc(reportRef, {
    'verification.status': 'resolved',
    'verification.resolution.resolvedBy': adminId,
    'verification.resolution.resolvedAt': serverTimestamp(),
    'verification.resolution.evidencePhotos': evidenceUrls,
    'verification.resolution.actionsTaken': actionsTaken,
    'verification.resolution.resolutionNotes': resolutionNotes,
    'verification.resolution.resourcesUsed': resourcesUsed,
  });
}

export async function deleteReport(reportId, adminRole = '', adminId = null) {
  if (!isAdminRole(adminRole)) {
    throw new Error('Admin privileges required to delete reports.');
  }

  logAuditEvent(
    new AuditEvent({
      eventType: AuditEventType.REPORT_DELETE,
      userId: adminId,
      userRole: adminRole,
      targetType: 'report',
      targetId: reportId,
      metadata: { action: 'report_deleted_by_admin', adminRole },
    })
  );

  const reportRef = doc(db, 'reports', reportId);
  await deleteDoc(reportRef);
}

export function getReportSubmissionRateLimit() {
  return checkLimit('report_submission');
}
