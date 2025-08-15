import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Play,
  Pause,
  FileText,
  Globe,
  User,
  Zap,
  Target,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { realTimeFeedService, type RealTimeFeedEvent } from '@/services/realTimeFeedService';
import { type Campaign } from '@/services/automationOrchestrator';

interface RealTimeFeedLog {
  id: string;
  timestamp: Date;
  type: 'campaign_created' | 'campaign_started' | 'content_generated' | 'url_published' | 'campaign_paused' | 'campaign_resumed' | 'campaign_completed' | 'campaign_failed' | 'user_action' | 'system_event';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  campaignId?: string;
  campaignName?: string;
  details?: {
    publishedUrl?: string;
    targetUrl?: string;
    keyword?: string;
    anchorText?: string;
    errorMessage?: string;
    duration?: number;
    wordCount?: number;
  };
}

interface InlineFeedMonitorProps {
  activeCampaigns: Campaign[];
  isVisible: boolean;
}

const InlineFeedMonitor: React.FC<InlineFeedMonitorProps> = ({
  activeCampaigns,
  isVisible
}) => {
  const [logs, setLogs] = useState<RealTimeFeedLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScrollEnabled && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, isAutoScrollEnabled]);

  // Add new log entry
  const addLog = (log: Omit<RealTimeFeedLog, 'id' | 'timestamp'>) => {
    const newLog: RealTimeFeedLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setLogs(prev => {
      const newLogs = [...prev, newLog];
      // Keep last 50 logs for inline view
      return newLogs.slice(-50);
    });
  };

  // Subscribe to real-time feed service
  useEffect(() => {
    if (!isVisible) return;

    console.log('📡 InlineFeedMonitor: Subscribing to real-time events');

    // Subscribe to real-time feed events
    const unsubscribe = realTimeFeedService.subscribe((event: RealTimeFeedEvent) => {
      // Convert RealTimeFeedEvent to RealTimeFeedLog format
      addLog({
        type: event.type,
        level: event.level,
        message: event.message,
        campaignId: event.campaignId,
        campaignName: event.campaignName,
        details: event.details
      });
    });

    // Initial logs for active campaigns (only if we don't have history)
    if (logs.length === 0) {
      activeCampaigns.forEach(campaign => {
        addLog({
          type: 'campaign_started',
          level: 'info',
          message: `Monitoring campaign "${campaign.keywords?.[0] || campaign.name}"`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          details: {
            targetUrl: campaign.target_url,
            keyword: campaign.keywords?.[0],
            anchorText: campaign.anchor_texts?.[0]
          }
        });
      });
    }

    return () => {
      console.log('📡 InlineFeedMonitor: Unsubscribing from real-time events');
      unsubscribe();
    };
  }, [isVisible, activeCampaigns.length]);

  // Initialize with welcome message
  useEffect(() => {
    if (isVisible && logs.length === 0) {
      const timer = setTimeout(() => {
        if (logs.length === 0) {
          addLog({
            type: 'system_event',
            level: 'info',
            message: 'Live monitoring ready • Real-time updates will appear here'
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getLogIcon = (type: RealTimeFeedLog['type'], level: RealTimeFeedLog['level']) => {
    if (level === 'error') return <AlertCircle className="w-3 h-3 text-red-500" />;
    if (level === 'warning') return <AlertCircle className="w-3 h-3 text-orange-500" />;
    if (level === 'success') return <CheckCircle className="w-3 h-3 text-green-500" />;

    switch (type) {
      case 'campaign_created':
      case 'campaign_started':
        return <Play className="w-3 h-3 text-blue-500" />;
      case 'campaign_paused':
        return <Pause className="w-3 h-3 text-orange-500" />;
      case 'campaign_resumed':
        return <Play className="w-3 h-3 text-green-500" />;
      case 'content_generated':
        return <FileText className="w-3 h-3 text-purple-500" />;
      case 'url_published':
        return <Globe className="w-3 h-3 text-green-500" />;
      case 'user_action':
        return <User className="w-3 h-3 text-blue-500" />;
      case 'system_event':
        return <Zap className="w-3 h-3 text-gray-500" />;
      default:
        return <Activity className="w-3 h-3 text-blue-500" />;
    }
  };

  const getLevelBadgeColor = (level: RealTimeFeedLog['level']) => {
    switch (level) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const clearLogs = () => {
    setLogs([]);
    addLog({
      type: 'system_event',
      level: 'info',
      message: 'Feed cleared • Continuing to monitor activities'
    });
  };

  if (!isVisible) return null;

  const recentLogs = logs.slice(-10); // Show last 10 events

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-lg">Live Monitor</span>
            <Badge variant="outline" className={
              activeCampaigns.length > 0 ?
                "bg-blue-100 text-blue-700 border-blue-300" :
                "bg-gray-100 text-gray-600 border-gray-300"
            }>
              {activeCampaigns.length > 0 ?
                `${activeCampaigns.length} active` :
                'ready'
              }
            </Badge>
          </span>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-3">
          {/* Controls */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Auto-scroll</span>
                <Switch
                  checked={isAutoScrollEnabled}
                  onCheckedChange={setIsAutoScrollEnabled}
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-gray-600">Details</span>
                <Switch
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500">{logs.length} events</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-6 text-xs px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Feed Content */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {recentLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {activeCampaigns.length === 0 ? 
                      'Create a campaign to see live activity' : 
                      'Waiting for campaign events...'
                    }
                  </p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 p-2 bg-white border border-gray-100 rounded text-xs hover:border-blue-200 transition-colors">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type, log.level)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs px-1 py-0 ${getLevelBadgeColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-gray-500 font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-gray-900 leading-tight">{log.message}</p>

                      {/* Campaign Info */}
                      {log.campaignName && (
                        <div className="flex items-center gap-1 mt-1">
                          <Target className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 truncate">
                            {log.campaignName}
                          </span>
                        </div>
                      )}

                      {/* Details */}
                      {showDetails && log.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded space-y-1">
                          {log.details.publishedUrl && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-blue-500" />
                              <a
                                href={log.details.publishedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate text-xs"
                              >
                                {log.details.publishedUrl}
                              </a>
                            </div>
                          )}
                          {log.details.keyword && (
                            <div className="text-gray-600">
                              Keyword: "{log.details.keyword}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}

      {/* Minimized view */}
      {isMinimized && (
        <CardContent className="pb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Last event:</span>
              {recentLogs.length > 0 ? (
                <span className="text-gray-900 truncate">{recentLogs[recentLogs.length - 1].message}</span>
              ) : (
                <span className="text-gray-500">No events yet</span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {logs.length} total
            </Badge>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default InlineFeedMonitor;
