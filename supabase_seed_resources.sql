-- Create the resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_coming_soon BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all necessary columns exist (in case the table already existed but was missing some)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.resources ADD COLUMN category TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.resources ADD COLUMN description TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.resources ADD COLUMN icon TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.resources ADD COLUMN is_coming_soon BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ 
BEGIN 
    BEGIN
        CREATE POLICY "Allow public read access on resources"
            ON public.resources
            FOR SELECT
            USING (true);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Seed data
INSERT INTO public.resources (id, title, category, description, icon, is_coming_soon)
VALUES 
(gen_random_uuid(), 'Complete React Notes', 'PDF Notes', 'Comprehensive handwritten notes for learning React.js from scratch.', '📝', true),
(gen_random_uuid(), 'Data Structures in C++', 'PDF Notes', 'Detailed notes covering arrays, linked lists, trees, and graphs.', '📓', true),

(gen_random_uuid(), 'Modern Resume Template', 'Templates', 'A clean, ATS-friendly resume template for software engineers.', '📄', true),
(gen_random_uuid(), 'Project Proposal Template', 'Templates', 'Standard template for submitting university project proposals.', '📋', true),

(gen_random_uuid(), 'GATE CS 2024 Question Paper', 'Previous Year Papers', 'Official question paper with detailed solutions.', '📖', true),
(gen_random_uuid(), 'TCS NQT Coding Questions 2023', 'Previous Year Papers', 'Collection of frequently asked programming questions in TCS NQT.', '💻', true),

(gen_random_uuid(), 'How to land your first Tech Internship', 'Career Guides', 'Step-by-step guide to applying and interviewing for tech internships.', '🚀', true),
(gen_random_uuid(), 'The Ultimate UI/UX Career Guide', 'Career Guides', 'Everything you need to know to become a product designer.', '🎨', true),

(gen_random_uuid(), 'Coolors - Color Palette Generator', 'Useful Websites', 'Generate perfect color palettes for your UI designs instantly.', '🌐', true),
(gen_random_uuid(), 'Roadmap.sh', 'Useful Websites', 'Community driven roadmaps, articles and resources for developers.', '🗺️', true),

(gen_random_uuid(), 'Figma', 'Free Tools', 'The collaborative interface design tool.', '🛠️', true),
(gen_random_uuid(), 'Notion Student Pack', 'Free Tools', 'Organize your entire student life with these free templates.', '⚙️', true),

(gen_random_uuid(), 'Frontend Developer Roadmap 2024', 'Roadmaps', 'A complete path to becoming a modern frontend developer.', '🛤️', true),
(gen_random_uuid(), 'Data Science Learning Path', 'Roadmaps', 'Step-by-step guide to mastering Python, ML, and data engineering.', '📊', true),

(gen_random_uuid(), '100 Days of Code Challenge Tracker', 'Study Materials', 'A printable tracker to keep you motivated during the 100 days of code.', '📅', true),
(gen_random_uuid(), 'System Design Interview Prep', 'Study Materials', 'Curated links and videos for cracking system design interviews.', '🏗️', true);
