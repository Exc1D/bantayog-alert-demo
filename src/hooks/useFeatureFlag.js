import { useState, useEffect, useCallback } from 'react';
import {
  isEnabled,
  getAllFlags,
  initializeRemoteConfig,
  getRemoteConfigValues,
  isRemoteConfigReady,
} from '../config/featureFlags.js';

let remoteConfigFetchPromise = null;

async function fetchRemoteConfig() {
  if (remoteConfigFetchPromise) {
    return remoteConfigFetchPromise;
  }

  remoteConfigFetchPromise = (async () => {
    try {
      const { getRemoteConfig, getValue } = await import('firebase/remote-config');
      const { remoteConfig } = await import('../utils/firebaseConfig.js');

      if (!remoteConfig) {
        console.warn('Firebase Remote Config not initialized');
        return null;
      }

      await getRemoteConfig(remoteConfig);

      const values = {};
      const flagNames = [
        'newReportFlow',
        'weatherAlerts',
        'communityEngagement',
        'adminAnalytics',
        'betaFeatures',
      ];

      for (const flag of flagNames) {
        try {
          const value = getValue(remoteConfig, flag);
          values[flag] = value.asBoolean();
        } catch (e) {
          console.warn(`Failed to get remote config for ${flag}:`, e);
        }
      }

      return values;
    } catch (error) {
      console.warn('Failed to fetch remote config:', error);
      return null;
    }
  })();

  return remoteConfigFetchPromise;
}

export function useFeatureFlag(flag, options = {}) {
  const {
    defaultValue,
    fetchRemoteConfig: shouldFetch = false,
    refreshInterval = 300000,
  } = options;

  const [enabled, setEnabled] = useState(() => {
    const initialValue = isEnabled(flag);
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return initialValue;
  });

  const [loading, setLoading] = useState(shouldFetch && !isRemoteConfigReady());
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkFlag = () => {
      const newValue = isEnabled(flag);
      setEnabled(newValue);
      setLoading(false);
    };

    checkFlag();
  }, [flag]);

  useEffect(() => {
    if (!shouldFetch) return;

    let intervalId = null;

    const loadRemoteConfig = async () => {
      try {
        setLoading(true);
        const values = await fetchRemoteConfig();

        if (values) {
          initializeRemoteConfig(values);
          const newValue = isEnabled(flag);
          setEnabled(newValue);
        }
      } catch (err) {
        setError(err);
        console.warn(`Failed to load remote config for ${flag}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (!isRemoteConfigReady()) {
      loadRemoteConfig();
    }

    if (refreshInterval > 0) {
      intervalId = setInterval(loadRemoteConfig, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [flag, shouldFetch, refreshInterval]);

  const refresh = useCallback(async () => {
    if (!shouldFetch) return;

    setLoading(true);
    setError(null);

    try {
      const values = await fetchRemoteConfig();
      if (values) {
        initializeRemoteConfig(values);
        setEnabled(isEnabled(flag));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [flag, shouldFetch]);

  return {
    enabled,
    isEnabled: enabled,
    loading,
    error,
    refresh,
  };
}

export function useFeatureFlags(flags = null) {
  const [flagsState, setFlagsState] = useState(() => {
    return flags ? Object.fromEntries(flags.map((f) => [f, isEnabled(f)])) : getAllFlags();
  });

  const refresh = useCallback(() => {
    setFlagsState(flags ? Object.fromEntries(flags.map((f) => [f, isEnabled(f)])) : getAllFlags());
  }, [flags]);

  return {
    flags: flagsState,
    refresh,
  };
}

export function useRemoteConfig() {
  const [isReady, setIsReady] = useState(isRemoteConfigReady());
  const [values, setValues] = useState(getRemoteConfigValues());
  const [loading, setLoading] = useState(false);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const remoteValues = await fetchRemoteConfig();
      if (remoteValues) {
        initializeRemoteConfig(remoteValues);
        setValues(getRemoteConfigValues());
        setIsReady(true);
      }
    } catch (error) {
      console.warn('Failed to initialize remote config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isReady,
    values,
    loading,
    initialize,
  };
}

export default useFeatureFlag;
