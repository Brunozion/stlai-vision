create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  name varchar(150),
  locale varchar(10) default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name varchar(150),
  language varchar(10) not null default 'pt-BR',
  plan_type varchar(20) not null default 'basic',
  status varchar(30) not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_key text not null,
  file_url text not null,
  mime_type varchar(100) not null,
  width int,
  height int,
  size_bytes bigint,
  asset_role varchar(30) not null default 'source',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_contexts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  product_name varchar(200) not null,
  category varchar(120),
  short_context text,
  dimensions_x_cm numeric(10,2),
  dimensions_y_cm numeric(10,2),
  dimensions_z_cm numeric(10,2),
  weight_grams numeric(10,2),
  voltage varchar(20),
  color varchar(80),
  material varchar(120),
  target_marketplaces jsonb,
  extra_attributes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  job_type varchar(20) not null,
  status varchar(20) not null default 'queued',
  provider varchar(60),
  provider_job_id varchar(120),
  trigger_source varchar(30) not null default 'user',
  prompt_version varchar(40),
  credits_reserved int not null default 0,
  credits_spent int not null default 0,
  input_payload jsonb,
  output_payload jsonb,
  error_code varchar(60),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists text_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  titles jsonb not null,
  description text not null,
  bullets jsonb,
  seo_keywords jsonb,
  language varchar(10) not null,
  is_current boolean not null default true,
  approved_by_user boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists image_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  storage_key text not null,
  file_url text not null,
  image_kind varchar(40) not null,
  title varchar(150),
  prompt_used text,
  provider varchar(60),
  width int,
  height int,
  variation_index int,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  project_id uuid references projects(id) on delete set null,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  transaction_type varchar(20) not null,
  amount int not null,
  balance_after int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  event_type varchar(50) not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_uploaded_assets_project_id on uploaded_assets(project_id);
create index if not exists idx_generation_jobs_project_id on generation_jobs(project_id);
create index if not exists idx_generation_jobs_status on generation_jobs(status);
create index if not exists idx_generation_jobs_type on generation_jobs(job_type);
create index if not exists idx_text_results_project_id on text_results(project_id);
create index if not exists idx_text_results_current on text_results(project_id, is_current);
create index if not exists idx_image_results_project_id on image_results(project_id);
create index if not exists idx_image_results_current on image_results(project_id, is_current);
create index if not exists idx_credit_transactions_user_id on credit_transactions(user_id);
create index if not exists idx_project_events_project_id on project_events(project_id);
