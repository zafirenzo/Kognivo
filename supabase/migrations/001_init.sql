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

create table orders (
  id uuid primary key default gen_random_uuid(),
  instrument text not null,
  kind text not null check (kind in ('plan', 'preorder')),
  plan text,
  buyer_name text not null,
  email text not null,
  phone text not null,
  company text,
  amount_paise integer not null check (amount_paise > 0),
  gateway_order_id text unique,
  gateway_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (kind = 'preorder' or plan is not null)
);

alter table waitlist enable row level security;
alter table commissions enable row level security;
alter table orders enable row level security;
-- No policies: only the server (service role) touches these tables.
