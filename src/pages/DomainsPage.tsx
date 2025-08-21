import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'validated' | 'error';
  netlify_verified: boolean;
  dns_verified: boolean;
  created_at: string;
  error_message?: string;
}

const DomainsPage = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [validatingDomains, setValidatingDomains] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);
        toast.error('Failed to load domains');
        return;
      }

      setDomains(data || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateDomainFormat = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  const cleanDomain = (domain: string) => {
    return domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    if (!user) {
      toast.error('Please sign in to add domains');
      return;
    }

    const cleanedDomain = cleanDomain(newDomain);

    if (!validateDomainFormat(cleanedDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    // Check if domain already exists
    const existingDomain = domains.find(d => d.domain === cleanedDomain);
    if (existingDomain) {
      toast.error('Domain already exists in your list');
      return;
    }

    setAddingDomain(true);

    try {
      // Add domain to database
      const { data, error } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
          status: 'pending',
          netlify_verified: false,
          dns_verified: false,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add to local state
      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      toast.success(`Domain ${cleanedDomain} added successfully`);

      // Auto-validate the domain
      setTimeout(() => {
        validateDomain(data.id);
      }, 1000);

    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAddingDomain(false);
    }
  };

  const validateDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setValidatingDomains(prev => new Set(prev).add(domainId));

    try {
      // Update status to validating
      await supabase
        .from('domains')
        .update({ status: 'validating' })
        .eq('id', domainId);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, status: 'validating' } : d
      ));

      toast.info(`Validating ${domain.domain}...`);

      // Call Netlify validation function
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain.domain,
          domainId: domainId
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update domain status based on validation result
      const updateData = {
        status: result.success ? 'validated' : 'error',
        netlify_verified: result.netlifyVerified || false,
        dns_verified: result.dnsVerified || false,
        error_message: result.success ? null : result.error
      };

      await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updateData } : d
      ));

      if (result.success) {
        toast.success(`✅ ${domain.domain} validated successfully`);
      } else {
        toast.error(`❌ Validation failed for ${domain.domain}: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      
      // Update domain status to error
      const updateData = {
        status: 'error' as const,
        error_message: error.message
      };

      await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updateData } : d
      ));

      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setValidatingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to delete ${domainName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId);

      if (error) {
        throw new Error(error.message);
      }

      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success(`Domain ${domainName} deleted successfully`);
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(`Failed to delete domain: ${error.message}`);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    switch (domain.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'validating':
        return <Badge variant="secondary" className="animate-pulse">Validating</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-600">Validated</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Manager
          </h1>
          <p className="text-xl text-gray-600">
            Add and validate domains for your Netlify account
          </p>
        </div>

        {/* Add Domain Section */}
        <Card className="mb-8">
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
                className="flex-1"
              />
              <Button 
                onClick={addDomain}
                disabled={addingDomain || !newDomain.trim()}
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
          </CardContent>
        </Card>

        {/* Domains List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Domains ({domains.length})</span>
              <Button variant="outline" size="sm" onClick={loadDomains}>
                Refresh
              </Button>
            </CardTitle>
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
                  No domains added yet
                </h3>
                <p className="text-gray-500">
                  Add your first domain to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{domain.domain}</h3>
                        {getStatusBadge(domain)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {domain.netlify_verified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Netlify: {domain.netlify_verified ? 'Verified' : 'Not Found'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {domain.dns_verified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span>DNS: {domain.dns_verified ? 'Valid' : 'Invalid'}</span>
                        </div>
                      </div>

                      {domain.error_message && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {domain.error_message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateDomain(domain.id)}
                        disabled={validatingDomains.has(domain.id)}
                      >
                        {validatingDomains.has(domain.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Validating
                          </>
                        ) : (
                          'Validate'
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDomain(domain.id, domain.domain)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default DomainsPage;
