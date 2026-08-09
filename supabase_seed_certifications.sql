-- Create the certifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_logo TEXT,
    difficulty TEXT,
    duration TEXT,
    short_description TEXT,
    is_coming_soon BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all necessary columns exist (in case the table already existed but was missing some)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.certifications RENAME COLUMN name TO title;
    EXCEPTION
        WHEN undefined_column THEN
            BEGIN
                ALTER TABLE public.certifications ADD COLUMN title TEXT;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
    END;

    BEGIN
        ALTER TABLE public.certifications ADD COLUMN difficulty TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.certifications ADD COLUMN duration TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.certifications ADD COLUMN short_description TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.certifications ADD COLUMN is_coming_soon BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ 
BEGIN 
    BEGIN
        CREATE POLICY "Allow public read access on certifications"
            ON public.certifications
            FOR SELECT
            USING (true);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Seed data
INSERT INTO public.certifications (id, title, provider, provider_logo, difficulty, duration, short_description, is_coming_soon)
VALUES 
(gen_random_uuid(), 'Google Data Analytics Professional Certificate', 'Google', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', 'Beginner', '6 months', 'Learn data analysis tools like SQL, R, and Tableau to make data-driven decisions.', true),
(gen_random_uuid(), 'AWS Certified Cloud Practitioner', 'AWS', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', 'Beginner', '3 months', 'Gain a foundational understanding of AWS Cloud concepts, services, and security.', true),
(gen_random_uuid(), 'Microsoft Certified: Azure Fundamentals', 'Microsoft', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', 'Beginner', '2 months', 'Learn cloud computing basics, models, and core services within Microsoft Azure.', true),
(gen_random_uuid(), 'Meta Front-End Developer Professional Certificate', 'Meta', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', 'Intermediate', '7 months', 'Master React, JavaScript, and UI design to build responsive web applications.', true),
(gen_random_uuid(), 'HubSpot Inbound Marketing Certification', 'HubSpot', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/HubSpot_Logo.png', 'Beginner', '1 month', 'Discover modern marketing techniques to attract and engage customers effectively.', true),
(gen_random_uuid(), 'IBM Data Science Professional Certificate', 'IBM', 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', 'Beginner', '11 months', 'Develop skills in Python, SQL, and machine learning to jumpstart a data career.', true),
(gen_random_uuid(), 'Adobe Certified Professional: Visual Design', 'Adobe', 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adobe_Corporate_Logo.png', 'Intermediate', '4 months', 'Prove your expertise in Photoshop and Illustrator for professional visual design.', true),
(gen_random_uuid(), 'Oracle Certified Associate, Java SE 8 Programmer', 'Oracle', 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', 'Intermediate', '6 months', 'Validate your foundational knowledge of Java programming and object-oriented concepts.', true),
(gen_random_uuid(), 'Cisco Certified Network Associate (CCNA)', 'Cisco', 'https://upload.wikimedia.org/wikipedia/commons/6/64/Cisco_logo.svg', 'Intermediate', '8 months', 'Master networking fundamentals, IP connectivity, and security basics.', true),
(gen_random_uuid(), 'MongoDB Certified Developer Associate', 'MongoDB', 'https://upload.wikimedia.org/wikipedia/en/4/45/MongoDB-Logo.svg', 'Intermediate', '3 months', 'Demonstrate your ability to build and deploy applications using MongoDB.', true);
