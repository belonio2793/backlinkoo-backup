-- Create permanent API configurations table for persistent storage
CREATE TABLE IF NOT EXISTS permanent_api_configurations (
    id TEXT PRIMARY KEY,
    service TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    endpoint TEXT,
    is_active BOOLEAN DEFAULT true,
    last_tested TIMESTAMP WITH TIME ZONE NOT NULL,
    health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_permanent_api_configurations_service 
ON permanent_api_configurations(service);

CREATE INDEX IF NOT EXISTS idx_permanent_api_configurations_active 
ON permanent_api_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_permanent_api_configurations_health 
ON permanent_api_configurations(health_score);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permanent_api_configurations_updated_at
    BEFORE UPDATE ON permanent_api_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert comment
COMMENT ON TABLE permanent_api_configurations IS 'Permanent storage for API configurations with health monitoring';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON permanent_api_configurations TO authenticated;
-- GRANT ALL ON permanent_api_configurations TO service_role;
