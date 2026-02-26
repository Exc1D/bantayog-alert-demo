import useFeatureFlag from '../../hooks/useFeatureFlag';

export default function FeatureFlag({
  flag,
  children,
  fallback = null,
  enabledFallback = null,
  showLoading = false,
  loadingFallback = null,
  fetchRemoteConfig = false,
}) {
  const { enabled, loading } = useFeatureFlag(flag, {
    fetchRemoteConfig,
  });

  if (showLoading && loading) {
    if (loadingFallback !== null) {
      return <>{loadingFallback}</>;
    }
    return <div className="animate-pulse bg-stone-200 rounded h-4 w-full" aria-hidden="true" />;
  }

  if (!enabled) {
    if (fallback !== null) {
      return <>{fallback}</>;
    }
    return null;
  }

  if (enabledFallback !== null && enabled) {
    return <>{enabledFallback}</>;
  }

  return <>{children}</>;
}

export function FeatureFlagEnabled({ flag, children, fetchRemoteConfig = false }) {
  const { enabled } = useFeatureFlag(flag, { fetchRemoteConfig });
  return enabled ? <>{children}</> : null;
}

export function FeatureFlagDisabled({ flag, children, fetchRemoteConfig = false }) {
  const { enabled } = useFeatureFlag(flag, { fetchRemoteConfig });
  return !enabled ? <>{children}</> : null;
}
