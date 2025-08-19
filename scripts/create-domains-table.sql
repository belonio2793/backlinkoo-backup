-- Domains table for DNS management and validation
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'active', 'failed', 'expired')),
  
  -- DNS Configuration
  verification_token text NOT NULL DEFAULT 'blo-' || substr(gen_random_uuid()::text, 1, 12),
  required_a_record inet,
  required_cname text,
  hosting_provider text DEFAULT 'backlinkoo',
  
  -- Validation tracking
  dns_validated boolean DEFAULT false,
  txt_record_validated boolean DEFAULT false,
  a_record_validated boolean DEFAULT false,
  cname_validated boolean DEFAULT false,
  ssl_enabled boolean DEFAULT false,
  
  -- Metadata
  last_validation_attempt timestamptz,
  validation_error text,
  auto_retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 10,
  
  -- Blog integration
  blog_enabled boolean DEFAULT false,
  blog_subdirectory text DEFAULT 'blog',
  pages_published integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, domain)
);

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
CREATE INDEX IF NOT EXISTS idx_domains_validation ON domains(dns_validated, status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_domains_updated_at();

-- DNS validation attempts table
CREATE TABLE IF NOT EXISTS domain_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
  validation_type text NOT NULL, -- 'txt', 'a', 'cname', 'full'
  success boolean NOT NULL,
  error_message text,
  dns_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for validation logs
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_domain_id ON domain_validation_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_created_at ON domain_validation_logs(created_at);
