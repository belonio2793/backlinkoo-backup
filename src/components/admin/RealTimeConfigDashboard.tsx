/**
 * Real-time Configuration Dashboard
 * Comprehensive view of admin settings, database sync, and global service status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseConfig, useAPIKey } from '@/hooks/useSupabaseConfig';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Cloud,
  Globe,
  Settings,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Sync,
  Eye,
  Shield,
  Key,
  Monitor,
  Activity,
  Server,
  Zap
} from 'lucide-react';
import { ModernEnvironmentVariablesManager } from './ModernEnvironmentVariablesManager';
import { TableSetupInstructions } from './TableSetupInstructions';
import { UnifiedServiceStatus } from './UnifiedServiceStatus';
import { globalOpenAI } from '@/services/globalOpenAIConfig';

interface ServiceStatus {
  name: string;
  configured: boolean;
  connected: boolean;
  healthy: boolean;
  lastCheck: string;
  details?: string;
  icon: React.ComponentType<any>;
}

export function RealTimeConfigDashboard() {
  const { 
    configs, 
    loading, 
    error, 
    syncStatus, 
    isOnline,
    refreshConfigs 
  } = useSupabaseConfig();

  const openAIKey = useAPIKey('OPENAI_API_KEY');
  const supabaseUrl = useAPIKey('VITE_SUPABASE_URL');
  const resendKey = useAPIKey('RESEND_API_KEY');

  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalConfigs: 0,
    syncedConfigs: 0,
    healthyServices: 0,
    lastSync: null as string | null
  });

  const { toast } = useToast();

  // Update real-time stats
  useEffect(() => {
    const totalConfigs = configs.length;
    const syncedConfigs = syncStatus.filter(s => s.syncStatus === 'synced').length;
    const lastSync = syncStatus.length > 0 
      ? syncStatus.reduce((latest, current) => 
          new Date(current.lastSync) > new Date(latest) ? current.lastSync : latest, 
          syncStatus[0].lastSync
        )
      : null;

    setRealTimeStats({
      totalConfigs,
      syncedConfigs,
      healthyServices: serviceStatuses.filter(s => s.healthy).length,
      lastSync
    });
  }, [configs, syncStatus, serviceStatuses]);

  // Check service statuses
  const checkServiceStatuses = async () => {
    setIsRefreshing(true);
    const statuses: ServiceStatus[] = [];

    try {
      // OpenAI Service
      const openAIConfigured = openAIKey.isConfigured;
      let openAIConnected = false;
      let openAIDetails = 'Not configured';

      if (openAIConfigured) {
        try {
          openAIConnected = await globalOpenAI.testConnection();
          openAIDetails = openAIConnected 
            ? `Health Score: ${openAIKey.healthScore}%` 
            : 'Connection failed';
        } catch (error) {
          openAIDetails = 'Test failed';
        }
      }

      statuses.push({
        name: 'OpenAI API',
        configured: openAIConfigured,
        connected: openAIConnected,
        healthy: openAIConnected && openAIKey.healthScore > 80,
        lastCheck: new Date().toISOString(),
        details: openAIDetails,
        icon: Globe
      });

      // Supabase Service
      const supabaseConfigured = supabaseUrl.isConfigured;
      statuses.push({
        name: 'Supabase Database',
        configured: supabaseConfigured,
        connected: isOnline && supabaseConfigured,
        healthy: isOnline && supabaseConfigured,
        lastCheck: new Date().toISOString(),
        details: supabaseConfigured ? 'Connected' : 'Not configured',
        icon: Database
      });

      // Resend Email Service
      const resendConfigured = resendKey.isConfigured;
      statuses.push({
        name: 'Email Service',
        configured: resendConfigured,
        connected: resendConfigured,
        healthy: resendConfigured && resendKey.healthScore > 50,
        lastCheck: new Date().toISOString(),
        details: resendConfigured 
          ? `Health Score: ${resendKey.healthScore}%`
          : 'Not configured',
        icon: Server
      });

      setServiceStatuses(statuses);

    } catch (error) {
      console.error('Failed to check service statuses:', error);
      toast({
        title: 'Status Check Failed',
        description: 'Unable to check some service statuses',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial status check and periodic updates
  useEffect(() => {
    checkServiceStatuses();
    const interval = setInterval(checkServiceStatuses, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [configs]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshConfigs(),
        checkServiceStatuses()
      ]);
      toast({
        title: 'Refreshed',
        description: 'All configurations and statuses updated'
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Some updates may have failed',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  const getOverallStatus = (): 'healthy' | 'warning' | 'error' => {
    const healthyServices = serviceStatuses.filter(s => s.healthy).length;
    const totalServices = serviceStatuses.length;
    
    if (healthyServices === totalServices && totalServices > 0) return 'healthy';
    if (healthyServices > 0) return 'warning';
    return 'error';
  };

  const getSyncProgress = () => {
    if (realTimeStats.totalConfigs === 0) return 0;
    return Math.round((realTimeStats.syncedConfigs / realTimeStats.totalConfigs) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuration Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Real-time sync with Supabase and global services
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(getOverallStatus())}
          <Button onClick={handleRefreshAll} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Configs</p>
                <p className="text-2xl font-bold">{realTimeStats.totalConfigs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Sync className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sync Progress</p>
                <p className="text-2xl font-bold">{getSyncProgress()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Healthy Services</p>
                <p className="text-2xl font-bold">{realTimeStats.healthyServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Cloud className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {realTimeStats.lastSync 
                    ? new Date(realTimeStats.lastSync).toLocaleTimeString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Setup Instructions */}
      {error && error.includes('Table needs to be created') && (
        <TableSetupInstructions />
      )}

      {/* Connection Status */}
      {error && !error.includes('Table needs to be created') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Sync Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {!isOnline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>Offline Mode:</strong> Working offline. Changes will sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Service Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Service Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceStatuses.map((service) => {
              const IconComponent = service.icon;
              const status = service.healthy ? 'healthy' : service.configured ? 'warning' : 'error';
              
              return (
                <div key={service.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{service.details}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={service.configured ? 'text-green-600' : 'text-red-600'}>
                      {service.configured ? 'Configured' : 'Not Configured'}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="variables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Environment Variables
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Sync className="h-4 w-4" />
            Sync Status
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="variables">
          <ModernEnvironmentVariablesManager />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Details</CardTitle>
            </CardHeader>
            <CardContent>
              {syncStatus.length === 0 ? (
                <p className="text-muted-foreground">No sync data available</p>
              ) : (
                <div className="space-y-3">
                  {syncStatus.map((sync) => (
                    <div key={sync.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{sync.key}</span>
                        <Badge variant={sync.syncStatus === 'synced' ? 'default' : 'destructive'}>
                          {sync.syncStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className={sync.inDatabase ? 'text-green-600' : 'text-red-600'}>
                            Database: {sync.inDatabase ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cloud className="h-3 w-3" />
                          <span className={sync.inGlobalServices ? 'text-green-600' : 'text-red-600'}>
                            Global: {sync.inGlobalServices ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Last: {new Date(sync.lastSync).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <UnifiedServiceStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
