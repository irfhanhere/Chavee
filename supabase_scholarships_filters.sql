-- Add new filtering columns to the scholarships table
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN state TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN country TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN education_level TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN category TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN funding_type TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.scholarships ADD COLUMN deadline_date DATE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
