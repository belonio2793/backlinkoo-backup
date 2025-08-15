import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info,
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  FileText, 
  Globe, 
  Target,
  ExternalLink,
  Copy,
  AlertTriangle,
  Settings,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Timer,
  Cpu,
  Database,
  Network,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';
import { CampaignProgress, ProgressStep } from './CampaignProgressTracker';
import { campaignNetworkLogger, NetworkRequest, DatabaseQuery } from '@/services/campaignNetworkLogger';

interface CampaignLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  step: string;
  message: string;
  details?: any;
  duration?: number;
}

interface DetailedCampaignInfo {
  campaign: Campaign;
  progress?: CampaignProgress;
  logs: CampaignLog[];
  publishedLinks: Array<{
    id: string;
    url: string;
    platform: string;
    publishedAt: string;
    status: string;
  }>;
  metrics: {
    totalDuration: number;
    contentGenerationTime: number;
    publishingTime: number;
    retryCount: number;
    errorCount: number;
  };
}

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

export function CampaignDetailsModal({ isOpen, onClose, campaignId }: CampaignDetailsModalProps) {
  const [campaignInfo, setCampaignInfo] = useState<DetailedCampaignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const orchestrator = getOrchestrator();

  useEffect(() => {
    if (isOpen && campaignId) {
      loadCampaignDetails();
    }
  }, [isOpen, campaignId]);

  const loadCampaignDetails = async () => {
    setLoading(true);
    try {
      // Get campaign basic info
      const campaign = await orchestrator.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get campaign progress
      const progress = orchestrator.getCampaignProgress(campaignId);

      // Get campaign logs (mock for now, would integrate with actual logging system)
      const logs = await generateCampaignLogs(campaign, progress);

      // Get published links
      const campaignWithLinks = await orchestrator.getCampaignWithLinks(campaignId);
      const publishedLinks = campaignWithLinks?.automation_published_links.map(link => ({
        id: link.id,
        url: link.published_url,
        platform: link.platform,
        publishedAt: link.published_at,
        status: 'active'
      })) || [];

      // Calculate metrics
      const metrics = calculateCampaignMetrics(logs, progress);

      setCampaignInfo({
        campaign,
        progress,
        logs,
        publishedLinks,
        metrics
      });
    } catch (error) {
      console.error('Error loading campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaignDetails();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Campaign details updated",
    });
  };

  const generateCampaignLogs = async (campaign: Campaign, progress?: CampaignProgress): Promise<CampaignLog[]> => {
    const logs: CampaignLog[] = [];
    
    // Campaign creation
    logs.push({
      id: '1',
      timestamp: new Date(campaign.created_at),
      level: 'success',
      step: 'initialization',
      message: 'Campaign created successfully',
      details: {
        targetUrl: campaign.target_url,
        keywords: campaign.keywords,
        anchorTexts: campaign.anchor_texts
      }
    });

    // Add progress-based logs
    if (progress) {
      progress.steps.forEach((step, index) => {
        if (step.status !== 'pending') {
          logs.push({
            id: `step-${index}`,
            timestamp: step.timestamp || new Date(campaign.created_at),
            level: step.status === 'error' ? 'error' : step.status === 'completed' ? 'success' : 'info',
            step: step.id,
            message: step.status === 'error' ? step.details || 'Step failed' : step.description,
            details: step.data
          });
        }
      });
    }

    // Add system logs based on campaign status
    if (campaign.status === 'paused' && campaign.error_message) {
      logs.push({
        id: 'error-pause',
        timestamp: new Date(campaign.updated_at),
        level: 'error',
        step: 'execution',
        message: 'Campaign paused due to error',
        details: { error: campaign.error_message }
      });
    }

    if (campaign.status === 'completed') {
      logs.push({
        id: 'completion',
        timestamp: new Date(campaign.completed_at || campaign.updated_at),
        level: 'success',
        step: 'completion',
        message: 'Campaign completed successfully',
        details: { publishedUrls: progress?.publishedUrls }
      });
    }

    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const calculateCampaignMetrics = (logs: CampaignLog[], progress?: CampaignProgress) => {
    const startTime = new Date(logs[0]?.timestamp || Date.now());
    const endTime = progress?.endTime || new Date();
    
    return {
      totalDuration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
      contentGenerationTime: 45, // Mock - would calculate from actual logs
      publishingTime: 12, // Mock - would calculate from actual logs
      retryCount: logs.filter(log => log.message.includes('retry')).length,
      errorCount: logs.filter(log => log.level === 'error').length
    };
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Campaign Details
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {campaignInfo?.campaign?.keywords?.[0] || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {campaignInfo?.campaign && (
                <Badge 
                  variant={
                    campaignInfo.campaign.status === 'completed' ? 'default' :
                    campaignInfo.campaign.status === 'active' ? 'secondary' :
                    campaignInfo.campaign.status === 'paused' ? 'destructive' : 'outline'
                  }
                >
                  {campaignInfo.campaign.status}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading campaign details...</p>
          </div>
        ) : campaignInfo ? (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 grid grid-cols-4 w-fit">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-6 pb-6">
                  <TabsContent value="overview" className="mt-4 space-y-4">
                    {/* Campaign Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Campaign Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Target URL</label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {campaignInfo.campaign.target_url}
                              </code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaignInfo.campaign.target_url)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Keywords</label>
                            <div className="mt-1">
                              {campaignInfo.campaign.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="mr-1">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Anchor Texts</label>
                            <div className="mt-1">
                              {campaignInfo.campaign.anchor_texts.map((anchor, index) => (
                                <Badge key={index} variant="outline" className="mr-1">
                                  {anchor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-sm mt-1">
                              {new Date(campaignInfo.campaign.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Published Links */}
                    {campaignInfo.publishedLinks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Published Links ({campaignInfo.publishedLinks.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {campaignInfo.publishedLinks.map((link) => (
                              <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{link.platform}</Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(link.publishedAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm font-mono truncate block"
                                  >
                                    {link.url}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link.url)}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => window.open(link.url, '_blank')}>
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="progress" className="mt-4 space-y-4">
                    {campaignInfo.progress ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Campaign Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium">Overall Progress</span>
                              <span className="text-sm text-gray-500">
                                {campaignInfo.progress.currentStep} of {campaignInfo.progress.steps.length} steps
                              </span>
                            </div>
                            <Progress 
                              value={(campaignInfo.progress.currentStep / campaignInfo.progress.steps.length) * 100} 
                              className="mb-6"
                            />
                            
                            <div className="space-y-3">
                              {campaignInfo.progress.steps.map((step, index) => (
                                <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                  <div className="mt-1">
                                    {getStepIcon(step)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">{step.title}</h4>
                                      {step.timestamp && (
                                        <span className="text-xs text-gray-500">
                                          {step.timestamp.toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                    {step.details && (
                                      <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                                    )}
                                    {step.data && (
                                      <details className="mt-2">
                                        <summary className="text-xs text-blue-600 cursor-pointer">View Data</summary>
                                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                          {JSON.stringify(step.data, null, 2)}
                                        </pre>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No detailed progress information available for this campaign.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="logs" className="mt-4 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Campaign Logs ({campaignInfo.logs.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {campaignInfo.logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                              <div className="mt-1">
                                {getLogIcon(log.level)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {log.step}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {log.timestamp.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm mt-1">{log.message}</p>
                                {log.details && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-blue-600 cursor-pointer">View Details</summary>
                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Timer className="w-4 h-4" />
                            Performance Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatDuration(campaignInfo.metrics.totalDuration)}
                              </div>
                              <div className="text-sm text-gray-600">Total Duration</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {formatDuration(campaignInfo.metrics.contentGenerationTime)}
                              </div>
                              <div className="text-sm text-gray-600">Content Generation</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {formatDuration(campaignInfo.metrics.publishingTime)}
                              </div>
                              <div className="text-sm text-gray-600">Publishing Time</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-600">
                                {campaignInfo.publishedLinks.length}
                              </div>
                              <div className="text-sm text-gray-600">Links Published</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-4 h-4" />
                            System Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">
                                {campaignInfo.metrics.retryCount}
                              </div>
                              <div className="text-sm text-gray-600">Retries</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {campaignInfo.metrics.errorCount}
                              </div>
                              <div className="text-sm text-gray-600">Errors</div>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 rounded-lg">
                              <div className="text-2xl font-bold text-indigo-600">
                                {campaignInfo.campaign.status === 'completed' ? '100%' : 
                                 campaignInfo.progress ? `${Math.round((campaignInfo.progress.currentStep / campaignInfo.progress.steps.length) * 100)}%` : '0%'}
                              </div>
                              <div className="text-sm text-gray-600">Completion</div>
                            </div>
                            <div className="text-center p-3 bg-teal-50 rounded-lg">
                              <div className="text-2xl font-bold text-teal-600">
                                {campaignInfo.campaign.status === 'active' ? 'Live' : 'Offline'}
                              </div>
                              <div className="text-sm text-gray-600">Status</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p>Failed to load campaign details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
