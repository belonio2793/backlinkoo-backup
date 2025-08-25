-- =====================================================
-- DOMAINS ENHANCEMENT SQL QUERIES
-- Execute these in Supabase SQL Editor
-- =====================================================

-- 1. ENHANCED DOMAINS TABLE STRUCTURE
-- =====================================================

-- Create or update domains table with all required fields
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'verified', 'dns_ready', 'active', 'error', 'removed')),
    
    -- Netlify Integration
    netlify_verified BOOLEAN DEFAULT false NOT NULL,
    netlify_site_id TEXT,
    netlify_domain_id TEXT,
    
    -- DNS Configuration
    dns_verified BOOLEAN DEFAULT false NOT NULL,
    dns_records JSONB DEFAULT '[]'::jsonb,
    custom_dns_configured BOOLEAN DEFAULT false,
    
    -- SSL Configuration
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'error')),
    ssl_certificate_id TEXT,
    
    -- Validation & Error Handling
    last_validation_at TIMESTAMP WITH TIME ZONE,
    validation_attempts INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Source & Metadata
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'netlify_sync', 'import')),
    is_global BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    
    -- Theme & Blog Configuration
    theme_name TEXT,
    selected_theme TEXT,
    blog_enabled BOOLEAN DEFAULT false,
    pages_published INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(user_id, domain),
    UNIQUE(netlify_domain_id) WHERE netlify_domain_id IS NOT NULL
);

