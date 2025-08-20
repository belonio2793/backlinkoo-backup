import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Globe,
  Settings,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  Terminal,
  Zap,
  Key,
  CloudUpload
} from 'lucide-react';
import { toast } from 'sonner';
import { netlifyDomainService } from '@/services/netlifyDomainService';

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

interface NetlifyControlPanelProps {
  domain: Domain;
  onDomainUpdate: (domainId: string, updates: Partial<Domain>) => void;
  onRefresh: () => void;
}

interface NetlifyConfig {
  accessToken: string;
  siteId: string;
  isConfigured: boolean;
  lastTested?: string;
  testResult?: any;
}

export const NetlifyControlPanel: React.FC<NetlifyControlPanelProps> = ({
  domain,
  onDomainUpdate,
  onRefresh
}) => {
  const [config, setConfig] = useState<NetlifyConfig>({
    accessToken: import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || '',
    siteId: import.meta.env.VITE_NETLIFY_SITE_ID || '',
    isConfigured: false
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<any>(null);

  // Check configuration on mount
  useEffect(() => {
    const isConfigured = !!(config.accessToken && config.siteId);
    setConfig(prev => ({ ...prev, isConfigured }));
    
    if (isConfigured) {
      setDnsInstructions(netlifyDomainService.getDNSInstructions(domain.domain));
    }
  }, [config.accessToken, config.siteId, domain.domain]);

  // Test Netlify connection
  const testConnection = async () => {
    setTesting(true);
    try {
      toast.info('Testing Netlify API connection...');
      
      const result = await netlifyDomainService.testConnection();
      
      if (result.success) {
        toast.success('✅ Netlify API connection successful!');
        setConfig(prev => ({
          ...prev,
          lastTested: new Date().toISOString(),
          testResult: result.data
        }));
      } else {
        toast.error(`❌ Netlify API test failed: ${result.error}`);
        setConfig(prev => ({
          ...prev,
          lastTested: new Date().toISOString(),
          testResult: { error: result.error }
        }));
      }
    } catch (error: any) {
      toast.error(`Failed to test connection: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Push domain to Netlify
  const pushToNetlify = async () => {
    if (!config.isConfigured) {
      toast.error('Please configure Netlify API credentials first');
      setShowConfig(true);
      return;
    }

    setPushing(true);
    try {
      toast.info(`🚀 Pushing ${domain.domain} to Netlify...`);

      // Add domain to Netlify
      const result = await netlifyDomainService.addDomain(domain.domain);

      if (result.success) {
        toast.success(`✅ Domain ${domain.domain} added to Netlify successfully!`);
        
        // Update domain in local state
        onDomainUpdate(domain.id, {
          netlify_id: result.data?.id,
          netlify_synced: true,
          hosting_provider: 'netlify',
          status: 'validating' as const
        });

        // Show DNS instructions
        setDnsInstructions(netlifyDomainService.getDNSInstructions(domain.domain));
        
        // Refresh domains list
        onRefresh();
      } else {
        toast.error(`❌ Failed to add domain to Netlify: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Failed to push domain: ${error.message}`);
    } finally {
      setPushing(false);
    }
  };

  // Remove domain from Netlify
  const removeFromNetlify = async () => {
    if (!confirm(`Remove ${domain.domain} from Netlify? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await netlifyDomainService.removeDomain(domain.domain);

      if (result.success) {
        toast.success(`✅ Domain ${domain.domain} removed from Netlify`);
        
        onDomainUpdate(domain.id, {
          netlify_id: undefined,
          netlify_synced: false,
          hosting_provider: undefined,
          ssl_enabled: false
        });
        
        onRefresh();
      } else {
        toast.error(`Failed to remove domain: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enable SSL for domain
  const enableSSL = async () => {
    setLoading(true);
    try {
      const result = await netlifyDomainService.enableSSL(domain.domain);

      if (result.success) {
        toast.success(`✅ SSL enabled for ${domain.domain}`);
        onDomainUpdate(domain.id, { ssl_enabled: true });
        onRefresh();
      } else {
        toast.error(`Failed to enable SSL: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Failed to enable SSL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy DNS instructions
  const copyDNSInstructions = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Trigger deploy
  const triggerDeploy = async () => {
    setLoading(true);
    try {
      const result = await netlifyDomainService.triggerDeploy();

      if (result.success) {
        toast.success('✅ Deploy triggered successfully');
      } else {
        toast.error(`Failed to trigger deploy: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Failed to trigger deploy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Netlify Control Panel
          <Badge variant={config.isConfigured ? "default" : "secondary"}>
            {config.isConfigured ? "Configured" : "Setup Required"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage {domain.domain} on your Netlify account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="dns">DNS Setup</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Netlify Status</Label>
                <div className="flex items-center gap-2">
                  {domain.netlify_synced ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Synced
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not Synced
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">SSL Status</Label>
                <div className="flex items-center gap-2">
                  {domain.ssl_enabled ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {config.testResult && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Site:</strong> {config.testResult.siteName}</div>
                    <div><strong>URL:</strong> {config.testResult.siteUrl}</div>
                    <div><strong>State:</strong> {config.testResult.state}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-4">
            <div className="space-y-4">
              {!domain.netlify_synced ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Domain not yet added to Netlify. Push it to your account to begin.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={pushToNetlify}
                    disabled={!config.isConfigured || pushing}
                    className="w-full"
                  >
                    {pushing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4 mr-2" />
                    )}
                    Push to Netlify
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Domain is configured on Netlify
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={enableSSL}
                      disabled={loading || domain.ssl_enabled}
                      variant="outline"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {domain.ssl_enabled ? 'SSL Enabled' : 'Enable SSL'}
                    </Button>

                    <Button
                      onClick={triggerDeploy}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Deploy
                    </Button>
                  </div>

                  <Button
                    onClick={removeFromNetlify}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Remove from Netlify
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* DNS Setup Tab */}
          <TabsContent value="dns" className="space-y-4">
            {dnsInstructions ? (
              <div className="space-y-4">
                <Alert>
                  <Terminal className="w-4 h-4" />
                  <AlertDescription>
                    Configure these DNS records at your domain registrar:
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-mono">A Record</Label>
                        <div className="text-sm text-gray-600">@ ��� {dnsInstructions.aRecord}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyDNSInstructions(`@ A ${dnsInstructions.aRecord}`)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-mono">CNAME Record</Label>
                        <div className="text-sm text-gray-600">www → {dnsInstructions.cnameRecord}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyDNSInstructions(`www CNAME ${dnsInstructions.cnameRecord}`)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {dnsInstructions.txtRecord && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-mono">TXT Record</Label>
                          <div className="text-sm text-gray-600 break-all">@ → {dnsInstructions.txtRecord}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyDNSInstructions(`@ TXT "${dnsInstructions.txtRecord}"`)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    DNS changes can take up to 24 hours to propagate globally.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Configure Netlify API credentials to see DNS instructions.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="netlify-token">Netlify Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="netlify-token"
                    type="password"
                    placeholder="Enter your Netlify access token"
                    value={config.accessToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://app.netlify.com/user/applications#personal-access-tokens', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="netlify-site-id">Netlify Site ID</Label>
                <Input
                  id="netlify-site-id"
                  placeholder="Enter your Netlify site ID"
                  value={config.siteId}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteId: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testConnection}
                  disabled={!config.isConfigured || testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>

              <Alert>
                <Key className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>1. Get your access token from Netlify dashboard</div>
                    <div>2. Find your site ID in site settings</div>
                    <div>3. Test connection before deploying</div>
                  </div>
                </AlertDescription>
              </Alert>

              {config.lastTested && (
                <div className="text-xs text-gray-500">
                  Last tested: {new Date(config.lastTested).toLocaleString()}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NetlifyControlPanel;
