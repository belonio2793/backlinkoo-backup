import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status?: 'pending' | 'validating' | 'validated' | 'error' | 'dns_ready' | 'theme_selection' | 'active';
  netlify_verified?: boolean;
  dns_verified?: boolean;
  created_at: string;
  error_message?: string;
}

const DomainsPageSimple = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    if (user) {
      loadDomains();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDomains = async () => {
    console.log('🔍 Loading domains...');
    setLoading(true);
    
    try {
      // Simulate loading for now to avoid database issues
      setTimeout(() => {
        console.log('✅ Mock domains loaded');
        setDomains([
          {
            id: '1',
            domain: 'example.com',
            status: 'active',
            netlify_verified: true,
            dns_verified: true,
            created_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error loading domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
      setLoading(false);
    }
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

    setAddingDomain(true);
    
    try {
      // Simulate adding domain
      setTimeout(() => {
        const newDomainObj: Domain = {
          id: Date.now().toString(),
          domain: newDomain.trim().toLowerCase(),
          status: 'pending',
          netlify_verified: false,
          dns_verified: false,
          created_at: new Date().toISOString()
        };
        
        setDomains(prev => [newDomainObj, ...prev]);
        setNewDomain('');
        toast.success(`Domain ${newDomain} added successfully (mock)`);
        setAddingDomain(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error adding domain:', error);
      toast.error(`Failed to add domain: ${error.message}`);
      setAddingDomain(false);
    }
  };

  const getStatusBadge = (domain: Domain) => {
    const status = domain.status || 'pending';
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'validating':
        return <Badge variant="secondary" className="animate-pulse">Validating</Badge>;
      case 'dns_ready':
        return <Badge variant="outline" className="border-orange-400 text-orange-600">DNS Ready</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-600">Validated</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Added</Badge>;
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Domain Manager (Simple)
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to manage your domains
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Manager (Simple)
          </h1>
          <p className="text-xl text-gray-600">
            Add and validate domains for your Netlify account
          </p>
        </div>

        {/* Domain Addition Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Domain to Netlify
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
                className="min-w-[140px]"
              >
                {addingDomain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Add to Netlify
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This is a simplified version for testing. Real database integration disabled.
            </p>
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
              <div className="space-y-3">
                {domains.map((domain) => (
                  <Card key={domain.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-xl text-gray-900">{domain.domain}</h3>
                            <p className="text-sm text-gray-500">
                              Added {new Date(domain.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(domain)}
                      </div>

                      {domain.error_message && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-700">{domain.error_message}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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

export default DomainsPageSimple;
