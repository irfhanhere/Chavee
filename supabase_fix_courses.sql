-- supabase_fix_courses.sql
-- Fixes courses being marked as Live instead of Coming Soon, 
-- and ensures their category is correctly set to 'Language'.

UPDATE public.courses
SET 
    is_coming_soon = true,
    category = 'Language'
WHERE 
    title IN ('Korean', 'Japanese', 'Spanish', 'French', 'German', 'Mandarin');
