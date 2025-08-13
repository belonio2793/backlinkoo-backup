import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Loader2,
  Bug
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { diagnoseDatabaseTables, formatDiagnosticReport } from '@/utils/backlinkDatabaseDiagnostic';

export function BacklinkDatabaseSetup() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [tableStatus, setTableStatus] = useState<{
    backlink_campaigns: boolean;
    backlink_posts: boolean;
  }>({
    backlink_campaigns: false,
    backlink_posts: false
  });
  const [diagnosticReport, setDiagnosticReport] = useState<string>('');

  const checkDatabaseTables = async () => {
    setIsChecking(true);

    try {
      // Check backlink_campaigns table with schema validation
      const { error: campaignsError } = await supabase
        .from('backlink_campaigns')
        .select('id, name, target_url, keyword, anchor_text, target_platform, status')
        .limit(1);

      // Check backlink_posts table
      const { error: postsError } = await supabase
        .from('backlink_posts')
        .select('count')
        .limit(1);

      setTableStatus({
        backlink_campaigns: !campaignsError,
        backlink_posts: !postsError
      });

      const allTablesExist = !campaignsError && !postsError;

      if (allTablesExist) {
        toast.success('All database tables are properly set up!');
      } else {
        if (campaignsError?.message?.includes('boolean')) {
          toast.error('Database schema conflict detected! Please run diagnostic for details.');
        } else {
          toast.error('Some database tables are missing. Please run the SQL setup.');
        }
      }

    } catch (error) {
      console.error('Error checking database:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const runDatabaseDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnosticReport('');

    try {
      const diagnostic = await diagnoseDatabaseTables();
      const report = formatDiagnosticReport(diagnostic);
      setDiagnosticReport(report);

      if (diagnostic.hasConflicts) {
        toast.error('Database conflicts detected! Check the diagnostic report.');
      } else if (!diagnostic.backlink_campaigns.exists) {
        toast.warning('Backlink campaigns table missing. Run the SQL setup.');
      } else {
        toast.success('Database diagnostic completed successfully.');
      }

    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Failed to run database diagnostic');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const setupSQL = `-- Backlink Automation Database Setup
-- IMPORTANT: This will resolve conflicts with existing automation_campaigns table
-- Run this in your Supabase SQL Editor

-- First, drop any conflicting policies if they exist
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON backlink_campaigns;
DROP POLICY IF EXISTS "Users can manage their own posts" ON backlink_posts;

-- Recreate backlink_campaigns table with proper schema
DROP TABLE IF EXISTS backlink_campaigns CASCADE;
CREATE TABLE backlink_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  anchor_text text not null,
  target_platform text not null,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recreate backlink_posts table
DROP TABLE IF EXISTS backlink_posts CASCADE;
CREATE TABLE backlink_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  campaign_id uuid references backlink_campaigns(id) on delete cascade,
  target_platform text not null,
  post_url text not null,
  live_url text,
  comment_content text not null,
  domain text not null,
  post_title text,
  status text not null check (status in ('posted', 'failed', 'pending')),
  posted_at timestamptz default now(),
  created_at timestamptz default now(),
  UNIQUE(campaign_id, post_url)
);

-- Enable Row Level Security
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own campaigns" ON backlink_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts" ON backlink_posts
  FOR ALL USING (auth.uid() = user_id);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_user_id ON backlink_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_status ON backlink_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_backlink_posts_user_id ON backlink_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_posts_campaign_id ON backlink_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_backlink_posts_status ON backlink_posts(status);`;

  const copySetupSQL = async () => {
    try {
      await navigator.clipboard.writeText(setupSQL);
      toast.success('Database setup SQL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy SQL');
    }
  };

  const allTablesExist = tableStatus.backlink_campaigns && tableStatus.backlink_posts;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle className="text-blue-900">Database Setup Required</CardTitle>
            <CardDescription className="text-blue-700">
              Set up the required database tables for backlink automation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Check */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={checkDatabaseTables} disabled={isChecking} variant="outline">
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Check Database Status
          </Button>

          <Button onClick={runDatabaseDiagnostic} disabled={isDiagnosing} variant="outline">
            {isDiagnosing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            Run Diagnostic
          </Button>

          {(tableStatus.backlink_campaigns || tableStatus.backlink_posts) && (
            <div className="flex items-center gap-2">
              <Badge variant={allTablesExist ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {allTablesExist ? 'All Tables Ready' : 'Partial Setup'}
              </Badge>
            </div>
          )}
        </div>

        {/* Table Status */}
        {(tableStatus.backlink_campaigns || tableStatus.backlink_posts) && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${tableStatus.backlink_campaigns ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {tableStatus.backlink_campaigns ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${tableStatus.backlink_campaigns ? 'text-green-900' : 'text-red-900'}`}>
                  backlink_campaigns
                </span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${tableStatus.backlink_posts ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {tableStatus.backlink_posts ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${tableStatus.backlink_posts ? 'text-green-900' : 'text-red-900'}`}>
                  backlink_posts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!allTablesExist && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some required database tables are missing. Please run the SQL setup script in your Supabase dashboard.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={copySetupSQL} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy SQL Setup Script
              </Button>
              <Button variant="outline" asChild>
                <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase SQL Editor
                </a>
              </Button>
            </div>
          </>
        )}

        {/* Diagnostic Report */}
        {diagnosticReport && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bug className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <details>
                <summary className="cursor-pointer font-medium text-blue-900 mb-2">
                  🔍 Database Diagnostic Report (Click to expand)
                </summary>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64 whitespace-pre-wrap">
                  {diagnosticReport}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        {allTablesExist && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ All database tables are properly configured! You can now use the backlink automation system.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
