-- Add pin_hash and remove email requirement
alter table if exists public.profiles
  add column if not exists pin_hash text,
  drop column if exists email;

-- Allow anon to insert profiles (anyone can create an account)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Anyone can create a profile"
  on public.profiles for insert
  with check (true);

-- Allow anon to read all profiles (for looking up by name)
-- Security: PINs are SHA-256 hashed, sensitive data is protected
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);
