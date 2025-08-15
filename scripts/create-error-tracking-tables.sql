-- Campaign errors tracking table
CREATE TABLE IF NOT EXISTS campaign_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN ('content_generation', 'publishing', 'api_failure', 'network', 'authentication', 'rate_limit', 'unknown')),
  error_message TEXT NOT NULL,
  error_details JSONB,
  step_name TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  can_auto_resume BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_campaign_errors_campaign_id (campaign_id),
  INDEX idx_campaign_errors_error_type (error_type),
  INDEX idx_campaign_errors_created_at (created_at),
  INDEX idx_campaign_errors_resolved (resolved_at)
);

-- Campaign progress snapshots table
CREATE TABLE IF NOT EXISTS campaign_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  current_step TEXT,
  completed_steps TEXT[] DEFAULT '{}',
  platform_progress JSONB DEFAULT '{}',
  content_generated BOOLEAN DEFAULT false,
  generated_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_progress_snapshots_campaign_id (campaign_id),
  INDEX idx_progress_snapshots_updated_at (updated_at)
);

-- RLS policies for campaign_errors
ALTER TABLE campaign_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign errors" ON campaign_errors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_errors.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert errors for their own campaigns" ON campaign_errors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_errors.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own campaign errors" ON campaign_errors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_errors.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

-- RLS policies for campaign_progress_snapshots
ALTER TABLE campaign_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign progress snapshots" ON campaign_progress_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_progress_snapshots.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert progress snapshots for their own campaigns" ON campaign_progress_snapshots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_progress_snapshots.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own campaign progress snapshots" ON campaign_progress_snapshots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_progress_snapshots.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upsert their own campaign progress snapshots" ON campaign_progress_snapshots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = campaign_progress_snapshots.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

-- Add error tracking columns to automation_campaigns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'error_count') THEN
    ALTER TABLE automation_campaigns ADD COLUMN error_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'last_error_at') THEN
    ALTER TABLE automation_campaigns ADD COLUMN last_error_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'auto_pause_reason') THEN
    ALTER TABLE automation_campaigns ADD COLUMN auto_pause_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'can_auto_resume') THEN
    ALTER TABLE automation_campaigns ADD COLUMN can_auto_resume BOOLEAN DEFAULT true;
  END IF;
END
$$;
