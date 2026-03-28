import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, error: null, loading: true });
    try {
      const response = await asyncFunction();
      if (isMountedRef.current) {
        setState({ data: response, error: null, loading: false });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      }
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, immediate]);

  return { ...state, execute, reset };
}
