import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  ExternalLink,
  Zap
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

const DomainsManager = () => {
  const { isAuthenticated } = useAuthState();
  const [domains] = useState([
    {
      id: '1',
      domain: 'example.com',
      status: 'active',
      pages: 5,
      ssl: true
    },
    {
      id: '2',
      domain: 'demo.net',
      status: 'pending',
      pages: 0,
      ssl: false
    }
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  const nameservers = ['ns1.yourhost.com', 'ns2.yourhost.com'];

  const copyNameserver = (ns: string) => {
    navigator.clipboard.writeText(ns);
    toast.success('Copied to clipboard!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Globe className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to manage your hosted domains.</p>
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
          <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Host Your Domains
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Point your domains to our servers and build beautiful pages with ease.
          </p>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Add Your Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Your Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name to start hosting it on our platform.
                </DialogDescription>
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
                <Button onClick={() => {
                  toast.success('Domain added!');
                  setNewDomain('');
                  setIsAddDialogOpen(false);
                }}>
                  Add Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Setup */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                <h3 className="font-semibold mb-2">Add Domain</h3>
                <p className="text-sm text-gray-600">Click "Add Your Domain" above</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                <h3 className="font-semibold mb-2">Update Nameservers</h3>
                <p className="text-sm text-gray-600">Point to our nameservers below</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                <h3 className="font-semibold mb-2">Start Building</h3>
                <p className="text-sm text-gray-600">Create pages on your domain</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nameservers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Nameservers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nameservers.map((ns, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Nameserver {index + 1}</div>
                    <div className="font-mono font-semibold">{ns}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyNameserver(ns)}>
                    <Copy className="h-4 w-4" />
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
          </CardHeader>
          <CardContent>
            {domains.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No domains yet</h3>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Domain
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="p-6 border rounded-lg hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Globe className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold">{domain.domain}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {domain.status === 'active' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />Live
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />Pending
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">{domain.pages} pages</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {domain.status === 'active' && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />Visit
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Zap className="h-4 w-4 mr-1" />Manage
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
