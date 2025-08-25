import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Copy,
  Eye,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import {
  getAllDomains,
  addDomain,
  syncToNetlify,
  removeDomain,
  testEdgeFunction,
  getSyncStats,
  type Domain
} from '@/services/supabaseToNetlifySync';
import TabbedDomainManager from './TabbedDomainManager';

// Domain interface is now imported from the service
// interface Domain {
//   id: string;
//   name: string;
//   site_id?: string;
//   source: 'supabase' | 'netlify';
//   status: 'pending' | 'active' | 'error';
//   user_id?: string;
//   created_at: string;
//   updated_at: string;
//   error_message?: string;
// }

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  required: boolean;
  description: string;
}

interface DNSSetupInstructions {
  title: string;
  type: 'subdomain' | 'root';
  steps: string[];
  nameservers?: string[];
  dnsRecords: DNSRecord[];
}

const EnhancedDomainManager = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [validatingDomain, setValidatingDomain] = useState<string | null>(null);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');

  // DNS Instructions Modal
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<DNSSetupInstructions | null>(null);

  // Sync state
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, active: 0, error: 0 });
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Editing state
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Primary domain (protected from editing)
  const PRIMARY_DOMAIN = 'backlinkoo.com';

  const isPrimaryDomain = (domainName: string) => {
    return domainName === PRIMARY_DOMAIN;
  };

  useEffect(() => {
    if (user) {
      loadDomains();
      loadSyncStats();
    }
  }, [user]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      console.log('🔍 Syncing domains from Netlify...');

      // First, sync domains from Netlify to ensure we have latest data
      try {
        let syncResult;
        if (useEdgeFunction && edgeFunctionStatus === 'deployed') {
          console.log('🔄 Using edge function for sync...');
          syncResult = await syncDomainsViaEdgeFunction();
          if (!syncResult.success) {
            console.warn('⚠️ Edge function sync failed, falling back to local sync');
            syncResult = await syncAllDomainsFromNetlify();
          }
        } else {
          console.log('🔄 Using local sync...');
          syncResult = await syncAllDomainsFromNetlify();
        }

        if (syncResult.success) {
          console.log(`✅ Netlify sync complete: ${syncResult.message}`);
        } else {
          console.warn(`⚠️ Netlify sync partial: ${syncResult.message}`);
        }
      } catch (syncError) {
        console.warn('⚠️ Netlify sync failed, continuing with database data:', syncError);
      }

      // Load domains from database (after sync), filtering for Netlify domains only
      const { data: domainData, error } = await supabase
        .from('domains')
        .select('*')
        .eq('netlify_verified', true)  // Only show domains that are verified on Netlify
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠�� Domains table not found');
          toast.error('Domains table not found. Please contact support.');
          setDomains([]);
          return;
        }
        throw error;
      }

      console.log(`✅ Loaded ${domainData?.length || 0} Netlify domains from database`);

      // Debug: Log domain data structure
      if (domainData && domainData.length > 0) {
        console.log('🔍 Domain data sample:', domainData[0]);
      }

      // Ensure primary domain is always present
      const domains = domainData || [];
      const hasPrimaryDomain = domains.some(d => d.domain === PRIMARY_DOMAIN);

      if (!hasPrimaryDomain) {
        console.log('🔧 Adding primary domain to database...');
        try {
          const { data: newPrimaryDomain, error: insertError } = await supabase
            .from('domains')
            .insert({
              domain: PRIMARY_DOMAIN,
              status: 'verified',
              netlify_verified: true,
              user_id: user?.id || 'system',
              netlify_site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809'
            })
            .select()
            .single();

          if (!insertError && newPrimaryDomain) {
            domains.unshift(newPrimaryDomain); // Add to beginning
            console.log('✅ Primary domain added successfully');
          }
        } catch (insertError) {
          console.warn('⚠️ Could not add primary domain:', insertError);
        }
      }

      // Sort to ensure primary domain appears first
      const sortedDomains = domains.sort((a, b) => {
        if (isPrimaryDomain(a.domain)) return -1;
        if (isPrimaryDomain(b.domain)) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setDomains(sortedDomains);

    } catch (error: any) {
      console.error('❌ Failed to load domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const syncDomainsToNetlify = async () => {
    setLoading(true);
    try {
      console.log('🔄 Syncing domains from Supabase to Netlify...');
      toast.loading('Syncing domains to Netlify...', { id: 'netlify-sync' });

      const syncResult = await syncToNetlify();

      if (syncResult.success) {
        toast.success(`✅ ${syncResult.message}`, { id: 'netlify-sync' });
        console.log(`✅ Sync successful: ${syncResult.message}`);
        setLastSync(new Date());
      } else {
        toast.error(`Sync failed: ${syncResult.message}`, { id: 'netlify-sync' });
        console.error('❌ Sync failed:', syncResult.error);
      }

      // Reload domains and stats after sync
      await loadDomains();
      await loadSyncStats();

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      toast.error(`Sync failed: ${error.message}`, { id: 'netlify-sync' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      toast.loading('Testing edge function...', { id: 'test-connection' });

      const testResult = await testEdgeFunction();

      if (testResult.success) {
        toast.success(`✅ Edge function working: ${testResult.message}`, { id: 'test-connection' });
        console.log('✅ Edge function test passed');
      } else {
        toast.error(`❌ Edge function test failed: ${testResult.message}`, { id: 'test-connection' });
        console.error('❌ Edge function test failed:', testResult.message);
      }
    } catch (error: any) {
      console.error('❌ Connection test error:', error);
      toast.error(`Test failed: ${error.message}`, { id: 'test-connection' });
    }
  };

  const addNewDomain = async () => {
    if (!newDomain.trim()) return;

    const cleanedDomain = cleanDomain(newDomain);
    setAddingDomain(true);

    try {
      const result = await addDomain(cleanedDomain);

      if (result.success) {
        toast.success(`✅ ${result.message}`);
        setNewDomain('');
        await loadDomains();
        await loadSyncStats();
      } else {
        toast.error(`Failed to add domain: ${result.message}`);
      }

    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAddingDomain(false);
    }
  };

  const startEditing = (domain: Domain) => {
    if (isPrimaryDomain(domain.domain)) {
      toast.warning('Cannot edit primary domain');
      return;
    }
    setEditingDomain(domain.domain);
    setEditingValue(domain.domain);
  };

  const cancelEditing = () => {
    setEditingDomain(null);
    setEditingValue('');
  };

  const saveEdit = async (originalDomain: string) => {
    if (!editingValue.trim() || editingValue === originalDomain) {
      cancelEditing();
      return;
    }

    setSavingEdit(true);
    try {
      // Update domain in database
      const { error } = await supabase
        .from('domains')
        .update({ domain: editingValue.trim() })
        .eq('domain', originalDomain);

      if (error) throw error;

      toast.success(`Domain updated from ${originalDomain} to ${editingValue}`);
      cancelEditing();
      await loadDomains();
    } catch (error: any) {
      console.error('Edit domain error:', error);
      toast.error(`Failed to update domain: ${error.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const validateDomain = async (domain: Domain) => {
    setValidatingDomain(domain.domain);
    
    try {
      // Call validation function
      const { data: result, error } = await supabase.functions.invoke('domains', {
        body: { 
          action: 'validate',
          domain: domain.domain 
        }
      });

      if (error) throw error;

      if (result.success) {
        // Update domain status
        await supabase
          .from('domains')
          .update({
            status: result.validated ? 'verified' : 'dns_ready',
            validation_status: result.validation?.validation_status,
            ssl_status: result.validation?.ssl_configured ? 'active' : 'pending',
          })
          .eq('id', domain.id);

        if (result.validated) {
          toast.success(`✅ Domain ${domain.domain} is now verified!`);
        } else {
          toast.warning(`⏳ Domain ${domain.domain} DNS is still propagating...`);
        }

        await loadDomains();
      } else {
        toast.error(`Validation failed: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error(`Failed to validate: ${error.message}`);
    } finally {
      setValidatingDomain(null);
    }
  };

  const removeDomainHandler = async (domain: Domain) => {
    setRemovingDomain(domain.name);

    try {
      const result = await removeDomain(domain.id);

      if (result.success) {
        toast.success(`✅ ${result.message}`);
        await loadDomains();
        await loadSyncStats();
      } else {
        toast.error(`Failed to remove domain: ${result.message}`);
      }

    } catch (error: any) {
      console.error('Remove domain error:', error);
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setRemovingDomain(null);
    }
  };

  const showDNSSetup = (domain: Domain) => {
    const instructions = generateDNSInstructions(domain.domain);
    setDnsInstructions(instructions);
    setSelectedDomain(domain);
    setShowDNSModal(true);
  };

  const cleanDomain = (domain: string): string => {
    return domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const generateDNSInstructions = (domain: string): DNSSetupInstructions => {
    const isSubdomain = domain.split('.').length > 2;

    if (isSubdomain) {
      return {
        title: 'Subdomain DNS Configuration',
        type: 'subdomain',
        steps: [
          `Add a CNAME record for ${domain}`,
          'Point it to backlinkoo.netlify.app',
          'Wait for DNS propagation (5-30 minutes)',
          'SSL certificate will be automatically provisioned'
        ],
        dnsRecords: [
          {
            type: 'CNAME',
            name: domain.split('.')[0],
            value: 'backlinkoo.netlify.app',
            ttl: 3600,
            required: true,
            description: 'Points subdomain to Netlify'
          }
        ]
      };
    } else {
      return {
        title: 'Root Domain DNS Configuration',
        type: 'root',
        steps: [
          'Add a CNAME record for www subdomain',
          'Point www to backlinkoo.netlify.app',
          'Configure A records for root domain',
          'Wait for DNS propagation (5-30 minutes)',
          'SSL certificate will be automatically provisioned'
        ],
        nameservers: [
          'dns1.p05.nsone.net',
          'dns2.p05.nsone.net',
          'dns3.p05.nsone.net',
          'dns4.p05.nsone.net'
        ],
        dnsRecords: [
          {
            type: 'A',
            name: '@',
            value: '75.2.60.5',
            ttl: 3600,
            required: true,
            description: 'Points root domain to Netlify'
          },
          {
            type: 'CNAME',
            name: 'www',
            value: 'backlinkoo.netlify.app',
            ttl: 3600,
            required: true,
            description: 'Points www subdomain to Netlify'
          }
        ]
      };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.error_message) {
      return <Badge variant="destructive">Error</Badge>;
    } else if (domain.status === 'verified') {
      return <Badge className="bg-green-600">Verified</Badge>;
    } else if (domain.status === 'dns_ready' && domain.netlify_verified) {
      return <Badge className="bg-blue-600">DNS Setup Required</Badge>;
    } else if (domain.netlify_verified) {
      return <Badge className="bg-blue-600">In Netlify</Badge>;
    } else if (domain.status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    } else {
      return <Badge variant="outline">Added</Badge>;
    }
  };

  const getStatusIcon = (domain: Domain) => {
    if (domain.status === 'verified') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (domain.status === 'dns_ready') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else if (domain.error_message) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Automation Link Building Domains</h2>
        <p className="text-gray-600">Add domains for publishing across diversified backlink profile using our content generation and campaigns management system</p>
      </div>


      {/* Tabbed Domain Manager */}
      <TabbedDomainManager
        newDomain={newDomain}
        setNewDomain={setNewDomain}
        addingDomain={addingDomain}
        onAddSingleDomain={addDomain}
        onRefreshDomains={loadDomains}
      />

      {/* Domains List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Your Domains ({domains.length})
            </CardTitle>
            <div className="flex gap-2">
              {/* Edge Function Status Indicator */}
              <div className="flex items-center gap-2 mr-2">
                {edgeFunctionStatus === 'deployed' && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Edge Function</span>
                  </div>
                )}
                {edgeFunctionStatus === 'not-deployed' && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">Local Sync</span>
                  </div>
                )}
                {edgeFunctionStatus === 'unknown' && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium">Checking...</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={loading}
                title="Test edge function and Netlify connections"
              >
                <Shield className="h-4 w-4 mr-2" />
                Test Connection
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={forceNetlifySync}
                disabled={loading}
                title={useEdgeFunction ? "Sync via Supabase Edge Function" : "Sync directly from Netlify"}
                className={edgeFunctionStatus === 'deployed' ? 'border-green-200 bg-green-50' : ''}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : edgeFunctionStatus === 'deployed' ? (
                  <Zap className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {edgeFunctionStatus === 'deployed' ? 'Sync via Edge Function' : 'Sync from Netlify'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Edge Function Deployment Instructions */}
        {edgeFunctionStatus === 'not-deployed' && (
          <div className="px-6 pb-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="font-medium mb-2">Supabase Edge Function Not Deployed</div>
                <div className="text-sm mb-2">
                  For faster and more reliable domain syncing, deploy the Netlify domains edge function:
                </div>
                <code className="bg-orange-100 px-2 py-1 rounded text-sm">
                  supabase functions deploy netlify-domains --no-verify-jwt
                </code>
                <div className="text-xs mt-2 text-orange-600">
                  Currently using direct API sync. Deploy the edge function for production use.
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {edgeFunctionStatus === 'deployed' && (
          <div className="px-6 pb-4">
            <Alert className="border-green-200 bg-green-50">
              <Zap className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium">Edge Function Active</div>
                <div className="text-sm text-green-600">
                  Domain syncing is using the deployed Supabase Edge Function for optimal performance.
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

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
              <p className="text-gray-500">
                Add your first domain to get started with DNS setup and validation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors relative ${
                    isPrimaryDomain(domain.domain)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Primary domain protection overlay */}
                  {isPrimaryDomain(domain.domain) && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-blue-600">
                        Primary
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain)}
                    <div>
                      <div className="flex items-center gap-2">
                        {editingDomain === domain.domain ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-lg font-medium w-64"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') saveEdit(domain.domain);
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEdit(domain.domain)}
                              disabled={savingEdit}
                            >
                              {savingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">
                              {domain.domain || domain.name || 'Unknown Domain'}
                            </span>
                            <button
                              onClick={() => window.open(`https://${domain.domain || domain.name}`, '_blank')}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title={`Visit ${domain.domain || domain.name}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Source:</span> {domain.is_global ? 'Netlify Sync' : 'Manual'} •
                        Added {new Date(domain.created_at).toLocaleDateString()}
                        {domain.netlify_site_id && ` • Site ID: ${domain.netlify_site_id.substring(0, 8)}...`}
                        {isPrimaryDomain(domain.domain) && ' • Primary Domain'}
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
                    {domain.netlify_verified && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {getStatusBadge(domain)}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      {domain.netlify_verified && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showDNSSetup(domain)}
                            title="View DNS Setup"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => validateDomain(domain)}
                            disabled={validatingDomain === domain.domain}
                            title="Validate Domain"
                          >
                            {validatingDomain === domain.domain ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      
                      {!isPrimaryDomain(domain.domain) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDomain(domain)}
                          disabled={removingDomain === domain.domain}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove Domain"
                        >
                          {removingDomain === domain.domain ? (
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

      {/* DNS Setup Instructions Modal */}
      <Dialog open={showDNSModal} onOpenChange={setShowDNSModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              DNS Setup Instructions
            </DialogTitle>
            <DialogDescription>
              Configure your DNS settings to activate {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          
          {dnsInstructions && (
            <div className="space-y-6">
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedDomain?.domain}</strong> has been added to Netlify.
                  Follow these DNS configuration steps to activate your domain.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">{dnsInstructions.title}</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {dnsInstructions.steps.map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>

              {dnsInstructions.nameservers && (
                <div>
                  <h4 className="font-semibold mb-3">Nameservers (Optional)</h4>
                  <div className="space-y-2">
                    {dnsInstructions.nameservers.map((ns, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <code className="text-sm">{ns}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ns)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">DNS Records</h4>
                <div className="space-y-3">
                  {dnsInstructions.dnsRecords.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={record.required ? "default" : "secondary"}>
                            {record.type}
                          </Badge>
                          <span className="text-sm font-medium">{record.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${record.type} ${record.name} ${record.value} ${record.ttl}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Value:</strong> <code>{record.value}</code></p>
                        <p><strong>TTL:</strong> {record.ttl} seconds</p>
                        <p className="text-gray-600">{record.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  DNS changes can take 5-30 minutes to propagate. After configuration,
                  use the validate button to check if your domain is properly configured.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDomainManager;
