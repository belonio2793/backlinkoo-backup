-- Fix blog_posts table to ensure keywords column exists as TEXT[]
-- This addresses the "Could not find the 'keywords' column" error

-- First, check current table structure
DO $$
BEGIN
    -- Check if keywords column exists and what type it is
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'keywords'
    ) THEN
        -- Add keywords column as TEXT[] if it doesn't exist
        ALTER TABLE blog_posts ADD COLUMN keywords TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added keywords column as TEXT[]';
    ELSE
        -- Check if it's the wrong type (TEXT instead of TEXT[])
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' 
            AND column_name = 'keywords' 
            AND data_type = 'text'
        ) THEN
            -- Convert TEXT to TEXT[]
            ALTER TABLE blog_posts ALTER COLUMN keywords TYPE TEXT[] 
            USING CASE 
                WHEN keywords IS NULL OR keywords = '' THEN '{}'::TEXT[]
                WHEN keywords LIKE '{%' THEN keywords::TEXT[] 
                ELSE ARRAY[keywords]::TEXT[]
            END;
            RAISE NOTICE 'Converted keywords column from TEXT to TEXT[]';
        END IF;
    END IF;

    -- Ensure tags column also exists as TEXT[]
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'tags'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column as TEXT[]';
    END IF;

    RAISE NOTICE 'Keywords column schema fix completed';
END $$;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('keywords', 'tags')
ORDER BY column_name;
