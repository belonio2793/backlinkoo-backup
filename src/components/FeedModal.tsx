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
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-2 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <CardTitle className="text-sm">Feed</CardTitle>
                {activeCampaign && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={isOpen && !isMinimized} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <CardTitle className="text-xl">Feed</CardTitle>
                </div>
                {activeCampaign && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {activeCampaign.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
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
                  className={`text-xs ${isAutoScrollEnabled ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  Auto-scroll {isAutoScrollEnabled ? 'ON' : 'OFF'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0"
                >
                  <Minimize2 className="h-4 w-4" />
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
          </CardHeader>
          
          <CardContent className="pt-0 pb-4">
            <div className="text-sm text-gray-600 mb-4">
              Real-time campaign activities and system events
            </div>

            <ScrollArea ref={scrollAreaRef} className="h-96 border rounded-lg bg-gray-50">
              <div className="p-4 space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for campaign activities...</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type, activity.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getActivityTypeColor(activity.type)}`}
                            >
                              {activity.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2 font-medium">{activity.message}</p>
                          
                          {activity.details && (
                            <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                              {activity.details.publishedUrl && (
                                <div className="flex items-center gap-2">
                                  <Link className="w-3 h-3 flex-shrink-0" />
                                  <a 
                                    href={activity.details.publishedUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {activity.details.publishedUrl}
                                  </a>
                                </div>
                              )}
                              {activity.details.wordCount && (
                                <div className="text-gray-500">
                                  Word count: {activity.details.wordCount}
                                </div>
                              )}
                              {activity.details.keyword && (
                                <div className="text-gray-500">
                                  Keyword: "{activity.details.keyword}"
                                </div>
                              )}
                              {activity.details.targetUrl && (
                                <div className="text-gray-500">
                                  Target: {activity.details.targetUrl}
                                </div>
                              )}
                            </div>
                          )}

                          {activity.campaignName && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              Campaign: {activity.campaignName}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < activities.length - 1 && (
                        <Separator className="my-2" />
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
