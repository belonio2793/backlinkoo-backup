import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Zap,
  Target
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';

interface FeedActivity {
  id: string;
  timestamp: Date;
  type: 'campaign_created' | 'campaign_started' | 'content_generated' | 'url_published' | 'campaign_paused' | 'campaign_resumed' | 'campaign_completed' | 'campaign_failed' | 'validation' | 'setup' | 'publishing';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  campaignId?: string;
  campaignName?: string;
  details?: {
    publishedUrl?: string;
    targetUrl?: string;
    keyword?: string;
    anchorText?: string;
    duration?: number;
    wordCount?: number;
  };
}

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampaign?: Campaign | null;
  isCreating?: boolean;
}

const FeedModal: React.FC<FeedModalProps> = ({
  isOpen,
  onClose,
  activeCampaign,
  isCreating = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (isAutoScrollEnabled && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [activities, isAutoScrollEnabled]);

  // Add new activity
  const addActivity = (activity: Omit<FeedActivity, 'id' | 'timestamp'>) => {
    const newActivity: FeedActivity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setActivities(prev => {
      const newActivities = [...prev, newActivity];
      // Keep last 50 activities
      return newActivities.slice(-50);
    });
  };

  // Initialize feed when modal opens
  useEffect(() => {
    if (isOpen && activities.length === 0) {
      addActivity({
        type: 'setup',
        level: 'info',
        message: 'Feed initialized - monitoring campaign activities'
      });
    }
  }, [isOpen]);

  // Handle campaign creation activities
  useEffect(() => {
    if (isCreating) {
      // Clear previous activities
      setActivities([]);
      
      addActivity({
        type: 'setup',
        level: 'info',
        message: 'Initializing campaign creation...'
      });

      const creationSteps = [
        { message: 'Validating campaign parameters...', delay: 1000 },
        { message: 'Setting up content generation...', delay: 2000 },
        { message: 'Preparing publishing workflow...', delay: 3000 },
        { message: 'Campaign ready to start', delay: 4000 }
      ];

      creationSteps.forEach((step, index) => {
        setTimeout(() => {
          addActivity({
            type: 'validation',
            level: 'info',
            message: step.message
          });
        }, step.delay);
      });
    }
  }, [isCreating]);

  // Handle active campaign
  useEffect(() => {
    if (activeCampaign && !isCreating) {
      addActivity({
        type: 'campaign_created',
        level: 'success',
        message: `Campaign "${activeCampaign.keywords?.[0] || activeCampaign.name}" created successfully`,
        campaignId: activeCampaign.id,
        campaignName: activeCampaign.name,
        details: {
          keyword: activeCampaign.keywords?.[0],
          targetUrl: activeCampaign.target_url,
          anchorText: activeCampaign.anchor_texts?.[0]
        }
      });

      // Simulate campaign progress
      if (activeCampaign.status === 'active') {
        const progressSteps = [
          { type: 'content_generated', message: 'AI content generated (892 words)', delay: 5000, wordCount: 892 },
          { type: 'publishing', message: 'Publishing content to Telegraph.ph', delay: 8000 },
          { type: 'url_published', message: 'Content published successfully', delay: 10000, url: `https://telegra.ph/${activeCampaign.keywords?.[0]?.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}` }
        ];

        progressSteps.forEach((step) => {
          setTimeout(() => {
            addActivity({
              type: step.type as FeedActivity['type'],
              level: 'success',
              message: step.message,
              campaignId: activeCampaign.id,
              campaignName: activeCampaign.name,
              details: {
                keyword: activeCampaign.keywords?.[0],
                targetUrl: activeCampaign.target_url,
                wordCount: step.wordCount,
                publishedUrl: step.url
              }
            });
          }, step.delay);
        });
      }
    }
  }, [activeCampaign, isCreating]);

  const getActivityIcon = (type: FeedActivity['type'], level: FeedActivity['level']) => {
    if (level === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (level === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    if (level === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;

    switch (type) {
      case 'campaign_created':
      case 'campaign_started':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'campaign_paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'content_generated':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'url_published':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'publishing':
        return <ExternalLink className="w-4 h-4 text-blue-500" />;
      case 'validation':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'setup':
        return <Zap className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActivityTypeColor = (type: FeedActivity['type']) => {
    switch (type) {
      case 'campaign_completed': return 'bg-green-100 text-green-800';
      case 'campaign_failed': return 'bg-red-100 text-red-800';
      case 'url_published': return 'bg-blue-100 text-blue-800';
      case 'content_generated': return 'bg-purple-100 text-purple-800';
      case 'campaign_paused': return 'bg-yellow-100 text-yellow-800';
      case 'validation': return 'bg-orange-100 text-orange-800';
      case 'publishing': return 'bg-blue-100 text-blue-800';
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

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  // If minimized, show as a small floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
        <Card className="w-80 shadow-xl border-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-sm font-semibold">Feed</CardTitle>
                </div>
                {activeCampaign && (
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {activeCampaign.status}
                  </Badge>
                )}
                {activities.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-100 border-green-300/30">
                    {activities.length} activities
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-7 w-7 p-0 hover:bg-white/20 text-white"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 w-7 p-0 hover:bg-white/20 text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {/* Mini activity preview */}
            {activities.length > 0 && (
              <div className="mt-2 text-xs text-blue-100">
                Latest: {activities[activities.length - 1]?.message.substring(0, 40)}...
              </div>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={isOpen && !isMinimized} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 bg-gradient-to-br from-white to-gray-50">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-xl font-semibold">Feed</CardTitle>
                </div>
                {activeCampaign && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
                      {activeCampaign.status}
                    </Badge>
                    <span className="text-sm text-blue-100">
                      {activeCampaign.keywords?.[0] || activeCampaign.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                  className={`text-xs hover:bg-white/20 ${isAutoScrollEnabled ? 'text-white' : 'text-blue-200'}`}
                >
                  Auto-scroll {isAutoScrollEnabled ? 'ON' : 'OFF'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 pb-6 px-6">
            <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time campaign activities and system events
            </div>

            <ScrollArea ref={scrollAreaRef} className="h-96 border rounded-lg bg-white shadow-inner">
              <div className="p-4 space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Activity className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2">Waiting for campaign activities...</p>
                    <p className="text-sm">Activities will appear here as your campaign progresses</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3 text-sm bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                        <div className="flex-shrink-0 mt-1 p-1 rounded-full bg-gray-50">
                          {getActivityIcon(activity.type, activity.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${getActivityTypeColor(activity.type)}`}
                            >
                              {activity.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2 font-medium leading-relaxed">{activity.message}</p>

                          {activity.details && (
                            <div className="text-xs text-gray-600 space-y-2 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-md border">
                              {activity.details.publishedUrl && (
                                <div className="flex items-center gap-2">
                                  <Link className="w-3 h-3 flex-shrink-0 text-blue-500" />
                                  <a
                                    href={activity.details.publishedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium"
                                  >
                                    {activity.details.publishedUrl}
                                  </a>
                                </div>
                              )}
                              {activity.details.wordCount && (
                                <div className="text-gray-600 flex items-center gap-2">
                                  <FileText className="w-3 h-3" />
                                  Word count: <span className="font-medium">{activity.details.wordCount}</span>
                                </div>
                              )}
                              {activity.details.keyword && (
                                <div className="text-gray-600 flex items-center gap-2">
                                  <Target className="w-3 h-3" />
                                  Keyword: <span className="font-medium">"{activity.details.keyword}"</span>
                                </div>
                              )}
                              {activity.details.targetUrl && (
                                <div className="text-gray-600 flex items-center gap-2">
                                  <Globe className="w-3 h-3" />
                                  Target: <span className="font-medium break-all">{activity.details.targetUrl}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {activity.campaignName && (
                            <div className="text-xs text-gray-500 mt-2 italic bg-gray-100 px-2 py-1 rounded inline-block">
                              Campaign: {activity.campaignName}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < activities.length - 1 && (
                        <div className="flex justify-center my-3">
                          <Separator className="w-24" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default FeedModal;
