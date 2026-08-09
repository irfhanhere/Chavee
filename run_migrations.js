import { execSync } from 'child_process';
import fs from 'fs';

console.log('Installing pg client...');
try {
  execSync('npm install pg --no-save', { stdio: 'inherit' });
  console.log('pg installed successfully.');
} catch (err) {
  console.error('Failed to install pg:', err.message);
  process.exit(1);
}

// Import pg dynamically since it was just installed
import pg from 'pg';
const { Client } = pg;

const sql = `
-- 1. Fix profiles table RLS (allow authenticated users to select/insert/update)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Add posts profiles foreign key constraint so PostgREST can join them
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS fk_posts_profiles;
ALTER TABLE public.posts ADD CONSTRAINT fk_posts_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Fix posts table RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- 4. Create post-images storage bucket + policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "post_images_insert" ON storage.objects;
CREATE POLICY "post_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "post_images_select" ON storage.objects;
CREATE POLICY "post_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "post_images_delete" ON storage.objects;
CREATE POLICY "post_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Fix gig_applications RLS
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gig_app_select" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_app_insert" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_app_update_owner" ON public.gig_applications;

CREATE POLICY "gig_app_select" ON public.gig_applications FOR SELECT USING (
  auth.uid() = applicant_id OR auth.uid() IN (SELECT posted_by FROM public.gigs WHERE id = gig_id)
);
CREATE POLICY "gig_app_insert" ON public.gig_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "gig_app_update_owner" ON public.gig_applications FOR UPDATE USING (
  auth.uid() IN (SELECT posted_by FROM public.gigs WHERE id = gig_id)
);

-- 6. Fix notifications table RLS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert_system" ON public.notifications;

CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);

-- 7. Fix conversations + participants RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conv_insert_auth" ON public.conversations;
DROP POLICY IF EXISTS "cp_select_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "cp_insert_auth" ON public.conversation_participants;

CREATE POLICY "conv_select_participant" ON public.conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "conv_insert_auth" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cp_select_own" ON public.conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "cp_insert_auth" ON public.conversation_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Fix messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msg_select_participant" ON public.messages;
DROP POLICY IF EXISTS "msg_insert_participant" ON public.messages;

CREATE POLICY "msg_select_participant" ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "msg_insert_participant" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- 9. Add conversation_id column to gig_applications
ALTER TABLE public.gig_applications ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id);

-- 10. Trigger function for gig proposals
CREATE OR REPLACE FUNCTION public.handle_gig_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_gig_poster_id UUID;
  v_gig_title TEXT;
  v_conv_id UUID;
  v_applicant_name TEXT;
BEGIN
  -- Find gig details
  SELECT posted_by, title INTO v_gig_poster_id, v_gig_title FROM public.gigs WHERE id = NEW.gig_id;

  -- Skip if no poster or self-apply
  IF v_gig_poster_id IS NULL OR v_gig_poster_id = NEW.applicant_id THEN
    RETURN NEW;
  END IF;

  -- Get applicant display name
  SELECT COALESCE(full_name, username, 'A Student') INTO v_applicant_name FROM public.profiles WHERE id = NEW.applicant_id;

  -- Check if conversation already exists
  SELECT cp1.conversation_id INTO v_conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = NEW.applicant_id AND cp2.user_id = v_gig_poster_id
  LIMIT 1;

  -- Create conversation if none exists
  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conv_id;
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conv_id, NEW.applicant_id), (v_conv_id, v_gig_poster_id);
  END IF;

  -- Back-fill conversation_id
  UPDATE public.gig_applications SET conversation_id = v_conv_id WHERE id = NEW.id;

  -- Insert proposal message
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (
    v_conv_id,
    NEW.applicant_id,
    '📋 Proposal for: ' || v_gig_title || E'\\n\\n' || COALESCE(NEW.pitch, '')
  );

  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, body, link, is_read)
  VALUES (
    v_gig_poster_id,
    'gig_proposal',
    '📩 New Proposal Received',
    v_applicant_name || ' sent a proposal for "' || v_gig_title || '"',
    '/messages?id=' || v_conv_id,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_gig_proposal_created ON public.gig_applications;
CREATE TRIGGER on_gig_proposal_created
  AFTER INSERT ON public.gig_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_gig_proposal();
`;

// Direct postgres connection
const client = new Client({
  connectionString: 'postgresql://postgres:Apirfhan12%40@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres'
});

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing migration queries...');
    await client.query(sql);
    console.log('Migrations executed successfully!');
  } catch (err) {
    console.error('Error executing migrations:', err.message);
  } finally {
    await client.end();
  }
}

run();
