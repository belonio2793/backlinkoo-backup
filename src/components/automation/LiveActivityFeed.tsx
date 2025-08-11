import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Link as LinkIcon,
  Eye,
  Globe,
  Zap,
  Pause,
  Play
} from 'lucide-react';
import { LiveAutomationEngine, LiveActivity, LiveLinkPlacement } from '@/services/liveAutomationEngine';

interface LiveActivityFeedProps {
  campaignId?: string;
  maxItems?: number;
  autoScroll?: boolean;
}

export function LiveActivityFeed({ 
  campaignId, 
  maxItems = 100, 
  autoScroll = true 
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [placements, setPlacements] = useState<LiveLinkPlacement[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [filter, setFilter] = useState<'all' | 'successes' | 'failures'>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to live activities
    const unsubscribe = LiveAutomationEngine.subscribeToActivity((activity) => {
      if (!campaignId || activity.campaign_id === campaignId) {
        setActivities(prev => {
          const updated = [activity, ...prev].slice(0, maxItems);
          return updated;
        });

        // Auto-scroll to bottom if enabled
        if (autoScroll && scrollAreaRef.current) {
          setTimeout(() => {
            const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          }, 100);
        }
      }
    });

    // Load recent placements
    loadRecentPlacements();

    return unsubscribe;
  }, [campaignId, maxItems, autoScroll]);

  const loadRecentPlacements = async () => {
    try {
      const recentPlacements = await LiveAutomationEngine.getRecentPlacements(20);
      setPlacements(recentPlacements);
    } catch (error) {
      console.error('Error loading recent placements:', error);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'searching':
        return <Search className="h-4 w-4 text-blue-500" />;
      case 'attempting_placement':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'placement_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'placement_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'verifying':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'searching':
        return 'border-l-blue-500 bg-blue-50';
      case 'attempting_placement':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'placement_success':
        return 'border-l-green-500 bg-green-50';
      case 'placement_failed':
        return 'border-l-red-500 bg-red-50';
      case 'verifying':
        return 'border-l-purple-500 bg-purple-50';
      case 'verified':
        return 'border-l-green-600 bg-green-100';
      default:
        return 'border-l-gray-500 bg-gray-50';
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

  const filteredActivities = activities.filter(activity => {
    if (filter === 'successes') {
      return activity.action === 'placement_success' || activity.action === 'verified';
    }
    if (filter === 'failures') {
      return activity.action === 'placement_failed';
    }
    return true;
  });

  const verifyUrl = async (url: string, targetUrl: string) => {
    try {
      // Trigger verification process
      const verification = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      console.log(`Verification attempted for ${url} → ${targetUrl}`);
      
      // Add verification activity
      const verifyActivity: LiveActivity = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        campaign_id: 'manual',
        campaign_name: 'Manual Verification',
        engine_type: 'verification',
        action: 'verifying',
        details: `Manual verification of ${url}`,
        url: url
      };
      
      setActivities(prev => [verifyActivity, ...prev]);
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Activity Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Activity className="h-5 w-5" />
                  Live Activity Stream
                </div>
              </CardTitle>
              <CardDescription>
                Real-time automation engine activity and link placements
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isLive ? 'default' : 'secondary'} className="gap-1">
                {isLive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {isLive ? 'LIVE' : 'PAUSED'}
              </Badge>
              
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Activity</option>
                <option value="successes">Successes Only</option>
                <option value="failures">Failures Only</option>
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
                  className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity.action)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {activity.campaign_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.engine_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {activity.details}
                        </p>
                        {activity.url && (
                          <a 
                            href={activity.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {activity.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
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
                  <p>No activity yet. Start a campaign to see live automation.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Live Link Placements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Live Link Placements
          </CardTitle>
          <CardDescription>
            Recently placed backlinks with verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {placements.length > 0 ? placements.map((placement) => (
              <div key={placement.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {placement.placement_type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={placement.verification_status === 'live' ? 'default' : 'secondary'}
                        className={placement.verification_status === 'live' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {placement.verification_status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(placement.placed_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <a 
                          href={placement.source_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {placement.source_domain}
                        </a>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm">"{placement.anchor_text}"</span>
                        <span className="text-xs text-gray-500">→</span>
                        <a 
                          href={placement.target_url}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-sm text-green-600 hover:underline"
                        >
                          {placement.target_url}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => verifyUrl(placement.source_url, placement.target_url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No link placements yet. Create and start campaigns to see placements.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
