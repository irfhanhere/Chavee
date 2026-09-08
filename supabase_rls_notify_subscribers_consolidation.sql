-- ====================================================================
--  Chavee — notify_subscribers RLS consolidation
--  Project dtokistffdnycrzbmxcr · Supabase Dashboard -> SQL Editor
--  Idempotent — safe to re-run.
--
--  ⛔ DO NOT RUN THIS UNTIL ALL OF THE FOLLOWING ARE TRUE:
--     [ ] subscribe-notify Edge Function deployed
--         (npx supabase functions deploy subscribe-notify --no-verify-jwt)
--     [ ] TURNSTILE_SECRET_KEY + CF_SERVICE_ROLE_KEY secrets set on it
--     [ ] All 7 migrated forms verified working (see checklist at bottom):
--         ComingSoon, Careers talent network, Dashboard "Notify me",
--         Earn "Notify me", Learn course-request, Learn resources notify,
--         Privacy "Export my data", Security "Notify me about 2FA"
--
--  Dropping notify_insert_own BEFORE the forms are migrated will break
--  every anonymous subscribe form (they rely on its "user_id IS NULL"
--  branch). NotifyMeButton.jsx is unaffected — it always sends user_id.
-- ====================================================================

begin;

-- ── 1. INSERT: drop the loose legacy policy ─────────────────────────
--  notify_insert_own = WITH CHECK (auth.uid() = user_id OR user_id IS NULL)
--  The "OR user_id IS NULL" branch let anon POST straight to
--  /rest/v1/notify_subscribers. Anonymous signups now go through the
--  subscribe-notify Edge Function (service role). The only client-side
--  direct insert left is a signed-in user subscribing themselves, which
--  notify_subscribers_insert_auth already covers.

drop policy if exists "notify_insert_own" on public.notify_subscribers;

drop policy if exists "notify_subscribers_insert_auth" on public.notify_subscribers;
create policy "notify_subscribers_insert_auth" on public.notify_subscribers
  for insert with check (auth.uid() = user_id);


-- ── 2. SELECT: drop the exact duplicate ────────────────────────────
--  notify_select_own  ≡  notify_subscribers_select_auth  (both:
--  USING (auth.uid() = user_id)). Keep the newer-named one. The admin
--  read policy (notify_select_admin) is NOT a duplicate — keep it
--  (SubscribersManager / MarketplaceManager read across all rows).

drop policy if exists "notify_select_own" on public.notify_subscribers;

drop policy if exists "notify_subscribers_select_auth" on public.notify_subscribers;
create policy "notify_subscribers_select_auth" on public.notify_subscribers
  for select using (auth.uid() = user_id);

drop policy if exists "notify_select_admin" on public.notify_subscribers;
create policy "notify_select_admin" on public.notify_subscribers
  for select using (public.is_admin());


-- ── 3. UPDATE: no true duplicate here ──────────────────────────────
--  notify_subscribers_update_auth (own) and notify_update_admin (admin)
--  are DIFFERENT policies — both kept. Re-assert for a self-contained
--  script and add an explicit WITH CHECK to the "own" one.

drop policy if exists "notify_subscribers_update_auth" on public.notify_subscribers;
create policy "notify_subscribers_update_auth" on public.notify_subscribers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notify_update_admin" on public.notify_subscribers;
create policy "notify_update_admin" on public.notify_subscribers
  for update using (public.is_admin()) with check (public.is_admin());


-- ── 4. DELETE: keep the single own-row policy ──────────────────────
drop policy if exists "notify_subscribers_delete_auth" on public.notify_subscribers;
create policy "notify_subscribers_delete_auth" on public.notify_subscribers
  for delete using (auth.uid() = user_id);


-- ── 5. Grants ──────────────────────────────────────────────────────
--  anon: nothing (all anon writes go via subscribe-notify / service role).
--  authenticated: SELECT/INSERT/UPDATE/DELETE (own rows via the policies
--  above — NotifyMeButton, toggle_notify_me callers); strip the non-DML
--  privileges. service_role keeps full access.

revoke all on table public.notify_subscribers from anon;
revoke truncate, references, trigger on table public.notify_subscribers from authenticated;
grant select, insert, update, delete on table public.notify_subscribers to authenticated;

commit;


-- ── 6. OPTIONAL (separate decision): drop the duplicate UNIQUE ──────
--  The table has TWO identical constraints, both UNIQUE (user_id, feature_key):
--    notify_subscribers_user_feature_unique
--    notify_subscribers_user_id_feature_key_key
--  Keeping one is enough. Uncomment to drop the redundant one:
--
-- alter table public.notify_subscribers
--   drop constraint if exists notify_subscribers_user_feature_unique;


-- ====================================================================
--  VERIFICATION (run after commit)
-- ====================================================================

-- 6a. Exactly 6 policies, no INSERT-with-NULL-allowed policy left.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'notify_subscribers'
order by cmd, policyname;
-- expect: notify_subscribers_insert_auth (INSERT),
--         notify_select_admin + notify_subscribers_select_auth (SELECT),
--         notify_subscribers_update_auth + notify_update_admin (UPDATE),
--         notify_subscribers_delete_auth (DELETE)

-- 6b. anon has zero table privileges; authenticated has the 4 DML verbs.
select
  has_table_privilege('anon',          'public.notify_subscribers', 'INSERT') as anon_insert,   -- false
  has_table_privilege('anon',          'public.notify_subscribers', 'SELECT') as anon_select,   -- false
  has_table_privilege('authenticated', 'public.notify_subscribers', 'INSERT') as auth_insert,   -- true
  has_table_privilege('authenticated', 'public.notify_subscribers', 'SELECT') as auth_select,   -- true
  has_table_privilege('authenticated', 'public.notify_subscribers', 'UPDATE') as auth_update,   -- true
  has_table_privilege('authenticated', 'public.notify_subscribers', 'DELETE') as auth_delete;   -- true


-- ====================================================================
--  PRE-DROP FORM CHECKLIST — verify BEFORE running the transaction above
--  (with the Edge Function deployed but this SQL NOT yet applied, so the
--   old policy is still there as a safety net during testing)
-- ====================================================================
--  Anonymous (logged out), public pages — Turnstile widget must appear:
--    1. /resources (ComingSoon)      -> enter email, pass Turnstile, submit
--                                       -> "You are on the list"
--    2. /careers -> Join Our Talent Network -> email + Turnstile -> "on our
--                                       talent network"
--  Signed in:
--    3. Dashboard -> a "Notify me" feature card -> success; click again ->
--       "You're already on the list!"
--    4. Earn -> "Notify me" feature card -> same
--    5. Education -> Request a course -> submit -> "request submitted"
--    6. Education -> Resources notify form -> submit -> success
--    7. Settings -> Privacy -> "Export my data" -> waitlist success
--    8. Settings -> Security -> "Notify me about 2FA" -> waitlist success
--  For 3-8, confirm the new row has user_id = the signed-in user (not NULL):
--    select feature_key, user_id, email, created_at
--    from notify_subscribers order by created_at desc limit 10;
--  Post-apply: repeat 1-8; also confirm a raw anon POST to
--    /rest/v1/notify_subscribers now returns 401/403.
-- ====================================================================
