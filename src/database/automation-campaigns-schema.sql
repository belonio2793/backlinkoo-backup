-- Automation Campaigns Table
-- This table stores user campaigns for automated link building

CREATE TABLE IF NOT EXISTS automation_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  target_links INTEGER DEFAULT 10,
  links_built INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_automation_campaigns_updated_at ON automation_campaigns;
CREATE TRIGGER update_automation_campaigns_updated_at
    BEFORE UPDATE ON automation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON automation_campaigns;

-- Create RLS policies
CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON automation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at DESC);

-- Insert some example data for testing (optional)
-- This will only work if you have a test user
/*
INSERT INTO automation_campaigns (
  user_id, 
  name, 
  keywords, 
  anchor_texts, 
  target_url, 
  target_links, 
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Gets first user for testing
  'Sample SEO Campaign',
  ARRAY['SEO tools', 'digital marketing', 'link building'],
  ARRAY['best SEO tools', 'click here', 'learn more'],
  'https://example.com',
  20,
  'draft'
);
*/
