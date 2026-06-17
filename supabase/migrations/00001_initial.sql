-- Create profiles table (extends Supabase Auth users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  first_name  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger the function on user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cases table
create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  specialty   text not null default '',
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.cases enable row level security;

create policy "Users can read own cases"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "Users can insert own cases"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cases"
  on public.cases for update
  using (auth.uid() = user_id);

create policy "Users can delete own cases"
  on public.cases for delete
  using (auth.uid() = user_id);

-- Teaching progress table
create table if not exists public.teaching_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  case_id     uuid not null references public.cases(id) on delete cascade,
  score       integer not null default 0,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, case_id)
);

alter table public.teaching_progress enable row level security;

create policy "Users can read own progress"
  on public.teaching_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.teaching_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.teaching_progress for update
  using (auth.uid() = user_id);
