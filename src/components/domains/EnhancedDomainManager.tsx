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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Settings,
  Cloud,
  Database,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

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
  dns_records: any[];
}

interface NetlifyDomainData {
  custom_domain?: string;
  domain_aliases: string[];
  ssl_url?: string;
  url: string;
}

const EnhancedDomainManager = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [netlifyData, setNetlifyData] = useState<NetlifyDomainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [addToNetlify, setAddToNetlify] = useState(true);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    errors: 0,
    lastSync: null as Date | null
  });

  useEffect(() => {
    if (user) {
      loadDomains();
      loadNetlifyData();
    }
  }, [user]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setDomains(data || []);
      
      // Calculate sync stats
      const total = data?.length || 0;
      const synced = data?.filter(d => d.netlify_verified).length || 0;
      const errors = data?.filter(d => d.error_message).length || 0;
      const lastSync = data?.reduce((latest, domain) => {
        if (domain.last_sync) {
          const syncDate = new Date(domain.last_sync);
          return !latest || syncDate > latest ? syncDate : latest;
        }
        return latest;
      }, null as Date | null);

      setSyncStats({ total, synced, errors, lastSync });

    } catch (error: any) {
      console.error('❌ Failed to load domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadNetlifyData = async () => {
    try {
      console.log('🔍 Loading Netlify data...');
      
      const { data, error } = await supabase.functions.invoke('domains', {
        body: { action: 'get_site_info' }
      });

      if (error) {
        console.warn('⚠️ Netlify data unavailable:', error);
        return;
      }

      if (data?.success) {
        setNetlifyData(data.data);
        console.log('✅ Netlify data loaded:', data.data);
      }

    } catch (error: any) {
      console.warn('⚠️ Could not load Netlify data:', error);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !user) return;

    const cleanedDomain = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    setProcessingActions(prev => new Set(prev).add('add'));

    try {
      console.log(`➕ Adding domain: ${cleanedDomain}`);

      // First add to database - this will trigger the automatic Netlify sync
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
          user_id: user.id,
          status: 'pending',
          custom_domain: true // New domains are set as custom domains
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('Domain already exists');
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success(`Domain ${cleanedDomain} added to database`);

      // If user wants to add to Netlify immediately (in addition to trigger)
      if (addToNetlify) {
        try {
          const { data: netlifyResult, error: netlifyError } = await supabase.functions.invoke('domains', {
            body: { 
              action: 'add', 
              domain: cleanedDomain 
            }
          });

          if (netlifyError) {
            throw new Error(netlifyError.message);
          }

          if (netlifyResult?.success) {
            // Update database to reflect Netlify success
            await supabase
              .from('domains')
              .update({
                netlify_verified: true,
                status: 'verified',
                last_sync: new Date().toISOString()
              })
              .eq('id', dbDomain.id);

            toast.success(`Domain ${cleanedDomain} added to Netlify successfully`);
          } else {
            toast.warning(`Added to database, but Netlify sync will retry: ${netlifyResult?.error || 'Unknown error'}`);
          }
        } catch (netlifyError: any) {
          console.error('Netlify addition failed:', netlifyError);
          toast.warning(`Added to database, Netlify sync will retry automatically`);
        }
      }

      // Reset form and refresh data
      setNewDomain('');
      setAddDialogOpen(false);
      await loadDomains();
      await loadNetlifyData();

    } catch (error: any) {
      console.error('❌ Add domain error:', error);
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
    if (!user) return;

    setProcessingActions(prev => new Set(prev).add(domainId));

    try {
      // Find the domain
      const domain = domains.find(d => d.id === domainId);
      
      if (!domain) {
        throw new Error('Domain not found');
      }

      // If it's verified in Netlify, remove it there first
      if (domain.netlify_verified) {
        try {
          const { data: netlifyResult, error: netlifyError } = await supabase.functions.invoke('domains', {
            body: { action: 'remove' }
          });

          if (netlifyError) {
            console.warn('Netlify removal failed:', netlifyError);
          } else if (netlifyResult?.success) {
            toast.success(`Removed ${domainName} from Netlify`);
          }
        } catch (netlifyError: any) {
          console.warn('Netlify removal failed:', netlifyError);
        }
      }

      // Remove from database
      const { error: dbError } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', user.id);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success(`Domain ${domainName} deleted successfully`);
      await loadDomains();
      await loadNetlifyData();

    } catch (error: any) {
      console.error('❌ Delete domain error:', error);
      toast.error(`Failed to delete domain: ${error.message}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const syncWithNetlify = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔄 Syncing with Netlify...');

      // Trigger manual sync for all domains
      const syncPromises = domains.map(async (domain) => {
        const { error } = await supabase.rpc('trigger_domain_sync', { 
          domain_id: domain.id 
        });
        
        if (error) {
          console.warn(`Sync failed for ${domain.domain}:`, error);
        }
      });

      await Promise.allSettled(syncPromises);
      
      // Refresh data
      await Promise.all([loadDomains(), loadNetlifyData()]);
      
      toast.success('Sync with Netlify completed');

    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.error_message) {
      return <Badge variant="destructive">Error</Badge>;
    } else if (domain.netlify_verified && domain.status === 'verified') {
      return <Badge className="bg-green-600">Synced</Badge>;
    } else if (domain.netlify_verified) {
      return <Badge className="bg-blue-600">In Netlify</Badge>;
    } else if (domain.status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    } else {
      return <Badge variant="outline">Database Only</Badge>;
    }
  };

  const getSyncIcon = (domain: Domain) => {
    if (domain.error_message) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (domain.netlify_verified) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!user) {
    return (
      <Alert className="border-gray-200">
        <Globe className="h-4 w-4" />
        <AlertDescription>
          Please sign in to manage your domains.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Domain Manager</h2>
          <p className="text-gray-600">Automatic two-way sync between database and Netlify</p>
          {syncStats.lastSync && (
            <p className="text-sm text-gray-500 mt-1">
              Last sync: {syncStats.lastSync.toLocaleTimeString()} • 
              {syncStats.synced}/{syncStats.total} synced • 
              {syncStats.errors} errors
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={syncWithNetlify}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync with Netlify
          </Button>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
                <DialogDescription>
                  Add a domain with automatic Netlify sync via database triggers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="addToNetlify"
                    checked={addToNetlify}
                    onChange={(e) => setAddToNetlify(e.target.checked)}
                  />
                  <label htmlFor="addToNetlify" className="text-sm">
                    Immediately sync to Netlify (in addition to automatic trigger)
                  </label>
                </div>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Domain will be automatically synced to Netlify via database triggers regardless of the checkbox above.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addDomain}
                  disabled={!newDomain.trim() || processingActions.has('add')}
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{syncStats.total}</div>
            <div className="text-sm text-gray-600">Total Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{syncStats.synced}</div>
            <div className="text-sm text-gray-600">Synced with Netlify</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{syncStats.errors}</div>
            <div className="text-sm text-gray-600">Sync Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {netlifyData ? (netlifyData.domain_aliases?.length || 0) + (netlifyData.custom_domain ? 1 : 0) : '?'}
            </div>
            <div className="text-sm text-gray-600">Netlify Domains</div>
          </CardContent>
        </Card>
      </div>

      {/* Netlify Connection Status */}
      {netlifyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Netlify Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Custom Domain</p>
                <p className="text-sm text-gray-600">{netlifyData.custom_domain || 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Domain Aliases</p>
                <p className="text-sm text-gray-600">
                  {netlifyData.domain_aliases?.length ? `${netlifyData.domain_aliases.length} aliases` : 'None'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Site URL</p>
                <a 
                  href={netlifyData.ssl_url || netlifyData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {netlifyData.ssl_url || netlifyData.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Domains ({domains.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading domains...</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No domains found
              </h3>
              <p className="text-gray-500 mb-4">
                Add your first domain to get started with automatic Netlify sync
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
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
                        {getSyncIcon(domain)}
                        <span className="text-sm">
                          {domain.netlify_verified ? 'Synced' : 'Pending'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {domain.last_sync 
                          ? new Date(domain.last_sync).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(domain.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {processingActions.has(domain.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Site
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteDomain(domain.id, domain.domain)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDomainManager;
