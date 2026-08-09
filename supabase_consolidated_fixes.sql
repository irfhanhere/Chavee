-- ============================================================
-- CHAVEE — CONSOLIDATED SQL FIXES
-- Run these in Supabase Dashboard → SQL Editor
-- This file contains all pending/unverified SQL changes from the current session.
-- Ordered by dependency: Tables/Columns -> Functions/Triggers -> Policies -> Data
-- ============================================================

-- ============================================================
-- 1. TABLES & COLUMNS
-- ============================================================

-- [Feature: Settings Module & Profiles Extensions]
DO $$ 
BEGIN 
    BEGIN ALTER TABLE public.profiles ADD COLUMN banner_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN phone TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN country TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN state TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN city TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN department TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN portfolio_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN github_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN website_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN languages TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN graduation_year TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.profiles ADD COLUMN privacy text DEFAULT 'public'; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- [Feature: Settings Module Tables]
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_id TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    community_activity BOOLEAN DEFAULT true,
    course_updates BOOLEAN DEFAULT true,
    scholarship_alerts BOOLEAN DEFAULT true,
    gig_updates BOOLEAN DEFAULT true,
    job_alerts BOOLEAN DEFAULT true,
    application_updates BOOLEAN DEFAULT true,
    event_reminders BOOLEAN DEFAULT true,
    mentions BOOLEAN DEFAULT true,
    comments BOOLEAN DEFAULT true,
    likes BOOLEAN DEFAULT true,
    connection_requests BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    monthly_digest BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_visibility TEXT DEFAULT 'public',
    hide_email BOOLEAN DEFAULT false,
    hide_phone BOOLEAN DEFAULT true,
    hide_college BOOLEAN DEFAULT false,
    hide_birthday BOOLEAN DEFAULT true,
    hide_profile_from_search BOOLEAN DEFAULT false,
    allow_connection_requests BOOLEAN DEFAULT true,
    allow_messages BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    show_last_seen BOOLEAN DEFAULT true,
    allow_community_invites BOOLEAN DEFAULT true,
    allow_event_invites BOOLEAN DEFAULT true,
    allow_mentor_requests BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'English',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    currency TEXT DEFAULT 'INR',
    date_format TEXT DEFAULT 'DD-MM-YYYY',
    homepage_default TEXT DEFAULT 'dashboard',
    remember_sidebar_state BOOLEAN DEFAULT true,
    compact_mode BOOLEAN DEFAULT false,
    animations BOOLEAN DEFAULT true,
    accessibility_mode BOOLEAN DEFAULT false,
    font_size TEXT DEFAULT 'medium',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    country TEXT,
    login_time TIMESTAMPTZ DEFAULT now(),
    last_active TIMESTAMPTZ DEFAULT now(),
    is_current BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT DEFAULT 'Free',
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deleted_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT,
    reason TEXT,
    scheduled_deletion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- [Feature: Education Admin & Scholarships]
DO $$ 
BEGIN 
    BEGIN ALTER TABLE public.courses ADD COLUMN tags TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN duration TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN category_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN banner_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN is_coming_soon BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN is_featured BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN language TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN short_description TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.courses ADD COLUMN estimated_launch_date TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.certifications ADD COLUMN status TEXT DEFAULT 'Draft'; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.resources ADD COLUMN status TEXT DEFAULT 'Draft'; EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.scholarships ADD COLUMN state TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.scholarships ADD COLUMN country TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.scholarships ADD COLUMN education_level TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.scholarships ADD COLUMN category TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.scholarships ADD COLUMN funding_type TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.scholarships ADD COLUMN deadline_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- [Feature: Post Comments & Gigs fixes]
ALTER TABLE public.post_comments
  DROP CONSTRAINT IF EXISTS fk_post_comments_user_id;

ALTER TABLE public.post_comments
  ADD CONSTRAINT fk_post_comments_user_id
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gig_applications' AND column_name = 'conversation_id') THEN
    ALTER TABLE public.gig_applications ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gig_applications' AND column_name = 'updated_at') THEN
    ALTER TABLE public.gig_applications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- [Feature: Notify Me / Waitlist]
