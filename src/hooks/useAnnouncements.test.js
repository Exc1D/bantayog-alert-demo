import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnnouncements } from './useAnnouncements';

vi.mock('../utils/firebaseConfig', () => ({
  db: {},
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'announcements'),
  query: vi.fn((...args) => args),
  where: vi.fn((col, field, op, val) => ({ col, field, op, val })),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return vi.fn();
  }),
}));

describe('useAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns announcements array', async () => {
    const { result } = renderHook(() => useAnnouncements('Daet'));
    await waitFor(() => {
      expect(result.current.announcements).toEqual([]);
    });
  });
});
