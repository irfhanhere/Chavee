-- supabase_notify_me_rpc.sql

-- 1. Create a unique constraint on user_id + feature_key for notify_subscribers
-- This ensures that a user cannot subscribe to the same feature twice.
ALTER TABLE public.notify_subscribers
ADD CONSTRAINT notify_subscribers_user_id_feature_key_key UNIQUE (user_id, feature_key);

-- 2. Create the toggle_notify_me RPC
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

-- 3. Update RLS on notify_subscribers to allow users to read their own rows
-- We drop existing policies and create new ones for clarity.
DROP POLICY IF EXISTS "notify_subscribers_insert_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_select_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_delete_auth" ON public.notify_subscribers;
DROP POLICY IF EXISTS "notify_subscribers_update_auth" ON public.notify_subscribers;

CREATE POLICY "notify_subscribers_select_auth" 
ON public.notify_subscribers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "notify_subscribers_insert_auth" 
ON public.notify_subscribers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notify_subscribers_delete_auth" 
ON public.notify_subscribers FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "notify_subscribers_update_auth" 
ON public.notify_subscribers FOR UPDATE 
USING (auth.uid() = user_id);

-- Note: Admins can still view/update all rows if they bypass RLS (e.g., service role)
-- or if there is a specific admin policy (which is usually handled by role checks).
