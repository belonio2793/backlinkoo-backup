/**
 * Database Setup Instructions Component
 * Provides clear setup instructions when database tables are missing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, ExternalLink, Database, Zap } from 'lucide-react';

interface DatabaseSetupInstructionsProps {
  missingTables: string[];
  onClose?: () => void;
}

export function DatabaseSetupInstructions({ missingTables, onClose }: DatabaseSetupInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const sqlCommand = `-- Complete Database Setup for Backlink Automation
-- Copy and paste this into your Supabase SQL Editor

-- Backlink Campaigns Table
CREATE TABLE IF NOT EXISTS backlink_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'paused', 'stopped', 'completed')) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    links_generated INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10,
    strategy_blog_comments BOOLEAN DEFAULT true,
    strategy_forum_profiles BOOLEAN DEFAULT true,
    strategy_web2_platforms BOOLEAN DEFAULT true,
    strategy_social_profiles BOOLEAN DEFAULT false,
    strategy_contact_forms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Discovered URLs Table
CREATE TABLE IF NOT EXISTS discovered_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    domain TEXT NOT NULL,
    link_type TEXT CHECK (link_type IN ('blog_comment', 'web2_platform', 'forum_profile', 'social_profile', 'guest_post', 'resource_page', 'directory_listing')) NOT NULL,
    discovered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    discovery_method TEXT DEFAULT 'recursive_crawler',
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
    status TEXT CHECK (status IN ('pending', 'verified', 'working', 'broken', 'blacklisted')) DEFAULT 'pending',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reports INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Link Opportunities Table
CREATE TABLE IF NOT EXISTS link_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT,
    link_type TEXT CHECK (link_type IN ('blog_comment', 'forum_profile', 'web2_platform', 'social_profile', 'contact_form')) NOT NULL,
    authority_score INTEGER CHECK (authority_score >= 0 AND authority_score <= 100),
    status TEXT CHECK (status IN ('pending', 'posted', 'failed', 'skipped')) DEFAULT 'pending',
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Link Posting Results Table
CREATE TABLE IF NOT EXISTS link_posting_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES link_opportunities(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    anchor_text TEXT,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    posting_metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_posting_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own campaigns" ON backlink_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view discovered URLs" ON discovered_urls FOR SELECT USING (true);
CREATE POLICY "Users can view opportunities from their campaigns" ON link_opportunities FOR SELECT USING (EXISTS (SELECT 1 FROM backlink_campaigns WHERE backlink_campaigns.id = link_opportunities.campaign_id AND backlink_campaigns.user_id = auth.uid()));

-- Sample Data
INSERT INTO discovered_urls (url, domain, link_type, domain_authority, status, upvotes, downvotes) VALUES
('https://techcrunch.com/submit-startup/', 'techcrunch.com', 'directory_listing', 95, 'verified', 15, 2),
('https://medium.com', 'medium.com', 'web2_platform', 90, 'verified', 25, 1),
('https://reddit.com/r/startups', 'reddit.com', 'social_profile', 85, 'verified', 20, 3)
ON CONFLICT (url) DO NOTHING;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL command:', err);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup Required
        </CardTitle>
        <CardDescription>
          Complete your setup in 2 minutes to unlock full automation capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Missing Tables */}
        <Alert>
          <AlertDescription>
            <strong>Missing Tables:</strong> {missingTables.map((table, idx) => (
              <Badge key={idx} variant="outline" className="ml-1">
                {table}
              </Badge>
            ))}
          </AlertDescription>
        </Alert>

        {/* Quick Setup Steps */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Setup (2 steps):
          </h4>
          
          <div className="space-y-2 pl-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Copy SQL Command</p>
                <p className="text-sm text-gray-600">Click the button below to copy the complete setup script</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Run in Supabase SQL Editor</p>
                <p className="text-sm text-gray-600">Paste and execute in your Supabase project's SQL Editor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={copyToClipboard}
            className="flex-1"
            variant={copied ? "outline" : "default"}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL Setup Command
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Supabase
          </Button>
        </div>

        {/* SQL Preview */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Preview SQL Command (Click to expand)
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <pre className="text-xs text-gray-600 overflow-x-auto max-h-40">
              {sqlCommand.substring(0, 500)}...
            </pre>
          </div>
        </details>

        {/* Need Help */}
        <Alert>
          <AlertDescription>
            <strong>Need help?</strong> Contact our support team and we'll set this up for you in minutes.{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => window.open('mailto:support@backlinkoo.com?subject=Database Setup Help', '_blank')}
            >
              support@backlinkoo.com
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
