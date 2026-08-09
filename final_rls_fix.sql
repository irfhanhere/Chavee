-- ── CHAVEE SUPABASE RLS POLICIES HOTFIX ──────────────────
-- Fixes: "infinite recursion detected in policy for relation 'conversation_participants'"
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ────────────────────────────────────────────────────────

-- 1. Enable RLS on conversations and conversation_participants
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 2. Drop all potential SELECT policies on conversation_participants
DROP POLICY IF EXISTS "Allow users to read participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of conversations they are in" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated users to read participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can read conversation participants they share a conversation with" ON public.conversation_participants;
DROP POLICY IF EXISTS "cp_select_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_part_select_auth" ON public.conversation_participants;

-- 3. Drop all potential INSERT/DELETE policies on conversation_participants
DROP POLICY IF EXISTS "Allow users to insert conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "cp_insert_auth" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_part_insert_auth" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_part_delete_auth" ON public.conversation_participants;

-- 4. Drop all potential policies on conversations
DROP POLICY IF EXISTS "conv_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conv_insert_auth" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_auth" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;

-- 5. Create a SECURITY DEFINER helper function to check membership.
-- By using SECURITY DEFINER, the query inside the function executes with postgres owner privileges, 
-- bypassing Row Level Security. This avoids the infinite loop (recursion) when reading participant records.
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = usr_id
  );
$$;

-- 6. Create the new non-recursive SELECT policy for conversation_participants using the helper function
CREATE POLICY "cp_select_own" ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(conversation_id, auth.uid())
);

-- 7. Create/Update INSERT policy for conversation_participants
CREATE POLICY "cp_insert_auth" ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to add themselves to a conversation
  auth.uid() = user_id 
  -- Or allow users to add others if they are already a member of that conversation
  OR public.is_conversation_member(conversation_id, auth.uid())
);

-- 8. Create the policies for conversations using the helper function for select
CREATE POLICY "conv_select_participant" ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(id, auth.uid())
);

CREATE POLICY "conv_insert_auth" ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
);
