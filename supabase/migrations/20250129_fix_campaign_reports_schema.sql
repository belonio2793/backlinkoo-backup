-- Fix campaign_reports table schema to match the application expectations
-- Add missing columns: report_name, report_type, generated_at, and report_data

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add report_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_reports' AND column_name = 'report_name') THEN
        ALTER TABLE campaign_reports ADD COLUMN report_name TEXT NOT NULL DEFAULT 'Unnamed Report';
    END IF;

    -- Add report_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_reports' AND column_name = 'report_type') THEN
        ALTER TABLE campaign_reports ADD COLUMN report_type TEXT NOT NULL DEFAULT 'summary' 
        CHECK (report_type IN ('summary', 'detailed', 'performance', 'links'));
    END IF;

    -- Add generated_at column (alias for created_at for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_reports' AND column_name = 'generated_at') THEN
        ALTER TABLE campaign_reports ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records to have generated_at = created_at
        UPDATE campaign_reports SET generated_at = created_at WHERE generated_at IS NULL;
    END IF;

    -- Add report_data JSONB column for storing structured report data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_reports' AND column_name = 'report_data') THEN
        ALTER TABLE campaign_reports ADD COLUMN report_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create additional indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_campaign_reports_generated_at ON campaign_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_report_type ON campaign_reports(report_type);

-- Update existing records to have proper default values
UPDATE campaign_reports 
SET 
    report_name = COALESCE(report_name, 'Legacy Report - ' || id::text),
    report_type = COALESCE(report_type, 'summary'),
    generated_at = COALESCE(generated_at, created_at),
    report_data = COALESCE(report_data, jsonb_build_object(
        'summary', jsonb_build_object(
            'total_links', total_links,
            'live_links', live_links,
            'pending_links', pending_links,
            'failed_links', failed_links
        ),
        'performance_metrics', jsonb_build_object(
            'success_rate', success_rate,
            'average_da', average_da,
            'total_cost', total_cost,
            'daily_velocity', daily_velocity
        )
    ))
WHERE report_data = '{}'::jsonb OR report_data IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN campaign_reports.report_name IS 'Human-readable name for the report';
COMMENT ON COLUMN campaign_reports.report_type IS 'Type of report: summary, detailed, performance, or links';
COMMENT ON COLUMN campaign_reports.generated_at IS 'When the report was generated (for ordering and display)';
COMMENT ON COLUMN campaign_reports.report_data IS 'Structured JSON data containing the full report details';
