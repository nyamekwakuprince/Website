import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { FetchResult } from '../lib/types';

export function useFetch<T>(fetcher: () => Promise<FetchResult<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await fetcher();

      if (!isMounted) {
        return;
      }

      setData(result.data);
      setError(result.error);
      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, deps);

  return {
    data,
    error,
    loading,
    setData: setData as Dispatch<SetStateAction<T | null>>,
    setError,
  };
}
