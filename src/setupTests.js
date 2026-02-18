import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase to prevent real initialization in CI (no .env file)
vi.mock('./utils/firebaseConfig', () => ({
  db: {},
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
    currentUser: null,
    signInAnonymously: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  },
  storage: {},
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  default: {},
}));
