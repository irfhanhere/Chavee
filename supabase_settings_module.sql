-- supabase_settings_module.sql

-- 1. Extend profiles table
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN banner_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN country TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN state TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN portfolio_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN github_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN languages TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN graduation_year TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 2. Create tables for Settings Modules

-- connected_accounts
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_id TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- notification_preferences
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

-- privacy_settings
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

-- user_preferences
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

-- user_sessions (mock logging table for the UI)
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

-- security_logs
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT DEFAULT 'Free',
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- deleted_accounts
CREATE TABLE IF NOT EXISTS public.deleted_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT,
    reason TEXT,
    scheduled_deletion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS and setup simple policies
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

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

-- 4. Create trigger to insert default settings row for new users
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

-- Trigger this on new profile creation
DROP TRIGGER IF EXISTS on_profile_created_settings ON public.profiles;
CREATE TRIGGER on_profile_created_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_settings();

-- Note: In a real environment, you'd also want to trigger this for all EXISTING users if this is a migration.
-- Let's run a backfill for existing profiles:
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;

INSERT INTO public.privacy_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;

INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;

INSERT INTO public.subscriptions (user_id, plan_name)
SELECT id, 'Free' FROM public.profiles
ON CONFLICT DO NOTHING;

-- 5. Storage Buckets (profile-images, profile-banners)
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-banners', 'profile-banners', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for profile-images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Auth Users Upload profile-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Users Update own profile-images" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid() = owner);
CREATE POLICY "Auth Users Delete own profile-images" ON storage.objects FOR DELETE USING (bucket_id = 'profile-images' AND auth.uid() = owner);

CREATE POLICY "Public Access for profile-banners" ON storage.objects FOR SELECT USING (bucket_id = 'profile-banners');
CREATE POLICY "Auth Users Upload profile-banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-banners' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Users Update own profile-banners" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-banners' AND auth.uid() = owner);
CREATE POLICY "Auth Users Delete own profile-banners" ON storage.objects FOR DELETE USING (bucket_id = 'profile-banners' AND auth.uid() = owner);
