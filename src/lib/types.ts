export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Appointment {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  phone_number?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: BookingStatus;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateAppointmentInput {
  service_id: string;
  customer_name: string;
  customer_email: string;
  phone_number?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status?: BookingStatus;
  notes?: string | null;
}

export interface BusinessHour {
  id: string;
  day_of_week:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  opens_at: string;
  closes_at: string;
  is_open: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string | null;
  is_full_day: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BookingSetting {
  id: string;
  business_name?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_address?: string | null;
  booking_window_days: number;
  allow_same_day_booking: boolean;
  minimum_lead_time_minutes: number;
  maximum_appointments_per_day: number;
  slot_interval_minutes: number;
  timezone: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  notes?: string | null;
}

export interface FetchResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}
