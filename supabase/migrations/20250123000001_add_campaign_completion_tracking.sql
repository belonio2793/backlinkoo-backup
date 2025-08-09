-- Add completion tracking to backlink campaigns
-- This migration adds a completion timestamp and ensures completed campaigns are preserved

-- Add completed_at column to track when campaigns finish
ALTER TABLE backlink_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for completed campaigns for better query performance
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_completed_at ON backlink_campaigns(completed_at);

-- Add a comment to document the completion behavior
COMMENT ON COLUMN backlink_campaigns.completed_at IS 'Timestamp when campaign reached its link limit and was marked as completed. Completed campaigns are preserved indefinitely.';
COMMENT ON COLUMN backlink_campaigns.status IS 'Campaign status: active (running), paused (temporarily stopped), stopped (manually stopped), completed (reached link limit and finished)';
