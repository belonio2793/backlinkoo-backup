/**
 * Platform Progress Fixer Component
 * Diagnoses and fixes platform progress tracking issues
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Settings, Wrench } from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import { supabase } from '@/integrations/supabase/client';

interface CampaignIssue {
  campaignId: string;
  campaignName: string;
  status: string;
  expectedCompleted: number;
  actualCompleted: number;
  publishedLinks: any[];
  fixed: boolean;
}

export const PlatformProgressFixer: React.FC = () => {
  const [issues, setIssues] = useState<CampaignIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const orchestrator = getOrchestrator();

  const diagnoseCampaigns = async () => {
    setLoading(true);
    try {
      console.log('🔍 Diagnosing platform progress issues...');
      
      // Get all campaigns
      const { data: campaigns, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const foundIssues: CampaignIssue[] = [];

      for (const campaign of campaigns) {
        // Get platform progress summary
        const summary = orchestrator.getCampaignStatusSummary(campaign.id);
        
        // Get published links from database
        const { data: publishedLinks } = await supabase
          .from('automation_published_links')
          .select('*')
          .eq('campaign_id', campaign.id);

        const expectedCompleted = publishedLinks?.length || 0;
        const actualCompleted = summary.platformsCompleted || 0;

        // Check for mismatch
        if (expectedCompleted > actualCompleted) {
          foundIssues.push({
            campaignId: campaign.id,
            campaignName: campaign.keywords?.[0] || campaign.name || 'Unknown',
            status: campaign.status,
            expectedCompleted,
            actualCompleted,
            publishedLinks: publishedLinks || [],
            fixed: false
          });
        }
      }

      setIssues(foundIssues);
      console.log(`🔍 Found ${foundIssues.length} campaigns with platform progress issues`);
      
    } catch (error) {
      console.error('❌ Error diagnosing campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixCampaignProgress = async (issue: CampaignIssue) => {
    try {
      console.log(`🔧 Fixing platform progress for campaign: ${issue.campaignName}`);
      
      const activePlatforms = orchestrator.getActivePlatforms();
      
      // Mark each published link's platform as completed
      for (const link of issue.publishedLinks) {
        const platform = activePlatforms.find(p => 
          p.name.toLowerCase() === link.platform.toLowerCase() ||
          p.id.toLowerCase() === link.platform.toLowerCase() ||
          (link.platform === 'telegraph' && p.id === 'telegraph')
        );
        
        if (platform) {
          console.log(`🔧 Marking ${platform.name} as completed for: ${link.published_url}`);
          orchestrator.markPlatformCompleted(issue.campaignId, platform.id, link.published_url);
        } else {
          console.warn(`⚠️ Could not find platform for: ${link.platform}`);
        }
      }
      
      // Update the issue as fixed
      setIssues(prev => prev.map(i => 
        i.campaignId === issue.campaignId 
          ? { ...i, fixed: true, actualCompleted: issue.expectedCompleted }
          : i
      ));
      
      console.log(`✅ Fixed platform progress for: ${issue.campaignName}`);
      
    } catch (error) {
      console.error(`❌ Error fixing campaign ${issue.campaignName}:`, error);
    }
  };

  const fixAllIssues = async () => {
    setFixingAll(true);
    try {
      for (const issue of issues.filter(i => !i.fixed)) {
        await fixCampaignProgress(issue);
      }
      console.log('✅ All platform progress issues fixed!');
    } catch (error) {
      console.error('❌ Error fixing all issues:', error);
    } finally {
      setFixingAll(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Platform Progress Fixer
        </CardTitle>
        <CardDescription>
          Diagnose and fix campaigns where platform progress doesn't match published links
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={diagnoseCampaigns}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Diagnosing...' : 'Diagnose Issues'}
          </Button>
          
          {issues.length > 0 && (
            <Button 
              onClick={fixAllIssues}
              disabled={fixingAll || issues.every(i => i.fixed)}
            >
              <Wrench className="w-4 h-4 mr-2" />
              {fixingAll ? 'Fixing...' : `Fix All (${issues.filter(i => !i.fixed).length})`}
            </Button>
          )}
        </div>

        {issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Found Issues ({issues.length})</h3>
            
            {issues.map((issue) => (
              <div key={issue.campaignId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={issue.status === 'completed' ? 'default' : 'secondary'}>
                      {issue.status}
                    </Badge>
                    <span className="font-medium">{issue.campaignName}</span>
                    {issue.fixed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  
                  {!issue.fixed && (
                    <Button 
                      size="sm"
                      onClick={() => fixCampaignProgress(issue)}
                      variant="outline"
                    >
                      <Wrench className="w-3 h-3 mr-1" />
                      Fix
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Progress Issue:</strong> Shows {issue.actualCompleted}/{issue.expectedCompleted} platforms completed
                  </p>
                  <p>
                    <strong>Published Links:</strong> {issue.publishedLinks.length} links in database
                  </p>
                  {issue.publishedLinks.length > 0 && (
                    <div className="mt-2">
                      <strong>Links:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {issue.publishedLinks.map((link, index) => (
                          <li key={index} className="text-xs">
                            {link.platform}: {link.published_url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {issue.fixed && (
                    <p className="text-green-600 font-medium">✅ Fixed - Progress updated</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Checking campaigns for platform progress issues...</p>
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <p className="text-gray-600">No platform progress issues found!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformProgressFixer;
