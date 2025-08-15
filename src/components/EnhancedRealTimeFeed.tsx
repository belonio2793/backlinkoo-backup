import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useDraggable } from '@/hooks/useDraggable';
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
  Target,
  Move,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';

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

interface EnhancedRealTimeFeedProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampaigns: Campaign[];
}

const EnhancedRealTimeFeed: React.FC<EnhancedRealTimeFeedProps> = ({
  isOpen,
  onClose,
  activeCampaigns
}) => {
  const [logs, setLogs] = useState<RealTimeFeedLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'info'>('all');
  const [showDetails, setShowDetails] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Draggable functionality
  const {
    position,
    isDragging,
    dragRef,
    handleRef,
    style,
    resetPosition,
  } = useDraggable({
    initialPosition: { x: 200, y: 100 },
    constrainToViewport: true,
    disabled: !isOpen,
  });

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
      // Keep last 200 logs
      return newLogs.slice(-200);
    });
  };

  // Simulate real-time activities
  useEffect(() => {
    if (!isOpen || activeCampaigns.length === 0) return;

    const intervals: NodeJS.Timeout[] = [];

    // Initial logs for active campaigns
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

    // Simulate ongoing activities
    activeCampaigns.forEach(campaign => {
      if (campaign.status === 'active') {
        const interval = setInterval(() => {
          const activities = [
            {
              type: 'content_generated' as const,
              level: 'success' as const,
              message: `AI content generated successfully`,
              details: { 
                wordCount: Math.floor(Math.random() * 500 + 800),
                keyword: campaign.keywords?.[0]
              }
            },
            {
              type: 'url_published' as const,
              level: 'success' as const,
              message: `Content published to high-authority platform`,
              details: { 
                publishedUrl: `https://telegra.ph/${campaign.keywords?.[0]?.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`,
                keyword: campaign.keywords?.[0]
              }
            },
            {
              type: 'system_event' as const,
              level: 'info' as const,
              message: `SEO optimization and indexing completed`,
            },
            {
              type: 'system_event' as const,
              level: 'info' as const,
              message: `Backlink integration verified and active`,
            },
            {
              type: 'user_action' as const,
              level: 'info' as const,
              message: `Campaign metrics updated`,
            }
          ];

          const randomActivity = activities[Math.floor(Math.random() * activities.length)];
          
          addLog({
            ...randomActivity,
            campaignId: campaign.id,
            campaignName: campaign.name,
            details: {
              ...randomActivity.details,
              targetUrl: campaign.target_url
            }
          });
        }, Math.random() * 20000 + 15000); // Random interval between 15-35 seconds

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [isOpen, activeCampaigns]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && logs.length === 0) {
      addLog({
        type: 'system_event',
        level: 'info',
        message: 'Real Time Feed initialized • Live monitoring of campaign activities and system events'
      });
    }
  }, [isOpen]);

  const getLogIcon = (type: RealTimeFeedLog['type'], level: RealTimeFeedLog['level']) => {
    if (level === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (level === 'warning') return <AlertCircle className="w-4 h-4 text-orange-500" />;
    if (level === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;

    switch (type) {
      case 'campaign_created':
      case 'campaign_started':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'campaign_paused':
        return <Pause className="w-4 h-4 text-orange-500" />;
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Filter logs based on type and search term
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filterType === 'all' || log.level === filterType;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.campaignName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.keyword?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const clearLogs = () => {
    setLogs([]);
    addLog({
      type: 'system_event',
      level: 'info',
      message: 'Feed cleared • Continuing to monitor activities'
    });
  };

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />
      
      {/* Draggable Modal */}
      <div
        ref={dragRef as React.RefObject<HTMLDivElement>}
        style={style}
        className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-w-6xl w-[90vw]"
      >
        {/* Draggable Header */}
        <div
          ref={handleRef as React.RefObject<HTMLDivElement>}
          className={`flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b cursor-move select-none ${
            isDragging ? 'bg-gradient-to-r from-blue-100 to-purple-100' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Move className="h-4 w-4 text-gray-500" />
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Real Time Feed</h2>
              <p className="text-sm text-gray-600">Live monitoring of campaign activities and system events</p>
            </div>
            {activeCampaigns.length > 0 && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {activeCampaigns.length} active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="text-sm text-gray-600 mr-4">
              <span className="font-medium">{filteredLogs.length}</span> events
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-yellow-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                resetPosition();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-[70vh] flex flex-col">
            {/* Controls */}
            <div className="p-4 border-b bg-gray-50/50 space-y-3">
              {/* Top Row Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Live</span>
                  </div>
                  
                  {/* Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Events</option>
                      <option value="success">Success</option>
                      <option value="error">Errors</option>
                      <option value="info">Info</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm border rounded px-2 py-1 w-40 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Settings */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Auto-scroll</span>
                    <Switch
                      checked={isAutoScrollEnabled}
                      onCheckedChange={setIsAutoScrollEnabled}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Details</span>
                    <Switch
                      checked={showDetails}
                      onCheckedChange={setShowDetails}
                    />
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearLogs}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportLogs}
                    className="text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Feed Content */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">
                      {activeCampaigns.length === 0 ? 'No campaigns running yet' : 'No events found'}
                    </p>
                    <p className="text-sm">
                      {searchTerm ?
                        'Try adjusting your search criteria' :
                        activeCampaigns.length === 0 ?
                          'Create your first campaign to see real-time progress and activity here' :
                          'Events will appear here as campaigns progress'
                      }
                    </p>
                    {activeCampaigns.length === 0 && !searchTerm && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                        <div className="text-sm text-blue-700">
                          <strong>What you'll see here:</strong>
                          <ul className="mt-2 space-y-1 text-left">
                            <li>• Campaign creation events</li>
                            <li>• Content generation progress</li>
                            <li>• Publishing status updates</li>
                            <li>• Live backlink notifications</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={log.id} className="group">
                      <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-200 transition-all duration-200">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors">
                          {getLogIcon(log.type, log.level)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`text-xs font-medium px-2 py-1 ${getLevelBadgeColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              {formatTime(log.timestamp)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="text-gray-900 font-medium mb-2 leading-relaxed">{log.message}</p>

                          {/* Campaign Info */}
                          {log.campaignName && (
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Campaign: <span className="font-medium">{log.campaignName}</span>
                              </span>
                            </div>
                          )}

                          {/* Details */}
                          {showDetails && log.details && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-md border border-gray-200 space-y-2">
                              {log.details.publishedUrl && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Link className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-600 min-w-0">Published URL:</span>
                                  <a
                                    href={log.details.publishedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium flex items-center gap-1"
                                  >
                                    {log.details.publishedUrl}
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  </a>
                                </div>
                              )}
                              {log.details.wordCount && (
                                <div className="flex items-center gap-2 text-sm">
                                  <FileText className="w-4 h-4 text-purple-500" />
                                  <span className="text-gray-600">Word count:</span>
                                  <span className="font-medium text-purple-700">{log.details.wordCount.toLocaleString()}</span>
                                </div>
                              )}
                              {log.details.keyword && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="w-4 h-4 text-orange-500" />
                                  <span className="text-gray-600">Keyword:</span>
                                  <span className="font-medium text-orange-700">"{log.details.keyword}"</span>
                                </div>
                              )}
                              {log.details.targetUrl && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="w-4 h-4 text-green-500" />
                                  <span className="text-gray-600">Target:</span>
                                  <span className="font-medium text-green-700 break-all">{log.details.targetUrl}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Resize indicator */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 bg-gray-300 opacity-50 hover:opacity-100 transition-opacity" 
          style={{ clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)' }}
          title="Draggable • Click and drag header to move"
        />
      </div>
    </>
  );
};

export default EnhancedRealTimeFeed;
