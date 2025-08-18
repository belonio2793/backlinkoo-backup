import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PublishedLink {
  id: string;
  campaign_id: string;
  published_url: string;
  platform: string;
  title?: string;
  status: string;
  published_at: string;
}

interface Campaign {
  id: string;
  keyword: string;
  status: string;
  automation_published_links?: PublishedLink[];
}

export default function PublishedLinksDebugger() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [directLinks, setDirectLinks] = useState<PublishedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const debugPublishedLinks = async () => {
    setLoading(true);
    try {
      // Test the exact query used by getCampaignWithLinks
      const { data: campaignData, error: campaignError } = await supabase
        .from('automation_campaigns')
        .select(`
          *,
          automation_published_links(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (campaignError) {
        console.error('Campaign query error:', campaignError);
        return;
      }

      setCampaigns(campaignData || []);

      // Also get direct links
      const { data: linkData, error: linkError } = await supabase
        .from('automation_published_links')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (linkError) {
        console.error('Direct links query error:', linkError);
        return;
      }

      setDirectLinks(linkData || []);

    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignLinks = (campaignId: string) => {
    return directLinks.filter(link => link.campaign_id === campaignId);
  };

  useEffect(() => {
    debugPublishedLinks();
  }, []);

  const platformCounts = directLinks.reduce((acc, link) => {
    const platform = link.platform || 'unknown';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const writeAsLinks = directLinks.filter(link => {
    const platform = (link.platform || '').toLowerCase();
    return platform.includes('write') || platform === 'writeas' || platform === 'write.as';
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Published Links Debugger</CardTitle>
          <Button onClick={debugPublishedLinks} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold">Total Campaigns</h3>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold">Total Published Links</h3>
              <p className="text-2xl font-bold">{directLinks.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold">Write.as Links</h3>
              <p className="text-2xl font-bold">{writeAsLinks.length}</p>
            </div>
          </div>

          {/* Platform Distribution */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Platform Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(platformCounts).map(([platform, count]) => (
                <div key={platform} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="font-medium">"{platform}"</div>
                  <div className="text-gray-600">{count} links</div>
                </div>
              ))}
            </div>
          </div>

          {/* Write.as Links Details */}
          {writeAsLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Write.as Links Found</h3>
              <div className="space-y-2">
                {writeAsLinks.map((link, index) => (
                  <div key={link.id} className="bg-yellow-50 p-3 rounded text-sm">
                    <div><strong>Platform:</strong> "{link.platform}"</div>
                    <div><strong>URL:</strong> <a href={link.published_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.published_url}</a></div>
                    <div><strong>Campaign:</strong> {link.campaign_id.substring(0, 8)}...</div>
                    <div><strong>Date:</strong> {new Date(link.published_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Campaigns with Links</h3>
            <div className="space-y-4">
              {campaigns.filter(c => c.automation_published_links && c.automation_published_links.length > 0).map((campaign) => {
                const directLinksForCampaign = getCampaignLinks(campaign.id);
                const hasDiscrepancy = campaign.automation_published_links!.length !== directLinksForCampaign.length;

                return (
                  <div key={campaign.id} className={`border rounded p-4 ${hasDiscrepancy ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">"{campaign.keyword}"</h4>
                        <p className="text-sm text-gray-600">Campaign ID: {campaign.id.substring(0, 8)}...</p>
                        <p className="text-sm text-gray-600">Status: {campaign.status}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCampaignId(selectedCampaignId === campaign.id ? '' : campaign.id)}
                      >
                        {selectedCampaignId === campaign.id ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Via getCampaignWithLinks:</strong> {campaign.automation_published_links?.length || 0} links
                      </div>
                      <div>
                        <strong>Via direct query:</strong> {directLinksForCampaign.length} links
                      </div>
                    </div>

                    {hasDiscrepancy && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                        ⚠️ <strong>Data Discrepancy Detected!</strong> Different counts between join query and direct query.
                      </div>
                    )}

                    {selectedCampaignId === campaign.id && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <h5 className="font-medium mb-2">Links from getCampaignWithLinks:</h5>
                          {campaign.automation_published_links?.map((link, index) => (
                            <div key={link.id} className="ml-4 text-sm bg-blue-50 p-2 rounded mb-1">
                              <div><strong>Platform:</strong> "{link.platform}"</div>
                              <div><strong>URL:</strong> {link.published_url}</div>
                              <div><strong>Status:</strong> {link.status}</div>
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2">Links from direct query:</h5>
                          {directLinksForCampaign.map((link, index) => (
                            <div key={link.id} className="ml-4 text-sm bg-green-50 p-2 rounded mb-1">
                              <div><strong>Platform:</strong> "{link.platform}"</div>
                              <div><strong>URL:</strong> {link.published_url}</div>
                              <div><strong>Status:</strong> {link.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
