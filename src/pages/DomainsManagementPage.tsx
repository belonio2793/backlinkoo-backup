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
  Database,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthState } from '@/hooks/useAuthState';
import DomainManagementService from '@/services/domainManagementService';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'removed' | 'error';
  user_id?: string;
  netlify_verified: boolean;
  dns_verified: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
  last_sync?: string;
  custom_domain: boolean;
  ssl_status: 'none' | 'pending' | 'issued' | 'error';
}

const DomainsManagementPage = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [validationError, setValidationError] = useState('');
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [netlifyConnected, setNetlifyConnected] = useState<boolean | null>(null);
  const [domainStats, setDomainStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    errors: 0,
    netlifyVerified: 0
  });

  // Initialize component
  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await Promise.all([
      loadDomains(),
      testNetlifyConnection()
    ]);
    
    // Setup real-time subscription
    const cleanup = DomainManagementService.setupRealtimeSubscription(
      (payload) => {
        console.log('Real-time domain update:', payload);
        loadDomains(); // Refresh domains on any change
      },
      user?.id
    );

    // Cleanup on unmount
    return cleanup;
  };

  const loadDomains = async () => {
    try {
      setLoading(true);
      const { domains: loadedDomains, error } = await DomainManagementService.getDomains(user?.id);

      if (error) {
        toast.error(`Failed to load domains: ${error}`);
        return;
      }

      setDomains(loadedDomains);
      
      // Update stats
      const stats = await DomainManagementService.getDomainStats(user?.id);
      setDomainStats(stats);

      console.log(`✅ Loaded ${loadedDomains.length} domains`);

    } catch (error: any) {
      console.error('Load domains error:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNetlifyConnection = async () => {
    try {
      const result = await DomainManagementService.testNetlifyConnection();
      setNetlifyConnected(result.success);
      
      if (!result.success) {
        console.warn('Netlify connection test failed:', result.message);
      }
    } catch (error) {
      console.error('Netlify connection test error:', error);
      setNetlifyConnected(false);
    }
  };

  const validateDomainInput = (domain: string) => {
    const validation = DomainManagementService.validateDomain(domain);
    setValidationError(validation.isValid ? '' : validation.error || '');
    return validation.isValid;
  };

  const handleDomainInput = (value: string) => {
    setNewDomain(value);
    validateDomainInput(value);
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      setValidationError('Domain cannot be empty');
      return;
    }

    if (!validateDomainInput(newDomain)) {
      return;
    }

    // Check if domain already exists
    const cleanDomain = DomainManagementService.cleanDomain(newDomain);
    if (domains.some(d => d.domain === cleanDomain)) {
      setValidationError('Domain already exists in your list');
      return;
    }

    setProcessingActions(prev => new Set(prev).add('add'));

    try {
      const result = await DomainManagementService.addDomain(cleanDomain, user?.id);

      if (result.success) {
        toast.success(result.message || `✅ Domain ${cleanDomain} added successfully`);
        setNewDomain('');
        setValidationError('');
        setAddDialogOpen(false);
        
        // Refresh domains to show the new addition
        await loadDomains();
        
        if (!result.netlify_verified) {
          toast.warning('Domain added to database but failed to sync with Netlify. Check configuration.');
        }
      } else {
        toast.error(result.error || 'Failed to add domain');
        setValidationError(result.error || 'Failed to add domain');
      }

    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
      setValidationError(error.message);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete('add');
        return newSet;
      });
    }
  };

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to remove ${domainName}? This will remove it from both Supabase and Netlify.`)) {
      return;
    }

    setProcessingActions(prev => new Set(prev).add(domainId));

    try {
      const result = await DomainManagementService.removeDomain(domainName, user?.id);

      if (result.success) {
        toast.success(result.message || `✅ Domain ${domainName} removed successfully`);
        
        // Refresh domains to show the removal
        await loadDomains();
        
        if (!result.netlify_removed) {
          toast.warning('Domain removed from database but may still exist in Netlify');
        }
      } else {
        toast.error(result.error || 'Failed to remove domain');
      }

    } catch (error: any) {
      console.error('Delete domain error:', error);
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const syncDomains = async () => {
    setSyncing(true);
    try {
      const result = await DomainManagementService.syncDomains(user?.id);

      if (result.success) {
        toast.success('✅ Domains synced successfully');
        
        // Show sync results
        if (result.sync_results) {
          const { sync_results } = result;
          toast.info(
            `Sync completed: ${sync_results.total_netlify} Netlify domains, ` +
            `${sync_results.total_supabase} Supabase domains, ` +
            `${sync_results.updated_in_supabase} updated`
          );
        }
        
        await loadDomains();
        await testNetlifyConnection();
      } else {
        toast.error(result.error || 'Failed to sync domains');
      }

    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Failed to sync domains: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'verified' && domain.netlify_verified) {
      return <Badge className="bg-green-600">✅ Active</Badge>;
    } else if (domain.status === 'error') {
      return <Badge variant="destructive">❌ Error</Badge>;
    } else if (domain.netlify_verified) {
      return <Badge className="bg-blue-600">🌐 Netlify Only</Badge>;
    } else if (domain.status === 'verified') {
      return <Badge className="bg-yellow-600">📄 Database Only</Badge>;
    } else {
      return <Badge variant="secondary">⏳ Pending</Badge>;
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
            Manage your domains with real-time Supabase and Netlify synchronization
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainStats.total}</p>
                <p className="text-sm text-gray-600">Total Domains</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainStats.verified}</p>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Globe className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainStats.netlifyVerified}</p>
                <p className="text-sm text-gray-600">Netlify Synced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Loader2 className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainStats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainStats.errors}</p>
                <p className="text-sm text-gray-600">Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Netlify Connection Status */}
        <Alert className={`mb-6 ${netlifyConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {netlifyConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Netlify Connection:</strong>
                {netlifyConnected ? (
                  <span className="text-green-700 ml-2">✅ Connected</span>
                ) : (
                  <span className="text-red-700 ml-2">❌ Not Connected</span>
                )}
                <div className="text-sm text-gray-600 mt-1">
                  Site ID: ca6261e6-0a59-40b5-a2bc-5b5481ac8809
                </div>
              </div>
              <Button
                size="sm"
                onClick={testNetlifyConnection}
                variant="outline"
              >
                Test Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>

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
                  Add a domain to both Supabase database and Netlify. The domain will be automatically synced.
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
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Domain will be added to Supabase database and registered as a Netlify domain alias.
                    Two-way sync ensures consistency across both platforms.
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
            onClick={syncDomains}
            disabled={syncing || netlifyConnected === false}
            size="lg"
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            {netlifyConnected === false ? 'Netlify Unavailable' : 'Sync Domains'}
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
                        {domain.error_message && (
                          <div className="text-xs text-red-600 mt-1">
                            {domain.error_message}
                          </div>
                        )}
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
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert className="mt-6">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Real-time two-way sync enabled:</strong> Changes to your domains are automatically 
            synchronized between Supabase database and Netlify domain aliases. Domain validation 
            happens instantly, and the interface reflects the current state of both systems.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default DomainsManagementPage;
