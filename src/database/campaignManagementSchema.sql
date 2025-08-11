-- ========================================================================
-- CAMPAIGN MANAGEMENT SCHEMA - NON-DESTRUCTIVE RECORD MANAGEMENT
-- ========================================================================
-- Complete database schema for user-tied campaigns with persistent state,
-- resume/pause capabilities, and adaptive discovery without data loss

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==================== CAMPAIGN STATE MANAGEMENT ====================

-- Main campaign states table
CREATE TABLE IF NOT EXISTS campaign_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    engine_type VARCHAR(50) NOT NULL,
    target_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    
    -- State Management (JSONB for flexibility without data loss)
    execution_state JSONB DEFAULT '{}',
    pause_state JSONB DEFAULT '{}',
    progress JSONB DEFAULT '{}',
    discovery_state JSONB DEFAULT '{}',
    historical_data JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Timestamps (never updated, only new records created)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete for non-destructive operations
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ NULL,
    archive_reason TEXT NULL
);

-- Campaign state history (immutable audit trail)
CREATE TABLE IF NOT EXISTS campaign_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Change tracking
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'paused', 'resumed', 'status_change'
    old_state JSONB,
    new_state JSONB,
    changed_fields TEXT[],
    
    -- Context
    change_reason TEXT,
    triggered_by VARCHAR(50), -- 'user', 'system', 'scheduler'
    user_agent TEXT,
    ip_address INET,
    
    -- Immutable timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================== REPORTING & SNAPSHOTS ====================

-- Campaign snapshots (immutable point-in-time records)
CREATE TABLE IF NOT EXISTS campaign_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Snapshot data (preserved forever)
    campaign_status VARCHAR(50),
    execution_phase VARCHAR(100),
    metrics JSONB,
    discovery_data JSONB,
    performance JSONB,
    context JSONB,
    
    -- Complete state preservation
    raw_state JSONB,
    preserved_data JSONB,
    
    -- Preservation settings
    preserve_indefinitely BOOLEAN DEFAULT FALSE,
    retention_years INTEGER DEFAULT 7,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical records (granular event tracking)
CREATE TABLE IF NOT EXISTS campaign_historical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Record data
    data JSONB,
    campaign_status_at_time VARCHAR(50),
    execution_phase_at_time VARCHAR(100),
    batch_id UUID NULL,
    operation_id UUID NULL,
    
    -- Preservation flags
    preserve_indefinitely BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    
    -- Relationships (non-destructive linking)
    related_records UUID[],
    parent_operation UUID NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign reports (generated reports with data preservation)
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Report content
    metrics JSONB,
    data JSONB,
    generated_at TIMESTAMPTZ NOT NULL,
    
    -- Report metadata
    report_version INTEGER DEFAULT 1,
    superseded_by UUID NULL REFERENCES campaign_reports(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== DISCOVERY SYSTEM ====================

-- Discovery targets (discovered domains/URLs with complete history)
CREATE TABLE IF NOT EXISTS discovery_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    base_url TEXT NOT NULL,
    discovery_method VARCHAR(50) NOT NULL,
    
    -- Domain characteristics (preserved even if domain changes)
    characteristics JSONB DEFAULT '{}',
    opportunity JSONB DEFAULT '{}',
    discovery_context JSONB DEFAULT '{}',
    
    -- Status tracking (append-only)
    status VARCHAR(50) DEFAULT 'discovered',
    last_tested TIMESTAMPTZ NULL,
    test_results JSONB DEFAULT '[]', -- Array of all test results
    
    -- Adaptation data (continuously updated without loss)
    adaptation_data JSONB DEFAULT '{}',
    
    -- Preservation
    preserve_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovery sessions (complete session tracking)
CREATE TABLE IF NOT EXISTS discovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL,
    
    -- Session configuration (immutable once started)
    parameters JSONB,
    
    -- Session results (append-only updates)
    results JSONB DEFAULT '{}',
    adaptation_insights JSONB DEFAULT '{}',
    
    -- Session lifecycle
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NULL,
    checkpoint_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LIFECYCLE MANAGEMENT ====================

-- Pause operations (complete pause state preservation)
CREATE TABLE IF NOT EXISTS pause_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pause_type VARCHAR(50) NOT NULL,
    
    -- Pause context (immutable)
    pause_context JSONB,
    
    -- State preservation (complete snapshot)
    preserved_state JSONB,
    resource_state JSONB,
    resume_preparation JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL
);

