-- ============================================================
-- LIVE RE-VERIFICATION PART 2 — Adversarial Tests
-- Run in Supabase SQL Editor (as service role or impersonation)
-- ============================================================

-- NOTE: These tests query as auth.uid() = specific user IDs.
-- To properly test RLS, run queries AFTER setting role to 
-- authenticated + claiming a specific user ID via:
--   SET LOCAL request.jwt.claims = '{"sub": "USER_B_UUID", "role": "authenticated"}';
-- OR test via the Supabase client JS scripts below.

-- -------------------------------------------------------
-- SETUP: Get User A and User B IDs from auth.users
-- -------------------------------------------------------
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at ASC
LIMIT 10;

-- -------------------------------------------------------
-- PART 2.1 — Test User B reading messages not in their conversation
-- Expected: Empty result when proper RLS is live
-- -------------------------------------------------------
-- First, get all conversations and their participants to understand data structure
SELECT c.id as conv_id, cp.user_id, c.created_at
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
ORDER BY c.created_at DESC
LIMIT 20;

-- Count messages in DB (as service role - bypasses RLS)
SELECT conversation_id, count(*) as msg_count
FROM messages
GROUP BY conversation_id
ORDER BY msg_count DESC
LIMIT 10;

-- -------------------------------------------------------
-- PART 2.2 — Test User B reading job_applications of User A
-- Expected: Empty when RLS is live
-- -------------------------------------------------------
-- Count of job_applications per user (service role view)
SELECT user_id, count(*) as app_count
FROM job_applications
GROUP BY user_id
LIMIT 10;

-- -------------------------------------------------------
-- PART 2.3 — Check gigs verified field distribution
-- -------------------------------------------------------
SELECT verified, count(*) as gig_count, 
       array_agg(title ORDER BY created_at DESC) as titles
FROM gigs
GROUP BY verified;

-- -------------------------------------------------------
-- PART 2.4 — profiles table row counts
-- -------------------------------------------------------
SELECT count(*) as total_profiles FROM profiles;
SELECT id, full_name, email IS NOT NULL as has_email, dob IS NOT NULL as has_dob
FROM profiles
LIMIT 5;

-- -------------------------------------------------------
-- PART 2.5 — posts - count per user
-- -------------------------------------------------------
SELECT posted_by, count(*) as post_count
FROM posts
GROUP BY posted_by
LIMIT 10;

-- -------------------------------------------------------
-- PART 2.6 — admins table content (service role)
-- -------------------------------------------------------
SELECT user_id FROM admins;

-- -------------------------------------------------------
-- PART 2.7 — notifications table RLS check
-- -------------------------------------------------------
SELECT count(*) as total_notifs FROM notifications;
SELECT user_id, count(*) as notif_count
FROM notifications
GROUP BY user_id
LIMIT 5;

-- -------------------------------------------------------
-- PART 2.8 — unverified gig visibility check
-- -------------------------------------------------------
SELECT id, title, verified, posted_by
FROM gigs
WHERE verified = false
LIMIT 10;

-- -------------------------------------------------------
-- EXTRA: gig_applications table structure + data
-- -------------------------------------------------------
SELECT ga.id, ga.gig_id, ga.applicant_id, ga.conversation_id, ga.status, ga.created_at
FROM gig_applications ga
ORDER BY ga.created_at DESC
LIMIT 10;

-- post_comments structure + FK check
SELECT pc.id, pc.post_id, pc.user_id, pc.content, pc.created_at
FROM post_comments pc
ORDER BY pc.created_at DESC
LIMIT 10;

-- Check if post_comments.user_id has FK to profiles
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'post_comments';
