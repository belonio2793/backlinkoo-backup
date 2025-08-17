import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ExternalLink,
  Copy,
  Link as LinkIcon,
  CheckCircle,
  Globe,
  RefreshCw
} from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PublishedLink {
  id: string;
  published_url: string;
  platform: string;
  published_at: string;
  campaign_id: string;
  target_url?: string;
  keyword?: string;
  anchor_text?: string;
}

const PublishedLinksDisplay = () => {
  const [links, setLinks] = useState<PublishedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPublishedLinks();

      // Set up real-time subscription for published links
      const interval = setInterval(() => {
        loadPublishedLinks();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPublishedLinks = async () => {
    try {
      setLoading(true);
      const orchestrator = getOrchestrator();
      const campaigns = await orchestrator.getUserCampaigns();

      console.log('📊 Debug: Loading published links...');
      console.log('📊 Debug: Found campaigns:', campaigns.length);

      // Extract all published links from campaigns
      const allLinks: PublishedLink[] = [];
      campaigns.forEach((campaign, index) => {
        console.log(`📊 Debug: Campaign ${index + 1}:`, {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          published_links_count: campaign.automation_published_links?.length || 0,
          published_links: campaign.automation_published_links
        });

        if (campaign.automation_published_links) {
          campaign.automation_published_links.forEach(link => {
            allLinks.push({
              ...link,
              campaign_id: campaign.id,
              target_url: campaign.target_url,
              keyword: campaign.keywords?.[0] || campaign.name,
              anchor_text: campaign.anchor_text
            });
          });
        }
      });

      console.log('📊 Debug: Total links extracted:', allLinks.length);
      console.log('📊 Debug: Links data:', allLinks);

      // Sort by published date (newest first)
      allLinks.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      setLinks(allLinks);
    } catch (error) {
      console.error('❌ Error loading published links:', error);
      toast({
        title: "Error Loading Links",
        description: `Failed to load published links: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyAllUrls = () => {
    const allUrls = links.map(link => link.published_url).join('\n');
    copyToClipboard(allUrls);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Published Backlinks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium text-gray-900 mb-2">Sign In to View Published Links</h3>
          <p className="text-sm text-gray-500">
            Create an account or sign in to view your published backlinks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Published Backlinks
            <Badge variant="outline" className="ml-2">
              {links.length} Total
            </Badge>
          </CardTitle>
          {links.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPublishedLinks()}
                className="text-xs"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyAllUrls}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading published links...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 mb-2">No Published Links Yet</h3>
            <p className="text-sm text-gray-500">
              Links will appear here after your campaigns publish content
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={link.platform === 'telegraph' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {link.platform === 'telegraph' ? 'Telegraph.ph' : link.platform}
                        </Badge>
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Published" />
                      </div>
                      
                      {link.keyword && (
                        <p className="font-medium text-gray-900 mb-1 text-sm">
                          {link.keyword}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Published {formatDate(link.published_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(link.published_url)}
                        title="Copy URL"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.published_url, '_blank')}
                        title="Open Link"
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* URL Display */}
                  <div className="bg-white rounded border p-3">
                    <div className="flex items-center justify-between">
                      <a
                        href={link.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-mono flex-1 truncate transition-colors"
                        title={link.published_url}
                      >
                        {link.published_url}
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(link.published_url, '_blank')}
                        className="ml-3 h-7 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(link.anchor_text || link.target_url) && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      {link.anchor_text && (
                        <div>
                          <span className="font-medium">Anchor:</span> {link.anchor_text}
                        </div>
                      )}
                      {link.target_url && (
                        <div>
                          <span className="font-medium">Target:</span> {link.target_url}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishedLinksDisplay;
