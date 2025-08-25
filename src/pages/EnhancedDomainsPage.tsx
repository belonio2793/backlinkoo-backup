import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Trash2,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { NetlifyDomainSyncService } from '@/services/netlifyDomainSync';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'removed' | 'error';
  user_id: string;
  netlify_verified: boolean;
  dns_verified: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
  last_sync?: string;
  custom_domain: boolean;
  ssl_status: 'none' | 'pending' | 'issued' | 'error';
}

const EnhancedDomainsPage = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [validationError, setValidationError] = useState('');
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [netlifyConnected, setNetlifyConnected] = useState<boolean | null>(null);
  const [syncStats, setSyncStats] = useState<{
    netlifyCount: number;
    needsSync: boolean;
    lastSync?: Date;
  } | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (user) {
      loadDomains();
      setupRealtimeSubscription();
      checkNetlifyConnection();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('domains-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time domain update:', payload);
          loadDomains(); // Refresh domains on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadDomains = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load domains:', error);
        toast.error(`Failed to load domains: ${error.message}`);
        return;
      }

      setDomains(data || []);
    } catch (error: any) {
      console.error('Load domains error:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateDomain = (domain: string): string | null => {
    if (!domain.trim()) {
      return 'Domain cannot be empty';
    }

    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Check for valid domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleanDomain)) {
      return 'Invalid domain format. Use format: example.com';
    }

    // Check if domain already exists
    if (domains.some(d => d.domain === cleanDomain)) {
      return 'Domain already exists in your list';
    }

    return null;
  };

  const handleDomainInput = (value: string) => {
    setNewDomain(value);
    const error = validateDomain(value);
    setValidationError(error || '');
  };

  const addDomain = async () => {
    if (!user?.id || !newDomain.trim()) return;

    const validation = validateDomain(newDomain);
    if (validation) {
      setValidationError(validation);
      return;
    }

    const cleanDomain = newDomain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    setProcessingActions(prev => new Set(prev).add('add'));

    try {
      const { error } = await supabase
        .from('domains')
        .insert({
          domain: cleanDomain,
          user_id: user.id,
          status: 'pending',
          netlify_verified: false,
          dns_verified: false,
          custom_domain: false,
          ssl_status: 'none'
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Domain already exists');
        }
        throw error;
      }

      toast.success(`✅ Domain ${cleanDomain} added successfully`);
      setNewDomain('');
      setValidationError('');
      setAddDialogOpen(false);
      
    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete('add');
        return newSet;
      });
    }
  };

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!user?.id) return;

    setProcessingActions(prev => new Set(prev).add(domainId));

    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast.success(`Domain ${domainName} deleted successfully`);
    } catch (error: any) {
      console.error('Delete domain error:', error);
      toast.error(`Failed to delete domain: ${error.message}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const checkNetlifyConnection = async () => {
    try {
      const result = await NetlifyDomainSyncService.testNetlifyConnection();
      setNetlifyConnected(result.success);

      if (result.success) {
        // Get sync stats
        const siteInfo = await NetlifyDomainSyncService.getNetlifySiteInfo();
        if (siteInfo.success) {
          setSyncStats({
            netlifyCount: siteInfo.domains?.length || 0,
            needsSync: (siteInfo.domains?.length || 0) > domains.length,
            lastSync: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error checking Netlify connection:', error);
      setNetlifyConnected(false);
    }
  };

  const syncFromNetlify = async () => {
    if (!user?.id) return;

    setSyncing(true);
    try {
      const result = await NetlifyDomainSyncService.syncDomainsFromNetlify(user.id, 'safe');

      if (result.success) {
        await loadDomains();
        await checkNetlifyConnection(); // Refresh sync stats
        toast.success('✅ Domains synced from Netlify successfully');
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Netlify sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const syncWithNetlify = syncFromNetlify; // Alias for backward compatibility

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'verified' && domain.netlify_verified) {
      return <Badge className="bg-green-600">Active</Badge>;
    } else if (domain.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    } else if (domain.netlify_verified) {
      return <Badge className="bg-blue-600">Netlify Only</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (domain: Domain) => {
    if (domain.status === 'verified' && domain.netlify_verified) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (domain.status === 'error') {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to manage your domains.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your domains with real-time Supabase sync and Netlify integration
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                <p className="text-sm text-gray-600">Supabase Domains</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Globe className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {syncStats?.netlifyCount || '?'}
                </p>
                <p className="text-sm text-gray-600">Netlify Domains</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {domains.filter(d => d.status === 'verified' && d.netlify_verified).length}
                </p>
                <p className="text-sm text-gray-600">Synced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {domains.filter(d => d.status === 'error').length}
                </p>
                <p className="text-sm text-gray-600">Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Netlify Connection Status */}
        {netlifyConnected !== null && (
          <Alert className={`mb-6 ${netlifyConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Netlify Connection:</strong>
                  {netlifyConnected ? (
                    <span className="text-green-700 ml-2">✅ Connected</span>
                  ) : (
                    <span className="text-red-700 ml-2">❌ Not Connected</span>
                  )}
                  {syncStats && syncStats.needsSync && (
                    <span className="text-blue-700 ml-2">• Sync Available</span>
                  )}
                </div>
                {netlifyConnected && syncStats?.needsSync && (
                  <Button
                    size="sm"
                    onClick={syncFromNetlify}
                    disabled={syncing}
                    className="ml-4"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="flex-1 sm:flex-none">
                <Plus className="h-5 w-5 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
                <DialogDescription>
                  Add a domain to your Supabase database. It will be synced with Netlify automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => handleDomainInput(e.target.value)}
                    className={validationError ? 'border-red-500' : ''}
                  />
                  {validationError && (
                    <p className="text-red-500 text-sm mt-2">{validationError}</p>
                  )}
                </div>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Domain will be validated and added to your database. Real-time sync with Netlify will occur automatically.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addDomain}
                  disabled={!!validationError || !newDomain.trim() || processingActions.has('add')}
                >
                  {processingActions.has('add') ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Domain'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={syncFromNetlify}
            disabled={syncing || netlifyConnected === false}
            size="lg"
            className={netlifyConnected === false ? 'opacity-50' : ''}
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            {netlifyConnected === false ? 'Netlify Unavailable' : 'Sync from Netlify'}
          </Button>

          <Button 
            variant="outline" 
            onClick={loadDomains}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Database className="h-5 w-5 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Domains Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Your Domains ({domains.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
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
                  Add your first domain to get started with automated domain management.
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Domain
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(domain)}
                          <span className="font-medium">{domain.domain}</span>
                          {domain.custom_domain && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(domain)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {domain.netlify_verified ? (
                            <Badge className="bg-green-100 text-green-800">Netlify ✓</Badge>
                          ) : (
                            <Badge variant="secondary">Local Only</Badge>
                          )}
                          {domain.dns_verified && (
                            <Badge className="bg-blue-100 text-blue-800">DNS ✓</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(domain.created_at).toLocaleDateString()}
                        </span>
                        {domain.last_sync && (
                          <div className="text-xs text-gray-500">
                            Synced: {new Date(domain.last_sync).toLocaleTimeString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDomain(domain.id, domain.domain)}
                            disabled={processingActions.has(domain.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {processingActions.has(domain.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {domains.some(d => d.error_message) && (
              <Alert className="mt-4 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Some domains have errors:</strong>
                  {domains
                    .filter(d => d.error_message)
                    .map(d => (
                      <div key={d.id} className="text-sm mt-1">
                        {d.domain}: {d.error_message}
                      </div>
                    ))}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert className="mt-6">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Real-time sync enabled:</strong> Changes to your domains are automatically synced between Supabase and Netlify. 
            Domain validation happens instantly as you type.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default EnhancedDomainsPage;
