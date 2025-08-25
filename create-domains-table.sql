-- ============================================================================
-- DOMAINS TABLE SETUP FOR SUPABASE
-- ============================================================================
-- Run this script in your Supabase SQL Editor to create the domains table
-- This enables the /domains page functionality with real-time sync

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'removed', 'error')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  netlify_verified boolean DEFAULT false,
  dns_verified boolean DEFAULT false,
  txt_record_value text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  custom_domain boolean DEFAULT false,
  ssl_status text DEFAULT 'none' CHECK (ssl_status IN ('none', 'pending', 'issued', 'error')),
  dns_records jsonb DEFAULT '[]'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own domains" ON domains;
DROP POLICY IF EXISTS "Users can insert own domains" ON domains;
DROP POLICY IF EXISTS "Users can update own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON domains;

-- Create RLS policies for user data isolation
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON domains(netlify_verified);
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON domains(updated_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at_trigger ON domains;
CREATE TRIGGER update_domains_updated_at_trigger
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_domains_updated_at();

-- Create sync logs table for debugging (optional but recommended)
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text,
  payload jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Index for sync logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_record ON sync_logs(table_name, record_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON domains TO authenticated;
GRANT ALL ON sync_logs TO authenticated;

-- Insert setup completion log
INSERT INTO sync_logs (table_name, record_id, action, payload, created_at)
VALUES ('domains', gen_random_uuid(), 'setup', jsonb_build_object('message', 'Domains table setup completed'), now())
ON CONFLICT DO NOTHING;

-- Display completion message
SELECT 'Domains table setup completed successfully!' as message;
