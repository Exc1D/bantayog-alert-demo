import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useIsLg from './useIsLg';

describe('useIsLg', () => {
  let mql;

  function mockMatchMedia(matches) {
    const listeners = [];
    mql = {
      matches,
      addEventListener: vi.fn((event, fn) => listeners.push(fn)),
      removeEventListener: vi.fn((event, fn) => {
        const i = listeners.indexOf(fn);
        if (i !== -1) listeners.splice(i, 1);
      }),
      _trigger: (newMatches) => {
        mql.matches = newMatches;
        listeners.forEach((fn) => fn({ matches: newMatches }));
      },
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  }

  afterEach(() => vi.restoreAllMocks());

  it('returns true when viewport matches lg breakpoint', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(true);
  });

  it('returns false when viewport is below lg breakpoint', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(false);
  });

  it('updates when viewport crosses lg breakpoint', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(false);
    act(() => mql._trigger(true));
    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsLg());
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledOnce();
  });
});
