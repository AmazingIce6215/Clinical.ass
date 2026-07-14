begin;

-- Display names are not identities. Multiple learners can share the same name.
alter table public.profiles
  drop constraint if exists profiles_first_name_key;

-- Replace overlapping and unsafe profile policies with one owner-only policy per action.
drop policy if exists "Anyone can update profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- These SECURITY DEFINER functions are internal helpers, not public RPC endpoints.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_device_limit(text) from public, anon, authenticated;
revoke execute on function public.reset_pin_by_name(text, text) from public, anon, authenticated;

-- Tighten the remaining ownership policies and avoid per-row auth function evaluation.
drop policy if exists "Users can read own cases" on public.cases;
drop policy if exists "Users can insert own cases" on public.cases;
drop policy if exists "Users can update own cases" on public.cases;
drop policy if exists "Users can delete own cases" on public.cases;

create policy "Users can read own cases"
  on public.cases for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own cases"
  on public.cases for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own cases"
  on public.cases for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own cases"
  on public.cases for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own progress" on public.teaching_progress;
drop policy if exists "Users can insert own progress" on public.teaching_progress;
drop policy if exists "Users can update own progress" on public.teaching_progress;

create policy "Users can read own progress"
  on public.teaching_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own progress"
  on public.teaching_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own progress"
  on public.teaching_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists teaching_progress_case_id_idx on public.teaching_progress(case_id);

commit;
