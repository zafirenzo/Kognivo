-- Kognivo: waitlist, commissions and orders. Run in Kognivo's own Supabase project.

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  instrument text not null,
  created_at timestamptz not null default now(),
  unique (email, instrument)
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  brief text not null,
  budget text,
  timeline text,
  created_at timestamptz not null default now()
);

-- One order per checkout. items is the priced cart as the server computed it:
-- [{ slug, name, option, qty, unit, kind, status }], unit in rupees.
create table orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  buyer_name text not null,
  email text not null,
  phone text not null,
  company text,
  ship_to jsonb, -- { line, city, region, postal, country } when the cart holds hardware
  subtotal_paise integer not null check (subtotal_paise > 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  amount_paise integer not null check (amount_paise = subtotal_paise + shipping_paise),
  gateway_order_id text unique,
  gateway_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'shipped', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table waitlist enable row level security;
alter table commissions enable row level security;
alter table orders enable row level security;
-- No policies: only the server (service role) touches these tables.
