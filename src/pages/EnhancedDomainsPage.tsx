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
  txt_record_value?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  last_sync?: string;
  custom_domain: boolean;
  ssl_status: 'none' | 'pending' | 'issued' | 'error';
  dns_records?: any[];
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
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    netlifyCount: number;
    needsSync: boolean;
    lastSync?: Date;
  } | null>(null);
  const [edgeFunctionSyncing, setEdgeFunctionSyncing] = useState(false);

  // Real-time subscription
  useEffect(() => {
    loadDomains();
    setupRealtimeSubscription();
    checkNetlifyConnection();
  }, [user]);

  const setupRealtimeSubscription = () => {
    const subscriptionConfig = {
      event: '*' as const,
      schema: 'public',
      table: 'domains',
      ...(user?.id && { filter: `user_id=eq.${user.id}` })
    };

    const channel = supabase
      .channel('domains-realtime')
      .on(
        'postgres_changes',
        subscriptionConfig,
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
    // Prevent multiple simultaneous calls
    if (checkingConnection) {
      console.log('🔄 Netlify connection check already in progress, skipping...');
      return;
    }

    try {
      setCheckingConnection(true);
      console.log('🔍 Starting Netlify connection check...');

      const result = await NetlifyDomainSyncService.testNetlifyConnection();
      setNetlifyConnected(result.success);

      if (result.success) {
        console.log('✅ Netlify connection successful, getting sync stats...');
        // Get sync stats
        const siteInfo = await NetlifyDomainSyncService.getNetlifySiteInfo();
        if (siteInfo.success) {
          setSyncStats({
            netlifyCount: siteInfo.domains?.length || 0,
            needsSync: (siteInfo.domains?.length || 0) > domains.length,
            lastSync: new Date()
          });
          console.log('📊 Sync stats updated:', siteInfo.domains?.length || 0, 'Netlify domains');
        } else {
          console.warn('⚠️ Failed to get sync stats:', siteInfo.error);
        }
      } else {
        console.warn('❌ Netlify connection failed:', result.error);
      }
    } catch (error: any) {
      console.error('❌ Error checking Netlify connection:', error);
      setNetlifyConnected(false);
    } finally {
      setCheckingConnection(false);
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

        // Show detailed sync results
        if (result.syncResult) {
          const { summary } = result.syncResult;
          toast.info(
            `📊 Sync Summary: Added ${summary.added}, Updated ${summary.updated}, Skipped ${summary.skipped}, Errors ${summary.errors}`,
            { duration: 8000 }
          );
        }
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

  const syncAllFromNetlify = async () => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      'This will fetch ALL domains from your Netlify account and add them to your Supabase database. Continue?'
    );

    if (!confirmed) return;

    setSyncing(true);
    try {
      // Force sync mode to add all domains
      const result = await NetlifyDomainSyncService.syncDomainsFromNetlify(user.id, 'force');

      if (result.success) {
        await loadDomains();
        await checkNetlifyConnection();

        if (result.syncResult) {
          const { summary, netlifyCount } = result.syncResult;
          toast.success(
            `✅ Successfully synced ${netlifyCount} domains from Netlify!\n• Added: ${summary.added}\n• Updated: ${summary.updated}\n• Errors: ${summary.errors}`,
            { duration: 10000 }
          );
        } else {
          toast.success('✅ All domains synced from Netlify successfully!');
        }
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

  const syncViaEdgeFunction = async () => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      'This will use the Supabase edge function to fetch ALL domains from Netlify and sync them to your domains table. Continue?'
    );

    if (!confirmed) return;

    setEdgeFunctionSyncing(true);
    try {
      console.log('🚀 Calling Supabase netlify-domains edge function...');

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'sync',
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error(`Edge function failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        console.log('✅ Edge function sync completed:', data);

        // Refresh domains list
        await loadDomains();
        await checkNetlifyConnection();

        const results = data.sync_results;
        toast.success(
          `✅ Edge Function Sync Complete!\n` +
          `• Netlify domains: ${results.total_netlify}\n` +
          `• Supabase domains: ${results.total_supabase}\n` +
          `• Updated: ${results.updated_in_supabase}\n` +
          `• In sync: ${results.in_sync}`,
          { duration: 10000 }
        );

        // Show individual domain info
        if (data.netlify_domains && data.netlify_domains.length > 0) {
          toast.info(
            `🌐 Netlify domains found: ${data.netlify_domains.join(', ')}`,
            { duration: 8000 }
          );
        }

      } else {
        console.error('❌ Edge function returned error:', data);
        toast.error(`Sync failed: ${data?.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('❌ Edge function call failed:', error);
      toast.error(`Edge function call failed: ${error.message}`);
    } finally {
      setEdgeFunctionSyncing(false);
    }
  };

  const testEdgeFunctionWithAllDomains = async () => {
    const confirmed = window.confirm(
      'This will sync ALL domains from Netlify for ALL users (admin function). Continue?'
    );

    if (!confirmed) return;

    setEdgeFunctionSyncing(true);
    try {
      console.log('🚀 Calling Supabase netlify-domains edge function (all users)...');

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'sync'
          // No user_id = fetch for all users
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error(`Edge function failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        console.log('✅ Edge function sync completed:', data);

        // Refresh domains list
        await loadDomains();

        const results = data.sync_results;
        toast.success(
          `✅ Global Edge Function Sync Complete!\n` +
          `• Netlify domains: ${results.total_netlify}\n` +
          `• Supabase domains: ${results.total_supabase}\n` +
          `• Updated: ${results.updated_in_supabase}\n` +
          `• In sync: ${results.in_sync}`,
          { duration: 10000 }
        );

        // Show individual domain info
        if (data.netlify_domains && data.netlify_domains.length > 0) {
          toast.info(
            `🌐 Netlify domains found: ${data.netlify_domains.join(', ')}`,
            { duration: 8000 }
          );
        }

      } else {
        console.error('�� Edge function returned error:', data);
        toast.error(`Sync failed: ${data?.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('❌ Edge function call failed:', error);
      toast.error(`Edge function call failed: ${error.message}`);
    } finally {
      setEdgeFunctionSyncing(false);
    }
  };

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
            onClick={syncAllFromNetlify}
            disabled={syncing || netlifyConnected === false}
            size="lg"
            className={`${netlifyConnected === false ? 'opacity-50' : ''} bg-blue-600 hover:bg-blue-700`}
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Zap className="h-5 w-5 mr-2" />
            )}
            {netlifyConnected === false ? 'Netlify Unavailable' : 'Sync ALL Domains'}
          </Button>

          <Button
            onClick={syncViaEdgeFunction}
            disabled={edgeFunctionSyncing}
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center">
              {edgeFunctionSyncing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin text-white" />
              ) : (
                <Database className="h-5 w-5 mr-2 text-white group-hover:animate-pulse" />
              )}
              <span className="font-medium">
                {edgeFunctionSyncing ? 'Syncing via Edge Function...' : 'Sync via Edge Function'}
              </span>
              {!edgeFunctionSyncing && (
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
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
                    <TableHead>Verification</TableHead>
                    <TableHead>SSL Status</TableHead>
                    <TableHead>TXT Record</TableHead>
                    <TableHead>DNS Records</TableHead>
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {domain.netlify_verified ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Netlify ✓</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Local Only</Badge>
                            )}
                            {domain.dns_verified && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">DNS ✓</Badge>
                            )}
                          </div>
                          {!domain.netlify_verified && !domain.dns_verified && (
                            <span className="text-xs text-gray-500">Not verified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={domain.ssl_status === 'issued' ? 'default' : domain.ssl_status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {domain.ssl_status === 'issued' ? '🔒 SSL Active' :
                             domain.ssl_status === 'pending' ? '⏳ SSL Pending' :
                             domain.ssl_status === 'error' ? '❌ SSL Error' :
                             '🔓 No SSL'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32">
                          {domain.txt_record_value ? (
                            <div className="text-xs">
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs break-all">
                                {domain.txt_record_value.length > 20
                                  ? `${domain.txt_record_value.substring(0, 20)}...`
                                  : domain.txt_record_value}
                              </code>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not set</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32">
                          {domain.dns_records && domain.dns_records.length > 0 ? (
                            <div className="text-xs">
                              <Badge variant="outline" className="text-xs">
                                {domain.dns_records.length} record{domain.dns_records.length !== 1 ? 's' : ''}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {domain.dns_records.slice(0, 2).map((record: any, idx: number) => (
                                  <div key={idx} className="truncate">
                                    {record.type || 'Record'}: {record.value ? record.value.substring(0, 15) + '...' : 'N/A'}
                                  </div>
                                ))}
                                {domain.dns_records.length > 2 && (
                                  <div className="text-xs text-gray-400">+{domain.dns_records.length - 2} more</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No records</span>
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
