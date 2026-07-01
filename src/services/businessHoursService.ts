import { supabase } from '../lib/supabase';
import type { BusinessHour, FetchResult } from '../lib/types';
import { buildFetchResult } from '../lib/api';

const BUSINESS_HOURS_TABLE = 'business_hours';

function isSupabaseReady(): boolean {
  return supabase && typeof supabase.from === 'function';
}

export async function getBusinessHours(): Promise<FetchResult<BusinessHour[]>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const { data, error } = await supabase
    .from<BusinessHour>(BUSINESS_HOURS_TABLE)
    .select('*')
    .order('day_of_week', { ascending: true });

  return buildFetchResult(data, error);
}

export async function updateBusinessHour(
  hourId: string,
  payload: Partial<BusinessHour>
): Promise<FetchResult<BusinessHour>> {
  const { data, error } = await supabase
    .from<BusinessHour>(BUSINESS_HOURS_TABLE)
    .update(payload)
    .eq('id', hourId)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}
