-- Create domains table for tracking Netlify domain additions
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL UNIQUE,
    netlify_site_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'disabled')),
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed', 'expired')),
    dns_configured BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_token TEXT,
    verification_method TEXT DEFAULT 'dns',
    last_checked_at TIMESTAMP WITH TIME ZONE,
    ssl_certificate_expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON public.domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_site_id ON public.domains(netlify_site_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_ssl_status ON public.domains(ssl_status);

-- Enable Row Level Security
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own domains" ON public.domains;
CREATE POLICY "Users can view their own domains" ON public.domains
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own domains" ON public.domains;
CREATE POLICY "Users can insert their own domains" ON public.domains
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own domains" ON public.domains;
CREATE POLICY "Users can update their own domains" ON public.domains
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own domains" ON public.domains;
CREATE POLICY "Users can delete their own domains" ON public.domains
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin access policy
DROP POLICY IF EXISTS "Admin full access to domains" ON public.domains;
CREATE POLICY "Admin full access to domains" ON public.domains
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email LIKE '%@admin.%')
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW EXECUTE FUNCTION update_domains_updated_at();

-- Create domain validation logs table
CREATE TABLE IF NOT EXISTS public.domain_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    validation_type TEXT NOT NULL CHECK (validation_type IN ('dns', 'ssl', 'connectivity', 'netlify_status')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'warning')),
    message TEXT,
    response_data JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for validation logs
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_domain_id ON public.domain_validation_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_type ON public.domain_validation_logs(validation_type);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_status ON public.domain_validation_logs(status);
CREATE INDEX IF NOT EXISTS idx_domain_validation_logs_checked_at ON public.domain_validation_logs(checked_at);

-- RLS for validation logs
ALTER TABLE public.domain_validation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view validation logs for their domains" ON public.domain_validation_logs;
CREATE POLICY "Users can view validation logs for their domains" ON public.domain_validation_logs
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert validation logs for their domains" ON public.domain_validation_logs;
CREATE POLICY "Users can insert validation logs for their domains" ON public.domain_validation_logs
    FOR INSERT WITH CHECK (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Admin access for validation logs
DROP POLICY IF EXISTS "Admin full access to validation logs" ON public.domain_validation_logs;
CREATE POLICY "Admin full access to validation logs" ON public.domain_validation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email LIKE '%@admin.%')
        )
    );

-- Sample data (comment out if not needed)
/*
INSERT INTO public.domains (domain_name, netlify_site_id, status, ssl_enabled, dns_configured) VALUES 
('example.com', 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809', 'active', true, true),
('test.org', 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809', 'pending', false, false)
ON CONFLICT (domain_name) DO NOTHING;
*/
