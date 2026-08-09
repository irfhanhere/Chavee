-- ============================================================
-- CHAVEE — PHASE 2 REMAINING FIXES
-- Run these in Supabase Dashboard → SQL Editor
-- Date: 2026-07-27
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FIX 1: post_comments FK (CRITICAL — commenting is broken)
-- PostgREST cannot join post_comments → profiles without this FK
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.post_comments
  ADD CONSTRAINT IF NOT EXISTS fk_post_comments_user_id
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Verify: should show the constraint
SELECT conname, confrelid::regclass
FROM pg_constraint
WHERE conrelid = 'public.post_comments'::regclass
  AND contype = 'f';


-- ──────────────────────────────────────────────────────────
-- FIX 2: notifications table RLS
-- Without this, any auth user can read all other users' notifications
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;

-- Users can only read their own notifications
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- The create_notification RPC runs as SECURITY DEFINER so it bypasses this
-- But if any direct inserts happen from client code, allow authenticated users
CREATE POLICY "notif_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can mark their own notifications as read
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Verify
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'notifications';


-- ──────────────────────────────────────────────────────────
-- FIX 3: Admin SELECT on profiles (prevents regression)
-- After profiles_select_own lands, admins need to read all profiles
-- for UsersManager, GigsManager, JobsManager, ReportsManager
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (is_admin());

-- Verify both policies now exist on profiles
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';


-- ──────────────────────────────────────────────────────────
-- FIX 4: handle_gig_proposal trigger
-- Called after INSERT on gig_applications to auto-create a DM conversation
-- between the gig poster and the applicant
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_gig_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_gig_poster_id UUID;
BEGIN
  -- Get the gig poster
  SELECT posted_by INTO v_gig_poster_id
  FROM public.gigs
  WHERE id = NEW.gig_id;

  IF v_gig_poster_id IS NULL OR v_gig_poster_id = NEW.applicant_id THEN
    -- No poster or self-application — skip
    RETURN NEW;
  END IF;

  -- Check if a conversation between these two users already exists
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM public.conversation_participants cp1
  INNER JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_gig_poster_id
    AND cp2.user_id = NEW.applicant_id
  LIMIT 1;

  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (created_at)
    VALUES (NOW())
    RETURNING id INTO v_conversation_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (v_conversation_id, v_gig_poster_id),
      (v_conversation_id, NEW.applicant_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  -- Update the gig_application row with the conversation_id
  NEW.conversation_id := v_conversation_id;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, recreate
DROP TRIGGER IF EXISTS on_gig_application_insert ON public.gig_applications;

CREATE TRIGGER on_gig_application_insert
  BEFORE INSERT ON public.gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gig_proposal();

-- NOTE: BEFORE INSERT trigger sets NEW.conversation_id before the row lands
-- The Earn.jsx code polls for conversation_id AFTER INSERT with a 700ms wait
-- Using BEFORE INSERT means conversation_id is available immediately in the
-- inserted row returned by .select('*').single() — no need to re-fetch

-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'gig_applications'
  AND trigger_name = 'on_gig_application_insert';


-- ──────────────────────────────────────────────────────────
-- FIX 5: complete_gig_application RPC
-- Called by Earn.jsx L411 when gig poster marks application as complete
-- Awards XP to applicant and updates application status
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_gig_application(p_application_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applicant_id UUID;
  v_gig_id UUID;
  v_gig_title TEXT;
  v_poster_id UUID;
BEGIN
  -- Get application details
  SELECT ga.applicant_id, ga.gig_id, g.title, g.posted_by
  INTO v_applicant_id, v_gig_id, v_gig_title, v_poster_id
  FROM public.gig_applications ga
  LEFT JOIN public.gigs g ON g.id = ga.gig_id
  WHERE ga.id = p_application_id;

  IF v_applicant_id IS NULL THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id;
  END IF;

  -- Only the gig poster can complete the application
  IF auth.uid() != v_poster_id THEN
    RAISE EXCEPTION 'Only the gig poster can mark an application as complete';
  END IF;

  -- Update application status to Completed
  UPDATE public.gig_applications
  SET status = 'Completed', updated_at = NOW()
  WHERE id = p_application_id;

  -- Award XP to the applicant (+100 XP for completing a gig)
  INSERT INTO public.user_gamification (user_id, points, level, badges)
  VALUES (v_applicant_id, 100, 1, ARRAY[]::text[])
  ON CONFLICT (user_id) DO UPDATE
  SET points = user_gamification.points + 100;

  -- Notify the applicant that their work is complete
  PERFORM public.create_notification(
    p_user_id  := v_applicant_id,
    p_type     := 'gig_completed',
    p_title    := '🎉 Gig Completed!',
    p_body     := 'Your work on "' || COALESCE(v_gig_title, 'the gig') || '" has been marked complete. +100 XP!',
    p_link     := '/earn'
  );

END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_gig_application(UUID) TO authenticated;

-- Verify RPC exists
SELECT proname, pronargs FROM pg_proc WHERE proname = 'complete_gig_application';


-- ──────────────────────────────────────────────────────────
-- ALSO: Ensure gig_applications table has conversation_id column
-- (required for handle_gig_proposal trigger to set it)
-- ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gig_applications' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.gig_applications
      ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gig_applications' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.gig_applications
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────
-- VERIFY ALL FIXES
-- ──────────────────────────────────────────────────────────

-- 1. post_comments FK
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.post_comments'::regclass AND contype = 'f';

-- 2. notifications policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'notifications';

-- 3. profiles policies (should now have both select_own and select_admin)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- 4. handle_gig_proposal trigger
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'gig_applications';

-- 5. complete_gig_application RPC
SELECT proname FROM pg_proc WHERE proname = 'complete_gig_application';

-- 6. gig_applications columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'gig_applications'
ORDER BY ordinal_position;
