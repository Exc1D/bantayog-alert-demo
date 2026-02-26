import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return vi.fn();
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('../utils/sentry', () => ({
  captureException: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('has signIn function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe('function');
  });

  it('has signUp function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signUp).toBe('function');
  });

  it('has signInAsGuest function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signInAsGuest).toBe('function');
  });

  it('has signOut function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signOut).toBe('function');
  });

  it('has requestPasswordReset function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.requestPasswordReset).toBe('function');
  });

  it('has updateProfilePicture function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.updateProfilePicture).toBe('function');
  });

  it('has removeAccount function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.removeAccount).toBe('function');
  });

  it('has isAdmin property', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.isAdmin).toBe('boolean');
  });

  it('has isSuperAdmin property', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.isSuperAdmin).toBe('boolean');
  });
});
