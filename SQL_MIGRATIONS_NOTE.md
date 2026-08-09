# 📋 Chavee — Supabase SQL Migration Note

To ensure that **Community Channel creation**, **Followed User Post Feeds**, and **Profile Privacy / Follows** work seamlessly without database permissions or Row Level Security (RLS) blocking, copy and execute the following SQL script in your **Supabase Dashboard → SQL Editor**.

---

## 📌 Master SQL Script (All-In-One)

```sql
-- ====================================================================
--  CHAVEE — COMPLETE MASTER DATABASE SCHEMA & RLS POLICIES
--  Run this script in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. PROFILES TABLE & PRIVACY COLUMN
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  college TEXT,
  course TEXT,
  year TEXT,
  bio TEXT,
  motive TEXT,
  skills TEXT,
  resume_link TEXT,
  dob DATE,
  interests JSONB DEFAULT '[]'::jsonb,
  is_mentor BOOLEAN DEFAULT false,
  is_mentee BOOLEAN DEFAULT false,
  privacy TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy') THEN
    ALTER TABLE public.profiles ADD COLUMN privacy TEXT DEFAULT 'public';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  community_id TEXT,
  feeling TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'post',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'community_id') THEN
    ALTER TABLE public.posts ADD COLUMN community_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'feeling') THEN
    ALTER TABLE public.posts ADD COLUMN feeling TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'image_url') THEN
    ALTER TABLE public.posts ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_featured') THEN
    ALTER TABLE public.posts ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_auth" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_select_auth" ON public.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id OR auth.uid() = posted_by);


-- 3. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_auth" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;

CREATE POLICY "follows_select_auth" ON public.follows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_auth" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;

CREATE POLICY "conversations_select_auth" ON public.conversations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "conversations_insert_auth" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 5. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_part_select_auth" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_part_insert_auth" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_part_delete_auth" ON public.conversation_participants;

CREATE POLICY "conv_part_select_auth" ON public.conversation_participants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "conv_part_insert_auth" ON public.conversation_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "conv_part_delete_auth" ON public.conversation_participants FOR DELETE USING (auth.role() = 'authenticated');


-- 6. COMMUNITY CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_chan_select_auth" ON public.community_channels;
DROP POLICY IF EXISTS "comm_chan_insert_auth" ON public.community_channels;
DROP POLICY IF EXISTS "comm_chan_delete_auth" ON public.community_channels;

CREATE POLICY "comm_chan_select_auth" ON public.community_channels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comm_chan_insert_auth" ON public.community_channels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "comm_chan_delete_auth" ON public.community_channels FOR DELETE USING (auth.role() = 'authenticated');


-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_auth" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_auth" ON public.messages;

CREATE POLICY "messages_select_auth" ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "messages_insert_auth" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 8. COMMUNITY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_mem_select_auth" ON public.community_members;
DROP POLICY IF EXISTS "comm_mem_insert_auth" ON public.community_members;

CREATE POLICY "comm_mem_select_auth" ON public.community_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comm_mem_insert_auth" ON public.community_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## 🛠️ Summary of Fixes Applied in Code

1. **Adding Channels inside Community**:
   - Updated [`src/pages/Network.jsx`](file:///c:/Users/Lenovo/Desktop/ALL%20FILES/business/Chavee/application/chavee/src/pages/Network.jsx#L1507) to allow **all community members** to click `+ Add` and create channels inside their community.
   - Updated SQL RLS policies for `community_channels`, `conversations`, and `conversation_participants` so channel insertion is permitted for authenticated users.

2. **Viewing Posts of Followed Users**:
   - Fixed feed slicing bug in [`src/pages/Dashboard.jsx`](file:///c:/Users/Lenovo/Desktop/ALL%20FILES/business/Chavee/application/chavee/src/pages/Dashboard.jsx#L1524) where posts were artificially capped at `posts.slice(0, 2)`.
   - Now **all posts created by users you follow** (e.g. Savinay hs) display on your Home page feed ordered by `created_at` descending.
