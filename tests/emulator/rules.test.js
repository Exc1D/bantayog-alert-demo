/**
 * Firestore Security Rules Emulator Tests
 *
 * These tests validate Firestore security rules using the Firebase Emulator Suite.
 * Requires @firebase/testing package to be installed and firebase emulators to be running.
 *
 * Setup:
 * 1. Install @firebase/testing: npm install --save-dev @firebase/testing
 * 2. Start emulators: firebase emulators:start --only firestore
 * 3. Run tests: npm test -- tests/emulator/rules.test.js
 *
 * Note: If @firebase/testing is not available, these tests will be skipped.
 */

import { test, expect, describe } from 'vitest';

// Check if Firebase Testing is available
let firebaseTesting;
try {
  firebaseTesting = await import('@firebase/testing');
} catch {
  firebaseTesting = null;
}

const EMULATOR_HOST = 'localhost:8080';
const COVERAGE_URL = `http://${EMULATOR_HOST}/emulator/v1/projects/bantayogalert:ruleCoverage`;

const SKIP_MESSAGE =
  '@firebase/testing not installed or emulators not available. Skipping emulator tests.';

// Helper to create timestamp for Firestore
const createTimestamp = (secondsAgo = 0) => {
  const now = Date.now();
  return { seconds: Math.floor((now - secondsAgo * 1000) / 1000), nanoseconds: 0 };
};

// Helper to create a valid report document
const createValidReportData = (overrides = {}) => ({
  timestamp: createTimestamp(),
  reportType: 'situation',
  location: {
    lat: 14.1057,
    lng: 122.9529,
    municipality: 'Daet',
    barangay: null,
    street: null,
  },
  disaster: {
    type: 'flood',
    severity: 'pending',
    description: 'Test flooding description that is at least 10 characters long',
    tags: null,
  },
  media: {
    photos: [],
    videos: [],
    thumbnails: [],
  },
  reporter: {
    userId: 'test-user-id',
    name: null,
  },
  verification: {
    status: 'pending',
    resolution: null,
  },
  engagement: {
    upvotes: 0,
    upvotedBy: [],
  },
  weatherContext: {},
  ...overrides,
});

// ============================================
// TEST SUITE - Firestore Security Rules
// ============================================

