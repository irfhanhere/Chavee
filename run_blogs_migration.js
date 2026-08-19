import pg from 'pg';
const { Client } = pg;

const sql = `
-- ====================================================================
--  CHAVEE — BLOGS, PRESS RELEASES & ACCOUNT DELETION MIGRATION
-- ====================================================================

-- 1. Create blogs table if not exists
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  author TEXT DEFAULT 'Chavee Team',
  published BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "blogs_select_policy" ON public.blogs;
DROP POLICY IF EXISTS "blogs_insert_policy" ON public.blogs;
DROP POLICY IF EXISTS "blogs_update_policy" ON public.blogs;
DROP POLICY IF EXISTS "blogs_delete_policy" ON public.blogs;

-- Select policy: Anyone can see published blogs, admins can see all
CREATE POLICY "blogs_select_policy" ON public.blogs FOR SELECT 
  USING (published = true OR auth.uid() IN (SELECT user_id FROM public.admins));

-- Insert/Update/Delete policies: restricted strictly to administrators
CREATE POLICY "blogs_insert_policy" ON public.blogs FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "blogs_update_policy" ON public.blogs FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "blogs_delete_policy" ON public.blogs FOR DELETE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins));


-- 2. Create press_releases table if not exists
CREATE TABLE IF NOT EXISTS public.press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on press_releases
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "press_releases_select_policy" ON public.press_releases;
DROP POLICY IF EXISTS "press_releases_insert_policy" ON public.press_releases;
DROP POLICY IF EXISTS "press_releases_update_policy" ON public.press_releases;
DROP POLICY IF EXISTS "press_releases_delete_policy" ON public.press_releases;

-- Select policy: Anyone can see published press releases, admins can see all
CREATE POLICY "press_releases_select_policy" ON public.press_releases FOR SELECT 
  USING (published = true OR auth.uid() IN (SELECT user_id FROM public.admins));

-- Insert/Update/Delete policies: restricted strictly to administrators
CREATE POLICY "press_releases_insert_policy" ON public.press_releases FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "press_releases_update_policy" ON public.press_releases FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "press_releases_delete_policy" ON public.press_releases FOR DELETE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins));


-- 3. Create delete_user_account RPC function
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete gamification data explicitly (in case of lack of foreign key cascade)
  DELETE FROM public.user_gamification WHERE user_id = auth.uid();
  
  -- Delete the authenticated user from auth.users
  -- Cascade deletes on profiles, follows, posts, comments, conversation_participants will automatically run
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
`;

// Direct postgres connection — password comes from the environment, never
// hardcoded. Set it in your own shell before running this script, e.g.:
//   SUPABASE_DB_PASSWORD='...' node run_blogs_migration.js
// Never put the real value in this file or any other committed file.
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD env var. Set it in your shell before running this script (do not hardcode it here).');
  process.exit(1);
}
const client = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres`
});

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully! Running schema migrations...');
    await client.query(sql);
    console.log('Migrations executed successfully!');
  } catch (err) {
    console.error('Error executing migrations:', err.message);
  } finally {
    await client.end();
  }
}

run();
