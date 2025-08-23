/**
 * Netlify API Tester Component
 * 
 * Tests and demonstrates all Netlify API functionality for domain management
 * Based on official Netlify API endpoints
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Plus,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import NetlifyApiService, { type NetlifyApiResponse, type SiteInfo, type DNSRecord, type SSLStatus } from '@/services/netlifyApiService';
import { NetlifyDeploymentChecker } from './NetlifyDeploymentChecker';

export function NetlifyApiTester() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [sslStatus, setSSLStatus] = useState<SSLStatus | null>(null);
  const [testDomain, setTestDomain] = useState('');
  const [validationResults, setValidationResults] = useState<any>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Test API connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const setOperationLoading = (operation: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [operation]: isLoading }));
  };

  const testConnection = async () => {
    setOperationLoading('connection', true);
    try {
      const result = await NetlifyApiService.testConnection();
      setApiConnected(result.success);
      
      if (result.success) {
        toast.success('✅ Netlify API connected successfully');
        console.log('🔗 Netlify API test result:', result);
      } else {
        toast.error(`❌ Netlify API connection failed: ${result.error}`);
        console.error('🔗 Connection failed:', result);
      }
    } catch (error) {
      setApiConnected(false);
      toast.error('❌ Connection test failed');
      console.error('🔗 Test error:', error);
    } finally {
      setOperationLoading('connection', false);
    }
  };

  const loadSiteInfo = async () => {
    setOperationLoading('siteInfo', true);
    try {
      const result = await NetlifyApiService.getSiteInfo();
      
      if (result.success && result.data) {
        setSiteInfo(result.data);
        toast.success('✅ Site information loaded');
      } else {
        toast.error(`❌ Failed to load site info: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error loading site info');
      console.error('Site info error:', error);
    } finally {
      setOperationLoading('siteInfo', false);
    }
  };

  const loadDNSInfo = async () => {
    setOperationLoading('dnsInfo', true);
    try {
      const result = await NetlifyApiService.getDNSInfo();
      
      if (result.success && result.data) {
        setDnsRecords(result.data.dns_records);
        toast.success(`✅ Loaded ${result.data.record_count} DNS records`);
      } else {
        toast.error(`❌ Failed to load DNS info: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error loading DNS info');
      console.error('DNS info error:', error);
    } finally {
      setOperationLoading('dnsInfo', false);
    }
  };

  const loadSSLStatus = async () => {
    setOperationLoading('sslStatus', true);
    try {
      const result = await NetlifyApiService.getSSLStatus();
      
      if (result.success && result.data) {
        setSSLStatus(result.data);
        toast.success('✅ SSL status loaded');
      } else {
        toast.error(`❌ Failed to load SSL status: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error loading SSL status');
      console.error('SSL status error:', error);
    } finally {
      setOperationLoading('sslStatus', false);
    }
  };

  const validateDomain = async () => {
    if (!testDomain.trim()) {
      toast.error('Please enter a domain to validate');
      return;
    }

    setOperationLoading('validate', true);
    try {
      const result = await NetlifyApiService.validateDomain(testDomain);
      setValidationResults(result);
      
      if (result.success) {
        const status = result.validation?.validation_status;
        if (status === 'valid') {
          toast.success(`✅ ${testDomain} is valid and configured`);
        } else {
          toast.warning(`⚠️ ${testDomain} validation status: ${status}`);
        }
      } else {
        toast.error(`❌ Validation failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error validating domain');
      console.error('Validation error:', error);
    } finally {
      setOperationLoading('validate', false);
    }
  };

  const addDomainAlias = async () => {
    if (!testDomain.trim()) {
      toast.error('Please enter a domain to add');
      return;
    }

    setOperationLoading('addAlias', true);
    try {
      const result = await NetlifyApiService.addDomainAlias(testDomain);
      
      if (result.success) {
        if (result.message?.includes('already exists')) {
          toast.info(`ℹ️ ${testDomain} already exists as alias`);
        } else {
          toast.success(`✅ Successfully added ${testDomain} as alias`);
          // Refresh site info to show updated aliases
          await loadSiteInfo();
        }
      } else {
        toast.error(`❌ Failed to add alias: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error adding domain alias');
      console.error('Add alias error:', error);
    } finally {
      setOperationLoading('addAlias', false);
    }
  };

  const getConnectionStatus = () => {
    if (apiConnected === null) return { icon: Loader2, color: 'text-gray-500', text: 'Testing...' };
    if (apiConnected) return { icon: CheckCircle2, color: 'text-green-600', text: 'Connected' };
    return { icon: XCircle, color: 'text-red-600', text: 'Disconnected' };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-600" />
            Netlify API Tester
            <Badge variant="outline" className="ml-auto">
              <ConnectionIcon className={`h-4 w-4 mr-1 ${connectionStatus.color} ${apiConnected === null ? 'animate-spin' : ''}`} />
              {connectionStatus.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={testConnection}
              disabled={loading.connection}
              variant="outline"
              size="sm"
            >
              {loading.connection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            
            <Button
              onClick={() => window.open('https://app.netlify.com/projects/backlinkoo/domain-management', '_blank')}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Netlify Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="site" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="site">Site Info</TabsTrigger>
          <TabsTrigger value="dns">DNS Records</TabsTrigger>
          <TabsTrigger value="ssl">SSL Status</TabsTrigger>
          <TabsTrigger value="validation">Domain Validation</TabsTrigger>
          <TabsTrigger value="management">Domain Management</TabsTrigger>
        </TabsList>

        {/* Site Information */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Site Information</span>
                <Button
                  onClick={loadSiteInfo}
                  disabled={loading.siteInfo}
                  size="sm"
                >
                  {loading.siteInfo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {siteInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Site Name</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{siteInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Site ID</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{siteInfo.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Primary URL</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{siteInfo.url}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">SSL URL</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{siteInfo.ssl_url || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Custom Domain</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{siteInfo.custom_domain || 'None'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">State</label>
                      <Badge variant={siteInfo.state === 'current' ? 'default' : 'secondary'}>
                        {siteInfo.state}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Domain Aliases ({siteInfo.domain_aliases.length})</label>
                    <div className="mt-2 space-y-2">
                      {siteInfo.domain_aliases.length > 0 ? (
                        siteInfo.domain_aliases.map((alias, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">{alias}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No domain aliases configured</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Refresh" to load site information
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS Records */}
        <TabsContent value="dns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>DNS Records ({dnsRecords.length})</span>
                <Button
                  onClick={loadDNSInfo}
                  disabled={loading.dnsInfo}
                  size="sm"
                >
                  {loading.dnsInfo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dnsRecords.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dnsRecords.map((record, index) => (
                    <div key={record.id || index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="font-medium">{record.hostname}</span>
                        </div>
                        {record.managed && (
                          <Badge variant="secondary" className="text-xs">Managed</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Value:</strong> {record.value}</p>
                        <p><strong>TTL:</strong> {record.ttl}</p>
                        {record.priority && <p><strong>Priority:</strong> {record.priority}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Refresh" to load DNS records
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSL Status */}
        <TabsContent value="ssl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SSL Certificate Status</span>
                <Button
                  onClick={loadSSLStatus}
                  disabled={loading.sslStatus}
                  size="sm"
                >
                  {loading.sslStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sslStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium">Certificate State</p>
                      <Badge variant={sslStatus.state === 'issued' ? 'default' : 'secondary'}>
                        {sslStatus.state}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Covered Domains</label>
                    <div className="mt-2 space-y-1">
                      {sslStatus.domains?.map((domain, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {domain}
                        </Badge>
                      )) || <p className="text-sm text-gray-500">No domains listed</p>}
                    </div>
                  </div>
                  
                  {sslStatus.expires_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Expires</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {new Date(sslStatus.expires_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Refresh" to load SSL status
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Validation */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Domain Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter domain to validate (e.g., example.com)"
                    value={testDomain}
                    onChange={(e) => setTestDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && validateDomain()}
                  />
                  <Button
                    onClick={validateDomain}
                    disabled={loading.validate || !testDomain.trim()}
                  >
                    {loading.validate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Validate'
                    )}
                  </Button>
                </div>

                {validationResults && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-5 w-5" />
                      <span className="font-medium">{validationResults.domain}</span>
                      <Badge variant={validationResults.validation?.validation_status === 'valid' ? 'default' : 'secondary'}>
                        {validationResults.validation?.validation_status || 'unknown'}
                      </Badge>
                    </div>
                    
                    {validationResults.validation && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {validationResults.validation.domain_exists_in_netlify ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Exists in Netlify</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {validationResults.validation.is_custom_domain ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span>Custom Domain</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {validationResults.validation.is_domain_alias ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span>Domain Alias</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {validationResults.validation.ssl_configured ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>SSL Configured</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Management */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Domain Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter domain to add as alias (e.g., example.com)"
                    value={testDomain}
                    onChange={(e) => setTestDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDomainAlias()}
                  />
                  <Button
                    onClick={addDomainAlias}
                    disabled={loading.addAlias || !testDomain.trim()}
                  >
                    {loading.addAlias ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Alias
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Adding a domain alias will make your site accessible via that domain. 
                    Ensure you have proper DNS configuration pointing to Netlify.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NetlifyApiTester;
