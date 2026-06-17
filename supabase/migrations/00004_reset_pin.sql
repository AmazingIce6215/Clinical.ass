create or replace function public.reset_pin_by_name(p_first_name text, p_pin_hash text)
returns json
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set pin_hash = p_pin_hash, updated_at = now()
  where first_name = p_first_name;

  if not found then
    return json_build_object('success', false, 'error', 'Profile not found');
  end if;

  return json_build_object('success', true);
end;
$$;
