import { useCallback, useRef } from 'react';

export default function useErrorBoundary() {
  const errorBoundaryRef = useRef(null);

  const showBoundary = useCallback((error) => {
    if (errorBoundaryRef.current) {
      errorBoundaryRef.current(error);
    }
  }, []);

  const captureError = useCallback((error) => {
    if (error instanceof Error) {
      showBoundary(error);
    } else {
      showBoundary(new Error(String(error)));
    }
  }, [showBoundary]);

  const captureAsyncError = useCallback(async (promise) => {
    try {
      return await promise;
    } catch (error) {
      captureError(error);
      throw error;
    }
  }, [captureError]);

  return {
    showBoundary,
    captureError,
    captureAsyncError,
    setErrorBoundaryHandler: useCallback((handler) => {
      errorBoundaryRef.current = handler;
    }, [])
  };
}