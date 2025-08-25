import React, { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, ExternalLink, Trash2, Loader2, Zap, Shield, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import { NetlifyDomainSyncService, type DomainSyncResult } from '@/services/netlifyDomainSyncService';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'error';
  user_id: string;
  netlify_verified: boolean;
  created_at: string;
  netlify_site_id?: string;
  error_message?: string;
}

const DomainsPageEnhanced = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  useEffect(() => {
    if (user) {
      loadDomains();
      testConnection();
    }
  }, [user]);

  const testConnection = async () => {
    try {
      const result = await NetlifyDomainSyncService.testConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
      
      if (!result.success) {
        console.warn('Netlify connection test failed:', result.errors?.[0]);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.warn('Connection test error:', error);
    }
  };

  const loadDomains = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await NetlifyDomainSyncService.getUserDomains(user.id);
      
      if (result.success) {
        setDomains(result.domains || []);
        console.log(`✅ Loaded ${result.domains?.length || 0} domains`);
      } else {
        toast.error(`Failed to load domains: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Load domains error:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const performFullSync = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    setSyncProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await NetlifyDomainSyncService.performFullSync(user.id);
      
      clearInterval(progressInterval);
      setSyncProgress(100);

      if (result.success) {
        toast.success(result.message);
        
        // Show detailed results
        if (result.domains_added || result.domains_updated) {
          const details = [];
          if (result.domains_added) details.push(`${result.domains_added} added`);
          if (result.domains_updated) details.push(`${result.domains_updated} updated`);
          toast.info(`Sync details: ${details.join(', ')}`);
        }

        // Reload domains
        await loadDomains();
      } else {
        toast.error(result.message);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => toast.error(error));
        }
      }
    } catch (error: any) {
      console.error('Full sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !user?.id) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    const cleanDomain = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    if (!domainRegex.test(cleanDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    setAdding(true);
    try {
      const result = await NetlifyDomainSyncService.addDomain(cleanDomain, user.id);
      
      if (result.success) {
        toast.success(result.message);
        setNewDomain('');
        await loadDomains();
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach(error => toast.error(error));
        }
      }
    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (domain: Domain) => {
    if (!user?.id) return;
    
    if (isPrimaryDomain(domain.domain)) {
      toast.warning('Cannot remove primary domain');
      return;
    }
    
    setRemoving(domain.id);
    try {
      const result = await NetlifyDomainSyncService.removeDomain(domain.id, user.id);
      
      if (result.success) {
        toast.success(result.message);
        await loadDomains();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Remove domain error:', error);
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setRemoving(null);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'verified' && domain.netlify_verified) {
      return <Badge className="bg-green-600">✅ Active</Badge>;
    } else if (domain.status === 'error') {
      return <Badge variant="destructive">❌ Error</Badge>;
    } else if (domain.status === 'pending') {
      return <Badge className="bg-blue-600">⏳ Pending</Badge>;
    } else {
      return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-600">🟢 Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">🔴 Disconnected</Badge>;
      default:
        return <Badge variant="outline">⚪ Testing...</Badge>;
    }
  };

  const isPrimaryDomain = (domain: string) => {
    return domain === 'backlinkoo.com';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600">Please sign in to manage your domains.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Management</h1>
          <p className="text-gray-600 mb-4">
            Sync and manage domains between Supabase, Netlify, and backlinkoo.com
          </p>
          <div className="flex justify-center items-center gap-4">
            <span className="text-sm text-gray-500">
              Netlify Site: {NETLIFY_SITE_ID.substring(0, 8)}...
            </span>
            {getConnectionBadge()}
          </div>
        </div>

        {/* Sync Progress */}
        {syncing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Syncing with Netlify...</span>
                  <span className="text-sm text-gray-500">{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={performFullSync}
                disabled={syncing || connectionStatus === 'error'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Full Sync from Netlify
              </Button>
              
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={syncing}
              >
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://app.netlify.com/projects/backlinkoo/domain-management', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Netlify Console
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Domain */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter domain (e.g., example.com)"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !adding && addDomain()}
                disabled={adding}
                className="flex-1"
              />
              <Button 
                onClick={addDomain} 
                disabled={adding || !newDomain.trim() || connectionStatus === 'error'}
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Domain
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                Domains will be added to both Supabase and Netlify automatically. DNS configuration instructions will be provided after adding.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Domains List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Your Domains ({domains.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDomains}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading domains...</p>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No domains found
                </h3>
                <p className="text-gray-500 mb-4">
                  Add your first domain or sync from Netlify to get started.
                </p>
                <Button 
                  onClick={performFullSync} 
                  disabled={connectionStatus === 'error'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync from Netlify
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isPrimaryDomain(domain.domain)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{domain.domain}</span>
                          <button
                            onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title={`Visit ${domain.domain}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          {isPrimaryDomain(domain.domain) && (
                            <Badge variant="default" className="bg-blue-600">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          ID: {domain.id.substring(0, 8)}... • 
                          Added {new Date(domain.created_at).toLocaleDateString()} • 
                          Netlify: {domain.netlify_verified ? '✅' : '❌'}
                        </p>
                        <p className="text-xs text-gray-400">
                          URL: <code className="bg-gray-100 px-1 rounded">https://{domain.domain}</code>
                        </p>
                        {domain.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {domain.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(domain)}
                      
                      <div className="flex gap-1">
                        {domain.netlify_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://app.netlify.com/projects/backlinkoo/domain-management`, '_blank')}
                            title="View in Netlify"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {!isPrimaryDomain(domain.domain) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDomain(domain)}
                            disabled={removing === domain.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove Domain"
                          >
                            {removing === domain.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="Primary domain cannot be removed"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Footer */}
        <Alert className="mt-6">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Sync Status:</strong> This interface provides real-time sync between your Supabase domains table and Netlify. 
            Use "Full Sync" to pull all domains from Netlify, or add new domains to push them to both systems.
          </AlertDescription>
        </Alert>
      </div>

      <Footer />
    </div>
  );
};

export default DomainsPageEnhanced;
