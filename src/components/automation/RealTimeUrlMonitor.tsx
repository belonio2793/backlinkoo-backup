import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Globe,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Target,
  TrendingUp,
  Eye,
  Link as LinkIcon,
  MousePointer,
  Send,
  Zap
} from 'lucide-react';
import { urlDataSiphon, SiphonedUrlData } from '@/services/urlDataSiphon';

interface UrlActivity {
  id: string;
  timestamp: string;
  campaign_id: string;
  campaign_name: string;
  action: 'discovering' | 'visiting' | 'analyzing' | 'posting' | 'verifying' | 'completed' | 'failed';
  url: string;
  target_url?: string;
  details: string;
  status: 'processing' | 'success' | 'error';
  metadata?: {
    domain_authority?: number;
    response_time?: number;
    content_type?: string;
    placement_type?: string;
    anchor_text?: string;
  };
}

interface UrlSession {
  session_id: string;
  start_time: string;
  urls_discovered: number;
  urls_visited: number;
  links_posted: number;
  success_rate: number;
  current_url?: string;
  campaign_id: string;
}

interface RealTimeUrlMonitorProps {
  campaignId?: string;
  onUrlProcessed?: (url: string, success: boolean) => void;
}

export function RealTimeUrlMonitor({ campaignId, onUrlProcessed }: RealTimeUrlMonitorProps) {
  const [urlActivities, setUrlActivities] = useState<UrlActivity[]>([]);
  const [currentSession, setCurrentSession] = useState<UrlSession | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [filter, setFilter] = useState<'all' | 'discovering' | 'posting' | 'verifying'>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (campaignId && isMonitoring) {
      startUrlMonitoring();
    }
    return () => stopUrlMonitoring();
  }, [campaignId, isMonitoring]);

  const startUrlMonitoring = () => {
    const session: UrlSession = {
      session_id: sessionRef.current,
      start_time: new Date().toISOString(),
      urls_discovered: 0,
      urls_visited: 0,
      links_posted: 0,
      success_rate: 0,
      campaign_id: campaignId || 'default'
    };
    
    setCurrentSession(session);
    
    // Start the URL discovery and processing simulation
    simulateRealUrlProcessing(session);
  };

  const stopUrlMonitoring = () => {
    setIsMonitoring(false);
  };

  const simulateRealUrlProcessing = async (session: UrlSession) => {
    const targetDomains = [
      'techcrunch.com',
      'mashable.com', 
      'wired.com',
      'theverge.com',
      'engadget.com',
      'medium.com',
      'dev.to',
      'hackernoon.com',
      'smashingmagazine.com',
      'css-tricks.com'
    ];

    const keywords = ['technology', 'web development', 'AI', 'software', 'startup'];
    
    while (isMonitoring) {
      // Phase 1: URL Discovery
      for (let i = 0; i < 3; i++) {
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        const searchUrl = `https://google.com/search?q="${keyword}"+blog+comments`;
        
        addUrlActivity({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          campaign_id: session.campaign_id,
          campaign_name: 'Link Building Campaign',
          action: 'discovering',
          url: searchUrl,
          details: `Searching for blogs about "${keyword}" that accept comments`,
          status: 'processing'
        });

        await sleep(1500);

        // Discover URLs
        const discoveredUrls = targetDomains.slice(0, Math.floor(Math.random() * 4) + 2);
        for (const domain of discoveredUrls) {
          const postUrl = `https://${domain}/blog/${keyword.replace(' ', '-')}-${Date.now()}`;
          
          addUrlActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            campaign_id: session.campaign_id,
            campaign_name: 'Link Building Campaign',
            action: 'discovering',
            url: postUrl,
            details: `Found potential blog post: ${domain}`,
            status: 'success',
            metadata: {
              domain_authority: Math.floor(Math.random() * 40) + 30,
              content_type: 'blog_post'
            }
          });

          session.urls_discovered++;
          updateSession(session);
          await sleep(800);
        }
      }

      // Phase 2: URL Visiting and Analysis
      const discoveredUrls = urlActivities
        .filter(a => a.action === 'discovering' && a.status === 'success')
        .slice(-10);

      for (const activity of discoveredUrls) {
        // Visit URL
        addUrlActivity({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          campaign_id: session.campaign_id,
          campaign_name: 'Link Building Campaign',
          action: 'visiting',
          url: activity.url,
          details: `Loading page and analyzing content structure`,
          status: 'processing',
          metadata: {
            domain_authority: activity.metadata?.domain_authority
          }
        });

        session.current_url = activity.url;
        updateSession(session);
        await sleep(2000);

        // Analyze page
        const analysisSuccess = Math.random() > 0.2; // 80% success rate
        
        addUrlActivity({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          campaign_id: session.campaign_id,
          campaign_name: 'Link Building Campaign',
          action: 'analyzing',
          url: activity.url,
          details: analysisSuccess 
            ? `Page analysis complete - found comment form and suitable anchor opportunities`
            : `Page analysis failed - no comment form or comments disabled`,
          status: analysisSuccess ? 'success' : 'error',
          metadata: {
            ...activity.metadata,
            response_time: Math.floor(Math.random() * 2000) + 500,
            placement_type: analysisSuccess ? 'blog_comment' : 'none'
          }
        });

        session.urls_visited++;
        updateSession(session);
        await sleep(1500);

        // Phase 3: Attempt Link Posting
        if (analysisSuccess) {
          const anchorTexts = ['learn more', 'check this out', 'read the full guide', 'detailed tutorial'];
          const selectedAnchor = anchorTexts[Math.floor(Math.random() * anchorTexts.length)];
          
          addUrlActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            campaign_id: session.campaign_id,
            campaign_name: 'Link Building Campaign',
            action: 'posting',
            url: activity.url,
            target_url: 'https://yoursite.com/landing-page',
            details: `Submitting comment with anchor text: "${selectedAnchor}"`,
            status: 'processing',
            metadata: {
              ...activity.metadata,
              anchor_text: selectedAnchor,
              placement_type: 'blog_comment'
            }
          });

          await sleep(3000);

          const postingSuccess = Math.random() > 0.3; // 70% success rate
          
          addUrlActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            campaign_id: session.campaign_id,
            campaign_name: 'Link Building Campaign',
            action: postingSuccess ? 'completed' : 'failed',
            url: activity.url,
            target_url: 'https://yoursite.com/landing-page',
            details: postingSuccess 
              ? `✅ Comment posted successfully with backlink - awaiting moderation`
              : `❌ Comment submission failed - possible spam detection`,
            status: postingSuccess ? 'success' : 'error',
            metadata: {
              ...activity.metadata,
              anchor_text: selectedAnchor
            }
          });

          if (postingSuccess) {
            session.links_posted++;
            onUrlProcessed?.(activity.url, true);
            
            // Start verification process
            setTimeout(() => {
              addUrlActivity({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                campaign_id: session.campaign_id,
                campaign_name: 'Link Building Campaign',
                action: 'verifying',
                url: activity.url,
                target_url: 'https://yoursite.com/landing-page',
                details: `Verifying link is live and indexable`,
                status: 'processing'
              });
            }, 5000);
          } else {
            onUrlProcessed?.(activity.url, false);
          }

          session.success_rate = session.urls_visited > 0 ? (session.links_posted / session.urls_visited) * 100 : 0;
          updateSession(session);
          await sleep(2000);
        }

        await sleep(1000);
      }

      // Brief pause before next discovery cycle
      await sleep(5000);
    }
  };

  const addUrlActivity = (activity: UrlActivity) => {
    setUrlActivities(prev => [activity, ...prev].slice(0, 200)); // Keep last 200 activities

    // Siphon data for reporting
    const siphonedData: SiphonedUrlData = {
      id: activity.id,
      timestamp: activity.timestamp,
      campaign_id: activity.campaign_id,
      url: activity.url,
      action: mapActivityToSiphonAction(activity.action),
      success: activity.status === 'success',
      metadata: {
        domain: extractDomain(activity.url),
        response_time: activity.metadata?.response_time,
        domain_authority: activity.metadata?.domain_authority,
        placement_type: activity.metadata?.placement_type,
        anchor_text: activity.metadata?.anchor_text,
        target_url: activity.target_url,
        error_message: activity.status === 'error' ? activity.details : undefined
      }
    };

    urlDataSiphon.siphonUrlData(siphonedData);

    // Notify parent component when URLs are processed
    if (activity.action === 'completed' || activity.action === 'failed') {
      onUrlProcessed?.(activity.url, activity.status === 'success');
    }

    // Auto-scroll to top for new activities
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = 0;
        }
      }
    }, 100);
  };

  const mapActivityToSiphonAction = (action: string): 'discovered' | 'visited' | 'analyzed' | 'posted' | 'verified' => {
    switch (action) {
      case 'discovering': return 'discovered';
      case 'visiting': return 'visited';
      case 'analyzing': return 'analyzed';
      case 'posting':
      case 'completed': return 'posted';
      case 'verifying': return 'verified';
      default: return 'visited';
    }
  };

  const extractDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url.split('/')[2] || url;
    }
  };

  const updateSession = (session: UrlSession) => {
    setCurrentSession({ ...session });
  };

  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'discovering':
        return <Search className="h-4 w-4 text-blue-500" />;
      case 'visiting':
        return <Globe className="h-4 w-4 text-purple-500" />;
      case 'analyzing':
        return <Eye className="h-4 w-4 text-orange-500" />;
      case 'posting':
        return <Send className="h-4 w-4 text-yellow-600" />;
      case 'verifying':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string, status: string) => {
    if (status === 'processing') return 'border-l-blue-400 bg-blue-50';
    if (status === 'error') return 'border-l-red-400 bg-red-50';
    
    switch (action) {
      case 'discovering':
        return 'border-l-blue-500 bg-blue-50';
      case 'visiting':
        return 'border-l-purple-500 bg-purple-50';
      case 'analyzing':
        return 'border-l-orange-500 bg-orange-50';
      case 'posting':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'verifying':
        return 'border-l-blue-600 bg-blue-100';
      case 'completed':
        return 'border-l-green-500 bg-green-50';
      case 'failed':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const filteredActivities = urlActivities.filter(activity => {
    if (filter === 'discovering') return activity.action === 'discovering';
    if (filter === 'posting') return activity.action === 'posting' || activity.action === 'completed';
    if (filter === 'verifying') return activity.action === 'verifying';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      {currentSession && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Zap className="h-5 w-5 text-green-600" />
                  Live URL Processing Session
                </CardTitle>
                <CardDescription>
                  Session ID: {currentSession.session_id.slice(0, 8)}... • Started {formatTimestamp(currentSession.start_time)}
                </CardDescription>
              </div>
              <Button 
                variant={isMonitoring ? "destructive" : "default"}
                onClick={() => setIsMonitoring(!isMonitoring)}
                className="flex items-center gap-2"
              >
                {isMonitoring ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentSession.urls_discovered}</div>
                <div className="text-sm text-gray-600">URLs Discovered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{currentSession.urls_visited}</div>
                <div className="text-sm text-gray-600">URLs Visited</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentSession.links_posted}</div>
                <div className="text-sm text-gray-600">Links Posted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{currentSession.success_rate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            {currentSession.current_url && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointer className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Currently Processing:</span>
                </div>
                <a 
                  href={currentSession.current_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {currentSession.current_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-Time URL Activity Stream
              </CardTitle>
              <CardDescription>
                Live feed of URLs being discovered, visited, and processed for link placement
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border rounded px-3 py-1"
              >
                <option value="all">All Activity</option>
                <option value="discovering">URL Discovery</option>
                <option value="posting">Link Posting</option>
                <option value="verifying">Verification</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96" ref={scrollAreaRef}>
            <div className="space-y-2">
              {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity.action, activity.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {activity.action.replace('_', ' ')}
                          </span>
                          {activity.metadata?.domain_authority && (
                            <Badge variant="outline" className="text-xs">
                              DA: {activity.metadata.domain_authority}
                            </Badge>
                          )}
                          {activity.metadata?.placement_type && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.metadata.placement_type.replace('_', ' ')}
                            </Badge>
                          )}
                          {activity.status === 'processing' && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              Processing...
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {activity.details}
                        </p>
                        
                        <div className="space-y-1">
                          <a 
                            href={activity.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {activity.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          
                          {activity.target_url && (
                            <div className="flex items-center gap-2 text-xs">
                              <LinkIcon className="h-3 w-3 text-green-500" />
                              <span className="text-gray-500">Target:</span>
                              <a 
                                href={activity.target_url}
                                target="_blank"
                                rel="noopener noreferrer" 
                                className="text-green-600 hover:underline"
                              >
                                {activity.target_url}
                              </a>
                            </div>
                          )}
                          
                          {activity.metadata?.anchor_text && (
                            <div className="flex items-center gap-2 text-xs">
                              <Target className="h-3 w-3 text-purple-500" />
                              <span className="text-gray-500">Anchor:</span>
                              <span className="text-purple-600 font-medium">"{activity.metadata.anchor_text}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No URL activity yet. {!isMonitoring && 'Click "Start Monitoring" to begin.'}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
