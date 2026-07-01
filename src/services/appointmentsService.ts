import { supabase } from '../lib/supabase';
import type { Appointment, CreateAppointmentInput, FetchResult } from '../lib/types';
import { buildFetchResult } from '../lib/api';

const APPOINTMENT_TABLE = 'appointments';

function isSupabaseReady(): boolean {
  return supabase && typeof supabase.from === 'function';
}

export async function createAppointment(
  payload: CreateAppointmentInput
): Promise<FetchResult<Appointment>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const { data, error } = await supabase
    .from<Appointment>(APPOINTMENT_TABLE)
    .insert(payload)
    .single();

  return buildFetchResult(data, error);
}

export async function getAppointments(): Promise<FetchResult<Appointment[]>> {
  if (!isSupabaseReady()) {
    return buildFetchResult(null, new Error('Supabase client not initialized'));
  }
  const todayIso = new Date().toISOString();
  const { data, error } = await supabase
    .from<Appointment>(APPOINTMENT_TABLE)
    .select('id,service_id,customer_name,customer_email,phone_number,scheduled_at,duration_minutes,status,notes,created_at')
    .gte('scheduled_at', todayIso)
    .order('scheduled_at', { ascending: true });

  return buildFetchResult(data, error);
}
