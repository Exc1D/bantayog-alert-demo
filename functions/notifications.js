const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Sanitize user content for FCM notification payloads
// Strips HTML tags and escapes special characters to prevent XSS in notifications
function sanitizeForNotification(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 200); // Limit length
}

exports.subscribeToTopic = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { token, topic } = data;

  if (!token || !topic) {
    throw new functions.https.HttpsError('invalid-argument', 'Token and topic are required');
  }

  try {
    await admin.messaging().subscribeToTopic(token, topic);

    const userId = context.auth.uid;
    await db.collection('users').doc(userId).collection('subscriptions').doc(topic).set({
      token,
      topic,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, topic };
  } catch (error) {
    console.error('Failed to subscribe to topic:', error);
    throw new functions.https.HttpsError('internal', 'Failed to subscribe to notifications');
  }
});

exports.unsubscribeFromTopic = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { token, topic } = data;

  if (!token || !topic) {
    throw new functions.https.HttpsError('invalid-argument', 'Token and topic are required');
  }

  try {
    await admin.messaging().unsubscribeFromTopic(token, topic);

    const userId = context.auth.uid;
    await db.collection('users').doc(userId).collection('subscriptions').doc(topic).delete();

    return { success: true, topic };
  } catch (error) {
    console.error('Failed to unsubscribe from topic:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unsubscribe from notifications');
  }
});

exports.sendReportNotification = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();
    const reportId = context.params.reportId;

    if (!report || !report.location || !report.location.municipality) {
      console.log('Report missing location data, skipping notification');
      return null;
    }

    const municipality = report.location.municipality;
    const disasterType = report.disaster?.type || 'unknown';
    const severity = report.disaster?.severity || 'unknown';

    const topic = `municipality_${municipality.toLowerCase().replace(/\s+/g, '_')}`;

    const notification = {
      notification: {
        title: `New ${disasterType} Report in ${municipality}`,
        body: `Severity: ${severity}. ${sanitizeForNotification(report.disaster?.description) || 'Tap to view details.'}`,
      },
      data: {
        reportId: reportId,
        type: 'new_report',
        municipality: municipality,
        disasterType: disasterType,
        severity: severity,
        url: `/#map?report=${reportId}`,
      },
      android: {
        notification: {
          channelId: 'reports',
          priority: severity === 'critical' ? 'max' : 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      topic: topic,
    };

    try {
      await admin.messaging().send(notification);
      console.log(`Notification sent to topic: ${topic}`);
      return null;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  });

exports.sendVerificationNotification = functions.firestore
  .document('reports/{reportId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const reportId = context.params.reportId;

    if (beforeData.verification?.status === afterData.verification?.status) {
      return null;
    }

    const reporterId = afterData.reporter?.userId;
    if (!reporterId || afterData.reporter?.isAnonymous) {
      return null;
    }

    const status = afterData.verification?.status;
    let title, body;

    switch (status) {
      case 'verified':
        title = 'Report Verified';
        body = 'Your report has been verified by authorities.';
        break;
      case 'rejected':
        title = 'Report Update';
        body = 'Your report has been reviewed.';
        break;
      case 'resolved':
        title = 'Report Resolved';
        body = 'Your report has been marked as resolved.';
        break;
      default:
        return null;
    }

    const userDoc = await db.collection('users').doc(reporterId).get();
    if (!userDoc.exists) {
      return null;
    }

    const subscriptionsSnapshot = await db
      .collection('users')
      .doc(reporterId)
      .collection('subscriptions')
      .get();

    const tokens = subscriptionsSnapshot.docs.map((doc) => doc.data().token).filter(Boolean);

    if (tokens.length === 0) {
      return null;
    }

    const messages = tokens.map((token) => ({
      notification: { title, body },
      data: {
        reportId: reportId,
        type: 'verification_update',
        status: status,
        url: `/#feed?report=${reportId}`,
      },
      android: {
        notification: {
          channelId: 'updates',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      token: token,
    }));

    try {
      await admin.messaging().sendEach(messages);
      console.log(`Verification notification sent to reporter: ${reporterId}`);
      return null;
    } catch (error) {
      console.error('Failed to send verification notification:', error);
      return null;
    }
  });

exports.sendAlertToAll = functions.https.onCall(async (data, context) => {
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (!userRole || (!userRole.startsWith('admin_') && userRole !== 'superadmin_provincial')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body, municipality } = data;

  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required');
  }

  const topic = municipality
    ? `municipality_${municipality.toLowerCase().replace(/\s+/g, '_')}`
    : 'all_users';

  const notification = {
    notification: {
      title: sanitizeForNotification(title),
      body: sanitizeForNotification(body),
    },
    data: {
      type: 'admin_alert',
      url: '/#feed',
    },
    android: {
      notification: {
        channelId: 'alerts',
        priority: 'max',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    topic: topic,
  };

  try {
    const messageId = await admin.messaging().send(notification);
    return { success: true, messageId };
  } catch (error) {
    console.error('Failed to send alert:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send alert');
  }
});

/**
 * Sends a push notification via FCM and logs it to an announcements subcollection.
 * @param {Object} data - { title, body, topic, url, announcementId }
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body
 * @param {string} [data.topic='all-citizens'] - FCM topic to send to
 * @param {string} [data.url] - Deep link URL for the notification
 * @param {string} [data.announcementId] - If provided, logs notification under announcements/{id}/notifications/
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  // Verify admin role (same pattern as sendAlertToAll)
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  if (!userRole || (!userRole.startsWith('admin_') && userRole !== 'superadmin_provincial')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body, topic = 'all-citizens', url, announcementId } = data;

  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required');
  }

  // Validate announcementId references an existing document if provided
  if (announcementId) {
    const announcementSnap = await db.collection('announcements').doc(announcementId).get();
    if (!announcementSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Announcement not found');
    }
  }

  // Normalize topic name (replace spaces with underscores, lowercase)
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '_');

  const notification = {
    notification: {
      title: sanitizeForNotification(title),
      body: sanitizeForNotification(body),
    },
    data: {
      type: 'announcement',
      url: url || '/#feed',
    },
    android: {
      notification: {
        channelId: 'alerts',
        priority: 'high',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    topic: normalizedTopic,
  };

  let messageId;
  let notificationRecord = {
    title,
    body,
    topic: normalizedTopic,
    url: url || '/#feed',
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    sentBy: context.auth.uid,
    sentByRole: userRole,
    status: 'sent',
  };

  try {
    messageId = await admin.messaging().send(notification);
    notificationRecord.fcmMessageId = messageId;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    notificationRecord.status = 'failed';
    notificationRecord.error = error.message;
    notificationRecord.fcmMessageId = null;

    // Still write the failed record to the subcollection if announcementId provided
    if (announcementId) {
      await db
        .collection('announcements')
        .doc(announcementId)
        .collection('notifications')
        .add(notificationRecord);
    }

    throw new functions.https.HttpsError('internal', 'Failed to send push notification', {
      error: error.message,
    });
  }

  // Write successful notification record to the announcements subcollection
  if (announcementId) {
    await db
      .collection('announcements')
      .doc(announcementId)
      .collection('notifications')
      .add(notificationRecord);
  }

  return { success: true, messageId, topic: normalizedTopic };
});
