-- ====================================================================
--  Chavee — RLS lockdown: contact_submissions + notifications
--  Run in Supabase Dashboard -> SQL Editor (project dtokistffdnycrzbmxcr).
--  Idempotent — safe to re-run.
--
--  Closes two direct-table bypasses found in the pre-launch audit:
--    1. contact_submissions: an open "INSERT WITH CHECK (true)" policy +
--       GRANT ALL TO anon let bots POST straight to
--       /rest/v1/contact_submissions, skipping the Turnstile check in the
--       submit-contact-form Edge Function.
--    2. notifications: "notif_insert_auth" (WITH CHECK auth.role() =
--       'authenticated') let any signed-in user forge/spam notification
--       rows for any user_id.
-- ====================================================================

begin;

-- ── 1. contact_submissions ──────────────────────────────────────────
--  Only write path is the submit-contact-form Edge Function, which uses
--  the service role (BYPASSRLS). Admin triage is covered by the existing
--  "Only admins can manage contact submissions" (FOR ALL USING is_admin()).

drop policy if exists "Anyone can submit the contact form" on public.contact_submissions;

-- anon has no legitimate use for this table anymore.
revoke all on table public.contact_submissions from anon;

-- `authenticated` keeps its grants but every operation is still gated by
-- the is_admin() policy, so a normal signed-in user can do nothing here.
-- (Left as-is intentionally; tighten to SELECT/UPDATE/DELETE if/when an
-- admin UI for contact submissions is built.)


-- ── 2. notifications — policies ─────────────────────────────────────
--  No INSERT policy at all: clients cannot write to this table directly.
--  All notification creation goes through public.create_notification()
--  (SECURITY DEFINER), used by triggers and by admin/app code.

drop policy if exists "notif_insert_auth" on public.notifications;

-- De-duplicate: these pairs are byte-for-byte identical. Keep the
-- notif_*_own names (consistent with the rest of the table's policies).
drop policy if exists "Users can view their own notifications" on public.notifications;      -- dup of notif_select_own
drop policy if exists "Users can mark their own notifications read" on public.notifications; -- dup of notif_update_own

-- Re-assert the survivors so this script is self-contained even on a
-- fresh DB where they were never created.
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);   -- was USING-only before; explicit now


-- ── 3. notifications — grants ──────────────────────────────────────
--  Remove every write privilege from client roles. SELECT + UPDATE stay
--  for `authenticated` (own rows, via the policies above) — HeaderActions
--  and Notifications.jsx read and mark-as-read. service_role keeps full
--  access for create_notification() / triggers / Edge Functions.

revoke all on table public.notifications from anon;
revoke insert, delete, truncate, references, trigger
  on table public.notifications from authenticated;
grant select, update on table public.notifications to authenticated;


-- ── 4. Harden the one allowed write path: create_notification() ─────
--  (a) anon should not be able to invoke it — only signed-in code and
--      SECURITY DEFINER callers (triggers run as the definer regardless).
--  (b) pin search_path — SECURITY DEFINER function with an unset
--      search_path. Its body already fully-qualifies public.notifications,
--      so an empty search_path is safe.

revoke execute on function public.create_notification(uuid, text, text, text, text) from anon;
grant  execute on function public.create_notification(uuid, text, text, text, text) to authenticated, service_role;
alter function public.create_notification(uuid, text, text, text, text) set search_path = '';

commit;


-- ====================================================================
--  VERIFICATION (run after commit; all should hold)
-- ====================================================================

-- 4a. contact_submissions: no permissive INSERT-for-all policy left,
--     admin policy still present.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'contact_submissions'
order by policyname;

-- 4b. anon has zero privileges on contact_submissions (all should be false).
select
  has_table_privilege('anon', 'public.contact_submissions', 'INSERT') as anon_insert,
  has_table_privilege('anon', 'public.contact_submissions', 'SELECT') as anon_select;

-- 4c. notifications: exactly notif_select_own + notif_update_own, no INSERT policy.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'notifications'
order by policyname;

-- 4d. notifications privileges: anon none; authenticated SELECT+UPDATE only.
select
  has_table_privilege('anon',          'public.notifications', 'INSERT') as anon_insert,      -- false
  has_table_privilege('authenticated', 'public.notifications', 'INSERT') as auth_insert,      -- false
  has_table_privilege('authenticated', 'public.notifications', 'SELECT') as auth_select,      -- true
  has_table_privilege('authenticated', 'public.notifications', 'UPDATE') as auth_update,      -- true
  has_table_privilege('authenticated', 'public.notifications', 'DELETE') as auth_delete;      -- false

-- 4e. create_notification: anon cannot execute, authenticated can.
select
  has_function_privilege('anon',          'public.create_notification(uuid, text, text, text, text)', 'EXECUTE') as anon_exec,  -- false
  has_function_privilege('authenticated', 'public.create_notification(uuid, text, text, text, text)', 'EXECUTE') as auth_exec;  -- true

-- ====================================================================
--  POST-DEPLOY SMOKE TEST (from a shell, not SQL)
--  1. Direct table insert as anon must now FAIL (401/403):
--       curl -i -X POST \
--         "https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/contact_submissions" \
--         -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
--         -H "Content-Type: application/json" \
--         -d '{"full_name":"x","email":"x@x.com","message":"x","agreed_to_terms":true}'
--  2. The real contact form (ContactUs.jsx -> submit-contact-form) must
--     still return { success: true } — test in the browser with a real
--     Turnstile challenge.
--  3. Admin: approve/reject a pending gig in Gig Moderation — the poster
--     still receives the notification (now via create_notification()).
-- ====================================================================