ALTER TABLE public.notify_subscribers DROP CONSTRAINT IF EXISTS notify_subscribers_user_id_feature_key_key;
ALTER TABLE public.notify_subscribers ADD CONSTRAINT notify_subscribers_user_id_feature_key_key UNIQUE (user_id, feature_key);

CREATE OR REPLACE VIEW public.waitlist_counts AS
SELECT feature_key, COUNT(*) as waitlist_count
FROM public.notify_subscribers
GROUP BY feature_key;

GRANT SELECT ON public.waitlist_counts TO authenticated;
GRANT SELECT ON public.waitlist_counts TO anon;


-- ============================================================
-- 2. FUNCTIONS & TRIGGERS
-- ============================================================

-- [Feature: Notify Me RPCs]
CREATE OR REPLACE FUNCTION toggle_notify_me(p_feature_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  SELECT true INTO v_exists 
  FROM public.notify_subscribers 
  WHERE user_id = v_user_id AND feature_key = p_feature_key;
  
  IF v_exists THEN
    DELETE FROM public.notify_subscribers 
    WHERE user_id = v_user_id AND feature_key = p_feature_key;
    RETURN false;
  ELSE
    INSERT INTO public.notify_subscribers (user_id, email, feature_key) 
    VALUES (v_user_id, v_email, p_feature_key);
    RETURN true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_waitlist_on_publish(p_feature_key text, p_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscriber RECORD;
BEGIN
    FOR subscriber IN 
        SELECT user_id, id 
        FROM public.notify_subscribers 
        WHERE feature_key = p_feature_key 
    LOOP
        BEGIN
            INSERT INTO public.notifications (user_id, title, message, link, is_read)
            VALUES (
                subscriber.user_id, 
                'Now Live: ' || p_title, 
                'The wait is over! "' || p_title || '" is now available. Click here to check it out.', 
                '/education', 
                false
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to insert notification for user %', subscriber.user_id;
        END;
    END LOOP;
    -- ⚠️ DESTRUCTIVE: Removes users from waitlist after notifying
    DELETE FROM public.notify_subscribers WHERE feature_key = p_feature_key;
END;
$$;

-- [Feature: Gig Applications Workflow]
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
  SELECT posted_by INTO v_gig_poster_id FROM public.gigs WHERE id = NEW.gig_id;
  IF v_gig_poster_id IS NULL OR v_gig_poster_id = NEW.applicant_id THEN RETURN NEW; END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM public.conversation_participants cp1
  INNER JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_gig_poster_id AND cp2.user_id = NEW.applicant_id
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (created_at) VALUES (NOW()) RETURNING id INTO v_conversation_id;
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, v_gig_poster_id), (v_conversation_id, NEW.applicant_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  NEW.conversation_id := v_conversation_id;
  RETURN NEW;
END;
$$;

-- ⚠️ DESTRUCTIVE: drops existing trigger before recreating
DROP TRIGGER IF EXISTS on_gig_application_insert ON public.gig_applications;
CREATE TRIGGER on_gig_application_insert
  BEFORE INSERT ON public.gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gig_proposal();

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
  SELECT ga.applicant_id, ga.gig_id, g.title, g.posted_by
  INTO v_applicant_id, v_gig_id, v_gig_title, v_poster_id
  FROM public.gig_applications ga
  LEFT JOIN public.gigs g ON g.id = ga.gig_id
  WHERE ga.id = p_application_id;

  IF v_applicant_id IS NULL THEN RAISE EXCEPTION 'Application not found: %', p_application_id; END IF;
  IF auth.uid() != v_poster_id THEN RAISE EXCEPTION 'Only the gig poster can mark an application as complete'; END IF;

  UPDATE public.gig_applications SET status = 'Completed', updated_at = NOW() WHERE id = p_application_id;

  INSERT INTO public.user_gamification (user_id, points, level, badges)
  VALUES (v_applicant_id, 100, 1, ARRAY[]::text[])
  ON CONFLICT (user_id) DO UPDATE SET points = user_gamification.points + 100;

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

-- [Feature: Settings Default Rows Trigger]
CREATE OR REPLACE FUNCTION public.create_default_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.privacy_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan_name) VALUES (NEW.id, 'Free') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ⚠️ DESTRUCTIVE: drops existing trigger before recreating
DROP TRIGGER IF EXISTS on_profile_created_settings ON public.profiles;
CREATE TRIGGER on_profile_created_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_settings();


-- ============================================================
-- 3. ROW LEVEL SECURITY (POLICIES)
-- ============================================================

-- [Feature: Notifications]
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- ⚠️ DESTRUCTIVE: drops existing policies before recreating
DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert_auth" ON public.notifications;

CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_auth" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- [Feature: Profiles]
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ⚠️ DESTRUCTIVE: drops existing policies before recreating
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- [Feature: Notify Subscribers]
ALTER TABLE public.notify_subscribers ENABLE ROW LEVEL SECURITY;
-- ⚠️ DESTRUCTIVE: drops existing policies before recreating
DROP POLICY IF EXISTS "notify_subscribers_insert_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_select_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_delete_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_update_auth" ON public.notify_subscribers;

CREATE POLICY "notify_subscribers_select_auth" ON public.notify_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notify_subscribers_insert_auth" ON public.notify_subscribers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notify_subscribers_delete_auth" ON public.notify_subscribers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "notify_subscribers_update_auth" ON public.notify_subscribers FOR UPDATE USING (auth.uid() = user_id);

-- [Feature: Follows]
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
-- ⚠️ DESTRUCTIVE: drops existing policies before recreating
DROP POLICY IF EXISTS "follows_select_auth" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "follows_select_auth" ON public.follows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- [Feature: Posts]
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- ⚠️ DESTRUCTIVE: drops existing policies before recreating
DROP POLICY IF EXISTS "posts_select_auth" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_select_auth" ON public.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- [Feature: Settings Module Tables]
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- ⚠️ DESTRUCTIVE: drops existing policies to ensure clean state
DROP POLICY IF EXISTS "Manage own connected_accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Manage own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Manage own privacy_settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Manage own user_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Manage own user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Read own security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "Insert own security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "Read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Manage own support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Insert deleted_accounts" ON public.deleted_accounts;

CREATE POLICY "Manage own connected_accounts" ON public.connected_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own notification_preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own privacy_settings" ON public.privacy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own user_preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own user_sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Read own security_logs" ON public.security_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own security_logs" ON public.security_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manage own support_tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Insert deleted_accounts" ON public.deleted_accounts FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. DATA UPDATES & STORAGE BUCKETS
-- ============================================================

-- [Feature: Settings Data Backfill for Existing Profiles]
INSERT INTO public.notification_preferences (user_id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;
INSERT INTO public.privacy_settings (user_id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;
INSERT INTO public.user_preferences (user_id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;
INSERT INTO public.subscriptions (user_id, plan_name) SELECT id, 'Free' FROM public.profiles ON CONFLICT DO NOTHING;

-- [Feature: Profile Images / Banners Storage Buckets]
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-banners', 'profile-banners', true) ON CONFLICT (id) DO NOTHING;

-- ⚠️ DESTRUCTIVE: drops existing storage policies before recreating
DROP POLICY IF EXISTS "Public Access for profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Upload profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Update own profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Delete own profile-images" ON storage.objects;

CREATE POLICY "Public Access for profile-images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Auth Users Upload profile-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Users Update own profile-images" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid() = owner);
CREATE POLICY "Auth Users Delete own profile-images" ON storage.objects FOR DELETE USING (bucket_id = 'profile-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Public Access for profile-banners" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Upload profile-banners" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Update own profile-banners" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Delete own profile-banners" ON storage.objects;

CREATE POLICY "Public Access for profile-banners" ON storage.objects FOR SELECT USING (bucket_id = 'profile-banners');
CREATE POLICY "Auth Users Upload profile-banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-banners' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Users Update own profile-banners" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-banners' AND auth.uid() = owner);
CREATE POLICY "Auth Users Delete own profile-banners" ON storage.objects FOR DELETE USING (bucket_id = 'profile-banners' AND auth.uid() = owner);
