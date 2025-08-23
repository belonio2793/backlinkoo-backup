-- Quick fix for domains table schema mismatch
-- This adds the missing columns to the existing domains table

-- Add missing columns to domains table if they don't exist
ALTER TABLE public.domains 
ADD COLUMN IF NOT EXISTS netlify_verified BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_theme TEXT,
ADD COLUMN IF NOT EXISTS theme_name TEXT,
ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS netlify_site_id TEXT,
ADD COLUMN IF NOT EXISTS netlify_domain_id TEXT,
ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_dns_configured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Create or update the status enum and column
DO $$ 
BEGIN
    -- Check if the status column exists and is the right type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domains' 
        AND column_name = 'status' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE IF NOT EXISTS domain_status AS ENUM (
            'pending',
            'validating', 
            'validated',
            'error',
            'dns_ready',
            'theme_selection',
            'active'
        );
        
        -- Add status column if it doesn't exist, or update it if it's wrong type
        ALTER TABLE public.domains 
        ADD COLUMN IF NOT EXISTS status domain_status DEFAULT 'pending' NOT NULL;
    END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_domains_updated_at_trigger ON public.domains;
CREATE TRIGGER update_domains_updated_at_trigger 
BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION update_domains_updated_at();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique ON public.domains(user_id, domain);

-- Verify the fix worked
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'domains' 
ORDER BY ordinal_position;
