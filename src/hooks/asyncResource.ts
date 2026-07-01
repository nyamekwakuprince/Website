import type { FetchResult } from '../lib/types';

export interface AsyncResource<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export async function loadResource<T>(
  loader: () => Promise<FetchResult<T>>
): Promise<AsyncResource<T>> {
  const result = await loader();
  return {
    data: result.data,
    error: result.error,
    loading: false,
  };
}
