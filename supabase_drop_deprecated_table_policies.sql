-- ====================================================================
--  Chavee — drop RLS policies on the *_deprecated tables
--  Project dtokistffdnycrzbmxcr · Supabase Dashboard -> SQL Editor
--  Idempotent — safe to re-run.
--
--  Confirmed unused:
--    - follows_deprecated, blogs_deprecated, press_releases_deprecated
--      have ZERO references in src/ (checked). The live blog / press
--      features read the `content` table (Blog.jsx, PressKit.jsx); the
--      social graph is connection_requests / connections.
--    - follows_deprecated still has an INSERT trigger (on_follow_created
--      -> handle_new_follow) but nothing ever inserts into the table, so
--      it never fires. Dropped here too.
--
--  RLS is left ENABLED on all three with no policies -> deny-all, the
--  safest resting state for a dead table (do NOT run DISABLE ROW LEVEL
--  SECURITY — that would open them up).
-- ====================================================================

begin;

-- ── follows_deprecated ─────────────────────────────────────────────
drop trigger if exists on_follow_created on public.follows_deprecated;
drop function if exists public.handle_new_follow();

drop policy if exists "Follows are viewable by everyone"       on public.follows_deprecated;
drop policy if exists "Users can follow others themselves"     on public.follows_deprecated;
drop policy if exists "Users can unfollow themselves"          on public.follows_deprecated;
drop policy if exists "follows_delete_own"                     on public.follows_deprecated;
drop policy if exists "follows_insert_own"                     on public.follows_deprecated;
drop policy if exists "follows_select_auth"                    on public.follows_deprecated;
revoke all on table public.follows_deprecated from anon, authenticated;

-- ── blogs_deprecated ───────────────────────────────────────────────
drop policy if exists "blogs_delete_policy"  on public.blogs_deprecated;
drop policy if exists "blogs_insert_policy"  on public.blogs_deprecated;
drop policy if exists "blogs_select_policy"  on public.blogs_deprecated;
drop policy if exists "blogs_update_policy"  on public.blogs_deprecated;
revoke all on table public.blogs_deprecated from anon, authenticated;

-- ── press_releases_deprecated ──────────────────────────────────────
drop policy if exists "press_releases_delete_policy"  on public.press_releases_deprecated;
drop policy if exists "press_releases_insert_policy"  on public.press_releases_deprecated;
drop policy if exists "press_releases_select_policy"  on public.press_releases_deprecated;
drop policy if exists "press_releases_update_policy"  on public.press_releases_deprecated;
revoke all on table public.press_releases_deprecated from anon, authenticated;

commit;


-- ── Optional next step (destructive — decide separately) ───────────
--  These tables still hold rows in chavee_backup_data_prelaunch.sql. If
--  you have confirmed the data is not needed, drop the tables outright:
--
-- drop table if exists public.follows_deprecated cascade;
-- drop table if exists public.blogs_deprecated cascade;
-- drop table if exists public.press_releases_deprecated cascade;


-- ====================================================================
--  VERIFICATION
-- ====================================================================
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
  and tablename in ('follows_deprecated','blogs_deprecated','press_releases_deprecated')
group by tablename;
-- expect: 0 rows (no policies left on any of them)

select relname, relrowsecurity as rls_enabled
from pg_class
where relname in ('follows_deprecated','blogs_deprecated','press_releases_deprecated');
-- expect: rls_enabled = true for all (deny-all)

select tgname from pg_trigger where tgname = 'on_follow_created';
-- expect: 0 rows
