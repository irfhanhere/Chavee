-- ====================================================================
--  Chavee — RLS over-exposure cleanup
--  Project dtokistffdnycrzbmxcr · Supabase Dashboard -> SQL Editor
--  Idempotent — safe to re-run.
--
--  Dependency check done against the client before writing this — see the
--  table notes below for exactly what each table's loose policy was used
--  for and why the tightened version does not break it.
-- ====================================================================

begin;

-- ── event_registrations ────────────────────────────────────────────
--  Was: "Registrations viewable by everyone" SELECT USING (true)
--   -> anon could enumerate every event's attendee list AND read
--      ticket_code / qr_code / checked_in for any registrant.
--  Client use of the loose read:
--    - EventDetail.jsx  : reads ONLY the current user's own row
--                         (.eq('user_id', me).maybeSingle())  -> still works
--    - EventsManager.jsx: admin count(*)                       -> is_admin() branch
--  Nothing renders other users' registrations. Safe to scope to owner+admin.
drop policy if exists "Registrations viewable by everyone" on public.event_registrations;
drop policy if exists "event_registrations_select_own_or_admin" on public.event_registrations;
create policy "event_registrations_select_own_or_admin"
  on public.event_registrations for select
  using (auth.uid() = user_id or public.is_admin());

-- Keep: "Users can register themselves" (INSERT), "Users can cancel their
-- own registration" (DELETE). Just drop anon's table grant.
revoke all on table public.event_registrations from anon;


-- ── event_speakers ─────────────────────────────────────────────────
--  Was: "Speakers viewable by everyone" SELECT USING (true).
--  Only consumer is EventDetail.jsx (an AppShell / auth-gated route);
--  prerender.mjs does not read this table. No PII (name/role/bio/photo/
--  socials — curated, publishable content). Scoped to signed-in users.
drop policy if exists "Speakers viewable by everyone" on public.event_speakers;
drop policy if exists "event_speakers_select_authenticated" on public.event_speakers;
create policy "event_speakers_select_authenticated"
  on public.event_speakers for select
  using (auth.role() = 'authenticated' or public.is_admin());

-- Keep: "Only admins manage speakers" (ALL is_admin()).
revoke all on table public.event_speakers from anon;


-- ── admins ─────────────────────────────────────────────────────────
--  Was: "Admins list is readable by any authenticated user" USING (true).
--  Dashboard.jsx and network/CommunityLanding.jsx read the full list to
--  render "admin" badges on regular users' content. Give them a narrow,
--  definer-backed helper that returns ONLY the user_id column, then lock
--  the table itself to admins.
create or replace function public.admin_ids()
returns table (user_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.admins
$$;
revoke execute on function public.admin_ids() from anon;
grant execute on function public.admin_ids() to authenticated;

drop policy if exists "Admins list is readable by any authenticated user" on public.admins;
drop policy if exists "admins_select_admin_only" on public.admins;
create policy "admins_select_admin_only"
  on public.admins for select
  using (public.is_admin());   -- is_admin() is SECURITY DEFINER -> no recursion

revoke all on table public.admins from anon;
-- authenticated keeps SELECT (gated by the policy above -> effectively
-- admin-only); non-admin badge rendering now goes through admin_ids().


-- ── deleted_accounts ───────────────────────────────────────────────
--  Was: "Insert deleted_accounts" INSERT WITH CHECK (true)
--   -> anyone (anon included) could insert arbitrary rows.
--  Only writer today is DangerZoneTab.jsx (deactivate + delete), which
--  always inserts with user_id = auth.uid(). There is no working
--  delete_user_account RPC in the schema, so a pure service-role lock
--  would break the only real deletion path. Scope to "own row" instead.
--  Full service-role lockdown = route DangerZoneTab through an Edge
--  Function / SECURITY DEFINER RPC first (follow-up).
drop policy if exists "Insert deleted_accounts" on public.deleted_accounts;
drop policy if exists "deleted_accounts_insert_own" on public.deleted_accounts;
create policy "deleted_accounts_insert_own"
  on public.deleted_accounts for insert
  with check (auth.uid() = user_id);

revoke all on table public.deleted_accounts from anon;
-- No SELECT policy exists for anon/authenticated -> reads already denied
-- (only the service role / admins via any future policy can read).


-- ── user_gamification — NO CHANGE (reviewed) ──────────────────────
--  Columns: user_id, points, level, badges, updated_at. No email, no
--  PII, nothing sensitive — this is leaderboard / profile-badge data and
--  is read cross-user by Profile.jsx (public profile points) and the
--  Dashboard leaderboard. "SELECT USING (true)" is intentional and
--  correct; tightening it would break public profiles for zero privacy
--  gain. Left as-is on purpose.

commit;


-- ====================================================================
--  VERIFICATION
-- ====================================================================
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('event_registrations','event_speakers','admins','deleted_accounts')
order by tablename, cmd, policyname;

-- anon should now have no privileges on the tightened tables:
select
  has_table_privilege('anon','public.event_registrations','SELECT') as er_anon_select, -- false
  has_table_privilege('anon','public.event_speakers','SELECT')      as es_anon_select, -- false
  has_table_privilege('anon','public.admins','SELECT')              as ad_anon_select, -- false
  has_table_privilege('anon','public.deleted_accounts','INSERT')    as da_anon_insert; -- false

-- admin_ids() callable by authenticated, not anon:
select
  has_function_privilege('authenticated','public.admin_ids()','EXECUTE') as auth_exec, -- true
  has_function_privilege('anon','public.admin_ids()','EXECUTE')          as anon_exec; -- false

-- ====================================================================
--  POST-DEPLOY SMOKE TEST
--   1. Logged in as a NON-admin:
--        - Dashboard + a community page still show "admin" badges
--          (they now call rpc('admin_ids'))
--        - select * from admins  -> 0 rows (policy denies)
--        - /events/<id> still loads; your own registration status shows
--        - select * from event_registrations where user_id <> auth.uid()
--          -> 0 rows
--   2. Logged in as an admin: EventsManager counts, UsersManager admin
--      list, PostsManager all still work.
--   3. Anonymous: POST to /rest/v1/deleted_accounts -> 401/403.
--   4. DangerZoneTab deactivate / delete still writes its row.
-- ====================================================================
