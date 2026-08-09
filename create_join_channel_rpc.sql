-- Required prerequisite for the community channel detail view (DiscussionsTab -> ChannelDetailView).
-- Run this in your Supabase Dashboard -> SQL Editor BEFORE testing the new channel-open flow.
--
-- Models the exact same lazy-create/dedupe/participant pattern already proven working in
-- fix_start_direct_conversation.sql's start_direct_conversation() RPC, adapted for channels:
-- a channel's conversation is created on first-ever open (not at channel-creation time), and
-- every subsequent open/creation just adds the calling user as a participant (idempotent).

-- Defensive: community_channels.conversation_id could not be confirmed live (conflicting
-- schema sources found this session — some show it, some don't). Safe no-op if it already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_channels' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.community_channels
      ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.join_channel(p_channel_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- same as start_direct_conversation: bypasses RLS chicken-and-egg on first create
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Look up the channel's existing conversation, if any
  SELECT conversation_id INTO v_conversation_id
  FROM public.community_channels
  WHERE id = p_channel_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Channel not found';
  END IF;

  -- 2. Lazily create the conversation on first-ever open
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (created_at)
    VALUES (now())
    RETURNING id INTO v_conversation_id;

    UPDATE public.community_channels
    SET conversation_id = v_conversation_id
    WHERE id = p_channel_id;
  END IF;

  -- 3. Add the calling user as a participant (idempotent — safe to call on every open)
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_current_user_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conversation_id;
END;
$$;
