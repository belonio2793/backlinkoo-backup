-- ============================================================================
-- DOMAINS PAGE - COMPLETE SQL SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema supports domain management, validation, DNS tracking, 
-- theme selection, and blog functionality for the /domains page
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom domain status enum
CREATE TYPE domain_status AS ENUM (
  'pending',
  'validating', 
  'validated',
  'error',
  'dns_ready',
  'theme_selection',
  'active'
);

-- Create DNS record status enum  
CREATE TYPE dns_record_status AS ENUM (
  'pending',
  'verified',
  'error'
);

-- ============================================================================
-- MAIN DOMAINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status domain_status DEFAULT 'pending' NOT NULL,
  netlify_verified BOOLEAN DEFAULT false NOT NULL,
  dns_verified BOOLEAN DEFAULT false NOT NULL,
  error_message TEXT,
  dns_records JSONB DEFAULT '[]'::jsonb,
  selected_theme TEXT,
  theme_name TEXT,
  blog_enabled BOOLEAN DEFAULT false NOT NULL,
  netlify_site_id TEXT,
  netlify_domain_id TEXT,
  ssl_enabled BOOLEAN DEFAULT false,
  custom_dns_configured BOOLEAN DEFAULT false,
  last_validation_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- DOMAIN VALIDATION HISTORY TABLE (Optional - for tracking validation attempts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.domain_validations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL, -- 'dns', 'netlify', 'ssl', etc.
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- DOMAIN THEMES TABLE (Optional - for storing available themes)
-- ============================================================================
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_created_at ON public.domains(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domains_user_status ON public.domains(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique ON public.domains(user_id, domain);

CREATE INDEX IF NOT EXISTS idx_domain_validations_domain_id ON public.domain_validations(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_validations_validated_at ON public.domain_validations(validated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

-- Domains table policies
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON public.domains
  FOR DELETE USING (auth.uid() = user_id);

-- Domain validations policies
CREATE POLICY "Users can view validations for their domains" ON public.domain_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.domains d 
      WHERE d.id = domain_validations.domain_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert validations for their domains" ON public.domain_validations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.domains d 
      WHERE d.id = domain_validations.domain_id 
      AND d.user_id = auth.uid()
    )
  );

-- Domain themes are readable by all authenticated users
CREATE POLICY "Anyone can view domain themes" ON public.domain_themes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get domain with validation history
CREATE OR REPLACE FUNCTION get_domain_with_validations(domain_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user owns this domain
  IF NOT EXISTS (
    SELECT 1 FROM public.domains 
    WHERE id = domain_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Domain not found or access denied';
  END IF;

  SELECT jsonb_build_object(
    'domain', to_jsonb(d.*),
    'validations', COALESCE(
      jsonb_agg(to_jsonb(v.*) ORDER BY v.validated_at DESC) 
      FILTER (WHERE v.id IS NOT NULL), 
      '[]'::jsonb
    )
  ) INTO result
  FROM public.domains d
  LEFT JOIN public.domain_validations v ON d.id = v.domain_id
  WHERE d.id = domain_uuid
  GROUP BY d.id;

  RETURN result;
END;
$$;

-- Function to update domain status with validation logging
CREATE OR REPLACE FUNCTION update_domain_status(
  domain_uuid UUID,
  new_status domain_status,
  validation_result JSONB DEFAULT NULL,
  error_msg TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_domain JSONB;
BEGIN
  -- Check if user owns this domain
  IF NOT EXISTS (
    SELECT 1 FROM public.domains 
    WHERE id = domain_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Domain not found or access denied';
  END IF;

  -- Update the domain
  UPDATE public.domains 
  SET 
    status = new_status,
    error_message = error_msg,
    last_validation_at = TIMEZONE('utc'::text, NOW()),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = domain_uuid
  RETURNING to_jsonb(domains.*) INTO updated_domain;

  -- Log the validation attempt
  INSERT INTO public.domain_validations (
    domain_id,
    validation_type,
    status,
    result,
    error_message
  ) VALUES (
    domain_uuid,
    'status_update',
    CASE WHEN new_status IN ('validated', 'active') THEN 'success' ELSE 'failed' END,
    COALESCE(validation_result, '{}'::jsonb),
    error_msg
  );

  RETURN updated_domain;
END;
$$;

-- Function to clean domain name (similar to frontend logic)
CREATE OR REPLACE FUNCTION clean_domain_name(input_domain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_domain),
          '^https?://', '', 'i'
        ),
        '^www\.', '', 'i'  
      ),
      '/$', ''
    )
  );
END;
$$;

-- Function to validate domain format
CREATE OR REPLACE FUNCTION is_valid_domain(domain_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Basic domain validation regex
  RETURN domain_name ~ '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$';
END;
$$;

-- Function to get user's domain count
CREATE OR REPLACE FUNCTION get_user_domain_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.domains 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Function to get domains by status for a user
CREATE OR REPLACE FUNCTION get_domains_by_status(status_filter domain_status)
RETURNS SETOF public.domains
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.domains
  WHERE user_id = auth.uid() AND status = status_filter
  ORDER BY created_at DESC;
END;
$$;

-- ============================================================================
-- SAMPLE DATA CLEANUP (Optional - remove if not needed)
-- ============================================================================

-- Function to clean up test domains (useful for development)
CREATE OR REPLACE FUNCTION cleanup_test_domains()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Only allow this for admin users or in development
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%@example.com'
  ) THEN
    RAISE EXCEPTION 'Access denied - admin only function';
  END IF;

  DELETE FROM public.domains
  WHERE domain LIKE '%.test' 
     OR domain LIKE '%.localhost'
     OR domain LIKE 'test-%'
     OR domain LIKE 'example.%';
     
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT, INSERT ON public.domain_validations TO authenticated;
GRANT SELECT ON public.domain_themes TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================================================

-- Verify the schema was created correctly
DO $$
BEGIN
  -- Check if tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'domains') THEN
    RAISE EXCEPTION 'Domains table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'domain_themes') THEN
    RAISE EXCEPTION 'Domain themes table was not created';
  END IF;

  -- Check if functions exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_domain_with_validations') THEN
    RAISE EXCEPTION 'get_domain_with_validations function was not created';
  END IF;

  RAISE NOTICE 'Domains schema created successfully!';
END $$;

-- ============================================================================
-- SAMPLE USAGE EXAMPLES (Comment out in production)
-- ============================================================================

/*
-- Example: Insert a new domain
INSERT INTO public.domains (user_id, domain, status) 
VALUES (auth.uid(), 'example.com', 'pending');

-- Example: Update domain status
SELECT update_domain_status(
  'your-domain-uuid-here'::UUID,
  'validated'::domain_status,
  '{"netlify_verified": true, "dns_verified": true}'::jsonb
);

-- Example: Get domain with validation history
SELECT get_domain_with_validations('your-domain-uuid-here'::UUID);

-- Example: Get user's domain count
SELECT get_user_domain_count();

-- Example: Get all active domains for user
SELECT * FROM get_domains_by_status('active'::domain_status);
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
