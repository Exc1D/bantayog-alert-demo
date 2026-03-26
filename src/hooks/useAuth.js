import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, getAuthInstance, getStorageInstance } from '../utils/firebaseConfig';
import { captureException, addBreadcrumb } from '../utils/sentry';
import { getStoragePathFromUrl } from '../utils/firebaseStorage';
import { logAuditEvent, AuditEvent, AuditEventType } from '../utils/auditLogger';

// Lazy-load firebase/auth functions alongside the auth instance
async function getFirebaseAuth() {
  const [authModule, authInstance] = await Promise.all([
    import('firebase/auth'),
    getAuthInstance(),
  ]);
  return { authInstance, ...authModule };
}

// Lazy-load firebase/storage functions alongside the storage instance
async function getFirebaseStorage() {
  const [storageModule, storageInstance] = await Promise.all([
    import('firebase/storage'),
    getStorageInstance(),
  ]);
  return { storageInstance, ...storageModule };
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    getFirebaseAuth()
      .then(({ authInstance, onAuthStateChanged }) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
          setUser(firebaseUser);

          if (firebaseUser) {
            try {
              const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (profileDoc.exists()) {
                setUserProfile(profileDoc.data());
              }
            } catch (err) {
              captureException(err, { tags: { component: 'useAuth', action: 'fetchProfile' } });
            }
          } else {
            setUserProfile(null);
          }

          setLoading(false);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        captureException(err, { tags: { component: 'useAuth', action: 'init' } });
        setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    const { authInstance, signInWithEmailAndPassword } = await getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(authInstance, email, password);

    logAuditEvent(
      new AuditEvent({
        eventType: AuditEventType.LOGIN,
        userId: credential.user.uid,
        userEmail: email,
        targetType: 'user',
        targetId: credential.user.uid,
        metadata: { method: 'email_password' },
      })
    );

    return credential.user;
  };

  const signUp = async (email, password, name, municipality) => {
    const { authInstance, createUserWithEmailAndPassword, updateProfile } = await getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(authInstance, email, password);
    await updateProfile(credential.user, { displayName: name });

    let firestoreSuccess = false;
    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        userId: credential.user.uid,
        email,
        displayName: name,
        photoURL: '',
        municipality: municipality || '',
        role: 'user',
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        stats: {
          reportsSubmitted: 0,
          reportsVerified: 0,
          reportsResolved: 0,
          upvotesReceived: 0,
        },
        settings: {
          notifications: true,
          shareLocation: true,
          dataCollectionEnabled: true,
        },
      });
      firestoreSuccess = true;
    } catch (err) {
      captureException(err, { tags: { component: 'useAuth', action: 'signUpFirestore' } });
      throw new Error('Failed to create user profile. Please try again.');
    }

    if (!firestoreSuccess) {
      throw new Error('Failed to create user profile. Please try again.');
    }

    try {
      await logAuditEvent(
        new AuditEvent({
          eventType: AuditEventType.PROFILE_UPDATE,
          userId: credential.user.uid,
          userEmail: email,
          userRole: 'user',
          targetType: 'user',
          targetId: credential.user.uid,
          metadata: { action: 'account_created' },
        })
      );
    } catch (auditErr) {}

    return credential.user;
  };

  const signInAsGuest = async () => {
    const { authInstance, signInAnonymously } = await getFirebaseAuth();
    const credential = await signInAnonymously(authInstance);

    logAuditEvent(
      new AuditEvent({
        eventType: AuditEventType.LOGIN,
        userId: credential.user.uid,
        userEmail: null,
        targetType: 'user',
        targetId: credential.user.uid,
        metadata: { method: 'anonymous' },
      })
    );

    return credential.user;
  };

  const signOut = async () => {
    const { authInstance, signOut: firebaseSignOut } = await getFirebaseAuth();
    const currentUser = authInstance.currentUser;

    if (currentUser && !currentUser.isAnonymous) {
      logAuditEvent(
        new AuditEvent({
          eventType: AuditEventType.LOGOUT,
          userId: currentUser.uid,
          userEmail: currentUser.email || null,
          targetType: 'user',
          targetId: currentUser.uid,
          metadata: {},
        })
      );
    }

    await firebaseSignOut(authInstance);
    setUser(null);
    setUserProfile(null);
  };

  const requestPasswordReset = async (email) => {
    const { authInstance, sendPasswordResetEmail } = await getFirebaseAuth();
    await sendPasswordResetEmail(authInstance, email);
  };

  const updateProfilePicture = async (file) => {
    const { authInstance, updateProfile } = await getFirebaseAuth();
    const { storageInstance, ref, uploadBytes, getDownloadURL, deleteObject } =
      await getFirebaseStorage();

    if (!authInstance.currentUser) {
      throw new Error('You must be signed in to update your profile picture.');
    }

    // Delete old avatar if it exists
    const currentPhotoURL = authInstance.currentUser.photoURL || userProfile?.photoURL;
    if (currentPhotoURL && currentPhotoURL.includes('/avatars%2F')) {
      const storagePath = getStoragePathFromUrl(currentPhotoURL);
      if (storagePath) {
        try {
          await deleteObject(ref(storageInstance, storagePath));
        } catch (error) {
          captureException(error, {
            tags: { component: 'useAuth', action: 'deleteOldAvatar' },
            level: 'warning',
          });
        }
      } else {
        addBreadcrumb('storage', 'Unable to extract avatar storage path from URL', 'info', {
          currentPhotoURL,
        });
      }
    }

    const avatarRef = ref(
      storageInstance,
      `avatars/${authInstance.currentUser.uid}/${Date.now()}-${file.name}`
    );
    await uploadBytes(avatarRef, file);
    const photoURL = await getDownloadURL(avatarRef);

    await updateProfile(authInstance.currentUser, { photoURL });
    await setDoc(doc(db, 'users', authInstance.currentUser.uid), { photoURL }, { merge: true });
    setUserProfile((prev) => ({ ...(prev || {}), photoURL }));

    return photoURL;
  };

  const removeAccount = async () => {
    const { authInstance, deleteUser } = await getFirebaseAuth();

    if (!authInstance.currentUser) {
      throw new Error('No signed in user found.');
    }

    const uid = authInstance.currentUser.uid;
    const currentPhotoURL = authInstance.currentUser.photoURL || userProfile?.photoURL;

    if (currentPhotoURL && currentPhotoURL.includes('/avatars%2F')) {
      const { storageInstance, ref, deleteObject } = await getFirebaseStorage();
      const storagePath = getStoragePathFromUrl(currentPhotoURL);
      if (storagePath) {
        try {
          await deleteObject(ref(storageInstance, storagePath));
        } catch (error) {
          captureException(error, {
            tags: { component: 'useAuth', action: 'deleteProfileImage' },
            level: 'warning',
          });
        }
      } else {
        addBreadcrumb('storage', 'Unable to extract avatar storage path from URL', 'info', {
          currentPhotoURL,
        });
      }
    }

    logAuditEvent(
      new AuditEvent({
        eventType: AuditEventType.DATA_DELETE,
        userId: uid,
        userEmail: userProfile?.email || authInstance.currentUser.email || null,
        targetType: 'user',
        targetId: uid,
        metadata: { action: 'account_deletion' },
      })
    );

    await deleteUser(authInstance.currentUser);
    await deleteDoc(doc(db, 'users', uid));
    setUser(null);
    setUserProfile(null);
  };

  const exportUserData = async () => {
    const { authInstance } = await getFirebaseAuth();

    if (!authInstance.currentUser) {
      throw new Error('No signed in user found.');
    }

    logAuditEvent(
      new AuditEvent({
        eventType: AuditEventType.DATA_EXPORT,
        userId: authInstance.currentUser.uid,
        userEmail: userProfile?.email || authInstance.currentUser.email,
        targetType: 'user',
        targetId: authInstance.currentUser.uid,
        metadata: { action: 'user_data_export_request' },
      })
    );

    return true;
  };

  const isAdmin =
    userProfile?.role?.startsWith('admin_') || userProfile?.role === 'superadmin_provincial';
  const isSuperAdmin = userProfile?.role === 'superadmin_provincial';

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInAsGuest,
    signOut,
    requestPasswordReset,
    updateProfilePicture,
    removeAccount,
    exportUserData,
    isAdmin,
    isSuperAdmin,
  };
}
