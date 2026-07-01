import { supabase } from '../lib/supabase';
import type { FetchResult, Service } from '../lib/types';
import { buildFetchResult } from '../lib/api';

const SERVICE_TABLE = 'services';

function isSupabaseReady(): boolean {
  return supabase && typeof supabase.from === 'function';
}

export async function getAllActiveServices(): Promise<FetchResult<Service[]>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const { data, error } = await supabase
    .from<Service>(SERVICE_TABLE)
    .select('id,name,description,price,duration_minutes,is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  return buildFetchResult(data, error);
}

export async function getServiceById(serviceId: string): Promise<FetchResult<Service>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const { data, error } = await supabase
    .from<Service>(SERVICE_TABLE)
    .select('id,name,description,price,duration_minutes,is_active')
    .eq('id', serviceId)
    .maybeSingle();

  return buildFetchResult(data, error);
}

export async function getAllServices(): Promise<FetchResult<Service[]>> {
  const { data, error } = await supabase
    .from<Service>(SERVICE_TABLE)
    .select('id,name,description,price,duration_minutes,is_active,created_at,updated_at')
    .order('created_at', { ascending: true });

  return buildFetchResult(data, error);
}

export async function createService(payload: Partial<Service>): Promise<FetchResult<Service>> {
  const { data, error } = await supabase
    .from<Service>(SERVICE_TABLE)
    .insert(payload)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}

export async function updateService(serviceId: string, payload: Partial<Service>): Promise<FetchResult<Service>> {
  const { data, error } = await supabase
    .from<Service>(SERVICE_TABLE)
    .update(payload)
    .eq('id', serviceId)
    .select()
    .maybeSingle();

  return buildFetchResult(data, error);
}
