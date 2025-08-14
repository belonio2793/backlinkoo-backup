-- Migration: Remove all automation tables and components
-- Created: 2025-01-30T00:00:00.000Z

-- Drop automation-related tables in order (handling dependencies)
DROP TABLE IF EXISTS automation_campaign_metrics CASCADE;
DROP TABLE IF EXISTS automation_campaign_logs CASCADE;
DROP TABLE IF EXISTS automation_discovered_links CASCADE;
DROP TABLE IF EXISTS automation_controls CASCADE;
DROP TABLE IF EXISTS automation_error_patterns CASCADE;
DROP TABLE IF EXISTS automation_debug_logs CASCADE;
DROP TABLE IF EXISTS automation_alerts CASCADE;
DROP TABLE IF EXISTS automation_sessions CASCADE;
DROP TABLE IF EXISTS automation_jobs CASCADE;
DROP TABLE IF EXISTS automation_posts CASCADE;
DROP TABLE IF EXISTS automation_activity CASCADE;
DROP TABLE IF EXISTS automation_analytics CASCADE;
DROP TABLE IF EXISTS automation_logs CASCADE;
DROP TABLE IF EXISTS automation_campaigns CASCADE;

-- Drop related automation tables
DROP TABLE IF EXISTS campaign_metrics_timeseries CASCADE;
DROP TABLE IF EXISTS posted_links CASCADE;
DROP TABLE IF EXISTS content_requests CASCADE;
DROP TABLE IF EXISTS link_opportunities CASCADE;
DROP TABLE IF EXISTS no_hands_seo_projects CASCADE;
DROP TABLE IF EXISTS substack_sessions CASCADE;
DROP TABLE IF EXISTS competitor_analysis CASCADE;

-- Drop any automation-related functions
DROP FUNCTION IF EXISTS handle_automation_campaign_changes() CASCADE;
DROP FUNCTION IF EXISTS update_automation_metrics() CASCADE;
DROP FUNCTION IF EXISTS log_automation_activity() CASCADE;
DROP FUNCTION IF EXISTS process_automation_queue() CASCADE;

-- Drop any automation-related triggers
DROP TRIGGER IF EXISTS automation_campaign_trigger ON public.campaigns;
DROP TRIGGER IF EXISTS automation_logs_trigger ON public.automation_logs;

-- Drop any automation-related views
DROP VIEW IF EXISTS automation_dashboard_view CASCADE;
DROP VIEW IF EXISTS campaign_performance_view CASCADE;

-- Clean up any automation-related sequences
DROP SEQUENCE IF EXISTS automation_campaigns_id_seq CASCADE;
DROP SEQUENCE IF EXISTS automation_logs_id_seq CASCADE;

-- Drop any automation-related types or enums
DROP TYPE IF EXISTS automation_status CASCADE;
DROP TYPE IF EXISTS campaign_type CASCADE;
DROP TYPE IF EXISTS automation_log_level CASCADE;

-- Remove automation-related RLS policies (if any remain)
-- These will be automatically removed when tables are dropped

-- Clean up any automation-related indexes (if any remain)
-- These will be automatically removed when tables are dropped

COMMIT;
