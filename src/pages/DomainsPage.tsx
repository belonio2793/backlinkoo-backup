import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
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
  Terminal,
  Trash2,
  Upload,
  Download,
  Settings,
  Play,
  Pause,
  Edit3,
  Save,
  Palette
} from 'lucide-react';
import DomainBlogTemplateManager from '@/components/DomainBlogTemplateManager';
import DNSValidationService from '@/services/dnsValidationService';
import AutoDNSPropagation from '@/components/AutoDNSPropagation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NetworkStatus } from '@/components/NetworkStatus';

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);

    // Extract meaningful error message
    let errorMessage = 'An unexpected error occurred';

    if (event.reason instanceof Error) {
      errorMessage = event.reason.message;
    } else if (typeof event.reason === 'string') {
      errorMessage = event.reason;
    } else if (event.reason && typeof event.reason === 'object') {
      errorMessage = event.reason.message || JSON.stringify(event.reason);
    }

    // Show user-friendly error
    toast.error(`System Error: ${errorMessage}`);

    // Prevent the default handling (console error)
    event.preventDefault();
  });
}

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
  required_a_record?: string;
  required_cname?: string;
  hosting_provider?: string;
  blog_subdirectory?: string;
  auto_retry_count?: number;
  max_retries?: number;
}

interface HostingConfig {
  ip: string;
  cname: string;
  provider: string;
  autoSSL: boolean;
  defaultSubdirectory: string;
}

