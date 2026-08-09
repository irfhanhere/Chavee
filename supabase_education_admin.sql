-- supabase_education_admin.sql

-- 1. Add `tags` and `duration` to `courses`, and `status` to `certifications` & `resources`
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.courses ADD COLUMN tags TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.courses ADD COLUMN duration TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.certifications ADD COLUMN status TEXT DEFAULT 'Draft';
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.resources ADD COLUMN status TEXT DEFAULT 'Draft';
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 2. Create a View for Waitlist Counts
-- This allows the admin panel to quickly fetch the notify count for any feature_key
CREATE OR REPLACE VIEW public.waitlist_counts AS
SELECT feature_key, COUNT(*) as waitlist_count
FROM public.notify_subscribers
GROUP BY feature_key;

-- Grant access to the view
GRANT SELECT ON public.waitlist_counts TO authenticated;
GRANT SELECT ON public.waitlist_counts TO anon;

-- 3. Create the RPC function to notify the waitlist upon publish
-- This function reads all subscribers for a given feature_key,
-- inserts a notification for each, and then deletes them from the waitlist
-- to prevent duplicate notifications in the future.
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
        -- Insert into notifications table (assuming it has user_id, title, message, link)
        -- We handle potential missing columns gracefully, but assume standard structure based on Chavee's notifications system.
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
            -- If notifications table structure is different, fail silently for that row so we don't break the transaction
            RAISE NOTICE 'Failed to insert notification for user %', subscriber.user_id;
        END;
    END LOOP;

    -- Delete the fulfilled waitlist entries so they aren't notified again
    DELETE FROM public.notify_subscribers WHERE feature_key = p_feature_key;
END;
$$;
