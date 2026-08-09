-- SQL to fix the RLS violation when starting new conversations.
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/dtokistffdnycrzbmxcr/sql/new)

CREATE OR REPLACE FUNCTION public.start_direct_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial: Runs with elevated privileges to bypass RLS chicken-and-egg validation
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  -- 1. Check if a direct conversation already exists between the two users
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id 
    AND cp2.user_id = other_user_id;

  -- 2. If it exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- 3. Otherwise, create a new conversation
  INSERT INTO public.conversations (created_at)
  VALUES (now())
  RETURNING id INTO v_conversation_id;

  -- 4. Add both participants to the conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, v_current_user_id),
    (v_conversation_id, other_user_id);

  RETURN v_conversation_id;
END;
$$;
