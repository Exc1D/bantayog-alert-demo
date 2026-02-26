import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, useRemoteConfig } from '../../src/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '../../src/config/featureFlags';

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return enabled state based on feature flag', async () => {
    const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.NEW_REPORT_FLOW));

    expect(result.current.enabled).toBeDefined();
    expect(result.current.isEnabled).toBeDefined();
  });

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.NEW_REPORT_FLOW));

    expect(typeof result.current.refresh).toBe('function');
  });
});

describe('useFeatureFlags', () => {
  it('should return flags object', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.flags).toBeDefined();
    expect(typeof result.current.flags).toBe('object');
  });

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(typeof result.current.refresh).toBe('function');
  });

  it('should accept specific flags parameter', () => {
    const { result } = renderHook(() => useFeatureFlags([FEATURE_FLAGS.NEW_REPORT_FLOW]));

    expect(result.current.flags).toHaveProperty('newReportFlow');
  });
});

describe('useRemoteConfig', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useRemoteConfig());

    expect(result.current.isReady).toBeDefined();
    expect(result.current.values).toBeDefined();
    expect(result.current.loading).toBeDefined();
  });

  it('should provide initialize function', () => {
    const { result } = renderHook(() => useRemoteConfig());

    expect(typeof result.current.initialize).toBe('function');
  });
});
