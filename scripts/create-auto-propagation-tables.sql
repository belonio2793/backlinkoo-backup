-- Create domain_registrar_credentials table
CREATE TABLE IF NOT EXISTS public.domain_registrar_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    registrar_code VARCHAR(50) NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one credential set per domain
    UNIQUE(domain_id)
);

-- Create domain_auto_propagation_logs table
CREATE TABLE IF NOT EXISTS public.domain_auto_propagation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors TEXT[] DEFAULT '{}',
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create domain_validation_logs table (for DNS validation tracking)
CREATE TABLE IF NOT EXISTS public.domain_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    validation_type VARCHAR(20) NOT NULL DEFAULT 'dns',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    dns_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_registrar_credentials_domain_id ON public.domain_registrar_credentials(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_auto_propagation_logs_domain_id ON public.domain_auto_propagation_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_auto_propagation_logs_created_at ON public.domain_auto_propagation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_domain_id ON public.domain_validation_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_created_at ON public.domain_validation_logs(created_at);

-- Enable RLS
ALTER TABLE public.domain_registrar_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_auto_propagation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_validation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for domain_registrar_credentials
CREATE POLICY "Users can view their own domain credentials" ON public.domain_registrar_credentials
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert credentials for their domains" ON public.domain_registrar_credentials
    FOR INSERT WITH CHECK (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own domain credentials" ON public.domain_registrar_credentials
    FOR UPDATE USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own domain credentials" ON public.domain_registrar_credentials
    FOR DELETE USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for domain_auto_propagation_logs
CREATE POLICY "Users can view their own domain propagation logs" ON public.domain_auto_propagation_logs
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert propagation logs for their domains" ON public.domain_auto_propagation_logs
    FOR INSERT WITH CHECK (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for domain_validation_logs
CREATE POLICY "Users can view their own domain validation logs" ON public.domain_validation_logs
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert validation logs for their domains" ON public.domain_validation_logs
    FOR INSERT WITH CHECK (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Create function to get domain propagation statistics
CREATE OR REPLACE FUNCTION public.get_domain_propagation_stats(p_domain_id UUID)
RETURNS TABLE (
    total_attempts INTEGER,
    successful_attempts INTEGER,
    failed_attempts INTEGER,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_attempts,
        COUNT(CASE WHEN success = true THEN 1 END)::INTEGER as successful_attempts,
        COUNT(CASE WHEN success = false THEN 1 END)::INTEGER as failed_attempts,
        MAX(created_at) as last_attempt_at,
        MAX(CASE WHEN success = true THEN created_at END) as last_success_at
    FROM public.domain_auto_propagation_logs
    WHERE domain_id = p_domain_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_domain_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete validation logs older than 90 days
    DELETE FROM public.domain_validation_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete propagation logs older than 180 days (keep longer for analysis)
    DELETE FROM public.domain_auto_propagation_logs 
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get registrar usage statistics
CREATE OR REPLACE FUNCTION public.get_registrar_usage_stats()
RETURNS TABLE (
    registrar_code VARCHAR(50),
    domain_count INTEGER,
    successful_propagations INTEGER,
    failed_propagations INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        drc.registrar_code,
        COUNT(DISTINCT drc.domain_id)::INTEGER as domain_count,
        COUNT(CASE WHEN dapl.success = true THEN 1 END)::INTEGER as successful_propagations,
        COUNT(CASE WHEN dapl.success = false THEN 1 END)::INTEGER as failed_propagations
    FROM public.domain_registrar_credentials drc
    LEFT JOIN public.domain_auto_propagation_logs dapl ON drc.domain_id = dapl.domain_id
    GROUP BY drc.registrar_code
    ORDER BY domain_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_registrar_credentials TO authenticated;
GRANT SELECT, INSERT ON public.domain_auto_propagation_logs TO authenticated;
GRANT SELECT, INSERT ON public.domain_validation_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_propagation_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_domain_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_registrar_usage_stats() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.domain_registrar_credentials IS 'Stores encrypted API credentials for domain registrars';
COMMENT ON TABLE public.domain_auto_propagation_logs IS 'Logs all automatic DNS propagation attempts';
COMMENT ON TABLE public.domain_validation_logs IS 'Logs all DNS validation attempts and results';

COMMENT ON COLUMN public.domain_registrar_credentials.encrypted_credentials IS 'Base64 encoded credentials (should use proper encryption in production)';
COMMENT ON COLUMN public.domain_auto_propagation_logs.details IS 'Detailed JSON information about the propagation attempt';
COMMENT ON COLUMN public.domain_validation_logs.dns_response IS 'Raw DNS lookup response data';
