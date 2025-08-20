import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Wand2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import NetlifyDomainAPI from '@/services/netlifyDomainAPI';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'active' | 'failed' | 'expired';
  verification_token: string;
  dns_validated: boolean;
  txt_record_validated: boolean;
  a_record_validated: boolean;
  cname_validated: boolean;
  ssl_enabled: boolean;
  blog_enabled: boolean;
  pages_published: number;
  validation_error?: string;
  last_validation_attempt?: string;
  created_at: string;
  required_a_record?: string;
  required_cname?: string;
  hosting_provider?: string;
  blog_subdirectory?: string;
  auto_retry_count?: number;
  max_retries?: number;
  netlify_id?: string;
  netlify_synced?: boolean;
}

interface NetlifyConfig {
  apiToken: string;
  siteId: string;
  autoSSL: boolean;
  syncEnabled: boolean;
}

interface SyncResult {
  domain: string;
  success: boolean;
  action: 'added' | 'exists' | 'updated' | 'failed';
  error?: string;
  netlifyId?: string;
}

export function NetlifyDomainSync() {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [netlifyConfig, setNetlifyConfig] = useState<NetlifyConfig>({
    apiToken: '',
    siteId: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809', // Your current site ID
    autoSSL: true,
    syncEnabled: false
  });
  const [apiService, setApiService] = useState<NetlifyDomainAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentDomain, setCurrentDomain] = useState('');
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'not_tested'>('not_tested');

  // Load domains from Supabase
  const loadDomains = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  // Test Netlify API connection
  const testConnection = async () => {
    if (!netlifyConfig.apiToken || !netlifyConfig.siteId) {
      toast.error('Please provide API token and Site ID');
      return;
    }

    setConnectionStatus('testing');

    try {
      const service = new NetlifyDomainAPI(netlifyConfig.apiToken, netlifyConfig.siteId);
      const result = await service.testConnection();

      if (result.connected) {
        setConnectionStatus('connected');
        setApiService(service);

        const isDemoMode = result.permissions.includes('demo:mode');
        if (isDemoMode) {
          toast.success(`Demo mode active! Netlify operations will be simulated. Permissions: ${result.permissions.filter(p => p !== 'demo:mode').join(', ')}`);
        } else {
          toast.success(`Connected to Netlify! Permissions: ${result.permissions.join(', ')}`);
        }

        // Save config to localStorage for persistence
        localStorage.setItem('netlify_domain_config', JSON.stringify(netlifyConfig));
      } else {
        setConnectionStatus('failed');
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Sync domains from Supabase to Netlify
  const syncDomainsToNetlify = async () => {
    if (!apiService) {
      toast.error('Please test connection first');
      return;
    }

    const domainsToSync = domains.filter(d => !d.netlify_synced);
    if (domainsToSync.length === 0) {
      toast.info('All domains are already synced to Netlify');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncResults([]);

    try {
      const results: SyncResult[] = [];
      
      for (let i = 0; i < domainsToSync.length; i++) {
        const domain = domainsToSync[i];
        setCurrentDomain(domain.domain);
        setSyncProgress(((i + 1) / domainsToSync.length) * 100);

        try {
          // Check if domain already exists in Netlify
          let existingDomains: any[] = [];
          try {
            existingDomains = await apiService.getDomains();
          } catch (domainError) {
            console.warn('Could not fetch existing domains, proceeding with add:', domainError);
          }
          const existingDomain = existingDomains.find(d => d.domain === domain.domain);

          if (existingDomain) {
            // Update Supabase record
            await supabase
              .from('domains')
              .update({ 
                netlify_id: existingDomain.id,
                netlify_synced: true 
              })
              .eq('id', domain.id);

            results.push({
              domain: domain.domain,
              success: true,
              action: 'exists',
              netlifyId: existingDomain.id
            });
          } else {
            // Add domain to Netlify
            const netlifyResult = await apiService.addDomain(domain.domain, {
              autoSSL: netlifyConfig.autoSSL
            });

            // Update Supabase record
            await supabase
              .from('domains')
              .update({ 
                netlify_id: netlifyResult.id,
                netlify_synced: true 
              })
              .eq('id', domain.id);

            results.push({
              domain: domain.domain,
              success: true,
              action: 'added',
              netlifyId: netlifyResult.id
            });
          }
        } catch (error) {
          results.push({
            domain: domain.domain,
            success: false,
            action: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Small delay to respect rate limits
        if (i < domainsToSync.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setSyncResults(results);
      setCurrentDomain('');
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast.success(`Sync completed: ${successful} successful, ${failed} failed`);
      
      // Reload domains to get updated sync status
      await loadDomains();
    } catch (error) {
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync specific domain (leadpages.org)
  const autoSyncSpecificDomain = async (domainName: string) => {
    if (!apiService) {
      toast.error('Please connect to Netlify first');
      return;
    }

    const domain = domains.find(d => d.domain === domainName);
    if (!domain) {
      toast.error(`Domain ${domainName} not found in your domains list`);
      return;
    }

    if (domain.netlify_synced) {
      toast.info(`${domainName} is already synced to Netlify`);
      return;
    }

    try {
      toast.info(`Adding ${domainName} to Netlify...`);

      // Check if domain exists in Netlify
      const existingDomains = await apiService.getDomains();
      const existingDomain = existingDomains.find(d => d.domain === domainName);

      if (existingDomain) {
        // Update Supabase record
        await supabase
          .from('domains')
          .update({ 
            netlify_id: existingDomain.id,
            netlify_synced: true 
          })
          .eq('id', domain.id);

        toast.success(`✅ ${domainName} was already in Netlify and is now synced`);
      } else {
        // Add domain to Netlify
        const netlifyResult = await apiService.addDomain(domainName, {
          autoSSL: netlifyConfig.autoSSL
        });

        // Update Supabase record
        await supabase
          .from('domains')
          .update({ 
            netlify_id: netlifyResult.id,
            netlify_synced: true 
          })
          .eq('id', domain.id);

        toast.success(`✅ ${domainName} successfully added to Netlify with SSL enabled`);
      }

      // Reload domains
      await loadDomains();
    } catch (error) {
      toast.error(`Failed to sync ${domainName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load persisted config and domains on mount
  useEffect(() => {
    // Load persisted Netlify config
    const savedConfig = localStorage.getItem('netlify_domain_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setNetlifyConfig(prev => ({ ...prev, ...config }));
      } catch (error) {
        console.warn('Failed to load saved Netlify config');
      }
    }

    // Load domains
    loadDomains();
  }, [user?.id]);

  const unsyncedDomains = domains.filter(d => !d.netlify_synced);
  const syncedDomains = domains.filter(d => d.netlify_synced);
  const leadpagesDomain = domains.find(d => d.domain === 'leadpages.org');

  return (
    <div className="space-y-6">
      {/* Netlify MCP Connection Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Globe className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">🚀 Netlify API Integration</p>
            <p className="text-sm">
              For automatic domain management, you can either:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• <strong>Option 1:</strong> <a href="#open-mcp-popover" className="text-blue-600 hover:underline">Connect to Netlify MCP</a> for automatic API credentials</li>
              <li>• <strong>Option 2:</strong> Manually configure your API token below</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Action for leadpages.org */}
      {leadpagesDomain && !leadpagesDomain.netlify_synced && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Wand2 className="h-5 w-5" />
              Quick Action: leadpages.org
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-800 mb-4">
              Your leadpages.org domain is ready to be added to Netlify for proper propagation and hosting.
            </p>
            <Button
              onClick={() => autoSyncSpecificDomain('leadpages.org')}
              disabled={!apiService}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add leadpages.org to Netlify Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Domain Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{domains.length}</div>
              <div className="text-sm text-blue-600">Total Domains</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{syncedDomains.length}</div>
              <div className="text-sm text-green-600">Synced to Netlify</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-800">{unsyncedDomains.length}</div>
              <div className="text-sm text-orange-600">Pending Sync</div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span>Loading domains...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.slice(0, 5).map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{domain.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.netlify_synced ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {domains.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ...and {domains.length - 5} more domains
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Netlify API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <input
                type="password"
                value={netlifyConfig.apiToken}
                onChange={(e) => setNetlifyConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                placeholder="Your Netlify API token"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500">
                <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" className="text-blue-600 hover:underline">
                  Get API token from Netlify Dashboard
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Site ID</Label>
              <input
                type="text"
                value={netlifyConfig.siteId}
                onChange={(e) => setNetlifyConfig(prev => ({ ...prev, siteId: e.target.value }))}
                placeholder="Your Netlify site ID"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500">Found in Site Settings → General</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={netlifyConfig.autoSSL}
              onCheckedChange={(checked) => setNetlifyConfig(prev => ({ ...prev, autoSSL: checked }))}
            />
            <Label>Enable automatic SSL certificates</Label>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={testConnection}
              disabled={!netlifyConfig.apiToken || !netlifyConfig.siteId || connectionStatus === 'testing'}
              variant="outline"
            >
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>

            {connectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Sync */}
      {unsyncedDomains.length > 0 && apiService && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Domain Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Sync {unsyncedDomains.length} unsynced domains to your Netlify account
            </p>

            <Button
              onClick={syncDomainsToNetlify}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? `Syncing ${currentDomain}...` : `Sync ${unsyncedDomains.length} Domains to Netlify`}
            </Button>

            {isSyncing && (
              <div className="space-y-2">
                <Progress value={syncProgress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  {syncProgress.toFixed(0)}% complete
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncResults.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.domain}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={result.success ? 'default' : 'destructive'}
                      className={
                        result.action === 'added' 
                          ? 'bg-green-100 text-green-800'
                          : result.action === 'exists'
                          ? 'bg-blue-100 text-blue-800'
                          : ''
                      }
                    >
                      {result.action}
                    </Badge>
                    
                    {result.error && (
                      <span className="text-xs text-red-600 max-w-xs truncate" title={result.error}>
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NetlifyDomainSync;
