import type { FetchResult } from './types';
import type { PostgrestError } from '@supabase/supabase-js';

export function buildFetchResult<T>(
  data: T | null,
  error: PostgrestError | null
): FetchResult<T> {
  return {
    data,
    error: error ? new Error(error.message) : null,
    loading: false,
  };
}
