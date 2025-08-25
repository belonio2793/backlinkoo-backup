import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Loader2, 
  Zap, 
  Shield, 
  Settings, 
  Eye,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { useRealTimeDomainSync } from '@/hooks/useRealTimeDomainSync';

const DomainsPageFinal = () => {
  const { user } = useAuthState();
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const {
    domains,
    syncStatus,
    loading,
    loadDomains,
    performSync,
    testConnection,
    addDomain,
    removeDomain,
    toggleAutoSync
  } = useRealTimeDomainSync(user?.id);

  const NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    const cleanDomain = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    if (!domainRegex.test(cleanDomain)) {
      alert('Please enter a valid domain name');
      return;
    }

    setAdding(true);
    try {
      const result = await addDomain(cleanDomain);
      if (result.success) {
        setNewDomain('');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveDomain = async (domainId: string, domainName: string) => {
    if (isPrimaryDomain(domainName)) {
      alert('Cannot remove primary domain');
      return;
    }

    setRemoving(domainId);
    try {
      await removeDomain(domainId);
    } finally {
      setRemoving(null);
    }
  };

  const getStatusBadge = (domain: any) => {
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

  const getConnectionIndicator = () => {
    if (syncStatus.syncInProgress) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Syncing...</span>
        </div>
      );
    }

    if (syncStatus.isOnline) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Connected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
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
            Real-time sync between Supabase, Netlify, and backlinkoo.com
          </p>
          <div className="flex justify-center items-center gap-6">
            <span className="text-sm text-gray-500">
              Netlify Site: {NETLIFY_SITE_ID.substring(0, 8)}...
            </span>
            {getConnectionIndicator()}
            {syncStatus.lastSync && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Last sync: {syncStatus.lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Sync Status & Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sync Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => performSync(true)}
                disabled={syncStatus.syncInProgress}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncStatus.syncInProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Manual Sync
              </Button>
              
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={syncStatus.syncInProgress}
              >
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </Button>

              <div className="flex items-center gap-2">
                <Switch
                  checked={syncStatus.autoSyncEnabled}
                  onCheckedChange={toggleAutoSync}
                  disabled={syncStatus.syncInProgress}
                />
                <span className="text-sm font-medium">Auto-sync (5min)</span>
              </div>

              <Button
                variant="outline"
                onClick={() => window.open('https://app.netlify.com/projects/backlinkoo/domain-management', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Netlify Console
              </Button>
            </div>

            {syncStatus.syncInProgress && (
              <div className="mt-4">
                <Progress value={75} className="h-2" />
                <p className="text-sm text-gray-600 mt-1">Syncing with Netlify...</p>
              </div>
            )}
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
                onKeyPress={(e) => e.key === 'Enter' && !adding && handleAddDomain()}
                disabled={adding}
                className="flex-1"
              />
              <Button 
                onClick={handleAddDomain} 
                disabled={adding || !newDomain.trim() || !syncStatus.isOnline}
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
                Domains will be added to both Supabase and Netlify automatically with real-time sync. 
                SSL certificates will be provisioned automatically.
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
                {syncStatus.autoSyncEnabled && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Live Sync
                  </Badge>
                )}
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
                  onClick={() => performSync(true)} 
                  disabled={!syncStatus.isOnline}
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
                            onClick={() => handleRemoveDomain(domain.id, domain.domain)}
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
            <strong>Real-time Domain Sync:</strong> This interface provides live synchronization between Supabase, Netlify, and your domain management. 
            Changes are automatically synced across all systems {syncStatus.autoSyncEnabled ? 'every 5 minutes' : '(auto-sync disabled)'}.
          </AlertDescription>
        </Alert>
      </div>

      <Footer />
    </div>
  );
};

export default DomainsPageFinal;
