import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Chrome, 
  Play, 
  Pause, 
  Square, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  MemoryStick,
  RefreshCw,
  Loader2,
  Eye,
  Settings
} from 'lucide-react';
import { browserPoolManager, BrowserPoolStats, CampaignBrowserInstance } from '@/services/automationEngine/BrowserPoolManager';
import { toast } from 'sonner';

export function BrowserPoolMonitor() {
  const [stats, setStats] = useState<BrowserPoolStats>({
    totalInstances: 0,
    activeInstances: 0,
    idleInstances: 0,
    errorInstances: 0,
    totalJobsProcessed: 0,
    memoryUsage: 0
  });
  
  const [instances, setInstances] = useState<CampaignBrowserInstance[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set up status update callback
    browserPoolManager.setStatusUpdateCallback((newStats, newInstances) => {
      setStats(newStats);
      setInstances(newInstances);
    });

    // Initial load
    loadCurrentStatus();

    return () => {
      // Cleanup would go here if needed
    };
  }, []);

  const loadCurrentStatus = () => {
    const currentStats = browserPoolManager.getStats();
    const currentInstances = browserPoolManager.getAllInstances();
    setStats(currentStats);
    setInstances(currentInstances);
  };

  const startMonitoring = async () => {
    setIsLoading(true);
    try {
      await browserPoolManager.startMonitoring();
      setIsMonitoring(true);
      toast.success('Browser pool monitoring started');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      toast.error('Failed to start monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  const stopMonitoring = async () => {
    setIsLoading(true);
    try {
      await browserPoolManager.stopMonitoring();
      setIsMonitoring(false);
      toast.success('Browser pool monitoring stopped');
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      toast.error('Failed to stop monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaignBrowser = async (campaignId: string, campaignName: string) => {
    setIsLoading(true);
    try {
      await browserPoolManager.createCampaignBrowser(campaignId, campaignName);
      toast.success(`Browser instance created for ${campaignName}`);
      loadCurrentStatus();
    } catch (error: any) {
      console.error('Failed to create browser instance:', error);
      toast.error(error.message || 'Failed to create browser instance');
    } finally {
      setIsLoading(false);
    }
  };

  const startCampaignAutomation = async (campaignId: string) => {
    try {
      await browserPoolManager.startCampaignAutomation(campaignId);
      toast.success('Campaign automation started');
      loadCurrentStatus();
    } catch (error: any) {
      console.error('Failed to start automation:', error);
      toast.error(error.message || 'Failed to start automation');
    }
  };

  const pauseCampaignAutomation = async (campaignId: string) => {
    try {
      await browserPoolManager.pauseCampaignAutomation(campaignId);
      toast.success('Campaign automation paused');
      loadCurrentStatus();
    } catch (error: any) {
      console.error('Failed to pause automation:', error);
      toast.error(error.message || 'Failed to pause automation');
    }
  };

  const closeCampaignBrowser = async (campaignId: string) => {
    try {
      await browserPoolManager.closeCampaignBrowser(campaignId);
      toast.success('Browser instance closed');
      loadCurrentStatus();
    } catch (error: any) {
      console.error('Failed to close browser:', error);
      toast.error(error.message || 'Failed to close browser');
    }
  };

  const closeAllBrowsers = async () => {
    setIsLoading(true);
    try {
      await browserPoolManager.closeAllBrowsers();
      setIsMonitoring(false);
      toast.success('All browser instances closed');
      loadCurrentStatus();
    } catch (error: any) {
      console.error('Failed to close all browsers:', error);
      toast.error(error.message || 'Failed to close all browsers');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-500';
      case 'idle': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'initializing': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return Activity;
      case 'idle': return CheckCircle;
      case 'paused': return Pause;
      case 'error': return AlertTriangle;
      case 'initializing': return Clock;
      default: return Chrome;
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="space-y-6">
      {/* Pool Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Browser Pool Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of browser automation instances
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadCurrentStatus}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {!isMonitoring ? (
                <Button
                  onClick={startMonitoring}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Monitoring
                </Button>
              ) : (
                <Button
                  onClick={stopMonitoring}
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Stop Monitoring
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalInstances}</div>
              <div className="text-sm text-gray-600">Total Instances</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeInstances}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.idleInstances}</div>
              <div className="text-sm text-gray-600">Idle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errorInstances}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalJobsProcessed}</div>
              <div className="text-sm text-gray-600">Jobs Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.memoryUsage)}MB
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Instances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Browser Instances</CardTitle>
            {stats.totalInstances > 0 && (
              <Button
                onClick={closeAllBrowsers}
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                <Square className="h-4 w-4 mr-2" />
                Close All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <Chrome className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No browser instances</h3>
              <p className="text-gray-600">Browser instances will appear here when campaigns are activated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => {
                const StatusIcon = getStatusIcon(instance.status);
                const statusColor = getStatusColor(instance.status);
                
                return (
                  <Card key={instance.campaignId} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                            <h3 className="font-semibold text-lg">{instance.campaignName}</h3>
                            <Badge variant="outline" className="capitalize">
                              {instance.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4 text-gray-500" />
                              <span>Status: {instance.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-gray-500" />
                              <span>{instance.processedJobs} jobs processed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>{formatLastActivity(instance.lastActivity)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-gray-500" />
                              <span>{instance.errors.length} errors</span>
                            </div>
                          </div>

                          {instance.errors.length > 0 && (
                            <Alert className="mt-3 border-red-200 bg-red-50">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                Latest error: {instance.errors[instance.errors.length - 1]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {instance.status === 'idle' && (
                            <Button
                              size="sm"
                              onClick={() => startCampaignAutomation(instance.campaignId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {instance.status === 'working' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseCampaignAutomation(instance.campaignId)}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {instance.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => startCampaignAutomation(instance.campaignId)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => closeCampaignBrowser(instance.campaignId)}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
