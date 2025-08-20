import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Settings,
  Loader2,
  ExternalLink,
  Key,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import NetlifyDomainAPI from '@/services/netlifyDomainAPI';

interface NetlifyConfig {
  apiToken: string;
  siteId: string;
}

interface BulkOperationResult {
  domain: string;
  success: boolean;
  status: 'added' | 'exists' | 'failed';
  error?: string;
  netlifyId?: string;
}

export function NetlifyBulkDomainManager() {
  const [netlifyConfig, setNetlifyConfig] = useState<NetlifyConfig>({
    apiToken: '',
    siteId: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809' // Your site ID
  });
  
  const [domainList, setDomainList] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDomain, setCurrentDomain] = useState('');
  const [results, setResults] = useState<BulkOperationResult[]>([]);
  const [autoSSL, setAutoSSL] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'not_tested'>('not_tested');
  const [apiService, setApiService] = useState<NetlifyDomainAPI | null>(null);

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
        toast.success(`Connected to Netlify! Permissions: ${result.permissions.join(', ')}`);
      } else {
        setConnectionStatus('failed');
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Parse domains from text input
  const parseDomains = (text: string): string[] => {
    return text
      .split(/[\n,\s]+/)
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0)
      .filter(domain => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain));
  };

  // Process bulk domain addition
  const processBulkDomains = async () => {
    if (!apiService) {
      toast.error('Please test connection first');
      return;
    }

    const domains = parseDomains(domainList);
    if (domains.length === 0) {
      toast.error('Please enter valid domains');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const results = await apiService.bulkAddDomains(domains, {
        autoSSL,
        batchSize: 3, // Conservative batch size
        onProgress: (completed, total, current) => {
          setProgress((completed / total) * 100);
          setCurrentDomain(current);
        }
      });

      setResults(results);
      setProgress(100);
      setCurrentDomain('');

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast.success(`Bulk operation completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      toast.error(`Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export results to CSV
  const exportResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      'Domain,Status,Success,Error,Netlify ID',
      ...results.map(r => 
        `${r.domain},${r.status},${r.success},${r.error || ''},${r.netlifyId || ''}`
      )
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netlify-domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get existing domains from Netlify
  const getExistingDomains = async () => {
    if (!apiService) return;

    try {
      const domains = await apiService.getDomains();
      const domainList = domains.map(d => d.domain).join('\\n');
      
      toast.success(`Found ${domains.length} existing domains`);
      console.log('Existing Netlify domains:', domains);
    } catch (error) {
      toast.error(`Failed to fetch existing domains: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const domainCount = parseDomains(domainList).length;

  return (
    <div className="space-y-6">
      {/* Netlify API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Netlify API Configuration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure your Netlify API access for bulk domain management
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">Netlify API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={netlifyConfig.apiToken}
                onChange={(e) => setNetlifyConfig(prev => ({...prev, apiToken: e.target.value}))}
                placeholder="Enter your Netlify API token"
              />
              <p className="text-xs text-gray-500">
                Get your token from: Netlify Dashboard → User settings → Applications → Personal access tokens
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteId">Site ID</Label>
              <Input
                id="siteId"
                value={netlifyConfig.siteId}
                onChange={(e) => setNetlifyConfig(prev => ({...prev, siteId: e.target.value}))}
                placeholder="Your Netlify site ID"
              />
              <p className="text-xs text-gray-500">
                Found in: Site settings → General → Site details → Site ID
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection}
              disabled={!netlifyConfig.apiToken || !netlifyConfig.siteId || connectionStatus === 'testing'}
              className="flex items-center gap-2"
            >
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Test Connection
            </Button>

            {connectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            
            {connectionStatus === 'failed' && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            )}

            {connectionStatus === 'connected' && (
              <Button 
                variant="outline" 
                onClick={getExistingDomains}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                View Existing Domains
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Domain Addition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Domain Addition
          </CardTitle>
          <p className="text-sm text-gray-600">
            Add multiple domains to Netlify at once. Enter one domain per line or comma-separated.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domainList">Domain List</Label>
            <Textarea
              id="domainList"
              value={domainList}
              onChange={(e) => setDomainList(e.target.value)}
              placeholder="example.com
another-domain.org
blog.mysite.net

Or comma-separated: domain1.com, domain2.org, domain3.net"
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{domainCount} valid domains detected</span>
              {domainCount > 50 && (
                <span className="text-orange-600">
                  ⚠️ Large batch - consider processing in smaller groups
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoSSL"
              checked={autoSSL}
              onCheckedChange={setAutoSSL}
            />
            <Label htmlFor="autoSSL">Enable automatic SSL certificates (Let's Encrypt)</Label>
          </div>

          <Button
            onClick={processBulkDomains}
            disabled={!apiService || isProcessing || domainCount === 0}
            className="w-full flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isProcessing ? `Processing ${currentDomain}...` : `Add ${domainCount} Domains to Netlify`}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {progress.toFixed(0)}% complete {currentDomain && `- Currently processing: ${currentDomain}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Operation Results
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={exportResults}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-800">
                  {results.filter(r => r.success && r.status === 'added').length}
                </div>
                <div className="text-sm text-green-600">Successfully Added</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {results.filter(r => r.status === 'exists').length}
                </div>
                <div className="text-sm text-blue-600">Already Existed</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-800">
                  {results.filter(r => !r.success).length}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? result.status === 'added' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      result.status === 'added' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{result.domain}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={result.success ? 'default' : 'destructive'}
                      className={
                        result.status === 'added' 
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'exists'
                          ? 'bg-blue-100 text-blue-800'
                          : ''
                      }
                    >
                      {result.status}
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

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Netlify API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Getting your API Token:</strong> 
              <a 
                href="https://app.netlify.com/user/applications#personal-access-tokens" 
                target="_blank" 
                className="text-blue-600 hover:underline ml-1"
              >
                Netlify Dashboard → User Settings → Applications → Personal Access Tokens
              </a>
            </p>
            
            <p>
              <strong>Finding your Site ID:</strong> 
              Go to your site in Netlify Dashboard → Site Settings → General → Site Details
            </p>
            
            <p>
              <strong>API Rate Limits:</strong> 
              Netlify allows 500 requests per minute. This tool processes domains in batches to respect limits.
            </p>

            <p>
              <strong>SSL Certificates:</strong> 
              When enabled, Let's Encrypt certificates are automatically issued and renewed for your domains.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NetlifyBulkDomainManager;
