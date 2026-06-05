-- AI Minecraft Plugin Forge production Supabase schema
-- Run in Supabase SQL Editor or with: supabase db push
-- Requires pgcrypto for gen_random_uuid(). Supabase projects normally include it,
-- but this statement is safe to run repeatedly.
create extension if not exists pgcrypto;

-- Keep updated_at columns accurate for dashboard polling and worker writes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Stores every AI generation, packaging, validation, and summarization response.
create table if not exists public.plugin_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  request_id text null,
  mode text not null default 'generate',
  prompt text null,
  output jsonb not null default '{}'::jsonb,
  score integer null check (score is null or (score >= 0 and score <= 50)),
  verdict text null check (verdict is null or verdict in ('ACCEPT', 'IMPROVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plugin_generations_user_id_idx on public.plugin_generations(user_id);
create index if not exists plugin_generations_mode_idx on public.plugin_generations(mode);
create index if not exists plugin_generations_created_at_idx on public.plugin_generations(created_at desc);

drop trigger if exists plugin_generations_set_updated_at on public.plugin_generations;
create trigger plugin_generations_set_updated_at
before update on public.plugin_generations
for each row
execute function public.set_updated_at();

-- Stores asynchronous Docker/Maven build job state. The API inserts pending rows;
-- workers upsert processing/done/failed rows as builds progress.
create table if not exists public.plugin_build_jobs (
  job_id text primary key,
  user_id uuid null references auth.users(id) on delete set null,
  generation_id uuid null references public.plugin_generations(id) on delete set null,
  status text not null check (status in ('pending', 'processing', 'done', 'failed')),
  plugin_name text not null default 'GeneratedPlugin',
  jar_location text null,
  error_log text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plugin_build_jobs_user_id_idx on public.plugin_build_jobs(user_id);
create index if not exists plugin_build_jobs_generation_id_idx on public.plugin_build_jobs(generation_id);
create index if not exists plugin_build_jobs_status_idx on public.plugin_build_jobs(status);
create index if not exists plugin_build_jobs_updated_at_idx on public.plugin_build_jobs(updated_at desc);

drop trigger if exists plugin_build_jobs_set_updated_at on public.plugin_build_jobs;
create trigger plugin_build_jobs_set_updated_at
before update on public.plugin_build_jobs
for each row
execute function public.set_updated_at();

-- Optional artifact records for dashboards/CDN handoff. Local workers currently store
-- jar_location in plugin_build_jobs; use this table when you later upload jars to Supabase Storage/S3/R2.
create table if not exists public.plugin_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.plugin_build_jobs(job_id) on delete cascade,
  storage_provider text not null default 'local',
  storage_path text not null,
  sha256 text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists plugin_artifacts_job_id_idx on public.plugin_artifacts(job_id);

-- Production security baseline: service-role backend can write; browser clients cannot
-- read/write these tables until you intentionally add authenticated dashboard policies.
alter table public.plugin_generations enable row level security;
alter table public.plugin_build_jobs enable row level security;
alter table public.plugin_artifacts enable row level security;
