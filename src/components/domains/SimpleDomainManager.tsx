import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  List,
  ExternalLink,
  Trash2
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
  created_at: string;
  error_message?: string;
}

const SimpleDomainManager = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [backgroundSyncInterval, setBackgroundSyncInterval] = useState<NodeJS.Timeout | null>(null);

  // Single domain add
  const [newDomain, setNewDomain] = useState('');

  // Bulk domain add
  const [bulkDomains, setBulkDomains] = useState('');

  // Auto-sync on page load and setup background functionality
  useEffect(() => {
    if (user) {
      // Immediate sync on page load
      loadDomains(true); // true = silent sync

      // Setup periodic background sync every 5 minutes
      if (autoSyncEnabled) {
        const interval = setInterval(() => {
          console.log('🔄 Background sync triggered...');
          loadDomains(true); // Silent background sync
        }, 5 * 60 * 1000); // 5 minutes

        setBackgroundSyncInterval(interval);

        // Cleanup interval on unmount
        return () => {
          if (interval) clearInterval(interval);
        };
      }
    }
  }, [user, autoSyncEnabled]);

  // Real-time domain monitoring via page visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && autoSyncEnabled) {
        console.log('👁️ Page became visible, syncing domains...');
        loadDomains(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, autoSyncEnabled]);

  // Dev server integration - listen for file changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Dev environment auto-detection
      const checkDevServerChanges = () => {
        console.log('🔧 Dev server detected, enabling enhanced monitoring...');
        // Enhanced sync for development
        if (user) loadDomains(true);
      };

      // Listen for hot reload events
      if ('EventSource' in window) {
        const eventSource = new EventSource('/dev-server-events');
        eventSource.onmessage = checkDevServerChanges;
        return () => eventSource.close();
      }
    }
  }, [user]);

  // Background domain detection from current URL
  useEffect(() => {
    const detectCurrentDomain = async () => {
      if (!user) return;

      const currentDomain = window.location.hostname;
      if (currentDomain && currentDomain !== 'localhost' && currentDomain.includes('.')) {
        console.log(`🔍 Auto-detected current domain: ${currentDomain}`);

        // Check if current domain is already in our list
        const exists = domains.some(d => d.domain === currentDomain);
        if (!exists) {
          console.log(`➕ Auto-adding detected domain: ${currentDomain}`);
          try {
            const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              },
              body: JSON.stringify({ domain: currentDomain })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                console.log(`✅ Auto-added current domain: ${currentDomain}`);
                // Silent reload to update the list
                setTimeout(() => loadDomains(true), 1000);
              }
            }
          } catch (error) {
            console.log('Auto-add failed:', error);
          }
        }
      }
    };

    // Run detection after domains are loaded
    if (domains.length >= 0) {
      detectCurrentDomain();
    }
  }, [domains, user]);

  const loadDomains = async (silent = false) => {
    if (!user) return;

    if (!silent) setLoading(true);

    // Update last sync time
    setLastSyncTime(new Date());
    try {
      console.log('🔍 Loading domains from Supabase edge function...');
      console.log('👤 Current user:', user.email);

      // Use the new Supabase edge function to list and sync domains
      const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Edge function result:', result);

      if (result.success) {
        const syncedDomains = result.domains || [];
        console.log(`✅ Successfully loaded ${syncedDomains.length} domains`);

        if (result.synced > 0 && !silent) {
          toast.success(`✅ Synced ${result.synced} new domains from Netlify!`);
        } else if (result.synced > 0 && silent) {
          console.log(`🔄 Background sync: ${result.synced} new domains synced`);
        }

        // Filter domains based on user permissions
        const isAdminUser = user.email === 'support@backlinkoo.com';
        const filteredDomains = isAdminUser
          ? syncedDomains
          : syncedDomains.filter(d => d.user_id === user.id);

        setDomains(filteredDomains);
        console.log(`📊 Showing ${filteredDomains.length} domains for user`);
      } else {
        throw new Error(result.error || 'Unknown error from edge function');
      }

    } catch (error: any) {
      console.error('❌ Failed to load domains:', error);
      if (!silent) {
        toast.error(`Failed to load domains: ${error.message}`);
      }

      // Fallback to direct database query
      try {
        console.log('🔄 Falling back to direct database query...');
        const isAdminUser = user.email === 'support@backlinkoo.com';
        let query = supabase.from('domains').select('*');

        if (!isAdminUser) {
          query = query.eq('user_id', user.id);
        }

        const { data: fallbackDomains } = await query.order('created_at', { ascending: false });
        setDomains(fallbackDomains || []);
        console.log(`📊 Fallback: loaded ${fallbackDomains?.length || 0} domains from database`);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setDomains([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const cleanDomain = (domain: string): string => {
    return domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const addSingleDomain = async () => {
    if (!newDomain.trim() || !user) return;

    const cleanedDomain = cleanDomain(newDomain);
    setAddingDomain(true);

    try {
      console.log(`➕ Adding domain: ${cleanedDomain}`);

      // Use the new Supabase edge function to add domain
      const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ domain: cleanedDomain })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Add domain result:', result);

      if (result.success) {
        setNewDomain('');
        toast.success(`✅ Domain ${cleanedDomain} added successfully`);
        await loadDomains();
      } else {
        throw new Error(result.error || 'Failed to add domain');
      }

    } catch (error: any) {
      console.error('❌ Failed to add domain:', error);

      if (error.message.includes('23505') || error.message.includes('already exists')) {
        toast.error(`Domain ${cleanedDomain} already exists`);
      } else {
        toast.error(`Failed to add domain: ${error.message}`);
      }
    } finally {
      setAddingDomain(false);
    }
  };

  const addBulkDomains = async () => {
    if (!bulkDomains.trim() || !user) return;

    const domainList = bulkDomains
      .split('\n')
      .map(d => cleanDomain(d))
      .filter(d => d.length > 0 && d.includes('.'));

    if (domainList.length === 0) {
      toast.error('No valid domains found');
      return;
    }

    setAddingBulk(true);

    try {
      console.log(`➕ Adding ${domainList.length} domains in bulk:`, domainList);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Add domains one by one using the edge function
      for (const domain of domainList) {
        try {
          const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ domain })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`${domain}: ${result.error}`);
            }
          } else {
            errorCount++;
            errors.push(`${domain}: HTTP ${response.status}`);
          }
        } catch (domainError) {
          errorCount++;
          errors.push(`${domain}: ${domainError.message}`);
        }
      }

      setBulkDomains('');

      if (successCount > 0) {
        toast.success(`✅ Successfully added ${successCount} domains`);
      }

      if (errorCount > 0) {
        console.warn('⚠️ Some domains failed:', errors);
        toast.warning(`⚠️ ${errorCount} domains failed to add. Check console for details.`);
      }

      await loadDomains();

    } catch (error: any) {
      console.error('❌ Failed to add bulk domains:', error);
      toast.error(`Failed to add domains: ${error.message}`);
    } finally {
      setAddingBulk(false);
    }
  };

  const removeDomain = async (domainName: string) => {
    if (!user) return;

    setRemovingDomain(domainName);

    try {
      console.log(`🗑️ Removing domain: ${domainName}`);

      // Use the new Supabase edge function to remove domain
      const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ domain: domainName })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Remove domain result:', result);

      if (result.success) {
        toast.success(`✅ Domain ${domainName} removed successfully`);
        await loadDomains();
      } else {
        throw new Error(result.error || 'Failed to remove domain');
      }

    } catch (error: any) {
      console.error('❌ Failed to remove domain:', error);
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setRemovingDomain(null);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.error_message) {
      return <Badge variant="destructive">Error</Badge>;
    } else if (domain.netlify_verified && domain.status === 'verified') {
      return <Badge className="bg-green-600">Active</Badge>;
    } else if (domain.netlify_verified) {
      return <Badge className="bg-blue-600">Netlify</Badge>;
    } else if (domain.status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    } else {
      return <Badge variant="outline">Added</Badge>;
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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Domain Manager</h2>
        <p className="text-gray-600">Add and manage your domains with Netlify integration</p>
        {domains.length === 0 && !loading && (
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>First time here?</strong> Click "Sync from Netlify" to automatically import your existing domains:
              <br /><strong>backlinkoo.com</strong> and <strong>leadpages.org</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Add Domains Interface */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Single Domain
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Bulk Add
              </TabsTrigger>
            </TabsList>

            {/* Single Domain Add */}
            <TabsContent value="single" className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !addingDomain && addSingleDomain()}
                  disabled={addingDomain}
                  className="flex-1 text-lg py-3"
                />
                <Button
                  onClick={addSingleDomain}
                  disabled={addingDomain || !newDomain.trim()}
                  size="lg"
                  className="min-w-[120px]"
                >
                  {addingDomain ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Enter a domain name to add to your Netlify account
              </p>
            </TabsContent>

            {/* Bulk Domain Add */}
            <TabsContent value="bulk" className="space-y-4">
              <Textarea
                placeholder={`Enter multiple domains, one per line:
example.com
mydomain.org
another-site.net`}
                value={bulkDomains}
                onChange={(e) => setBulkDomains(e.target.value)}
                className="min-h-[120px] text-base"
                disabled={addingBulk}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {bulkDomains.split('\n').filter(d => d.trim().length > 0).length} domains entered
                </p>
                <Button
                  onClick={addBulkDomains}
                  disabled={addingBulk || !bulkDomains.trim()}
                  size="lg"
                >
                  {addingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <List className="h-4 w-4 mr-2" />
                      Add All Domains
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
              Sync from Netlify
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading domains from database and Netlify...</p>
              <p className="text-sm text-gray-500 mt-2">This will sync any missing domains automatically</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No domains found
              </h3>
              <p className="text-gray-500 mb-6">
                No domains found in database or Netlify account.<br />
                Add your first domain to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{domain.domain}</span>
                        <button
                          onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Added {new Date(domain.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {domain.netlify_verified && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {getStatusBadge(domain)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDomain(domain.domain)}
                      disabled={removingDomain === domain.domain}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingDomain === domain.domain ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Messages */}
          {domains.some(d => d.error_message) && (
            <div className="mt-6">
              <h4 className="font-medium text-red-900 mb-2">Issues Found:</h4>
              {domains
                .filter(d => d.error_message)
                .map(domain => (
                  <Alert key={domain.id} className="mb-2 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      <strong>{domain.domain}:</strong> {domain.error_message}
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDomainManager;