-- 2. DOMAIN SYNC HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.domain_sync_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('netlify_sync', 'dns_validation', 'ssl_provision', 'status_check')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    sync_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. DOMAIN VALIDATION QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.domain_validation_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    validation_type TEXT NOT NULL CHECK (validation_type IN ('dns', 'ssl', 'netlify', 'health_check')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON public.domains(netlify_verified);
CREATE INDEX IF NOT EXISTS idx_domains_domain_text ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_created_at ON public.domains(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_domains_user_status ON public.domains(user_id, status);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_site ON public.domains(netlify_site_id) WHERE netlify_site_id IS NOT NULL;

-- Sync history indexes
CREATE INDEX IF NOT EXISTS idx_domain_sync_history_domain_id ON public.domain_sync_history(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_sync_history_created_at ON public.domain_sync_history(created_at DESC);

-- Validation queue indexes
CREATE INDEX IF NOT EXISTS idx_domain_validation_queue_status ON public.domain_validation_queue(status);
CREATE INDEX IF NOT EXISTS idx_domain_validation_queue_scheduled ON public.domain_validation_queue(scheduled_at) WHERE status = 'pending';

-- 5. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for domains table
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log domain changes
CREATE OR REPLACE FUNCTION log_domain_sync(
    p_domain_id UUID,
    p_sync_type TEXT,
    p_status TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_error_message TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    sync_id UUID;
BEGIN
    INSERT INTO public.domain_sync_history (
        domain_id, sync_type, status, details, error_message, sync_duration_ms
    ) VALUES (
        p_domain_id, p_sync_type, p_status, p_details, p_error_message, p_duration_ms
    ) RETURNING id INTO sync_id;
    
    RETURN sync_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue domain validation
CREATE OR REPLACE FUNCTION queue_domain_validation(
    p_domain_id UUID,
    p_validation_type TEXT,
    p_priority INTEGER DEFAULT 5,
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    -- Remove any existing pending validations of the same type
    DELETE FROM public.domain_validation_queue 
    WHERE domain_id = p_domain_id 
    AND validation_type = p_validation_type 
    AND status = 'pending';
    
    -- Add new validation to queue
    INSERT INTO public.domain_validation_queue (
        domain_id, validation_type, priority, scheduled_at
    ) VALUES (
        p_domain_id, p_validation_type, p_priority, p_scheduled_at
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_validation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domains
CREATE POLICY "Users can view their own domains" ON public.domains
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON public.domains
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON public.domains
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON public.domains
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sync history
CREATE POLICY "Users can view sync history for their domains" ON public.domain_sync_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.domains 
            WHERE domains.id = domain_sync_history.domain_id 
            AND domains.user_id = auth.uid()
        )
    );

-- RLS Policies for validation queue
CREATE POLICY "Users can view validation queue for their domains" ON public.domain_validation_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.domains 
            WHERE domains.id = domain_validation_queue.domain_id 
            AND domains.user_id = auth.uid()
        )
    );

-- 7. UTILITY VIEWS
-- =====================================================

-- View for domain overview with stats
CREATE OR REPLACE VIEW public.domain_overview AS
SELECT 
    d.*,
    COALESCE(sh.last_sync, d.created_at) as last_activity,
    COALESCE(sh.sync_count, 0) as total_syncs,
    COALESCE(vq.pending_validations, 0) as pending_validations,
    CASE 
        WHEN d.netlify_verified AND d.dns_verified AND d.ssl_enabled THEN 'fully_configured'
        WHEN d.netlify_verified AND d.dns_verified THEN 'ssl_pending'
        WHEN d.netlify_verified THEN 'dns_pending'
        ELSE 'setup_required'
    END as configuration_status
FROM public.domains d
LEFT JOIN (
    SELECT 
        domain_id,
        MAX(created_at) as last_sync,
        COUNT(*) as sync_count
    FROM public.domain_sync_history 
    GROUP BY domain_id
) sh ON d.id = sh.domain_id
LEFT JOIN (
    SELECT 
        domain_id,
        COUNT(*) as pending_validations
    FROM public.domain_validation_queue 
    WHERE status = 'pending'
    GROUP BY domain_id
) vq ON d.id = vq.domain_id;

-- View for recent domain activity
CREATE OR REPLACE VIEW public.recent_domain_activity AS
SELECT 
    d.domain,
    d.status,
    sh.sync_type,
    sh.status as sync_status,
    sh.created_at as activity_time,
    sh.details,
    sh.error_message
FROM public.domain_sync_history sh
JOIN public.domains d ON d.id = sh.domain_id
ORDER BY sh.created_at DESC
LIMIT 100;

-- 8. INITIAL DATA SETUP
-- =====================================================

-- Insert default primary domain if not exists
INSERT INTO public.domains (
    domain, 
    status, 
    netlify_verified, 
    netlify_site_id, 
    is_primary, 
    is_global,
    user_id,
    source
) 
SELECT 
    'backlinkoo.com',
    'verified',
    true,
    'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
    true,
    true,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'netlify_sync'
WHERE NOT EXISTS (
    SELECT 1 FROM public.domains WHERE domain = 'backlinkoo.com'
);

-- 9. MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean old sync history
CREATE OR REPLACE FUNCTION cleanup_old_sync_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.domain_sync_history 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to process pending validations
CREATE OR REPLACE FUNCTION get_pending_validations(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    domain_id UUID,
    domain_name TEXT,
    validation_type TEXT,
    priority INTEGER,
    attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vq.id,
        vq.domain_id,
        d.domain,
        vq.validation_type,
        vq.priority,
        vq.attempts
    FROM public.domain_validation_queue vq
    JOIN public.domains d ON d.id = vq.domain_id
    WHERE vq.status = 'pending'
    AND vq.scheduled_at <= NOW()
    AND vq.attempts < vq.max_attempts
    ORDER BY vq.priority DESC, vq.scheduled_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 10. EXAMPLE USAGE QUERIES
-- =====================================================

-- Get all domains for a user with their status
/*
SELECT * FROM public.domain_overview 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
*/

-- Log a sync operation
/*
SELECT log_domain_sync(
    (SELECT id FROM public.domains WHERE domain = 'example.com' LIMIT 1),
    'netlify_sync',
    'success',
    '{"domains_synced": 5, "new_domains": 2}'::jsonb,
    NULL,
    1500
);
*/

-- Queue a DNS validation
/*
SELECT queue_domain_validation(
    (SELECT id FROM public.domains WHERE domain = 'example.com' LIMIT 1),
    'dns',
    8
);
*/

-- Get recent activity
/*
SELECT * FROM public.recent_domain_activity 
WHERE domain LIKE '%example%'
LIMIT 20;
*/

-- Clean old sync history (keep last 30 days)
/*
SELECT cleanup_old_sync_history(30);
*/

-- Get pending validations
/*
SELECT * FROM get_pending_validations(5);
*/

-- =====================================================
-- COMPLETE: Copy and paste sections into Supabase SQL Editor
-- =====================================================
