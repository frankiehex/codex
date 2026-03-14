create extension if not exists pgcrypto;

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'USD',
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table positions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  product_type text not null,
  product_name text not null,
  currency text not null,
  notional numeric(18,2) not null,
  issuer text,
  status text not null default 'running',
  opened_at date not null default current_date,
  maturity_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table structured_products (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null unique references positions(id) on delete cascade,
  structure_type text not null default 'fcn',
  coupon_pa numeric(8,4),
  strike_pct numeric(8,4),
  ko_barrier_pct numeric(8,4),
  observation_freq text,
  tenor_months integer,
  memory_coupon boolean not null default false,
  denomination numeric(18,2),
  settlement_currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table underlyings (
  id uuid primary key default gen_random_uuid(),
  structured_product_id uuid not null references structured_products(id) on delete cascade,
  ticker text not null,
  name text,
  market text,
  initial_price numeric(18,6),
  strike_price numeric(18,6),
  ko_price numeric(18,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  position_id uuid references positions(id) on delete set null,
  txn_type text not null,
  amount numeric(18,2) not null,
  currency text not null,
  fee numeric(18,2) not null default 0,
  fx_rate numeric(18,6),
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table observation_dates (
  id uuid primary key default gen_random_uuid(),
  structured_product_id uuid not null references structured_products(id) on delete cascade,
  obs_date date not null,
  obs_type text not null default 'observation',
  created_at timestamptz not null default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  alert_type text not null,
  channel text not null,
  recipient text not null,
  schedule_rule text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  snapshot_date date not null,
  total_cost numeric(18,2) not null default 0,
  total_market_value numeric(18,2) not null default 0,
  coupon_income numeric(18,2) not null default 0,
  realized_pnl numeric(18,2) not null default 0,
  unrealized_pnl numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (portfolio_id, snapshot_date)
);

create table ingestion_logs (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  raw_text text,
  parsed_intent text,
  parsed_payload jsonb,
  status text not null default 'success',
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_positions_portfolio_id on positions(portfolio_id);
create index idx_positions_status on positions(status);
create index idx_transactions_portfolio_id on transactions(portfolio_id);
create index idx_transactions_position_id on transactions(position_id);
create index idx_transactions_occurred_at on transactions(occurred_at);
create index idx_underlyings_structured_product_id on underlyings(structured_product_id);
create index idx_observation_dates_structured_product_id on observation_dates(structured_product_id);
create index idx_observation_dates_obs_date on observation_dates(obs_date);
create index idx_daily_snapshots_portfolio_date on daily_snapshots(portfolio_id, snapshot_date);
