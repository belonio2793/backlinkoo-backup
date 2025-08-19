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
  Target,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import UserDomainsService, { UserDomain } from '@/services/userDomainsService';

const DomainsManager = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<UserDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainNotes, setNewDomainNotes] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const domainsData = await UserDomainsService.getUserDomains();
      setDomains(domainsData);
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
      // Check if domain already exists
      const exists = await UserDomainsService.domainExists(newDomain.trim());
      if (exists) {
        toast.error('Domain already exists');
        return;
      }

      // Create the domain
      const newDomainRecord = await UserDomainsService.createDomain({
        domain: newDomain.trim(),
        url: '', // Will be set by the service
        notes: newDomainNotes.trim() || undefined
      });

      // Update local state
      setDomains(prev => [newDomainRecord, ...prev]);
      setNewDomain('');
      setNewDomainNotes('');
      setIsAddDialogOpen(false);
      toast.success('Domain added successfully');

      // Trigger verification after a short delay
      setTimeout(async () => {
        try {
          const result = await UserDomainsService.verifyDomain(newDomainRecord.id);
          if (result.verified) {
            // Reload domains to get updated status
            await loadDomains();
            toast.success(`Domain ${newDomainRecord.domain} verified`);
          } else {
            toast.warning(`Domain verification failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error('Domain verification failed');
        }
      }, 2000);

    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const deleteDomain = async (domainId: string) => {
    try {
      // For now, remove from local state - replace with actual Supabase delete
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success('Domain deleted successfully');
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain');
    }
  };

  const getStatusBadge = (status: UserDomain['status'], verified: boolean) => {
    if (status === 'verifying') {
      return <Badge variant="outline" className="text-yellow-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying</Badge>;
    }
    if (verified && status === 'active') {
      return <Badge variant="outline" className="text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
    }
    return <Badge variant="outline" className="text-red-600"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to manage your domains.
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
                <Globe className="h-8 w-8 text-blue-600" />
                Domain Manager
              </h1>
              <p className="text-gray-600">
                Manage your domains for automated backlink generation and content distribution.
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
                  <DialogTitle>Add New Domain</DialogTitle>
                  <DialogDescription>
                    Add a domain to use for automated blog post generation and backlink building.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Domain or URL</Label>
                    <Input
                      id="domain"
                      placeholder="example.com or https://example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Description or purpose of this domain"
                      value={newDomainNotes}
                      onChange={(e) => setNewDomainNotes(e.target.value)}
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
            <TabsTrigger value="domains">My Domains</TabsTrigger>
            <TabsTrigger value="integration">Automation Integration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Domains</CardTitle>
                <CardDescription>
                  Manage domains that will be used for automated content generation and backlink building.
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
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains added yet</h3>
                    <p className="text-gray-600 mb-4">Add your first domain to start building automated backlinks.</p>
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
                        <TableHead>Added</TableHead>
                        <TableHead>Notes</TableHead>
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
                                <a 
                                  href={domain.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  Visit <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(domain.status, domain.verified)}
                          </TableCell>
                          <TableCell>
                            {new Date(domain.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {domain.notes || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{domain.domain}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteDomain(domain.id)}>
                                      Delete
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

          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Backlink Automation Integration
                </CardTitle>
                <CardDescription>
                  Configure how your domains integrate with the automated backlink generation system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <LinkIcon className="h-4 w-4" />
                    <AlertDescription>
                      Your domains will be automatically used as target URLs in backlink campaigns created from the <strong>/home</strong> page automation tool.
                      Each domain can receive blog posts with contextual backlinks to boost SEO performance.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Content Generation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          Automatically generate high-quality blog posts targeting your domains.
                        </p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            SEO-optimized content
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Contextual backlinks
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Keyword targeting
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Campaign Integration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          Your domains are automatically available in campaign creation.
                        </p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Auto-populated target URLs
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Domain rotation
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Performance tracking
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-center">
                    <Button asChild>
                      <a href="/automation">
                        <Target className="h-4 w-4 mr-2" />
                        Create Backlink Campaign
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Domain Performance Analytics
                </CardTitle>
                <CardDescription>
                  Track the performance of your domains in backlink campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-600">
                    Domain performance analytics will be available after you create your first campaigns.
                  </p>
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
