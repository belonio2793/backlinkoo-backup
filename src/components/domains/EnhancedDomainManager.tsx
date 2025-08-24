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
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'removed' | 'error' | 'dns_ready';
  user_id: string;
  netlify_verified: boolean;
  created_at: string;
  error_message?: string;
  dns_records?: DNSRecord[];
  netlify_site_id?: string;
  validation_status?: string;
  ssl_status?: string;
}

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

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const { data: domainData, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Domains table not found. Please contact support.');
          setDomains([]);
          return;
        }
        throw error;
      }

      setDomains(domainData || []);

      // Try to sync with Netlify
      try {
        const { data: netlifyResult } = await supabase.functions.invoke('domains', {
          body: { action: 'sync' }
        });

        if (netlifyResult?.success && netlifyResult.synced > 0) {
          toast.success(`✅ Synced ${netlifyResult.synced} domains from Netlify!`);
          // Reload after sync
          const { data: updatedData } = await supabase
            .from('domains')
            .select('*')
            .order('created_at', { ascending: false });
          setDomains(updatedData || []);
        }
      } catch (netlifyError) {
        console.warn('Netlify sync unavailable:', netlifyError);
      }

    } catch (error: any) {
      console.error('Failed to load domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    const cleanedDomain = cleanDomain(newDomain);
    setAddingDomain(true);

    try {
      // First add to database
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          status: 'pending',
          netlify_verified: false,
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('Domain already exists');
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Then try to add to Netlify
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: cleanedDomain,
          domainId: dbDomain.id 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update database with Netlify success
        await supabase
          .from('domains')
          .update({
            netlify_verified: true,
            status: 'dns_ready',
            netlify_site_id: result.netlifyData?.site_id,
            dns_records: result.dnsInstructions?.dnsRecords,
          })
          .eq('id', dbDomain.id);

        toast.success(`✅ Domain ${cleanedDomain} added to Netlify!`);
        
        // Show DNS setup instructions
        const instructions = generateDNSInstructions(cleanedDomain);
        setDnsInstructions(instructions);
        setSelectedDomain({ ...dbDomain, dns_records: instructions.dnsRecords });
        setShowDNSModal(true);
      } else {
        // Update database with error
        await supabase
          .from('domains')
          .update({
            status: 'error',
            error_message: result.error,
          })
          .eq('id', dbDomain.id);

        toast.error(`Failed to add to Netlify: ${result.error}`);
      }

      setNewDomain('');
      await loadDomains();

    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAddingDomain(false);
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

  const removeDomain = async (domain: Domain) => {
    setRemovingDomain(domain.domain);

    try {
      // Try to remove from Netlify first
      if (domain.netlify_verified) {
        const response = await fetch('/netlify/functions/add-domain-to-netlify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'remove',
            domain: domain.domain 
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success(`Removed ${domain.domain} from Netlify`);
        }
      }

      // Remove from database
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domain.id);

      if (error) throw error;

      toast.success(`✅ Domain ${domain.domain} removed successfully`);
      await loadDomains();

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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Domain Manager</h2>
        <p className="text-gray-600">Add domains to Netlify with DNS setup instructions and validation</p>
      </div>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !addingDomain && addDomain()}
              disabled={addingDomain}
              className="flex-1 text-lg py-3"
            />
            <Button
              onClick={addDomain}
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
          <p className="text-sm text-gray-500 mt-2">
            Domain will be added to Netlify and you'll receive DNS setup instructions
          </p>
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
              <p className="text-gray-500">
                Add your first domain to get started with DNS setup and validation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain)}
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
                        {domain.netlify_site_id && ` • Site ID: ${domain.netlify_site_id.substring(0, 8)}...`}
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