describe('Firestore Security Rules', () => {
  // Skip all tests if @firebase/testing is not available
  const isEmulatorAvailable = firebaseTesting !== null;

  test.describe('Reports Collection', () => {
    test('Any user can read reports (allow read: if true)', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;

      try {
        // Unauthenticated read should succeed
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
        });

        // Try to read reports - should succeed with "allow read: if true"
        const reportsRef = db.collection('reports');
        const querySnapshot = await reportsRef.get();

        // If we get here without error, the read rule allowed it
        expect(querySnapshot).toBeDefined();
      } finally {
        if (db) {
          await cleanup(db);
        }
      }
    });

    test('Unauthenticated users CANNOT create reports', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        // No auth - uid is null
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
        });

        const reportsRef = db.collection('reports');
        const reportData = createValidReportData();

        // Try to create a report without authentication
        await reportsRef.add(reportData);
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      // Should have failed with permission denied
      expect(error).toBeDefined();
      expect(error.message).toMatch(/PERMISSION_DENIED|Missing or insufficient permissions/i);
    });

    test('Authenticated users with user role can create reports', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;
      let docId;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'test-user-123', email: 'test@example.com' },
        });

        // First, create the user document with 'user' role
        const usersRef = db.collection('users');
        await usersRef.doc('test-user-123').set({
          userId: 'test-user-123',
          displayName: 'Test User',
          municipality: 'Daet',
          role: 'user',
        });

        // Now try to create a report
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData({
          reporter: { userId: 'test-user-123', name: 'Test' },
        });

        const docRef = await reportsRef.add(reportData);
        docId = docRef.id;
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
      expect(docId).toBeDefined();
    });

    test('Rate limit: same user cannot submit reports within 60 seconds', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let firstError;
      let secondError;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'test-user-rate-limit', email: 'ratelimit@example.com' },
        });

        // Create user document
        const usersRef = db.collection('users');
        await usersRef.doc('test-user-rate-limit').set({
          userId: 'test-user-rate-limit',
          displayName: 'Rate Limit Test',
          municipality: 'Daet',
          role: 'user',
        });

        // Create rate limit document (recent submission)
        const rateLimitsRef = db.collection('rateLimits');
        await rateLimitsRef.doc('test-user-rate-limit').set({
          lastReportAt: createTimestamp(30), // 30 seconds ago
        });

        const reportsRef = db.collection('reports');
        const reportData = createValidReportData({
          reporter: { userId: 'test-user-rate-limit', name: 'Test' },
        });

        // First submission within 60 seconds should fail
        try {
          await reportsRef.add(reportData);
        } catch (e) {
          firstError = e;
        }

        // Try again after 60 seconds (simulate by updating rate limit)
        await rateLimitsRef.doc('test-user-rate-limit').set({
          lastReportAt: createTimestamp(120), // 120 seconds ago (> 60s)
        });

        try {
          await reportsRef.add(reportData);
        } catch (e) {
          secondError = e;
        }
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      // First should fail (within 60 seconds), second should succeed (after 60 seconds)
      expect(firstError).toBeDefined();
      expect(firstError.message).toMatch(/PERMISSION_DENIED|resource exhausted|rate limit/i);
      expect(secondError).toBeUndefined();
    });

    test('Users can only update their own upvote (engagement update)', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'test-user-upvoter', email: 'upvoter@example.com' },
        });

        // Create user
        const usersRef = db.collection('users');
        await usersRef.doc('test-user-upvoter').set({
          userId: 'test-user-upvoter',
          displayName: 'Upvoter Test',
          municipality: 'Daet',
          role: 'user',
        });

        // Create a report with initial engagement
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData({
          reporter: { userId: 'other-user', name: 'Other' },
          engagement: { upvotes: 5, upvotedBy: ['user-1', 'user-2'] },
        });

        const docRef = await reportsRef.add(reportData);

        // Try to update engagement (upvote) - should succeed
        // The rule allows: adding upvote when user not in upvotedBy, upvotes = old + 1
        await docRef.update({
          engagement: {
            upvotes: 6,
            upvotedBy: ['user-1', 'user-2', 'test-user-upvoter'],
          },
        });
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
    });

    test("Users cannot update other users' engagement fields", async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'malicious-user', email: 'malicious@example.com' },
        });

        // Create user
        const usersRef = db.collection('users');
        await usersRef.doc('malicious-user').set({
          userId: 'malicious-user',
          displayName: 'Malicious',
          municipality: 'Daet',
          role: 'user',
        });

        // Create a report owned by another user
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData({
          reporter: { userId: 'victim-user', name: 'Victim' },
          engagement: { upvotes: 5, upvotedBy: ['victim-user'] },
        });

        const docRef = await reportsRef.add(reportData);

        // Try to update non-engagement fields (should fail - only engagement is allowed)
        await docRef.update({
          'disaster.description': 'Modified by malicious user',
        });
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      // Should have failed - user cannot modify non-engagement fields
      expect(error).toBeDefined();
      expect(error.message).toMatch(/PERMISSION_DENIED|Invalid update path/i);
    });

    test('Moderators/admins can update verification status to verified', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;
      let docId;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'moderator-user', email: 'moderator@example.com' },
        });

        // Create moderator user
        const usersRef = db.collection('users');
        await usersRef.doc('moderator-user').set({
          userId: 'moderator-user',
          displayName: 'Moderator',
          municipality: 'Daet',
          role: 'moderator',
        });

        // Create a report
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData();
        const docRef = await reportsRef.add(reportData);
        docId = docRef.id;

        // Update verification to verified
        await docRef.update({
          verification: {
            status: 'verified',
            verifiedBy: 'moderator-user',
            verifiedAt: createTimestamp(),
            verifierRole: 'moderator',
            notes: 'Verified by moderator',
            resolution: null,
          },
        });
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
      expect(docId).toBeDefined();
    });

    test('Admins can delete reports', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;
      let docExists = true;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'admin-user', email: 'admin@example.com' },
        });

        // Create admin user
        const usersRef = db.collection('users');
        await usersRef.doc('admin-user').set({
          userId: 'admin-user',
          displayName: 'Admin',
          municipality: 'Daet',
          role: 'admin_camarines_norte',
        });

        // Create a report
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData();
        const docRef = await reportsRef.add(reportData);

        // Admin should be able to delete
        await docRef.delete();
        docExists = false; // If we get here, delete succeeded
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
      expect(docExists).toBe(false);
    });

    test('Regular users cannot delete reports', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'regular-user', email: 'regular@example.com' },
        });

        // Create regular user
        const usersRef = db.collection('users');
        await usersRef.doc('regular-user').set({
          userId: 'regular-user',
          displayName: 'Regular User',
          municipality: 'Daet',
          role: 'user',
        });

        // Create a report
        const reportsRef = db.collection('reports');
        const reportData = createValidReportData();
        const docRef = await reportsRef.add(reportData);

        // Try to delete - should fail
        await docRef.delete();
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      // Should have failed - only admins can delete
      expect(error).toBeDefined();
      expect(error.message).toMatch(/PERMISSION_DENIED|Missing or insufficient permissions/i);
    });
  });

  test.describe('Users Collection', () => {
    test('Users can read their own profile', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'test-user', email: 'test@example.com' },
        });

        // Create user document
        const usersRef = db.collection('users');
        await usersRef.doc('test-user').set({
          userId: 'test-user',
          displayName: 'Test User',
          municipality: 'Daet',
          role: 'user',
        });

        // Try to read own profile
        const doc = await usersRef.doc('test-user').get();
        expect(doc.exists).toBe(true);
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
    });

    test("Users cannot read other users' profiles", async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'user-a', email: 'usera@example.com' },
        });

        // Create another user's document
        const usersRef = db.collection('users');
        await usersRef.doc('user-b').set({
          userId: 'user-b',
          displayName: 'User B',
          municipality: 'Daet',
          role: 'user',
        });

        // Try to read user-b's profile as user-a
        await usersRef.doc('user-b').get();
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeDefined();
      expect(error.message).toMatch(/PERMISSION_DENIED|private/i);
    });
  });

  test.describe('Rate Limits Collection', () => {
    test('Users can read their own rate limit state', async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'test-user', email: 'test@example.com' },
        });

        // Create rate limit document
        const rateLimitsRef = db.collection('rateLimits');
        await rateLimitsRef.doc('test-user').set({
          lastReportAt: createTimestamp(30),
        });

        // Try to read own rate limit
        const doc = await rateLimitsRef.doc('test-user').get();
        expect(doc.exists).toBe(true);
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeUndefined();
    });

    test("Users cannot read other users' rate limits", async () => {
      if (!isEmulatorAvailable) {
        test.skip(SKIP_MESSAGE, undefined);
        return;
      }

      const { setup, cleanup } = firebaseTesting;
      let db;
      let error;

      try {
        db = setup({
          projectId: 'bantayogalert-demo-test',
          firestore: { host: EMULATOR_HOST, port: 8080 },
          auth: { uid: 'user-a', email: 'usera@example.com' },
        });

        // Create another user's rate limit
        const rateLimitsRef = db.collection('rateLimits');
        await rateLimitsRef.doc('user-b').set({
          lastReportAt: createTimestamp(30),
        });

        // Try to read user-b's rate limit
        await rateLimitsRef.doc('user-b').get();
      } catch (e) {
        error = e;
      } finally {
        if (db) {
          await cleanup(db);
        }
      }

      expect(error).toBeDefined();
      expect(error.message).toMatch(/PERMISSION_DENIED|private/i);
    });
  });
});
