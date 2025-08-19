import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
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
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';

const DomainsPage = () => {
  const [domains, setDomains] = useState([
    { id: '1', domain: 'example.com', status: 'active', dns: true },
    { id: '2', domain: 'mysite.net', status: 'pending', dns: false }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [validating, setValidating] = useState<string | null>(null);

  const nameservers = ['ns1.yourdns.com', 'ns2.yourdns.com'];

  const addDomain = () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (domains.find(d => d.domain === domain)) {
      toast.error('Domain already exists');
      return;
    }

    setDomains(prev => [...prev, {
      id: Date.now().toString(),
      domain,
      status: 'pending',
      dns: false
    }]);

    setNewDomain('');
    setIsAddDialogOpen(false);
    toast.success(`Domain ${domain} added successfully!`);
  };

  const validateDNS = async (domainId: string) => {
    setValidating(domainId);
    
    // Simulate DNS validation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDomains(prev => prev.map(d => 
      d.id === domainId 
        ? { ...d, status: 'active', dns: true }
        : d
    ));
    
    setValidating(null);
    toast.success('DNS validation completed!');
  };

  const copyNameserver = (ns: string) => {
    navigator.clipboard.writeText(ns);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Manager
          </h1>
          <p className="text-xl text-gray-600">
            Add domains, configure DNS, and validate propagation
          </p>
        </div>

        {/* Add Domain */}
        <div className="text-center mb-8">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDomain}>Add Domain</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Nameservers */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Nameservers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Point your domain to these nameservers:
                </p>
                {nameservers.map((ns, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">{ns}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyNameserver(ns)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Domains */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Domains</CardTitle>
              </CardHeader>
              <CardContent>
                {domains.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No domains added</h3>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Domain
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {domains.map((domain) => (
                      <div key={domain.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Globe className="h-5 w-5 text-blue-600" />
                              <h3 className="font-medium">{domain.domain}</h3>
                              {domain.status === 'active' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNS: {domain.dns ? '✅ Configured' : '⏳ Pending'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => validateDNS(domain.id)}
                              disabled={validating === domain.id}
                            >
                              {validating === domain.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Validate
                            </Button>
                            {domain.status === 'active' && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
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
