import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill for window.matchMedia (not available in jsdom by default)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
