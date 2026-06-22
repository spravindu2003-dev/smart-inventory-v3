import { useState, useEffect, useRef, useCallback } from 'react';

export function useFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (fetchFn) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(controller.signal);
      if (!mountedRef.current) return undefined;
      return result;
    } catch (err) {
      if (!mountedRef.current) return undefined;
      if (err.name === 'CanceledError' || err.name === 'AbortError') return undefined;
      const msg = err.response?.data?.message || err.message || 'Request failed';
      setError(msg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  return { loading, error, run, setError };
}
