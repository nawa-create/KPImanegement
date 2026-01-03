-- =========================================
-- ACHIEVE - Initial Database Schema
-- =========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================
-- 目標 (Goals)
-- =========================================
create type goal_status as enum ('active', 'achieved', 'archived');

create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status goal_status default 'active' not null,
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table goals enable row level security;

create policy "Users can view own goals"
  on goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on goals for delete
  using (auth.uid() = user_id);

-- =========================================
-- KPI（指標）
-- =========================================
create type metric_type as enum ('number', 'percentage', 'boolean');

create table kpis (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references goals(id) on delete cascade not null,
  title text not null,
  metric_type metric_type default 'number' not null,
  current_value numeric,
  target_value numeric,
  unit text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table kpis enable row level security;

create policy "Users can view own kpis"
  on kpis for select
  using (
    exists (
      select 1 from goals
      where goals.id = kpis.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can insert own kpis"
  on kpis for insert
  with check (
    exists (
      select 1 from goals
      where goals.id = kpis.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own kpis"
  on kpis for update
  using (
    exists (
      select 1 from goals
      where goals.id = kpis.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete own kpis"
  on kpis for delete
  using (
    exists (
      select 1 from goals
      where goals.id = kpis.goal_id
      and goals.user_id = auth.uid()
    )
  );

-- =========================================
-- 行動 (Actions)
-- =========================================
create type action_type as enum ('daily', 'weekly', 'once');
create type tracking_type as enum ('checkbox', 'number', 'time');

create table actions (
  id uuid primary key default uuid_generate_v4(),
  kpi_id uuid references kpis(id) on delete cascade not null,
  title text not null,
  action_type action_type default 'daily' not null,
  tracking_type tracking_type default 'checkbox' not null,
  target_value numeric,
  unit text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table actions enable row level security;

create policy "Users can view own actions"
  on actions for select
  using (
    exists (
      select 1 from kpis
      join goals on goals.id = kpis.goal_id
      where kpis.id = actions.kpi_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can insert own actions"
  on actions for insert
  with check (
    exists (
      select 1 from kpis
      join goals on goals.id = kpis.goal_id
      where kpis.id = actions.kpi_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own actions"
  on actions for update
  using (
    exists (
      select 1 from kpis
      join goals on goals.id = kpis.goal_id
      where kpis.id = actions.kpi_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete own actions"
  on actions for delete
  using (
    exists (
      select 1 from kpis
      join goals on goals.id = kpis.goal_id
      where kpis.id = actions.kpi_id
      and goals.user_id = auth.uid()
    )
  );

-- =========================================
-- 行動ログ (Action Logs)
-- =========================================
create table action_logs (
  id uuid primary key default uuid_generate_v4(),
  action_id uuid references actions(id) on delete cascade not null,
  logged_date date not null,
  completed boolean default false not null,
  value numeric,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(action_id, logged_date)
);

-- RLS
alter table action_logs enable row level security;

create policy "Users can view own action_logs"
  on action_logs for select
  using (
    exists (
      select 1 from actions
      join kpis on kpis.id = actions.kpi_id
      join goals on goals.id = kpis.goal_id
      where actions.id = action_logs.action_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can insert own action_logs"
  on action_logs for insert
  with check (
    exists (
      select 1 from actions
      join kpis on kpis.id = actions.kpi_id
      join goals on goals.id = kpis.goal_id
      where actions.id = action_logs.action_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own action_logs"
  on action_logs for update
  using (
    exists (
      select 1 from actions
      join kpis on kpis.id = actions.kpi_id
      join goals on goals.id = kpis.goal_id
      where actions.id = action_logs.action_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete own action_logs"
  on action_logs for delete
  using (
    exists (
      select 1 from actions
      join kpis on kpis.id = actions.kpi_id
      join goals on goals.id = kpis.goal_id
      where actions.id = action_logs.action_id
      and goals.user_id = auth.uid()
    )
  );

-- =========================================
-- AIフィードバック履歴
-- =========================================
create type feedback_target_type as enum ('goal', 'kpi', 'action', 'progress');
create type feedback_type as enum ('decomposition', 'analysis', 'suggestion');
create type feedback_status as enum ('pending', 'accepted', 'rejected', 'modified');

create table ai_feedbacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target_type feedback_target_type not null,
  target_id uuid not null,
  feedback_type feedback_type not null,
  content jsonb not null,
  status feedback_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table ai_feedbacks enable row level security;

create policy "Users can view own ai_feedbacks"
  on ai_feedbacks for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai_feedbacks"
  on ai_feedbacks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai_feedbacks"
  on ai_feedbacks for update
  using (auth.uid() = user_id);

-- =========================================
-- Indexes
-- =========================================
create index goals_user_id_idx on goals(user_id);
create index goals_status_idx on goals(status);
create index kpis_goal_id_idx on kpis(goal_id);
create index actions_kpi_id_idx on actions(kpi_id);
create index action_logs_action_id_idx on action_logs(action_id);
create index action_logs_logged_date_idx on action_logs(logged_date);
create index ai_feedbacks_user_id_idx on ai_feedbacks(user_id);

-- =========================================
-- Updated at trigger
-- =========================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_goals_updated_at
  before update on goals
  for each row execute function update_updated_at_column();

create trigger update_kpis_updated_at
  before update on kpis
  for each row execute function update_updated_at_column();

create trigger update_actions_updated_at
  before update on actions
  for each row execute function update_updated_at_column();
