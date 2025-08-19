import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

interface HostedDomain {
  id: string;
  domain: string;
  status: 'setup' | 'active' | 'pending';
  ssl_enabled: boolean;
  pages_count: number;
  created_at: string;
}

const DomainsManager = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<HostedDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Your hosting nameservers - replace with real values
  const NAMESERVERS = [
    'ns1.yourhost.com',
    'ns2.yourhost.com'
  ];

  // Sample domains for demo
  const sampleDomains: HostedDomain[] = [
    {
      id: '1',
      domain: 'mybusiness.com',
      status: 'active',
      ssl_enabled: true,
      pages_count: 12,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      domain: 'startup-demo.net',
      status: 'pending',
      ssl_enabled: false,
      pages_count: 0,
      created_at: '2024-01-20'
    }
  ];

  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setDomains(sampleDomains);
    } catch (error) {
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setAddingDomain(true);
    try {
      const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      const newDomainRecord: HostedDomain = {
        id: Date.now().toString(),
        domain,
        status: 'setup',
        ssl_enabled: false,
        pages_count: 0,
        created_at: new Date().toLocaleDateString()
      };

      setDomains(prev => [newDomainRecord, ...prev]);
      setNewDomain('');
      setIsAddDialogOpen(false);
      toast.success('Domain added! Follow the setup steps below.');

    } catch (error) {
      toast.error('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const copyNameserver = (ns: string) => {
    navigator.clipboard.writeText(ns);
    toast.success('Nameserver copied!');
  };

  const getStatusDisplay = (domain: HostedDomain) => {
    switch (domain.status) {
      case 'active':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Live
            </Badge>
            {domain.ssl_enabled && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                SSL
              </Badge>
            )}
          </div>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Propagating
          </Badge>
        );
      case 'setup':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Setup Required
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
          <div className="max-w-md mx-auto">
            <Alert className="border-blue-200 bg-blue-50">
              <Globe className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please sign in to manage your hosted domains.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Host Your Domains
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Point your domains to our servers and build beautiful pages with ease. 
            No technical knowledge required.
          </p>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Add Your Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Add Your Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name to start hosting it on our platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="domain" className="text-sm font-medium">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Don't include http:// or www.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDomain} disabled={addingDomain} className="bg-blue-600 hover:bg-blue-700">
                  {addingDomain && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Setup Instructions */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Quick Setup Guide
            </CardTitle>
            <CardDescription className="text-blue-700">
              Follow these simple steps to get your domain live on our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Add Domain</h3>
                <p className="text-sm text-blue-700">
                  Click "Add Your Domain" and enter your domain name.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Update Nameservers</h3>
                <p className="text-sm text-blue-700">
                  Point your domain to our nameservers at your registrar.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Start Building</h3>
                <p className="text-sm text-blue-700">
                  Create beautiful pages with our page builder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nameservers Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Nameservers</CardTitle>
            <CardDescription>
              Update these nameservers at your domain registrar (GoDaddy, Namecheap, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NAMESERVERS.map((ns, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <div className="text-sm text-gray-500">Nameserver {index + 1}</div>
                    <div className="font-mono text-lg font-semibold">{ns}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyNameserver(ns)}
                    className="ml-4"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domains List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Hosted Domains</CardTitle>
            <CardDescription>
              Manage and monitor your domains hosted on our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading your domains...</span>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No domains yet</h3>
                <p className="text-gray-500 mb-6">Add your first domain to get started with hosting.</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Domain
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="p-6 border rounded-lg hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Globe className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{domain.domain}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            {getStatusDisplay(domain)}
                            <span className="text-sm text-gray-500">
                              {domain.pages_count} pages
                            </span>
                            <span className="text-sm text-gray-500">
                              Added {domain.created_at}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {domain.status === 'active' && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Zap className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
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

export default DomainsManager;
