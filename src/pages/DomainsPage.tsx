import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Globe, 
  Plus, 
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'active' | 'error' | 'propagating';
  dns_configured: boolean;
  ssl_enabled: boolean;
  created_at: string;
}

const DomainsPage = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: '1',
      domain: 'example.com',
      status: 'active',
      dns_configured: true,
      ssl_enabled: true,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      domain: 'mysite.net',
      status: 'propagating',
      dns_configured: false,
      ssl_enabled: false,
      created_at: '2024-01-20'
    }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  // Your nameservers (replace with actual values)
  const NAMESERVERS = [
    'ns1.yourdns.com',
    'ns2.yourdns.com'
  ];

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setLoading(true);
    try {
      const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Check if domain already exists
      if (domains.find(d => d.domain === domain)) {
        toast.error('Domain already exists');
        return;
      }

      const newDomainRecord: Domain = {
        id: Date.now().toString(),
        domain,
        status: 'pending',
        dns_configured: false,
        ssl_enabled: false,
        created_at: new Date().toLocaleDateString()
      };

      setDomains(prev => [newDomainRecord, ...prev]);
      setNewDomain('');
      setIsAddDialogOpen(false);
      toast.success(`Domain ${domain} added! Configure DNS settings.`);

    } catch (error) {
      toast.error('Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const validateDNS = async (domainId: string) => {
    setChecking(domainId);
    try {
      // Simulate DNS validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDomains(prev => prev.map(d => 
        d.id === domainId 
          ? { 
              ...d, 
              status: Math.random() > 0.3 ? 'active' : 'error',
              dns_configured: Math.random() > 0.3,
              ssl_enabled: Math.random() > 0.5
            }
          : d
      ));
      
      const domain = domains.find(d => d.id === domainId);
      toast.success(`DNS validation completed for ${domain?.domain}`);
      
    } catch (error) {
      toast.error('DNS validation failed');
    } finally {
      setChecking(null);
    }
  };

  const copyNameserver = (ns: string) => {
    navigator.clipboard.writeText(ns);
    toast.success('Nameserver copied to clipboard!');
  };

  const getStatusBadge = (domain: Domain) => {
    switch (domain.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'propagating':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Propagating
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Alert className="max-w-md mx-auto">
            <Globe className="h-4 w-4" />
            <AlertDescription>
              Please sign in to manage your domains and DNS settings.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Domain & DNS Manager
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add your domains, configure DNS settings, and validate propagation status.
          </p>
        </div>

        {/* Add Domain Button */}
        <div className="flex justify-center mb-8">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name to add it to your DNS management.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter domain without http:// or www.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDomain} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Nameservers */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Nameservers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Update your domain registrar to use these nameservers:
                </p>
                {NAMESERVERS.map((ns, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-500">NS{index + 1}</div>
                      <div className="font-mono text-sm font-medium">{ns}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyNameserver(ns)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    DNS propagation can take 24-48 hours after updating nameservers.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Domains List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Domains</CardTitle>
              </CardHeader>
              <CardContent>
                {domains.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No domains added</h3>
                    <p className="text-gray-500 mb-4">Add your first domain to get started.</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Domain
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {domains.map((domain) => (
                      <div key={domain.id} className="p-4 border rounded-lg hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Globe className="h-5 w-5 text-blue-600" />
                              <h3 className="font-medium text-gray-900">{domain.domain}</h3>
                              {getStatusBadge(domain)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                {domain.dns_configured ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Clock className="h-3 w-3 text-yellow-600" />
                                )}
                                DNS {domain.dns_configured ? 'Configured' : 'Pending'}
                              </span>
                              <span className="flex items-center gap-1">
                                {domain.ssl_enabled ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Clock className="h-3 w-3 text-gray-400" />
                                )}
                                SSL {domain.ssl_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <span>Added {domain.created_at}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => validateDNS(domain.id)}
                              disabled={checking === domain.id}
                            >
                              {checking === domain.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Validate DNS
                            </Button>
                            {domain.status === 'active' && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Visit
                                </a>
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsPage;
