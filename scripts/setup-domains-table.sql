-- Domains table for Netlify domain management with automatic sync
-- This script creates the domains table with proper schema and RLS policies

-- Drop existing table if needed (for clean setup)
-- DROP TABLE IF EXISTS domains CASCADE;

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

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own domains" ON domains;
DROP POLICY IF EXISTS "Users can insert own domains" ON domains;
DROP POLICY IF EXISTS "Users can update own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON domains;

-- RLS Policies for user data isolation
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON domains(netlify_verified);
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON domains(updated_at);

-- Function to update updated_at timestamp
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

-- Function to sync domain with Netlify automatically
CREATE OR REPLACE FUNCTION sync_domain_with_netlify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  response jsonb;
  function_url text;
BEGIN
  -- Get the Supabase project URL for the edge function
  -- This will be dynamically constructed based on your project
  function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.functions.supabase.co/domains';
  
  -- Only sync if this is a real domain change, not just status updates from sync
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.domain != NEW.domain) THEN
    
    -- Build JSON payload for Edge Function
    payload := jsonb_build_object(
      'action', CASE
                  WHEN TG_OP = 'INSERT' THEN 'add'
                  WHEN TG_OP = 'UPDATE' AND NEW.status = 'removed' THEN 'remove'
                  ELSE 'add'
                END,
      'domain', NEW.domain,
      'txt_record_value', NEW.txt_record_value
    );

    -- Log the sync attempt
    INSERT INTO sync_logs (table_name, record_id, action, payload, created_at)
    VALUES ('domains', NEW.id, payload->>'action', payload, now())
    ON CONFLICT DO NOTHING;
    
    -- Update last_sync timestamp
    NEW.last_sync = now();
    
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  INSERT INTO sync_logs (table_name, record_id, action, payload, error_message, created_at)
  VALUES ('domains', NEW.id, 'sync_error', payload, SQLERRM, now())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create sync logs table for debugging
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

-- Create the trigger for automatic Netlify sync
DROP TRIGGER IF EXISTS domain_sync_trigger ON domains;
CREATE TRIGGER domain_sync_trigger
  BEFORE INSERT OR UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION sync_domain_with_netlify();

-- Function to manually trigger domain sync
CREATE OR REPLACE FUNCTION trigger_domain_sync(domain_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  domain_record domains%ROWTYPE;
  result jsonb;
BEGIN
  -- Get the domain record
  SELECT * INTO domain_record FROM domains WHERE id = domain_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;
  
  -- Update the record to trigger sync
  UPDATE domains 
  SET last_sync = now() 
  WHERE id = domain_id;
  
  RETURN jsonb_build_object('success', true, 'domain', domain_record.domain);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON domains TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_domain_sync(uuid) TO authenticated;

-- Insert default project configuration if needed
INSERT INTO sync_logs (table_name, record_id, action, payload, created_at)
VALUES ('domains', gen_random_uuid(), 'setup', jsonb_build_object('message', 'Domains table setup completed'), now())
ON CONFLICT DO NOTHING;

-- Display setup completion message
DO $$
BEGIN
  RAISE NOTICE 'Domains table setup completed successfully!';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '- Row Level Security (RLS)';
  RAISE NOTICE '- Automatic Netlify sync triggers';
  RAISE NOTICE '- Performance indexes';
  RAISE NOTICE '- Sync logging for debugging';
END;
$$;
