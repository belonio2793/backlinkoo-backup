import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Play,
  Pause,
  FileText,
  Link,
  Globe,
  User,
  Zap
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';
import { realTimeFeedService, type RealTimeFeedEvent } from '@/services/realTimeFeedService';

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

interface RealTimeFeedModalProps {
  isVisible: boolean;
  activeCampaigns: Campaign[];
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

const RealTimeFeedModal: React.FC<RealTimeFeedModalProps> = ({
  isVisible,
  activeCampaigns,
  onClose,
  onMinimize,
  isMinimized
}) => {
  const [logs, setLogs] = useState<RealTimeFeedLog[]>([]);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const orchestrator = getOrchestrator();

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
      // Keep last 100 logs
      return newLogs.slice(-100);
    });
  };

  // Monitor active campaigns
  useEffect(() => {
    activeCampaigns.forEach(campaign => {
      addLog({
        type: 'campaign_started',
        level: 'info',
        message: `Monitoring campaign "${campaign.keywords?.[0] || 'Unknown'}"`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        details: {
          targetUrl: campaign.target_url,
          keyword: campaign.keywords?.[0],
          anchorText: campaign.anchor_texts?.[0]
        }
      });
    });
  }, [activeCampaigns]);

  // Simulate real-time campaign activities
  useEffect(() => {
    if (activeCampaigns.length === 0) return;

    const intervals: NodeJS.Timeout[] = [];

    activeCampaigns.forEach(campaign => {
      // Simulate campaign progress
      if (campaign.status === 'active') {
        const interval = setInterval(() => {
          const activities = [
            {
              type: 'content_generated' as const,
              level: 'success' as const,
              message: `AI content generated (${Math.floor(Math.random() * 500 + 800)} words)`,
              details: { wordCount: Math.floor(Math.random() * 500 + 800) }
            },
            {
              type: 'url_published' as const,
              level: 'success' as const,
              message: `Content published to Telegraph.ph`,
              details: { 
                publishedUrl: `https://telegra.ph/${campaign.keywords?.[0]?.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`
              }
            },
            {
              type: 'system_event' as const,
              level: 'info' as const,
              message: `SEO optimization completed`,
            },
            {
              type: 'system_event' as const,
              level: 'info' as const,
              message: `Backlink integration verified`,
            }
          ];

          const randomActivity = activities[Math.floor(Math.random() * activities.length)];
          
          addLog({
            ...randomActivity,
            campaignId: campaign.id,
            campaignName: campaign.name,
            details: {
              ...randomActivity.details,
              keyword: campaign.keywords?.[0],
              targetUrl: campaign.target_url
            }
          });
        }, Math.random() * 15000 + 10000); // Random interval between 10-25 seconds

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [activeCampaigns]);

  // Subscribe to real-time feed service
  useEffect(() => {
    if (!isVisible) return;

    console.log('📡 RealTimeFeedModal: Subscribing to real-time events');

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

    return () => {
      console.log('📡 RealTimeFeedModal: Unsubscribing from real-time events');
      unsubscribe();
    };
  }, [isVisible]);

  // Add initial welcome log
  useEffect(() => {
    if (isVisible && logs.length === 0) {
      setTimeout(() => {
        if (logs.length === 0) {
          addLog({
            type: 'system_event',
            level: 'info',
            message: 'Real Time Feed initialized - monitoring campaign activities'
          });
        }
      }, 500);
    }
  }, [isVisible]);

  const getLogIcon = (type: RealTimeFeedLog['type'], level: RealTimeFeedLog['level']) => {
    if (level === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (level === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    if (level === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;

    switch (type) {
      case 'campaign_created':
      case 'campaign_started':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'campaign_paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'campaign_resumed':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'content_generated':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'url_published':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'user_action':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'system_event':
        return <Zap className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogTypeColor = (type: RealTimeFeedLog['type']) => {
    switch (type) {
      case 'campaign_completed': return 'bg-green-100 text-green-800';
      case 'campaign_failed': return 'bg-red-100 text-red-800';
      case 'url_published': return 'bg-blue-100 text-blue-800';
      case 'content_generated': return 'bg-purple-100 text-purple-800';
      case 'campaign_paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (!isVisible) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMinimized 
        ? 'bottom-4 right-4 w-80 h-16' 
        : 'bottom-4 right-4 w-96 h-[600px] max-h-[80vh]'
    }`}>
      <Card className="h-full shadow-2xl border-2 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Real Time Feed</CardTitle>
              {activeCampaigns.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {activeCampaigns.length} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isMinimized && (
            <CardDescription className="text-sm">
              Live monitoring of campaign activities and system events
            </CardDescription>
          )}
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="pt-0 pb-4 h-[calc(100%-120px)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                className={`text-xs ${isAutoScrollEnabled ? 'text-blue-600' : 'text-gray-400'}`}
              >
                Auto-scroll {isAutoScrollEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>

            <ScrollArea ref={scrollAreaRef} className="h-full border rounded-lg bg-gray-50">
              <div className="p-3 space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for campaign activities...</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={log.id}>
                      <div className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getLogIcon(log.type, log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getLogTypeColor(log.type)}`}
                            >
                              {log.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-1">{log.message}</p>
                          
                          {log.details && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {log.details.publishedUrl && (
                                <div className="flex items-center gap-1">
                                  <Link className="w-3 h-3" />
                                  <a 
                                    href={log.details.publishedUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {log.details.publishedUrl}
                                  </a>
                                </div>
                              )}
                              {log.details.wordCount && (
                                <div className="text-gray-500">
                                  Word count: {log.details.wordCount}
                                </div>
                              )}
                              {log.details.keyword && (
                                <div className="text-gray-500">
                                  Keyword: "{log.details.keyword}"
                                </div>
                              )}
                            </div>
                          )}

                          {log.campaignName && (
                            <div className="text-xs text-gray-500 mt-1">
                              Campaign: {log.campaignName}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < logs.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default RealTimeFeedModal;
