import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, Database, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableCheck {
  name: string;
  exists: boolean;
  error?: string;
  rowCount?: number;
}

interface ViewCheck {
  name: string;
  exists: boolean;
  error?: string;
}

interface FunctionCheck {
  name: string;
  exists: boolean;
  error?: string;
}

export const CampaignMetricsDBVerifier: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [tableChecks, setTableChecks] = useState<TableCheck[]>([]);
  const [viewChecks, setViewChecks] = useState<ViewCheck[]>([]);
  const [functionChecks, setFunctionChecks] = useState<FunctionCheck[]>([]);
  const [overallStatus, setOverallStatus] = useState<'unknown' | 'complete' | 'partial' | 'missing'>('unknown');
  const [sqlCommands, setSqlCommands] = useState<string>('');
  const { toast } = useToast();

  const requiredTables = [
    'campaign_runtime_metrics',
    'user_monthly_link_aggregates', 
    'campaign_link_history'
  ];

  const requiredViews = [
    'live_campaign_monitor',
    'user_dashboard_summary'
  ];

  const requiredFunctions = [
    'update_campaign_runtime_metrics',
    'update_user_monthly_aggregates'
  ];

  const checkTableExists = async (tableName: string): Promise<TableCheck> => {
    try {
      // Try to query the table with a limit of 0 to check existence
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          name: tableName,
          exists: false,
          error: error.message
        };
      }

      return {
        name: tableName,
        exists: true,
        rowCount: count || 0
      };
    } catch (error) {
      return {
        name: tableName,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkViewExists = async (viewName: string): Promise<ViewCheck> => {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        return {
          name: viewName,
          exists: false,
          error: error.message
        };
      }

      return {
        name: viewName,
        exists: true
      };
    } catch (error) {
      return {
        name: viewName,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkFunctionExists = async (functionName: string): Promise<FunctionCheck> => {
    try {
      // Test function by calling it with null parameters (this will error but confirm function exists)
      const { error } = await supabase.rpc(functionName as any);
      
      // If we get a parameter error, the function exists
      if (error && error.message.includes('null value')) {
        return {
          name: functionName,
          exists: true
        };
      }

      // If we get function not found error, it doesn't exist
      if (error && (error.message.includes('function') && error.message.includes('does not exist'))) {
        return {
          name: functionName,
          exists: false,
          error: error.message
        };
      }

      // Function exists and worked
      return {
        name: functionName,
        exists: true
      };
    } catch (error) {
      return {
        name: functionName,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runVerification = async () => {
    setIsChecking(true);
    setOverallStatus('unknown');

    try {
      // Check tables
      const tableResults = await Promise.all(
        requiredTables.map(table => checkTableExists(table))
      );
      setTableChecks(tableResults);

      // Check views
      const viewResults = await Promise.all(
        requiredViews.map(view => checkViewExists(view))
      );
      setViewChecks(viewResults);

      // Check functions
      const functionResults = await Promise.all(
        requiredFunctions.map(func => checkFunctionExists(func))
      );
      setFunctionChecks(functionResults);

      // Determine overall status
      const allTablesExist = tableResults.every(t => t.exists);
      const allViewsExist = viewResults.every(v => v.exists);
      const allFunctionsExist = functionResults.every(f => f.exists);

      if (allTablesExist && allViewsExist && allFunctionsExist) {
        setOverallStatus('complete');
        setSqlCommands('-- ✅ All campaign metrics database objects exist! No setup needed.');
      } else if (tableResults.some(t => t.exists) || viewResults.some(v => v.exists) || functionResults.some(f => f.exists)) {
        setOverallStatus('partial');
        generatePartialSetupSQL(tableResults, viewResults, functionResults);
      } else {
        setOverallStatus('missing');
        generateFullSetupSQL();
      }

    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify database setup. Check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const generatePartialSetupSQL = (tables: TableCheck[], views: ViewCheck[], functions: FunctionCheck[]) => {
    let sql = "-- 🔧 Partial Setup Required - Missing Components:\n\n";
    
    const missingTables = tables.filter(t => !t.exists);
    const missingViews = views.filter(v => !v.exists);
    const missingFunctions = functions.filter(f => !f.exists);

    if (missingTables.length > 0) {
      sql += "-- Missing Tables: " + missingTables.map(t => t.name).join(', ') + "\n";
    }
    if (missingViews.length > 0) {
      sql += "-- Missing Views: " + missingViews.map(v => v.name).join(', ') + "\n";
    }
    if (missingFunctions.length > 0) {
      sql += "-- Missing Functions: " + missingFunctions.map(f => f.name).join(', ') + "\n";
    }

    sql += "\n-- Run the complete setup SQL below:\n\n";
    sql += getFullMigrationSQL();

    setSqlCommands(sql);
  };

  const generateFullSetupSQL = () => {
    let sql = "-- 🚀 Complete Campaign Metrics Database Setup Required\n\n";
    sql += "-- No campaign metrics tables found. Run the complete migration:\n\n";
    sql += getFullMigrationSQL();
    setSqlCommands(sql);
  };

  const getFullMigrationSQL = () => {
    return `-- Campaign Metrics Database Setup
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Campaign Runtime Metrics Table
CREATE TABLE IF NOT EXISTS campaign_runtime_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_runtime_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'completed', 'deleted')),
    
    -- Progressive link tracking
    progressive_link_count INTEGER DEFAULT 0,
    links_live INTEGER DEFAULT 0,
    links_pending INTEGER DEFAULT 0,
    links_failed INTEGER DEFAULT 0,
    
    -- Campaign configuration
    target_url TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    daily_limit INTEGER DEFAULT 25,
    
    -- Quality metrics
    average_authority DECIMAL(5,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    velocity DECIMAL(8,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, user_id)
);

-- 2. User Monthly Link Aggregates Table
CREATE TABLE IF NOT EXISTS user_monthly_link_aggregates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Aggregate metrics
    total_links_generated INTEGER DEFAULT 0,
    total_links_live INTEGER DEFAULT 0,
    total_campaigns_active INTEGER DEFAULT 0,
    total_campaigns_completed INTEGER DEFAULT 0,
    
    -- Quality aggregates
    average_authority DECIMAL(5,2) DEFAULT 0,
    average_success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- User subscription info
    is_premium BOOLEAN DEFAULT FALSE,
    monthly_link_limit INTEGER DEFAULT 20,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);

-- 3. Campaign Link History Table
CREATE TABLE IF NOT EXISTS campaign_link_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Link details
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    domain TEXT NOT NULL,
    
    -- Link status and quality
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'failed', 'removed')),
    domain_authority INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Link type and strategy
    link_type TEXT NOT NULL DEFAULT 'unknown',
    link_strategy TEXT DEFAULT 'manual',
    
    -- Performance metrics
    clicks INTEGER DEFAULT 0,
    link_juice DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Live Campaign Monitor View
CREATE OR REPLACE VIEW live_campaign_monitor AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(crm.id) as total_campaigns,
    COUNT(CASE WHEN crm.status = 'active' THEN 1 END) as active_campaigns,
    COUNT(CASE WHEN crm.status = 'paused' THEN 1 END) as paused_campaigns,
    SUM(crm.progressive_link_count) as total_links_generated,
    SUM(crm.links_live) as total_links_live,
    SUM(crm.links_pending) as total_links_pending,
    AVG(crm.average_authority) as avg_authority,
    AVG(crm.success_rate) as avg_success_rate,
    SUM(crm.total_runtime_seconds) as total_runtime_seconds,
    MAX(crm.last_active_time) as last_activity
FROM auth.users u
LEFT JOIN campaign_runtime_metrics crm ON u.id = crm.user_id AND crm.status != 'deleted'
GROUP BY u.id, u.email;

-- 5. User Dashboard Summary View
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.email,
    p.subscription_tier,
    p.subscription_status,
    
    -- Current month aggregates
    COALESCE(umla_current.total_links_generated, 0) as current_month_links,
    COALESCE(umla_current.monthly_link_limit, 20) as monthly_limit,
    COALESCE(umla_current.is_premium, false) as is_premium,
    
    -- All-time totals
    COALESCE(lcm.total_links_generated, 0) as lifetime_links,
    COALESCE(lcm.total_campaigns, 0) as total_campaigns,
    COALESCE(lcm.active_campaigns, 0) as active_campaigns,
    COALESCE(lcm.avg_authority, 0) as average_authority,
    COALESCE(lcm.avg_success_rate, 0) as average_success_rate,
    
    lcm.last_activity
    
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN live_campaign_monitor lcm ON u.id = lcm.user_id
LEFT JOIN user_monthly_link_aggregates umla_current ON (
    u.id = umla_current.user_id 
    AND umla_current.year = EXTRACT(YEAR FROM NOW())
    AND umla_current.month = EXTRACT(MONTH FROM NOW())
);

-- 6. Update Campaign Runtime Metrics Function
CREATE OR REPLACE FUNCTION update_campaign_runtime_metrics(
    p_campaign_id UUID,
    p_user_id UUID,
    p_campaign_name TEXT,
    p_target_url TEXT,
    p_keywords TEXT[],
    p_anchor_texts TEXT[],
    p_status TEXT,
    p_progressive_link_count INTEGER,
    p_links_live INTEGER DEFAULT 0,
    p_links_pending INTEGER DEFAULT 0,
    p_average_authority DECIMAL DEFAULT 0,
    p_success_rate DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    existing_record campaign_runtime_metrics%ROWTYPE;
    updated_id UUID;
BEGIN
    SELECT * INTO existing_record 
    FROM campaign_runtime_metrics 
    WHERE campaign_id = p_campaign_id AND user_id = p_user_id;
    
    IF existing_record.id IS NOT NULL THEN
        UPDATE campaign_runtime_metrics SET
            campaign_name = p_campaign_name,
            target_url = p_target_url,
            keywords = p_keywords,
            anchor_texts = p_anchor_texts,
            status = p_status,
            progressive_link_count = GREATEST(existing_record.progressive_link_count, p_progressive_link_count),
            links_live = p_links_live,
            links_pending = p_links_pending,
            average_authority = p_average_authority,
            success_rate = p_success_rate,
            last_active_time = NOW(),
            total_runtime_seconds = CASE 
                WHEN p_status = 'active' THEN 
                    existing_record.total_runtime_seconds + EXTRACT(EPOCH FROM (NOW() - existing_record.last_active_time))::INTEGER
                ELSE existing_record.total_runtime_seconds
            END,
            updated_at = NOW()
        WHERE id = existing_record.id
        RETURNING id INTO updated_id;
    ELSE
        INSERT INTO campaign_runtime_metrics (
            campaign_id, user_id, campaign_name, target_url, keywords, anchor_texts,
            status, progressive_link_count, links_live, links_pending,
            average_authority, success_rate, start_time, last_active_time
        ) VALUES (
            p_campaign_id, p_user_id, p_campaign_name, p_target_url, p_keywords, p_anchor_texts,
            p_status, p_progressive_link_count, p_links_live, p_links_pending,
            p_average_authority, p_success_rate, NOW(), NOW()
        )
        RETURNING id INTO updated_id;
    END IF;
    
    PERFORM update_user_monthly_aggregates(p_user_id);
    
    RETURN updated_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update User Monthly Aggregates Function
CREATE OR REPLACE FUNCTION update_user_monthly_aggregates(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    user_is_premium BOOLEAN;
    user_link_limit INTEGER;
    aggregate_id UUID;
BEGIN
    SELECT 
        CASE WHEN p.subscription_tier = 'premium' OR p.subscription_tier = 'pro' THEN TRUE ELSE FALSE END,
        CASE WHEN p.subscription_tier = 'premium' OR p.subscription_tier = 'pro' THEN -1 ELSE 20 END
    INTO user_is_premium, user_link_limit
    FROM profiles p WHERE p.user_id = p_user_id;
    
    user_is_premium := COALESCE(user_is_premium, FALSE);
    user_link_limit := COALESCE(user_link_limit, 20);
    
    INSERT INTO user_monthly_link_aggregates (
        user_id, year, month, 
        total_links_generated, total_links_live,
        total_campaigns_active, total_campaigns_completed,
        is_premium, monthly_link_limit
    )
    SELECT 
        p_user_id, current_year, current_month,
        COALESCE(SUM(crm.progressive_link_count), 0),
        COALESCE(SUM(crm.links_live), 0),
        COUNT(CASE WHEN crm.status = 'active' THEN 1 END),
        COUNT(CASE WHEN crm.status = 'completed' THEN 1 END),
        user_is_premium,
        user_link_limit
    FROM campaign_runtime_metrics crm
    WHERE crm.user_id = p_user_id AND crm.status != 'deleted'
    
    ON CONFLICT (user_id, year, month) DO UPDATE SET
        total_links_generated = EXCLUDED.total_links_generated,
        total_links_live = EXCLUDED.total_links_live,
        total_campaigns_active = EXCLUDED.total_campaigns_active,
        total_campaigns_completed = EXCLUDED.total_campaigns_completed,
        is_premium = EXCLUDED.is_premium,
        monthly_link_limit = EXCLUDED.monthly_link_limit,
        updated_at = NOW()
    RETURNING id INTO aggregate_id;
    
    RETURN aggregate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security Policies
ALTER TABLE campaign_runtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_link_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_link_history ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can manage campaign metrics" ON campaign_runtime_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view monthly aggregates" ON user_monthly_link_aggregates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage monthly aggregates" ON user_monthly_link_aggregates FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update monthly aggregates" ON user_monthly_link_aggregates FOR UPDATE USING (true);
CREATE POLICY "Users can manage link history" ON campaign_link_history FOR ALL USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins have full access to campaign metrics" ON campaign_runtime_metrics FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to monthly aggregates" ON user_monthly_link_aggregates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to link history" ON campaign_link_history FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

-- 9. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_user_id ON campaign_runtime_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_campaign_id ON campaign_runtime_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_status ON campaign_runtime_metrics(status);
CREATE INDEX IF NOT EXISTS idx_user_monthly_aggregates_user_month ON user_monthly_link_aggregates(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_user_id ON campaign_link_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_campaign_id ON campaign_link_history(campaign_id);

-- ✅ Setup Complete! 
-- Your campaign metrics database is now ready for persistent storage.`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCommands);
      toast({
        title: "Copied!",
        description: "SQL commands copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the SQL commands",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    runVerification();
  }, []);

  const getStatusBadge = () => {
    switch (overallStatus) {
      case 'complete':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'partial':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'missing':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missing</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Campaign Metrics Database Verification
          </CardTitle>
          <CardDescription>
            Checking if your Supabase database has the required tables, views, and functions for campaign metrics persistence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Database Status:</span>
              {getStatusBadge()}
            </div>
            <Button 
              onClick={runVerification} 
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Re-check
            </Button>
          </div>

          {/* Tables Check */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Tables</h3>
            <div className="grid gap-2">
              {tableChecks.map(table => (
                <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{table.name}</code>
                    {table.rowCount !== undefined && (
                      <span className="ml-2 text-sm text-gray-600">({table.rowCount} rows)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {table.exists ? (
                      <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Exists</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Views Check */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Views</h3>
            <div className="grid gap-2">
              {viewChecks.map(view => (
                <div key={view.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{view.name}</code>
                  <div className="flex items-center gap-2">
                    {view.exists ? (
                      <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Exists</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Functions Check */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Functions</h3>
            <div className="grid gap-2">
              {functionChecks.map(func => (
                <div key={func.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{func.name}()</code>
                  <div className="flex items-center gap-2">
                    {func.exists ? (
                      <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Exists</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SQL Commands */}
          {sqlCommands && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">SQL Commands for Supabase Editor</h3>
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SQL
                </Button>
              </div>
              
              {overallStatus === 'complete' ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ All campaign metrics database components are properly set up! No action needed.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-orange-200 bg-orange-50 mb-4">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      {overallStatus === 'partial' 
                        ? '⚠️ Some components are missing. Run the SQL below to complete setup.'
                        : '🚀 Database setup required. Copy and paste the SQL below into your Supabase SQL Editor.'
                      }
                    </AlertDescription>
                  </Alert>
                  
                  <Textarea
                    value={sqlCommands}
                    readOnly
                    className="font-mono text-xs"
                    rows={20}
                  />
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Copy the SQL commands above</li>
                      <li>2. Go to your Supabase Dashboard → SQL Editor</li>
                      <li>3. Create a new query and paste the SQL</li>
                      <li>4. Click "Run" to execute the migration</li>
                      <li>5. Return here and click "Re-check" to verify</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignMetricsDBVerifier;
