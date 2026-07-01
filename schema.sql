-- services table
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null,
  duration_minutes int not null,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- appointments table
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  phone_number text,
  scheduled_at timestamptz not null,
  duration_minutes int not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- business_hours table
create table if not exists business_hours (
  id uuid primary key default uuid_generate_v4(),
  day_of_week text not null,
  opens_at text not null,
  closes_at text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- blocked_dates table
create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  reason text,
  is_full_day boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- business_settings table
create table if not exists business_settings (
  id uuid primary key default uuid_generate_v4(),
  business_name text,
  business_phone text,
  business_email text,
  business_address text,
  booking_window_days int not null default 30,
  allow_same_day_booking boolean not null default false,
  minimum_lead_time_minutes int not null default 60,
  maximum_appointments_per_day int not null default 10,
  slot_interval_minutes int not null default 30,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
