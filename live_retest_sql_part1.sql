-- ============================================================
-- LIVE RE-VERIFICATION PART 1 — Run in Supabase SQL Editor
-- Chavee project: dtokistffdnycrzbmxcr
-- Date: 2026-07-27
-- ============================================================

-- -------------------------------------------------------
-- SECTION A: RLS POLICIES — pg_policies audit
-- -------------------------------------------------------

-- A1. messages policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- A2. conversations policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- A3. conversation_participants policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

-- A4. gigs policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'gigs'
ORDER BY policyname;

-- A5. job_applications policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'job_applications'
ORDER BY policyname;

-- A6. posts policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;

-- A7. admins policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- A8. profiles policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- A9. notifications policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- A10. gig_applications policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'gig_applications'
ORDER BY policyname;

-- ALL IN ONE — easier to screenshot:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'messages','conversations','conversation_participants',
  'gigs','job_applications','gig_applications','posts',
  'admins','profiles','notifications'
)
ORDER BY tablename, policyname;

-- -------------------------------------------------------
-- SECTION B: FUNCTIONS — pg_proc audit
-- -------------------------------------------------------

-- B1. is_conversation_participant
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'is_conversation_participant';

-- B2. complete_gig_application
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'complete_gig_application';

-- B3. create_notification
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'create_notification';

-- B4. is_admin
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'is_admin';

-- B5. ALL relevant functions summary
SELECT proname, provolatile, prosecdef
FROM pg_proc
WHERE proname IN (
  'is_conversation_participant',
  'complete_gig_application',
  'create_notification',
  'is_admin',
  'handle_gig_proposal'
);

-- -------------------------------------------------------
-- SECTION C: TRIGGERS — information_schema audit
-- -------------------------------------------------------

-- C1. All triggers on gig_applications
SELECT trigger_name, event_object_table, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gig_applications'
   OR event_object_table = 'gigs';

-- C2. All triggers (full list)
SELECT trigger_name, event_object_schema, event_object_table, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- -------------------------------------------------------
-- SECTION D: CONSTRAINTS — post_comments FK check
-- -------------------------------------------------------

-- D1. post_comments constraints
SELECT con.conname, con.contype, 
       pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'post_comments'
ORDER BY con.contype;

-- -------------------------------------------------------
-- SECTION E: STORAGE BUCKETS
-- -------------------------------------------------------

-- E1. message-attachments bucket
SELECT id, name, public, created_at
FROM storage.buckets
WHERE name IN ('message-attachments', 'job-cvs')
ORDER BY name;

-- -------------------------------------------------------
-- SECTION F: RLS ENABLED CHECK
-- -------------------------------------------------------

-- F1. Which tables have RLS enabled?
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'messages','conversations','conversation_participants',
    'gigs','job_applications','gig_applications','posts',
    'admins','profiles','notifications','post_comments'
  )
ORDER BY tablename;

-- -------------------------------------------------------
-- SECTION G: public_profiles VIEW EXISTS?
-- -------------------------------------------------------
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'public_profiles';

-- Check its definition
SELECT view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'public_profiles';
