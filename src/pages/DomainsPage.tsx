import React, { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

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

const DomainsPage = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      // First sync domains from Netlify
      await syncFromNetlify();
      
      // Load domains from database
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDomains(data || []);
      console.log(`Loaded ${data?.length || 0} domains`);
    } catch (error: any) {
      console.error('Failed to load domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncFromNetlify = async () => {
    try {
      // Get domains from Netlify
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_site_info' }),
      });

      const result = await response.json();
      
      if (result.success && result.domains) {
        console.log('Netlify domains found:', result.domains);
        
        // Sync each domain to database
        for (const domain of result.domains) {
          await upsertDomain(domain);
        }
      }
    } catch (error) {
      console.warn('Netlify sync failed:', error);
    }
  };

  const upsertDomain = async (domainName: string) => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .upsert({
          domain: domainName,
          user_id: user?.id,
          status: 'verified',
          netlify_verified: true,
          netlify_site_id: NETLIFY_SITE_ID,
        }, {
          onConflict: 'user_id,domain',
          ignoreDuplicates: false
        })
        .select();

      if (error && !error.message.includes('duplicate key')) {
        console.error('Failed to upsert domain:', error);
      }
    } catch (error) {
      console.warn('Domain upsert warning:', error);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    const cleanedDomain = newDomain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    setAdding(true);
    try {
      // First add to database
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
          user_id: user?.id,
          status: 'pending',
          netlify_verified: false,
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('Domain already exists');
        }
        throw dbError;
      }

      // Add to Netlify
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
        // Update database with success
        await supabase
          .from('domains')
          .update({
            status: 'verified',
            netlify_verified: true,
            netlify_site_id: NETLIFY_SITE_ID,
          })
          .eq('id', dbDomain.id);

        toast.success(`✅ ${cleanedDomain} added successfully!`);
        setNewDomain('');
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

      await loadDomains();
    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (domain: Domain) => {
    setRemoving(domain.id);
    try {
      // Remove from database
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domain.id);

      if (error) throw error;

      toast.success(`✅ ${domain.domain} removed successfully`);
      await loadDomains();
    } catch (error: any) {
      console.error('Remove domain error:', error);
      toast.error(`Failed to remove domain: ${error.message}`);
    } finally {
      setRemoving(null);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'verified' && domain.netlify_verified) {
      return <Badge className="bg-green-600">Active</Badge>;
    } else if (domain.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Management</h1>
          <p className="text-gray-600">
            Manage domains for your Netlify site (ID: {NETLIFY_SITE_ID.substring(0, 8)}...)
          </p>
        </div>

        {/* Add Domain Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter domain (e.g., example.com)"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                disabled={adding}
              />
              <Button onClick={addDomain} disabled={adding || !newDomain.trim()}>
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Domain
              </Button>
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                Domains will be added as aliases to your Netlify site. DNS configuration instructions will be provided after adding.
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
                <p className="text-gray-500">
                  Add your first domain to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
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
                      
                      {!isPrimaryDomain(domain.domain) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDomain(domain)}
                          disabled={removing === domain.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removing === domain.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert className="mt-6">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Next Steps:</strong> After adding a domain, configure your DNS records to point to Netlify. 
            Contact support if you need help with DNS configuration.
          </AlertDescription>
        </Alert>
      </div>

      <Footer />
    </div>
  );
};

export default DomainsPage;
