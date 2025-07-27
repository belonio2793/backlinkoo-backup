-- Create error_logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT NOT NULL CHECK (category IN (
        'authentication', 
        'email', 
        'payment', 
        'seo_analysis', 
        'database', 
        'network', 
        'validation', 
        'general'
    )),
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,
    user_id TEXT,
    component TEXT,
    action TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- Add Row Level Security (RLS)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (adjust based on your user_roles table structure)
CREATE POLICY "Admin can access all error logs" ON error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id::text = auth.uid()::text 
            AND user_roles.role = 'admin'
        )
    );

-- Create policy for users to see their own errors (optional)
CREATE POLICY "Users can see their own error logs" ON error_logs
    FOR SELECT USING (user_id = auth.uid()::text);

-- Grant necessary permissions
GRANT ALL ON error_logs TO authenticated;
GRANT ALL ON error_logs TO service_role;

-- Add comment for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging table for application monitoring and debugging';
COMMENT ON COLUMN error_logs.severity IS 'Error severity level: low, medium, high, critical';
COMMENT ON COLUMN error_logs.category IS 'Error category for classification and filtering';
COMMENT ON COLUMN error_logs.details IS 'Additional error context and metadata in JSON format';
COMMENT ON COLUMN error_logs.resolved IS 'Whether the error has been marked as resolved by an admin';
