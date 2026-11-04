"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Runs `fetcher` on mount and whenever `key` changes; aborts stale requests.
 * `key` should be a string that uniquely identifies the request.
 */
export function useApi<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<ApiState<T> & { key: string; nonce: number }>({
    data: undefined,
    error: undefined,
    loading: true,
    key,
    nonce: 0,
  });
  const [nonce, setNonce] = useState(0);

  // Reset to loading synchronously when the request identity changes.
  if (state.key !== key || state.nonce !== nonce) {
    setState({ data: state.key === key ? state.data : undefined, error: undefined, loading: true, key, nonce });
  }

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: undefined, loading: false, key, nonce });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          key,
          nonce,
        });
      },
    );
    return () => controller.abort();
    // `fetcher` is intentionally excluded: `key` captures its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (data: T) => setState((s) => ({ ...s, data, error: undefined, loading: false })),
    [],
  );

  return { data: state.data, error: state.error, loading: state.loading, reload, setData };
}
