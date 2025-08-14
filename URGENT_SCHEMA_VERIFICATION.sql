-- URGENT: Verify automation_campaigns table schema
-- Run this to check if the columns were actually added

-- 1. Check which columns exist in the table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Specifically check for the problematic columns
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'published_articles') 
        THEN '✅ published_articles column EXISTS'
        ELSE '❌ published_articles column MISSING'
    END as published_articles_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'links_built') 
        THEN '✅ links_built column EXISTS'
        ELSE '❌ links_built column MISSING'
    END as links_built_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'available_sites') 
        THEN '✅ available_sites column EXISTS'
        ELSE '❌ available_sites column MISSING'
    END as available_sites_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'target_sites_used') 
        THEN '✅ target_sites_used column EXISTS'
        ELSE '❌ target_sites_used column MISSING'
    END as target_sites_used_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'engine_type') 
        THEN '✅ engine_type column EXISTS'
        ELSE '❌ engine_type column MISSING'
    END as engine_type_status;

-- 3. Test a minimal insert to see exactly what fails
-- Replace 'your-user-id' with an actual user ID from auth.users
INSERT INTO automation_campaigns (
    user_id,
    name,
    keywords,
    anchor_texts,
    target_url,
    status
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Test Schema Fix',
    ARRAY['test'],
    ARRAY['test link'],
    'https://test.com',
    'draft'
) RETURNING id, name;

-- Clean up the test
DELETE FROM automation_campaigns WHERE name = 'Test Schema Fix';
