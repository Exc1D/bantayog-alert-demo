const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Callable Cloud Function: syncUserClaims
 * Fetches the user's role from Firestore users/{uid} document
 * and sets it as a custom claim on the user's authentication token.
 *
 * Called by the client after sign-in to ensure claims are synced.
 */
exports.syncUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const uid = context.auth.uid;
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // New user — no role set yet, use default
      return { success: true, role: 'user' };
    }

    const role = userDoc.data().role || '';

    // Set custom claim via admin SDK
    await admin.auth().setCustomUserClaims(uid, { role });

    return { success: true, role };
  } catch (error) {
    console.error('syncUserClaims error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync claims');
  }
});
