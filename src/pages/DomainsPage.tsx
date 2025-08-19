import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Settings,
  Eye,
  Terminal
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'active' | 'failed' | 'expired';
  verification_token: string;
  dns_validated: boolean;
  txt_record_validated: boolean;
  a_record_validated: boolean;
  cname_validated: boolean;
  ssl_enabled: boolean;
  blog_enabled: boolean;
  pages_published: number;
  validation_error?: string;
  last_validation_attempt?: string;
  created_at: string;
}

const DomainsPage = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [validatingDomains, setValidatingDomains] = useState<Set<string>>(new Set());
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showDNSInstructions, setShowDNSInstructions] = useState<string | null>(null);

  // Hosting configuration - replace with your actual values
  const HOSTING_CONFIG = {
    ip: '192.168.1.100', // Replace with your actual hosting IP
    cname: 'hosting.backlinkoo.com', // Replace with your actual CNAME target
    domain: 'backlinkoo.com' // Your main domain
  };

  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
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
      // Clean domain input
      const domain = newDomain.trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(domain)) {
        toast.error('Please enter a valid domain name');
        return;
      }

      const { data, error } = await supabase
        .from('domains')
        .insert({
          user_id: user?.id,
          domain,
          status: 'pending',
          required_a_record: HOSTING_CONFIG.ip,
          required_cname: HOSTING_CONFIG.cname
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Domain already exists');
        } else {
          throw error;
        }
        return;
      }

      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      setIsAddDialogOpen(false);
      setShowDNSInstructions(data.id);
      toast.success(`Domain ${domain} added! Configure DNS records to validate.`);

    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const validateDomain = async (domainId: string) => {
    setValidatingDomains(prev => new Set(prev).add(domainId));
    
    try {
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain_id: domainId })
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.validated) {
          toast.success(`Domain ${result.domain} validated successfully!`);
        } else {
          toast.warning(`Domain ${result.domain} validation failed. Check DNS records.`);
        }
        
        // Reload domains to get updated status
        await loadDomains();
      } else {
        throw new Error(result.message || 'Validation failed');
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setValidatingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
      case 'validating':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Validating
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Setup
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getDNSInstructions = (domain: Domain) => [
    {
      type: 'A',
      name: '@',
      value: HOSTING_CONFIG.ip,
      description: 'Points your domain to our hosting server',
      validated: domain.a_record_validated
    },
    {
      type: 'CNAME',
      name: 'www',
      value: domain.domain,
      description: 'Redirects www subdomain to main domain',
      validated: domain.cname_validated
    },
    {
      type: 'TXT',
      name: '@',
      value: `blo-verification=${domain.verification_token}`,
      description: 'Verifies domain ownership',
      validated: domain.txt_record_validated
    }
  ];

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain & DNS Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect your domains to our hosting platform. Add domains, configure DNS records, 
            and validate propagation to start publishing automated content.
          </p>
        </div>

        {/* Add Domain */}
        <div className="text-center mb-8">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Connect New Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Your Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name to start the DNS configuration process.
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
                  Enter domain without http:// or www. (e.g., example.com)
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDomain} disabled={addingDomain}>
                  {addingDomain && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Domains List */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Connected Domains</span>
                  <Button variant="outline" size="sm" onClick={loadDomains}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </CardTitle>
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains connected</h3>
                    <p className="text-gray-500 mb-6">Connect your first domain to start publishing automated content.</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Your First Domain
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {domains.map((domain) => (
                      <div key={domain.id} className="p-6 border rounded-lg hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Globe className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{domain.domain}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                {getStatusBadge(domain)}
                                {domain.blog_enabled && (
                                  <Badge variant="outline" className="text-green-600">
                                    <Terminal className="w-3 h-3 mr-1" />
                                    Blog Active
                                  </Badge>
                                )}
                                {domain.ssl_enabled && (
                                  <Badge variant="outline" className="text-blue-600">
                                    🔒 SSL
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowDNSInstructions(showDNSInstructions === domain.id ? null : domain.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              DNS Setup
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => validateDomain(domain.id)}
                              disabled={validatingDomains.has(domain.id)}
                            >
                              {validatingDomains.has(domain.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Validate DNS
                            </Button>
                            {domain.status === 'active' && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Visit
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* DNS Status Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-600">A Record</div>
                            <div className="flex items-center justify-center mt-1">
                              {domain.a_record_validated ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-600">TXT Record</div>
                            <div className="flex items-center justify-center mt-1">
                              {domain.txt_record_validated ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-600">CNAME Record</div>
                            <div className="flex items-center justify-center mt-1">
                              {domain.cname_validated ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Validation Error */}
                        {domain.validation_error && (
                          <Alert className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {domain.validation_error}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* DNS Instructions */}
                        {showDNSInstructions === domain.id && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                            <h4 className="font-semibold text-blue-900 mb-3">DNS Configuration Instructions</h4>
                            <p className="text-sm text-blue-700 mb-4">
                              Add these DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
                            </p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getDNSInstructions(domain).map((record, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono text-sm">{record.type}</TableCell>
                                    <TableCell className="font-mono text-sm">{record.name}</TableCell>
                                    <TableCell className="font-mono text-sm max-w-xs truncate">{record.value}</TableCell>
                                    <TableCell>
                                      {record.validated ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-gray-400" />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => copyToClipboard(record.value)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                          <span>{domain.pages_published} pages published</span>
                          <span>Added {new Date(domain.created_at).toLocaleDateString()}</span>
                          {domain.last_validation_attempt && (
                            <span>Last checked {new Date(domain.last_validation_attempt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Help */}
          <div className="xl:col-span-1">
            <div className="space-y-6 sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span className="font-medium">Connect Domain</span>
                    </div>
                    <p className="text-gray-600 text-xs ml-8">Add your domain to our system</p>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span className="font-medium">Configure DNS</span>
                    </div>
                    <p className="text-gray-600 text-xs ml-8">Add required DNS records at your registrar</p>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <span className="font-medium">Validate</span>
                    </div>
                    <p className="text-gray-600 text-xs ml-8">Verify DNS propagation and activate domain</p>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                      <span className="font-medium">Publish Content</span>
                    </div>
                    <p className="text-gray-600 text-xs ml-8">Start publishing automated blog content</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      DNS propagation can take 24-48 hours. You can check propagation status anytime using the "Validate DNS" button.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsPage;
