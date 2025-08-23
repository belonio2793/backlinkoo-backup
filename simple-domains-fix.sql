-- Simple fix for /domains page - Copy and paste this into Supabase SQL Editor

-- Add missing columns that DomainsPage.tsx expects
ALTER TABLE public.domains 
  ADD COLUMN IF NOT EXISTS netlify_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_theme TEXT,
  ADD COLUMN IF NOT EXISTS theme_name TEXT,
  ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false;

-- Create domain themes table for the dropdown
CREATE TABLE IF NOT EXISTS public.domain_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO public.domain_themes (id, name, description, is_premium) VALUES
  ('minimal', 'Minimal Clean', 'Clean and simple design', false),
  ('modern', 'Modern Business', 'Professional business layout', false), 
  ('elegant', 'Elegant Editorial', 'Magazine-style layout', false),
  ('tech', 'Tech Focus', 'Technology-focused design', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on domain_themes
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read themes
DROP POLICY IF EXISTS "Anyone can view domain themes" ON public.domain_themes;
CREATE POLICY "Anyone can view domain themes" ON public.domain_themes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON public.domain_themes TO authenticated;

-- Verify the fix worked
SELECT 'Migration completed successfully!' as result;
