-- ============================================================
--  CHAVEE — Supabase SQL Fixes
--  Run these in order in Supabase Dashboard → SQL Editor
--  Project: https://dtokistffdnycrzbmxcr.supabase.co
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- STEP 1: Auto-create profile + gamification on ANY signup
--         (works for both Email AND Google OAuth)
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile row (skip if already exists)
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    email,
    onboarding_completed,
    bio,
    interests,
    motive,
    college,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    LOWER(REPLACE(COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ), ' ', '_')),
    NEW.email,
    false,
    'New to Chavee! 👋',
    ARRAY[]::text[],
    '',
    '',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create gamification row (skip if already exists)
  INSERT INTO public.user_gamification (
    user_id,
    points,
    level,
    badges
  )
  VALUES (
    NEW.id,
    50,
    1,
    ARRAY['Onboarding Explorer']
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ──────────────────────────────────────────────────────────
-- STEP 2: Fix RLS policies for profiles
--         (ensures Google OAuth users can read/update their own profile)
-- ──────────────────────────────────────────────────────────

-- Enable RLS (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies cleanly
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_auth" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Anyone authenticated can read all profiles (needed for network/community)
CREATE POLICY "profiles_select_all_auth"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ──────────────────────────────────────────────────────────
-- STEP 3: Fix RLS policies for posts
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_auth" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Posts visible to all authenticated" ON public.posts;

CREATE POLICY "posts_select_auth"
  ON public.posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  USING (auth.uid() = posted_by);


-- ──────────────────────────────────────────────────────────
-- STEP 4: Fix RLS for user_gamification
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_select_auth" ON public.user_gamification;
DROP POLICY IF EXISTS "gamification_insert_own" ON public.user_gamification;
DROP POLICY IF EXISTS "gamification_update_own" ON public.user_gamification;

CREATE POLICY "gamification_select_auth"
  ON public.user_gamification FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "gamification_insert_own"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gamification_update_own"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- STEP 5: Clean ALL mock / seed data for fresh start
--         (Events, Community, Scholarships are KEPT as-is)
-- ──────────────────────────────────────────────────────────

-- Remove mock posts
DELETE FROM public.posts;

-- Remove mock gigs/jobs
DELETE FROM public.gigs;

-- ──────────────────────────────────────────────────────────
-- STEP 6: Add 'email' column to profiles if missing
--         (needed for Google OAuth users)
-- ──────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────
-- VERIFICATION: Check all is working
-- ──────────────────────────────────────────────────────────

-- Should show 0 rows (fresh start)
SELECT COUNT(*) as posts_count FROM public.posts;
SELECT COUNT(*) as gigs_count FROM public.gigs;

-- Should show the trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ──────────────────────────────────────────────────────────
-- SUPABASE DASHBOARD MANUAL STEPS (do these in the UI):
-- ──────────────────────────────────────────────────────────
-- 1. Go to: Authentication → URL Configuration
-- 2. Site URL: https://chavee.in
-- 3. Redirect URLs → Add ALL of:
--      https://chavee.in
--      https://chavee.in/dashboard
--      https://www.chavee.in
--      https://www.chavee.in/dashboard
--      http://localhost:5173
--      http://localhost:5173/dashboard
-- 4. Go to: Authentication → Providers → Google
--    Verify Client ID and Client Secret are set correctly
-- ──────────────────────────────────────────────────────────
