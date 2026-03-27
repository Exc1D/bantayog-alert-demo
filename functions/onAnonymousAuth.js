const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

/**
 * Firestore trigger: onAnonymousAuth
 * Runs when a new anonymous authentication account is created.
 * Stores fingerprint->uid mapping to detect/merge duplicate anonymous accounts.
 */
exports.onAnonymousAuth = functions.auth.user().onCreate(async (user) => {
  if (!user.isAnonymous) return null;

  const uid = user.uid;
  const db = admin.firestore();

  // Get the device fingerprint from custom claims (set by client)
  const fingerprint = user.customClaims?.fingerprint || 'unknown';

  try {
    // Check if this fingerprint already has an anonymous account
    const existingQuery = await db
      .collection('anonymousAccounts')
      .where('fingerprint', '==', fingerprint)
      .where('linked', '==', false)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      // Fingerprint already exists — mark new account for review
      await db.collection('anonymousAccounts').add({
        uid,
        fingerprint,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        linked: false,
        duplicateOf: existingQuery.docs[0].id,
      });
    } else {
      // First account for this fingerprint
      await db.collection('anonymousAccounts').add({
        uid,
        fingerprint,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        linked: false,
      });
    }

    return null;
  } catch (error) {
    console.error('onAnonymousAuth error:', error);
    return null;
  }
});
