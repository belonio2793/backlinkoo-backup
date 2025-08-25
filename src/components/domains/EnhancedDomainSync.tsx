import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Globe, Loader2, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import { DomainSyncService, type SyncResult, type NetlifySiteInfo } from '@/services/domainSyncService';

interface EnhancedDomainSyncProps {
  onSyncComplete?: () => void;
}

interface SyncOverview {
  total: number;
  inSync: number;
  needsSync: number;
  hasErrors: number;
  lastSync: string | null;
}

const EnhancedDomainSync: React.FC<EnhancedDomainSyncProps> = ({ onSyncComplete }) => {
  const { user } = useAuthState();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [siteInfo, setSiteInfo] = useState<NetlifySiteInfo | null>(null);
  const [syncOverview, setSyncOverview] = useState<SyncOverview | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    if (user) {
      loadSyncOverview();
      testConnection();
    }
  }, [user]);

  const loadSyncOverview = async () => {
    if (!user?.id) return;

    try {
      const overview = await DomainSyncService.getDomainSyncOverview(user.id);
      setSyncOverview(overview);
    } catch (error: any) {
      console.error('Failed to load sync overview:', error);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await DomainSyncService.testNetlifyConfiguration();
      
      if (result.success) {
        setConnectionStatus('connected');
        setSiteInfo(result.siteInfo || null);
      } else {
        setConnectionStatus('error');
        console.error('Netlify connection test failed:', result.error);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      console.error('Connection test error:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const performBidirectionalSync = async () => {
    if (!user?.id) return;

    setLoading(true);
    setSyncResult(null);
    
    try {
      const result = await DomainSyncService.performBidirectionalSync(user.id);
      setSyncResult(result);
      
      if (result.success) {
        toast.success('🔄 Sync completed successfully!');
        await loadSyncOverview();
        onSyncComplete?.();
      } else {
        toast.error(`Sync failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
      setSyncResult({
        success: false,
        message: error.message,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatusIcon = () => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (connectionStatus === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    if (connectionStatus === 'connected') return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Globe className="h-5 w-5 text-gray-400" />;
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-600">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Connection Error</Badge>;
      default:
        return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  const calculateSyncProgress = (): number => {
    if (!syncOverview || syncOverview.total === 0) return 100;
    return Math.round((syncOverview.inSync / syncOverview.total) * 100);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Please sign in to manage domain sync.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSyncStatusIcon()}
            Netlify Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {getConnectionStatusBadge()}
                  {siteInfo && (
                    <span className="text-sm text-gray-600">
                      Site: {siteInfo.name}
                    </span>
                  )}
                </div>
                {siteInfo && (
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {siteInfo.id} • URL: {siteInfo.url}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>

            {connectionStatus === 'error' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cannot connect to Netlify. Please check your environment variables:
                  <br />• NETLIFY_ACCESS_TOKEN
                  <br />• NETLIFY_SITE_ID
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Overview */}
      {syncOverview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sync Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Progress</span>
                <span className="text-sm text-gray-600">
                  {syncOverview.inSync} of {syncOverview.total} domains synced
                </span>
              </div>
              
              <Progress value={calculateSyncProgress()} className="h-2" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{syncOverview.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{syncOverview.inSync}</div>
                  <div className="text-xs text-gray-500">In Sync</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{syncOverview.needsSync}</div>
                  <div className="text-xs text-gray-500">Needs Sync</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{syncOverview.hasErrors}</div>
                  <div className="text-xs text-gray-500">Errors</div>
                </div>
              </div>

              {syncOverview.lastSync && (
                <div className="text-xs text-gray-500 text-center">
                  Last sync: {new Date(syncOverview.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Bidirectional Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                Bidirectional sync keeps your Supabase domains table and Netlify domain aliases in perfect sync.
                This will add missing domains from Netlify to Supabase and update status for existing domains.
              </AlertDescription>
            </Alert>

            <Button
              onClick={performBidirectionalSync}
              disabled={loading || connectionStatus === 'error'}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Syncing...' : 'Start Bidirectional Sync'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={syncResult.success ? 'default' : 'destructive'}>
                      {syncResult.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {syncResult.message}
                  </div>
                  {syncResult.error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{syncResult.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-4">
                {syncResult.details && (
                  <div className="space-y-4">
                    {syncResult.details.added.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Added Domains</h4>
                        <ul className="text-sm space-y-1">
                          {syncResult.details.added.map(domain => (
                            <li key={domain} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {domain}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {syncResult.details.updated.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">Updated Domains</h4>
                        <ul className="text-sm space-y-1">
                          {syncResult.details.updated.map(domain => (
                            <li key={domain} className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3 text-blue-500" />
                              {domain}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {syncResult.details.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Errors</h4>
                        <ul className="text-sm space-y-1">
                          {syncResult.details.errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Object.values(syncResult.details).every(arr => arr.length === 0) && (
                      <div className="text-center text-gray-500 py-4">
                        No changes were needed - all domains are already in sync!
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedDomainSync;
