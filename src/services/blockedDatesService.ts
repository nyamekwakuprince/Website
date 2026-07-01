import { supabase } from '../lib/supabase';
import type { BlockedDate, FetchResult } from '../lib/types';
import { buildFetchResult } from '../lib/api';

const BLOCKED_DATES_TABLE = 'blocked_dates';

function isSupabaseReady(): boolean {
  return supabase && typeof supabase.from === 'function';
}

export async function getBlockedDates(): Promise<FetchResult<BlockedDate[]>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from<BlockedDate>(BLOCKED_DATES_TABLE)
    .select('id,date,reason,is_full_day')
    .gte('date', todayIso)
    .order('date', { ascending: true });

  return buildFetchResult(data, error);
}

export async function createBlockedDate(
  payload: Partial<BlockedDate>
): Promise<FetchResult<BlockedDate>> {
  const { data, error } = await supabase
    .from<BlockedDate>(BLOCKED_DATES_TABLE)
    .insert(payload)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}

export async function deleteBlockedDate(dateId: string): Promise<FetchResult<BlockedDate>> {
  const { data, error } = await supabase
    .from<BlockedDate>(BLOCKED_DATES_TABLE)
    .delete()
    .eq('id', dateId)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}
