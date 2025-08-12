import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database,
  AlertTriangle,
  Copy,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function DatabaseFix() {
  const [copied, setCopied] = useState(false);

  const sqlFix = `-- Fix missing columns in automation_campaigns table
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false NOT NULL;

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  destination_url text not null,
  keyword text not null,
  anchor_text text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create blog_urls_discovery table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_urls_discovery (
  id uuid default gen_random_uuid() primary key,
  url text not null unique,
  discovered_for text[] default '{}',
  last_tried_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Create backlinks table if it doesn't exist
CREATE TABLE IF NOT EXISTS backlinks (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  candidate_url text not null,
  anchor_text text,
  comment_text text,
  posted_at timestamptz,
  indexed_status text default 'pending',
  created_at timestamptz default now()
);

-- Create campaign_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_logs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  level text default 'info',
  message text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs (
  id bigserial primary key,
  job_type text not null,
  payload jsonb not null,
  status text not null default 'queued',
  attempts int default 0,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create successful_blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS successful_blogs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  url text not null,
  verified_at timestamptz default now(),
  proof jsonb,
  created_at timestamptz default now()
);

-- Verify tables exist
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('campaigns', 'blog_urls_discovery', 'backlinks', 'campaign_logs', 'jobs', 'successful_blogs')
ORDER BY tablename;`;

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlFix);
      setCopied(true);
      toast.success('SQL copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy SQL');
      console.error('Copy failed:', error);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertTriangle className="h-5 w-5" />
          Database Setup Required
        </CardTitle>
        <CardDescription className="text-orange-700">
          The database tables need to be created or updated for the automation system to work properly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Quick Fix Required:</p>
              <p className="text-sm">
                The automation system needs some database tables and columns to be created. 
                This is a one-time setup that takes less than a minute.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-orange-900">Setup Steps:</h4>
          <ol className="list-decimal list-inside text-sm space-y-2 text-orange-800">
            <li>Copy the SQL script below</li>
            <li>Open your Supabase SQL Editor</li>
            <li>Paste and run the SQL script</li>
            <li>Refresh this page</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={copySQL}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy SQL Script'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql', '_blank')}
            className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase SQL Editor
          </Button>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-orange-900 hover:text-orange-700">
            Show SQL Script
          </summary>
          <div className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-auto max-h-64">
            <pre>{sqlFix}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export default DatabaseFix;