const DomainsPage = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [bulkDomains, setBulkDomains] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  const [validatingDomains, setValidatingDomains] = useState<Set<string>>(new Set());
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [dnsServiceStatus, setDnsServiceStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  // Calculate blog-enabled domains for UI messaging
  const blogEnabledDomains = domains.filter(d => d.blog_enabled);

  // Hosting configuration - editable
  const [hostingConfig, setHostingConfig] = useState<HostingConfig>({
    ip: '192.168.1.100', // Replace with your actual hosting IP
    cname: 'hosting.backlinkoo.com', // Replace with your actual CNAME target
    provider: 'backlinkoo',
    autoSSL: true,
    defaultSubdirectory: 'blog'
  });

  useEffect(() => {
    if (user?.id) {
      loadDomains().catch((error) => {
        console.error('Failed to load domains on mount:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        toast.error(`Failed to load domains: ${errorMessage}`);
      });

      // Check DNS service status on load
      checkDNSServiceHealth();
    }
  }, [user?.id]);

  // Check DNS service health
  const checkDNSServiceHealth = async () => {
    const status = await DNSValidationService.checkServiceHealth();
    setDnsServiceStatus(status);
  };

  // Fix domains missing verification tokens
  useEffect(() => {
    const fixMissingTokens = async () => {
      const domainsNeedingTokens = domains.filter(d => !d.verification_token);

      if (domainsNeedingTokens.length > 0) {
        console.log(`🔧 Fixing ${domainsNeedingTokens.length} domains without verification tokens`);

        for (const domain of domainsNeedingTokens) {
          try {
            const token = generateVerificationToken();
            await updateDomain(domain.id, { verification_token: token });
          } catch (error) {
            console.error(`Failed to add token to ${domain.domain}:`, error);
          }
        }
      }
    };

    if (domains.length > 0) {
      fixMissingTokens().catch(console.error);
    }
  }, [domains]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 
                           error?.details || 
                           'Unknown error occurred';
        throw new Error(errorMessage);
      }
      
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to load domains: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanDomain = (domain: string) => {
    return domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const validateDomainFormat = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  const generateVerificationToken = () => {
    // Generate a unique verification token
    return 'blo-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const addSingleDomain = async (domainName: string) => {
    const domain = cleanDomain(domainName);

    if (!validateDomainFormat(domain)) {
      throw new Error(`Invalid domain format: ${domainName}`);
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .insert({
          user_id: user?.id,
          domain,
          status: 'pending',
          verification_token: generateVerificationToken(), // Explicitly set verification token
          required_a_record: hostingConfig.ip,
          required_cname: hostingConfig.cname,
          hosting_provider: hostingConfig.provider,
          blog_subdirectory: hostingConfig.defaultSubdirectory,
          ssl_enabled: hostingConfig.autoSSL,
          blog_enabled: false
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding domain:', error);
        
        // Handle Supabase error object properly
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 
                           error?.details || 
                           error?.hint ||
                           JSON.stringify(error);
        
        if (error.code === '23505') {
          throw new Error(`Domain ${domain} already exists`);
        }
        if (error.code === '23503') {
          throw new Error(`Authentication error: Please sign out and sign in again`);
        }
        if (error.code === '23502') {
          throw new Error(`Required field missing: Please try again or contact support`);
        }
        if (error.code === 'PGRST301') {
          throw new Error(`Database error: Please try again in a moment`);
        }
        if (errorMessage?.includes('Failed to fetch')) {
          throw new Error(`Network error: Please check your connection and try again`);
        }
        if (errorMessage?.includes('timeout')) {
          throw new Error(`Request timeout: Please try again`);
        }
        if (errorMessage?.includes('JWT')) {
          throw new Error(`Authentication error: Please sign in again`);
        }
        if (errorMessage?.includes('permission')) {
          throw new Error(`Permission denied: Please check your access rights`);
        }
        
        // Generic error with helpful message
        throw new Error(`Failed to add domain: ${errorMessage}`);
      }

      if (!data) {
        throw new Error('Domain was added but no data returned');
      }

      return data;
    } catch (networkError: any) {
      console.error('Network error adding domain:', networkError);
      
      // Handle error object properly
      const errorMessage = typeof networkError === 'string' ? networkError :
                          networkError?.message ||
                          networkError?.details ||
                          networkError?.toString() ||
                          'Unknown error';
      
      if (errorMessage.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      if (networkError.name === 'AbortError') {
        throw new Error('Request was cancelled due to timeout. Please try again.');
      }
      if (errorMessage.includes('NetworkError')) {
        throw new Error('Network error occurred. Please check your connection and try again.');
      }
      if (errorMessage.includes('body stream already read')) {
        throw new Error('Request processing error. Please refresh the page and try again.');
      }
      
      // Re-throw if it's already a formatted error
      if (networkError instanceof Error && networkError.message && !networkError.message.includes('[object Object]')) {
        throw networkError;
      }
      
      // Fallback for unknown errors
      throw new Error(`Unexpected error adding domain: ${domain}. Error: ${errorMessage}`);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setAddingDomain(true);
    try {
      const data = await addSingleDomain(newDomain);
      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      toast.success(`Domain ${data.domain} added successfully!`);
    } catch (error: any) {
      console.error('Error adding domain:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setAddingDomain(false);
    }
  };

  const addBulkDomains = async () => {
    if (!bulkDomains.trim()) {
      toast.error('Please enter domains to add');
      return;
    }

    setAddingBulk(true);
    const domainList = bulkDomains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const domainName of domainList) {
        try {
          const data = await addSingleDomain(domainName);
          setDomains(prev => [data, ...prev]);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const errorMessage = error?.message || 'Unknown error';
          errors.push(`${domainName}: ${errorMessage}`);
        }
      }

      setBulkDomains('');
      setShowBulkAdd(false);
      
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} domain${successCount > 1 ? 's' : ''}`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} domain${errorCount > 1 ? 's' : ''}. Check console for details.`);
        console.error('Bulk domain errors:', errors);
      }

    } catch (error: any) {
      console.error('Bulk add error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to process bulk domains: ${errorMessage}`);
    } finally {
      setAddingBulk(false);
    }
  };

  const updateDomain = async (domainId: string, updates: Partial<Domain>) => {
    try {
      const { error } = await supabase
        .from('domains')
        .update(updates)
        .eq('id', domainId);

      if (error) {
        console.error('Error updating domain:', error);
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 
                           error?.details || 
                           'Unknown error occurred';
        throw new Error(errorMessage);
      }

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updates } : d
      ));
      
      toast.success('Domain updated successfully');
    } catch (error: any) {
      console.error('Error updating domain:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to update domain: ${errorMessage}`);
    }
  };

  const toggleBlogEnabled = async (domainId: string, enabled: boolean) => {
    await updateDomain(domainId, { blog_enabled: enabled });
  };

  const toggleSSL = async (domainId: string, enabled: boolean) => {
    await updateDomain(domainId, { ssl_enabled: enabled });
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
        console.error('Error deleting domain:', error);
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 
                           error?.details || 
                           'Unknown error occurred';
        throw new Error(errorMessage);
      }

      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success(`Domain ${domainName} deleted successfully`);
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to delete domain: ${errorMessage}`);
    }
  };

  const validateDomain = async (domainId: string) => {
    setValidatingDomains(prev => new Set(prev).add(domainId));

    try {
      // Get domain info first
      const domain = domains.find(d => d.id === domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      toast.info(`Performing DNS validation for ${domain.domain}...`);

      // Use improved DNS validation service
      const result = await DNSValidationService.validateDomain(domainId);

      if (result.success) {
        if (result.validated) {
          const successMessage = result.isUsingFallback
            ? `✅ Domain ${result.domain} validated using fallback method`
            : `✅ Domain ${result.domain} validated successfully! DNS records are properly configured.`;
          toast.success(successMessage);
        } else {
          const warningMessage = result.isUsingFallback
            ? `⚠️ Domain ${result.domain} validation pending: ${result.message}`
            : `❌ Domain ${result.domain} validation failed: ${result.message}`;
          toast.warning(warningMessage);
        }

        // Show additional info for fallback validation
        if (result.isUsingFallback) {
          setTimeout(() => {
            toast.info('💡 DNS service unavailable. Manual DNS propagation check recommended.');
          }, 2000);
        }

        // Reload domains to get updated status
        try {
          await loadDomains();
        } catch (loadError: any) {
          console.warn('Failed to reload domains after validation:', loadError);
          // Don't throw - validation succeeded even if reload failed
        }
      } else {
        const errorMsg = result.message || 'DNS validation failed';
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('DNS validation error:', error);
      const errorMessage = error?.message || 'DNS validation failed';
      toast.error(errorMessage);
    } finally {
      setValidatingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const generatePages = async (domainId: string) => {
    // Placeholder for page generation functionality
    toast.info('Page generation feature coming soon!');
  };

  // Test function for debugging DNS validation issues
  const testValidation = async () => {
    console.log('🧪 Testing DNS validation service...');
    toast.info('Testing DNS validation service...');

    try {
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain_id: 'test-validation-123' }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Service error response:', errorText);

        if (response.status === 502 || response.status === 503) {
          toast.warning('⚠️ DNS validation service is temporarily unavailable. Domains can still be added and will use fallback validation.');
          setDnsServiceStatus('offline');
        } else if (response.status === 404) {
          toast.error('❌ DNS validation function not deployed. Contact support.');
          setDnsServiceStatus('offline');
        } else {
          toast.error(`DNS validation service error: HTTP ${response.status}`);
          setDnsServiceStatus('offline');
        }
        return;
      }

      const result = await response.json();
      console.log('📋 Test result:', result);

      if (result.success === false && result.error === 'Domain not found') {
        toast.success('✅ DNS validation service is working correctly! (Test domain not found as expected)');
        console.log('✅ DNS validation service is operational');
        setDnsServiceStatus('online');
      } else {
        toast.info(`Service response: ${JSON.stringify(result)}`);
        setDnsServiceStatus('online');
      }

    } catch (error: any) {
      console.error('❌ Test validation error:', error);

      if (error.name === 'AbortError') {
        toast.error('❌ DNS validation service timeout - service may be down');
        setDnsServiceStatus('offline');
      } else if (error.message.includes('Failed to fetch')) {
        toast.warning('⚠️ Cannot reach DNS validation service. Network or deployment issue.');
        setDnsServiceStatus('offline');
      } else {
        toast.error(`DNS validation service test failed: ${error.message}`);
        setDnsServiceStatus('offline');
      }
    }
  };

  // Wrapper to handle async errors in event handlers
  const safeAsync = (asyncFn: (...args: any[]) => Promise<any>) => {
    return (...args: any[]) => {
      Promise.resolve(asyncFn(...args)).catch((error) => {
        console.error('Async operation failed:', error);
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        toast.error(`Operation failed: ${errorMessage}`);
      });
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
        return;
      }

      // Fallback for development/non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success('Copied to clipboard!');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);

      // Final fallback - show text in a prompt
      const message = `Copy this text manually:\n\n${text}`;
      if (window.prompt) {
        window.prompt(message, text);
      } else {
        toast.error(`Copy failed. Text: ${text}`);
      }
    }
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

  const getDNSInstructions = (domain: Domain) => {
    // Generate token if missing
    const token = domain.verification_token || generateVerificationToken();

    // If token was missing, update the domain
    if (!domain.verification_token && domain.id) {
      updateDomain(domain.id, { verification_token: token }).catch(console.error);
    }

    return DNSValidationService.getDNSInstructions(domain, hostingConfig);
  };

  const exportDomains = () => {
    const csv = ['Domain,Status,Created,Pages Published,Blog Enabled,SSL Enabled']
      .concat(domains.map(d => 
        `${d.domain},${d.status},${new Date(d.created_at).toLocaleDateString()},${d.pages_published},${d.blog_enabled},${d.ssl_enabled}`
      ))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Hosting Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Add, configure, and manage domains for automated content publishing. Full hosting control with executable page generation.
          </p>
          
          {/* Network Status */}
          <div className="mt-6 max-w-lg mx-auto space-y-4">
            <NetworkStatus onRetry={loadDomains} />

            {/* DNS Service Status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span>DNS Validation Service:</span>
              {dnsServiceStatus === 'online' ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : dnsServiceStatus === 'offline' ? (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Offline (Using Fallback)
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Checking...
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={checkDNSServiceHealth}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Hosting Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hosting Configuration
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
                {showConfig ? 'Hide' : 'Show'} Config
              </Button>
            </CardTitle>
          </CardHeader>
          {showConfig && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hosting-ip">Hosting IP Address</Label>
                  <Input
                    id="hosting-ip"
                    value={hostingConfig.ip}
                    onChange={(e) => setHostingConfig(prev => ({ ...prev, ip: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="hosting-cname">CNAME Target</Label>
                  <Input
                    id="hosting-cname"
                    value={hostingConfig.cname}
                    onChange={(e) => setHostingConfig(prev => ({ ...prev, cname: e.target.value }))}
                    placeholder="hosting.backlinkoo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="hosting-provider">Provider</Label>
                  <Input
                    id="hosting-provider"
                    value={hostingConfig.provider}
                    onChange={(e) => setHostingConfig(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="backlinkoo"
                  />
                </div>
                <div>
                  <Label htmlFor="default-subdirectory">Default Blog Subdirectory</Label>
                  <Input
                    id="default-subdirectory"
                    value={hostingConfig.defaultSubdirectory}
                    onChange={(e) => setHostingConfig(prev => ({ ...prev, defaultSubdirectory: e.target.value }))}
                    placeholder="blog"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-ssl"
                  checked={hostingConfig.autoSSL}
                  onCheckedChange={(checked) => setHostingConfig(prev => ({ ...prev, autoSSL: checked }))}
                />
                <Label htmlFor="auto-ssl">Enable Auto SSL for new domains</Label>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quick Add Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Single Domain Add */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Single Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !addingDomain && addDomain()}
                  className="flex-1"
                />
                <Button onClick={addDomain} disabled={addingDomain}>
                  {addingDomain ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Domain
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter domain without http:// or www. (e.g., example.com)
              </p>
            </CardContent>
          </Card>

          {/* Bulk Add Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Add Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowBulkAdd(!showBulkAdd)}
                variant={showBulkAdd ? "secondary" : "default"}
                className="w-full"
              >
                {showBulkAdd ? 'Hide' : 'Show'} Bulk Add Interface
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Add multiple domains at once, one per line
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Add Interface */}
        {showBulkAdd && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Bulk Domain Addition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bulk-domains">Domains (one per line)</Label>
                <Textarea
                  id="bulk-domains"
                  placeholder={`example1.com
example2.com
example3.com
mydomain.net
anotherdomain.org`}
                  value={bulkDomains}
                  onChange={(e) => setBulkDomains(e.target.value)}
                  rows={8}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter each domain on a new line. Duplicates will be automatically skipped.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={addBulkDomains} 
                  disabled={addingBulk || !bulkDomains.trim()}
                  className="flex-1"
                >
                  {addingBulk ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Add All Domains
                </Button>
                <Button variant="outline" onClick={() => setBulkDomains('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domains List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Domains ({domains.length})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportDomains}>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={testValidation}>
                  <Terminal className="h-4 w-4 mr-1" />
                  Test DNS Service
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  // Bulk validate all pending domains
                  const pendingDomains = domains.filter(d =>
                    d.status === 'pending' || d.status === 'failed'
                  );

                  if (pendingDomains.length === 0) {
                    toast.info('No domains need validation');
                    return;
                  }

                  toast.info(`Starting validation for ${pendingDomains.length} domains...`);

                  pendingDomains.forEach((domain, index) => {
                    setTimeout(() => {
                      validateDomain(domain.id).catch(console.error);
                    }, index * 2000); // Stagger requests by 2 seconds
                  });
                }}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Validate All
                </Button>
                <Button variant="outline" size="sm" onClick={loadDomains}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading domains...</span>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains added yet</h3>
                <p className="text-gray-500 mb-6">Add your first domain to start managing DNS and hosting.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DNS Records</TableHead>
                    <TableHead>Hosting</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{domain.domain}</div>
                            <div className="text-xs text-gray-500">
                              Added {new Date(domain.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(domain)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            <div className={`w-3 h-3 rounded-full ${domain.a_record_validated ? 'bg-green-500' : 'bg-gray-300'}`} title="A Record" />
                            <div className={`w-3 h-3 rounded-full ${domain.txt_record_validated ? 'bg-green-500' : 'bg-gray-300'}`} title="TXT Record" />
                            <div className={`w-3 h-3 rounded-full ${domain.cname_validated ? 'bg-green-500' : 'bg-gray-300'}`} title="CNAME Record" />
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Settings className="h-3 w-3 mr-1" />
                                DNS Setup
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>DNS Configuration for {domain.domain}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    Add these DNS records at your domain registrar to complete setup:
                                  </AlertDescription>
                                </Alert>

                                {getDNSInstructions(domain).map((record, index) => (
                                  <div key={index} className={`p-4 rounded-lg border ${record.validated ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={record.required ? "default" : "outline"}>
                                          {record.type}
                                        </Badge>
                                        {record.validated && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                        {record.required && !record.validated && <Clock className="h-4 w-4 text-yellow-600" />}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(record.value)}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm">
                                        <span className="font-medium">Name:</span> {record.name}
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium">Value:</span>
                                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                                          {record.value}
                                        </code>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {record.description}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div className="text-center pt-4 space-y-3">
                                  <Button
                                    onClick={safeAsync(() => validateDomain(domain.id))}
                                    disabled={validatingDomains.has(domain.id)}
                                  >
                                    {validatingDomains.has(domain.id) ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Validate DNS Records
                                  </Button>

                                  {dnsServiceStatus === 'offline' && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                      <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Manual DNS Propagation Check
                                      </h4>
                                      <div className="text-sm text-yellow-800 space-y-2">
                                        <p>DNS validation service is unavailable. Check propagation manually:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                          {DNSValidationService.getManualPropagationInstructions(domain.domain).map((instruction, i) => (
                                            <li key={i}>{instruction}</li>
                                          ))}
                                        </ul>
                                        <div className="flex gap-2 mt-3">
                                          <a
                                            href={`https://whatsmydns.net/#A/${domain.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Check A Record
                                          </a>
                                          <a
                                            href={`https://whatsmydns.net/#TXT/${domain.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Check TXT Record
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={domain.blog_enabled}
                              onCheckedChange={safeAsync((checked) => toggleBlogEnabled(domain.id, checked))}
                              size="sm"
                            />
                            <span className="text-xs">Blog</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={domain.ssl_enabled}
                              onCheckedChange={safeAsync((checked) => toggleSSL(domain.id, checked))}
                              size="sm"
                            />
                            <span className="text-xs">SSL</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {domain.pages_published} pages
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={safeAsync(() => validateDomain(domain.id))}
                            disabled={validatingDomains.has(domain.id)}
                            title="Validate DNS"
                          >
                            {validatingDomains.has(domain.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={safeAsync(() => generatePages(domain.id))}
                            disabled={domain.status !== 'active'}
                            title="Generate Pages"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          
                          {domain.status === 'active' && (
                            <Button variant="outline" size="sm" asChild title="Visit Domain">
                              <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={safeAsync(() => deleteDomain(domain.id, domain.domain))}
                            title="Delete Domain"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* DNS Instructions Card */}
        {domains.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                DNS Configuration Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  For each domain, add these DNS records at your registrar (GoDaddy, Namecheap, Cloudflare, etc.):
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">A Record</h4>
                    <div className="font-mono text-sm">
                      <div>Name: @</div>
                      <div>Value: {hostingConfig.ip}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => copyToClipboard(hostingConfig.ip)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy IP
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">CNAME Record</h4>
                    <div className="font-mono text-sm">
                      <div>Name: www</div>
                      <div>Value: {hostingConfig.cname}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => copyToClipboard(hostingConfig.cname)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy CNAME
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">TXT Record</h4>
                    <div className="font-mono text-sm">
                      <div>Name: @</div>
                      <div>Value: blo-verification=[token]</div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      Each domain gets a unique token
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Automation Integration Info */}
        {blogEnabledDomains.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Domain Blog Integration Active</h4>
                    <p className="text-sm text-green-800 mb-3">
                      Your blog-enabled domains are automatically integrated with campaigns. Each campaign will publish additional themed blog posts across your domains, creating multiple high-quality backlinks.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Automatic theme assignment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Campaign blog rotation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>SEO-optimized content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">How Domain Blog Integration Works</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      When you create campaigns in the automation system, the system will:
                    </p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Generate unique, themed blog posts for each domain</li>
                      <li>Apply your custom themes and styling automatically</li>
                      <li>Publish posts with natural backlinks to your target URLs</li>
                      <li>Rotate across domains to diversify your backlink profile</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href="/automation"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Test Automation
                </a>
                <a
                  href="/blog"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Published Blogs
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto DNS Propagation Section */}
        {domains.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Automatic DNS Propagation
              </CardTitle>
              <CardDescription>
                Automatically detect your registrar and update DNS records with confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Domain Selection */}
                <div className="space-y-2">
                  <Label>Select Domain for Auto-Propagation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a domain to auto-propagate" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{domain.domain}</span>
                            <Badge
                              variant={domain.status === 'active' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {domain.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-propagation for first domain (demo) */}
                {domains.length > 0 && (
                  <AutoDNSPropagation
                    domain={domains[0]}
                    hostingConfig={hostingConfig}
                    onSuccess={(domain) => {
                      toast.success(`✅ Auto-propagation completed for ${domain.domain}`);
                      loadDomains(); // Refresh domains list
                    }}
                    onError={(error) => {
                      toast.error(`Auto-propagation failed: ${error}`);
                    }}
                  />
                )}

                {/* Info about auto-propagation */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">How Auto-Propagation Works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Automatically detects your domain registrar (Cloudflare, Namecheap, GoDaddy, etc.)</li>
                        <li>Shows you exactly what DNS changes will be made</li>
                        <li>Asks for confirmation before making any updates</li>
                        <li>Uses secure API integration to update your DNS records</li>
                        <li>Validates the changes immediately after propagation</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Supported Registrars */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Supported Registrars</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      'Cloudflare',
                      'Namecheap',
                      'GoDaddy',
                      'Route 53',
                      'DigitalOcean',
                      'Google Domains'
                    ].map(registrar => (
                      <div key={registrar} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{registrar}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Other registrars supported with manual DNS setup
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blog Template Management Section */}
        <div className="mt-8">
          <DomainBlogTemplateManager
            domains={domains}
            onThemeUpdate={(domainId, themeId) => {
              toast.success(`Theme updated to ${themeId} for domain`);
            }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsPage;
