-- InterviewHub initial schema
-- Applied via `supabase db push`. Future schema changes should be added as new
-- files under supabase/migrations/ (e.g. `supabase migration new <name>`), never
-- by editing this file after it has been applied.

create extension if not exists pgcrypto;

-- =========================================================
-- Tables
-- =========================================================

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'manager',
  created_at timestamptz default now()
);

create table if not exists ai_settings (
  admin_id uuid primary key references admins(id) on delete cascade,
  default_model text not null default 'claude-sonnet-4-6',
  default_system_prompt text,
  updated_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  title text not null,
  description text not null,
  language text not null default 'javascript',
  difficulty text not null default 'medium',
  time_limit_minutes int,
  starter_code text,
  test_cases jsonb,
  is_ai_generated boolean default false,
  created_at timestamptz default now()
);

create table if not exists interview_sets (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  title text not null,
  target_role text,
  question_ids uuid[] not null default '{}',
  time_limit_minutes int,
  expires_at timestamptz,
  status text not null default 'draft',
  ai_model text default 'claude-sonnet-4-6',
  ai_system_prompt text,
  created_at timestamptz default now()
);

create table if not exists interview_links (
  id uuid primary key default gen_random_uuid(),
  interview_set_id uuid references interview_sets(id) on delete cascade,
  token text unique not null,
  candidate_name text,
  candidate_email text,
  status text not null default 'pending',
  expires_at timestamptz,
  open_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz default now()
);

create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references interview_links(id) on delete cascade,
  candidate_id uuid references candidates(id),
  candidate_name text,
  started_at timestamptz,
  submitted_at timestamptz,
  last_active_at timestamptz,
  final_answers jsonb,
  status text not null default 'in_progress',
  review_status text not null default 'pending',
  ai_score numeric,
  ai_score_summary text,
  ai_interaction_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade,
  question_id uuid references questions(id),
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade,
  storage_path text not null,
  duration_seconds int,
  created_at timestamptz default now()
);

create index if not exists idx_questions_admin on questions(admin_id);
create index if not exists idx_interview_sets_admin on interview_sets(admin_id);
create index if not exists idx_interview_links_set on interview_links(interview_set_id);
create index if not exists idx_interview_links_token on interview_links(token);
create index if not exists idx_candidates_admin on candidates(admin_id);
create index if not exists idx_sessions_link on interview_sessions(link_id);
create index if not exists idx_ai_messages_session on ai_messages(session_id);
create index if not exists idx_recordings_session on recordings(session_id);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table admins enable row level security;
alter table ai_settings enable row level security;
alter table questions enable row level security;
alter table interview_sets enable row level security;
alter table interview_links enable row level security;
alter table candidates enable row level security;
alter table interview_sessions enable row level security;
alter table ai_messages enable row level security;
alter table recordings enable row level security;

drop policy if exists admins_self on admins;
create policy admins_self on admins
  for select using (id = auth.uid());
drop policy if exists admins_self_update on admins;
create policy admins_self_update on admins
  for update using (id = auth.uid());

drop policy if exists ai_settings_owner on ai_settings;
create policy ai_settings_owner on ai_settings
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists questions_owner on questions;
create policy questions_owner on questions
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists interview_sets_owner on interview_sets;
create policy interview_sets_owner on interview_sets
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists candidates_owner on candidates;
create policy candidates_owner on candidates
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists interview_links_owner on interview_links;
create policy interview_links_owner on interview_links
  for all using (
    exists (
      select 1 from interview_sets s
      where s.id = interview_links.interview_set_id
        and s.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from interview_sets s
      where s.id = interview_links.interview_set_id
        and s.admin_id = auth.uid()
    )
  );

-- interview_sessions / ai_messages / recordings: intentionally no policies for
-- anon/authenticated roles. All access goes through Next.js Route Handlers
-- using the service role key (which bypasses RLS), after verifying either the
-- admin's session (ownership via join) or the candidate's link token.
