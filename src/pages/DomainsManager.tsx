import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Globe, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Settings,
  Server,
  Copy,
  Info,
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
  status: 'pending' | 'active' | 'configured' | 'error';
  nameservers_configured: boolean;
  ssl_enabled: boolean;
  pages_count: number;
  created_at: string;
  dns_records?: {
    type: string;
    name: string;
    value: string;
  }[];
}

const DomainsManager = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<HostedDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Your server nameservers (replace with actual values)
  const SERVER_NAMESERVERS = [
    'ns1.yourserver.com',
    'ns2.yourserver.com'
  ];

  const SERVER_IP = '192.168.1.100'; // Replace with actual server IP

  // Mock data for demo
  const mockDomains: HostedDomain[] = [
    {
      id: '1',
      domain: 'example.com',
      status: 'active',
      nameservers_configured: true,
      ssl_enabled: true,
      pages_count: 5,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      domain: 'demo-site.net',
      status: 'pending',
      nameservers_configured: false,
      ssl_enabled: false,
      pages_count: 0,
      created_at: new Date().toISOString()
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDomains(mockDomains);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    setAddingDomain(true);
    try {
      // Basic domain validation
      const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Check if domain already exists
      const exists = domains.find(d => d.domain === domain);
      if (exists) {
        toast.error('Domain already exists');
        return;
      }

      // TODO: Add to database
      const newDomainRecord: HostedDomain = {
        id: Date.now().toString(),
        domain,
        status: 'pending',
        nameservers_configured: false,
        ssl_enabled: false,
        pages_count: 0,
        created_at: new Date().toISOString()
      };

      setDomains(prev => [newDomainRecord, ...prev]);
      setNewDomain('');
      setIsAddDialogOpen(false);
      toast.success('Domain added! Configure nameservers to activate hosting.');

    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const deleteDomain = async (domainId: string) => {
    try {
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success('Domain removed successfully');
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusBadge = (domain: HostedDomain) => {
    switch (domain.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800"><Server className="w-3 h-3 mr-1" />Configured</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Loader2 className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to manage your hosted domains.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Server className="h-8 w-8 text-blue-600" />
                Domain Hosting Manager
              </h1>
              <p className="text-gray-600">
                Point your domains to our servers and build pages hosted on your custom domains.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Domain for Hosting</DialogTitle>
                  <DialogDescription>
                    Add a domain that you want to host on our servers. You'll need to configure nameservers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Domain Name</Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addDomain} disabled={addingDomain}>
                    {addingDomain && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Domain
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList>
            <TabsTrigger value="domains">Hosted Domains</TabsTrigger>
            <TabsTrigger value="nameservers">Nameserver Setup</TabsTrigger>
            <TabsTrigger value="dns">DNS Management</TabsTrigger>
            <TabsTrigger value="pages">Page Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Hosted Domains</CardTitle>
                <CardDescription>
                  Domains configured to be hosted on our infrastructure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading domains...
                  </div>
                ) : domains.length === 0 ? (
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains configured yet</h3>
                    <p className="text-gray-600 mb-4">Add your first domain to start hosting pages.</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Domain
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>SSL</TableHead>
                        <TableHead>Pages</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{domain.domain}</div>
                                {domain.status === 'active' && (
                                  <a 
                                    href={`https://${domain.domain}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    Visit <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(domain)}
                          </TableCell>
                          <TableCell>
                            {domain.ssl_enabled ? (
                              <Badge variant="outline" className="text-green-600">
                                <Shield className="w-3 h-3 mr-1" />Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                <AlertCircle className="w-3 h-3 mr-1" />Disabled
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{domain.pages_count}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(domain.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Zap className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove "{domain.domain}" from hosting? This will disable all pages on this domain.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteDomain(domain.id)}>
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nameservers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Nameserver Configuration
                </CardTitle>
                <CardDescription>
                  Configure your domain registrar to point to our nameservers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      To host your domain on our servers, you need to update the nameservers at your domain registrar (GoDaddy, Namecheap, etc.) to point to our nameservers.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Required Nameservers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SERVER_NAMESERVERS.map((ns, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-mono text-sm">{ns}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(ns)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Server IP Address</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg max-w-md">
                      <span className="font-mono text-sm">{SERVER_IP}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(SERVER_IP)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Log into your domain registrar's control panel</li>
                      <li>Find the "Nameservers" or "DNS" section</li>
                      <li>Replace existing nameservers with our nameservers above</li>
                      <li>Save changes (propagation may take 24-48 hours)</li>
                      <li>Return here to verify and activate hosting</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DNS Management</CardTitle>
                <CardDescription>
                  Manage DNS records for your hosted domains.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">DNS Management Coming Soon</h3>
                  <p className="text-gray-600">
                    Advanced DNS record management will be available once domains are configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Builder Integration</CardTitle>
                <CardDescription>
                  Build and manage pages for your hosted domains.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Builder Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Build beautiful pages directly on your hosted domains with our integrated page builder.
                  </p>
                  <Button disabled>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsManager;
