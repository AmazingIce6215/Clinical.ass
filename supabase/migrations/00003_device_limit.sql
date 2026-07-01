-- Add lightweight device tracking and make the profiles table work with Supabase Auth

alter table if exists public.profiles
  add column if not exists device_id text,
  add column if not exists email text,
  add column if not exists first_name text;

create index if not exists profiles_device_id_idx on public.profiles(device_id);

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Anyone can create a profile" on public.profiles;
drop policy if exists "Anyone can read profiles" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.check_device_limit(p_device_id text)
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  profile_count integer;
begin
  select count(*) into profile_count
  from public.profiles
  where device_id = p_device_id;

  if profile_count >= 3 then
    return json_build_object('allowed', false, 'count', profile_count, 'limit', 3);
  end if;

  return json_build_object('allowed', true, 'count', profile_count, 'limit', 3);
end;
$$;
