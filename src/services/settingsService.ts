import { supabase } from '../lib/supabase';
import type { BookingSetting, FetchResult } from '../lib/types';
import { buildFetchResult } from '../lib/api';

const SETTINGS_TABLE = 'business_settings';

function isSupabaseReady(): boolean {
  return supabase && typeof supabase.from === 'function';
}

export async function getBookingSettings(): Promise<FetchResult<BookingSetting>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const { data, error } = await supabase
    .from<BookingSetting>(SETTINGS_TABLE)
    .select('*')
    .maybeSingle();

  return buildFetchResult(data, error);
}

export async function updateBookingSettings(
  settingsId: string | null,
  payload: Partial<BookingSetting>
): Promise<FetchResult<BookingSetting>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  if (settingsId) {
    const { data, error } = await supabase
      .from<BookingSetting>(SETTINGS_TABLE)
      .update(payload)
      .eq('id', settingsId)
      .select()
      .maybeSingle();

    return buildFetchResult(data, error);
  }

  const { data, error } = await supabase
    .from<BookingSetting>(SETTINGS_TABLE)
    .insert(payload)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}