-- Resume operations (complete resume tracking)
CREATE TABLE IF NOT EXISTS resume_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    pause_operation_id UUID REFERENCES pause_operations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Resume context
    resume_context JSONB,
    
    -- Validation and restoration tracking
    validation_results JSONB,
    restoration_process JSONB,
    adaptations JSONB,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'preparing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

-- Lifecycle events (immutable event log)
CREATE TABLE IF NOT EXISTS lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_states(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Event data (immutable)
    data JSONB,
    impact_assessment JSONB,
    
    -- Immutable creation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== NON-DESTRUCTIVE TRIGGERS ====================

-- Campaign state history trigger (records all changes)
CREATE OR REPLACE FUNCTION record_campaign_state_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Record state change in history table
    INSERT INTO campaign_state_history (
        campaign_id,
        user_id,
        change_type,
        old_state,
        new_state,
        changed_fields,
        change_reason,
        triggered_by
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.user_id, OLD.user_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_change'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'deleted'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN (
                SELECT array_agg(key) 
                FROM jsonb_each(row_to_json(NEW)::jsonb) n(key, value)
                JOIN jsonb_each(row_to_json(OLD)::jsonb) o(key, old_value) USING (key)
                WHERE n.value != o.old_value
            )
            ELSE ARRAY[]::TEXT[]
        END,
        'System triggered',
        'system'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to campaign_states
DROP TRIGGER IF EXISTS campaign_state_change_trigger ON campaign_states;
CREATE TRIGGER campaign_state_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaign_states
    FOR EACH ROW
    EXECUTE FUNCTION record_campaign_state_change();

-- Discovery target update trigger (preserve test history)
CREATE OR REPLACE FUNCTION preserve_discovery_target_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamp
    NEW.updated_at = NOW();
    
    -- Ensure test_results array is preserved and appended to
    IF OLD.test_results IS NOT NULL AND NEW.test_results IS NOT NULL THEN
        -- Merge arrays ensuring no data loss
        NEW.test_results = OLD.test_results || NEW.test_results;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preserve_discovery_history_trigger ON discovery_targets;
CREATE TRIGGER preserve_discovery_history_trigger
    BEFORE UPDATE ON discovery_targets
    FOR EACH ROW
    EXECUTE FUNCTION preserve_discovery_target_history();

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Campaign states indexes
CREATE INDEX IF NOT EXISTS idx_campaign_states_user_id ON campaign_states(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_states_status ON campaign_states(status);
CREATE INDEX IF NOT EXISTS idx_campaign_states_engine_type ON campaign_states(engine_type);
CREATE INDEX IF NOT EXISTS idx_campaign_states_created_at ON campaign_states(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_states_archived ON campaign_states(archived) WHERE archived = FALSE;

-- Historical records indexes
CREATE INDEX IF NOT EXISTS idx_historical_records_campaign_id ON campaign_historical_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_historical_records_timestamp ON campaign_historical_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_historical_records_type ON campaign_historical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_historical_records_preserve ON campaign_historical_records(preserve_indefinitely) WHERE preserve_indefinitely = TRUE;

-- Snapshots indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_campaign_id ON campaign_snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON campaign_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON campaign_snapshots(snapshot_type);

-- Discovery indexes
CREATE INDEX IF NOT EXISTS idx_discovery_targets_campaign_id ON discovery_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_discovery_targets_domain ON discovery_targets(domain);
CREATE INDEX IF NOT EXISTS idx_discovery_targets_status ON discovery_targets(status);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_campaign_id ON discovery_sessions(campaign_id);

-- Lifecycle indexes
CREATE INDEX IF NOT EXISTS idx_pause_operations_campaign_id ON pause_operations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pause_operations_status ON pause_operations(status);
CREATE INDEX IF NOT EXISTS idx_resume_operations_campaign_id ON resume_operations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_campaign_id ON lifecycle_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_timestamp ON lifecycle_events(timestamp);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE campaign_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pause_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_events ENABLE ROW LEVEL SECURITY;

-- Campaign states policies (user can only access their own campaigns)
CREATE POLICY "Users can view own campaign states" ON campaign_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaign states" ON campaign_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaign states" ON campaign_states
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Historical records policies (read-only for users)
CREATE POLICY "Users can view own campaign history" ON campaign_state_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own campaign snapshots" ON campaign_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own historical records" ON campaign_historical_records
    FOR SELECT USING (auth.uid() = user_id);

-- Discovery policies
CREATE POLICY "Users can manage own discovery targets" ON discovery_targets
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaign_states WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own discovery sessions" ON discovery_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Lifecycle policies
CREATE POLICY "Users can manage own pause operations" ON pause_operations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own resume operations" ON resume_operations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lifecycle events" ON lifecycle_events
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaign_states WHERE user_id = auth.uid()
        )
    );

-- ==================== HELPER FUNCTIONS ====================

-- Function to safely archive campaign (non-destructive)
CREATE OR REPLACE FUNCTION archive_campaign(
    p_campaign_id UUID,
    p_archive_reason TEXT DEFAULT 'User requested'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE campaign_states 
    SET 
        archived = TRUE,
        archived_at = NOW(),
        archive_reason = p_archive_reason,
        updated_at = NOW()
    WHERE id = p_campaign_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign with full history
CREATE OR REPLACE FUNCTION get_campaign_with_history(p_campaign_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'campaign', row_to_json(cs.*),
        'history', (
            SELECT json_agg(row_to_json(csh.*) ORDER BY csh.created_at)
            FROM campaign_state_history csh
            WHERE csh.campaign_id = p_campaign_id
        ),
        'snapshots', (
            SELECT json_agg(row_to_json(csn.*) ORDER BY csn.timestamp DESC)
            FROM campaign_snapshots csn
            WHERE csn.campaign_id = p_campaign_id
            LIMIT 10
        ),
        'discovery_targets', (
            SELECT json_agg(row_to_json(dt.*) ORDER BY dt.created_at DESC)
            FROM discovery_targets dt
            WHERE dt.campaign_id = p_campaign_id
            LIMIT 50
        )
    )
    INTO result
    FROM campaign_states cs
    WHERE cs.id = p_campaign_id AND cs.user_id = auth.uid();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create campaign snapshot
CREATE OR REPLACE FUNCTION create_campaign_snapshot(
    p_campaign_id UUID,
    p_snapshot_type VARCHAR(50),
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    campaign_data JSON;
BEGIN
    -- Get current campaign state
    SELECT row_to_json(cs.*) INTO campaign_data
    FROM campaign_states cs
    WHERE cs.id = p_campaign_id AND cs.user_id = auth.uid();
    
    IF campaign_data IS NULL THEN
        RAISE EXCEPTION 'Campaign not found or access denied';
    END IF;
    
    -- Create snapshot
    INSERT INTO campaign_snapshots (
        campaign_id,
        user_id,
        snapshot_type,
        timestamp,
        raw_state,
        context
    ) VALUES (
        p_campaign_id,
        auth.uid(),
        p_snapshot_type,
        NOW(),
        campaign_data::jsonb,
        p_context
    ) RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== DATA RETENTION POLICIES ====================

-- Function to clean up old non-preserved records (respects preservation flags)
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Only delete records that are not marked for indefinite preservation
    -- and are older than retention period
    
    -- Clean up old snapshots (keeping preserved ones)
    DELETE FROM campaign_snapshots 
    WHERE preserve_indefinitely = FALSE 
    AND created_at < NOW() - INTERVAL '1 year' * retention_years;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old historical records (keeping preserved ones)
    DELETE FROM campaign_historical_records 
    WHERE preserve_indefinitely = FALSE 
    AND archived = FALSE
    AND created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Campaign Management Schema created successfully with non-destructive record management' as status;
