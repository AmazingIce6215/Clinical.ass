-- Add device_id column for per-device creation limits
alter table if exists public.profiles
  add column if not exists device_id text;

create index if not exists profiles_device_id_idx on public.profiles(device_id);

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
