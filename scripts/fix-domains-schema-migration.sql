-- ============================================================================
-- DOMAINS TABLE SCHEMA MIGRATION - FIX FOR /domains PAGE
-- ============================================================================
-- This script ensures the domains table has the correct schema
-- expected by src/pages/DomainsPage.tsx
-- ============================================================================

-- Create custom domain status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_status') THEN
        CREATE TYPE domain_status AS ENUM (
            'pending',
            'validating', 
            'validated',
            'error',
            'dns_ready',
            'theme_selection',
            'active'
        );
    END IF;
END $$;

-- Add missing columns to domains table if they don't exist
ALTER TABLE public.domains 
  ADD COLUMN IF NOT EXISTS netlify_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_theme TEXT,
  ADD COLUMN IF NOT EXISTS theme_name TEXT,
  ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS netlify_site_id TEXT,
  ADD COLUMN IF NOT EXISTS netlify_domain_id TEXT,
  ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_dns_configured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMP WITH TIME ZONE;

-- Migrate data from alternative column names if they exist
DO $$
BEGIN
    -- Migrate dns_validated to dns_verified
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'domains' AND column_name = 'dns_validated') THEN
        UPDATE public.domains 
        SET dns_verified = dns_validated 
        WHERE dns_validated IS NOT NULL AND dns_verified IS NULL;
        
        RAISE NOTICE 'Migrated dns_validated to dns_verified';
    END IF;
    
    -- Migrate validation_error to error_message
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'domains' AND column_name = 'validation_error') THEN
        UPDATE public.domains 
        SET error_message = validation_error 
        WHERE validation_error IS NOT NULL AND error_message IS NULL;
        
        RAISE NOTICE 'Migrated validation_error to error_message';
    END IF;
    
    -- Migrate txt_record_validated to netlify_verified if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'domains' AND column_name = 'txt_record_validated') THEN
        UPDATE public.domains 
        SET netlify_verified = txt_record_validated 
        WHERE txt_record_validated IS NOT NULL AND netlify_verified IS NULL;
        
        RAISE NOTICE 'Migrated txt_record_validated to netlify_verified';
    END IF;
END $$;

-- Ensure the status column can handle all required statuses
ALTER TABLE public.domains ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.domains ALTER COLUMN status TYPE TEXT;
ALTER TABLE public.domains ADD CONSTRAINT status_check 
  CHECK (status IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active'));
ALTER TABLE public.domains ALTER COLUMN status SET DEFAULT 'pending';

-- Add proper constraints
ALTER TABLE public.domains ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.domains ALTER COLUMN domain SET NOT NULL;

-- Add foreign key constraint to auth.users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'domains_user_id_fkey') THEN
        ALTER TABLE public.domains 
        ADD CONSTRAINT domains_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for user_id';
    END IF;
END $$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_created_at ON public.domains(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domains_user_status ON public.domains(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique ON public.domains(user_id, domain);

-- Ensure RLS is enabled
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist and create proper ones
DROP POLICY IF EXISTS "Users can view their own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can insert their own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can update their own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can delete their own domains" ON public.domains;

DROP POLICY IF EXISTS "Allow public read access" ON public.domains;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.domains;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.domains;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.domains;

-- Create proper RLS policies
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON public.domains
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create domain themes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.domain_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  css_file_path TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default themes
INSERT INTO public.domain_themes (id, name, description, is_premium) VALUES
  ('minimal', 'Minimal Clean', 'Clean and simple design', false),
  ('modern', 'Modern Business', 'Professional business layout', false), 
  ('elegant', 'Elegant Editorial', 'Magazine-style layout', false),
  ('tech', 'Tech Focus', 'Technology-focused design', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Enable RLS on domain_themes
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

-- Create policy for domain themes (readable by authenticated users)
DROP POLICY IF EXISTS "Anyone can view domain themes" ON public.domain_themes;
CREATE POLICY "Anyone can view domain themes" ON public.domain_themes
  FOR SELECT USING (auth.role() = 'authenticated');

GRANT SELECT ON public.domain_themes TO authenticated;

-- Final verification
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
  required_columns TEXT[] := ARRAY[
    'id', 'user_id', 'domain', 'status', 'netlify_verified', 
    'dns_verified', 'error_message', 'dns_records', 'selected_theme', 
    'theme_name', 'blog_enabled', 'created_at', 'updated_at'
  ];
BEGIN
  -- Check if all required columns exist
  FOREACH col_name IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'domains' AND column_name = col_name) THEN
      missing_columns := array_append(missing_columns, col_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All required columns present in domains table';
  END IF;
  
  -- Check if domain_themes table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'domain_themes') THEN
    RAISE EXCEPTION 'domain_themes table was not created';
  ELSE
    RAISE NOTICE '✅ domain_themes table exists';
  END IF;
  
  RAISE NOTICE '🎉 Domains schema migration completed successfully!';
END $$;
