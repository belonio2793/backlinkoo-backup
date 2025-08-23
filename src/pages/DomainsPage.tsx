import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status?: 'pending' | 'validating' | 'validated' | 'error' | 'dns_ready' | 'theme_selection' | 'active';
  netlify_verified?: boolean;
  dns_verified?: boolean;
  created_at: string;
  error_message?: string;
  dns_records?: DNSRecord[];
  selected_theme?: string;
  theme_name?: string;
  blog_enabled?: boolean;
  user_id?: string;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  status: 'pending' | 'verified' | 'error';
}

const DomainsPage = () => {
  const { isAuthenticated, user } = useAuthState();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [validatingDomains, setValidatingDomains] = useState<Set<string>>(new Set());
  const [retryingDomains, setRetryingDomains] = useState<Set<string>>(new Set());
  const [diagnosingDomains, setDiagnosingDomains] = useState<Set<string>>(new Set());
  const [addingToNetlify, setAddingToNetlify] = useState<Set<string>>(new Set());
  const [selectedThemeForDomain, setSelectedThemeForDomain] = useState<{[key: string]: string}>({});

  const BLOG_THEMES = [
    { id: 'minimal', name: 'Minimal Clean', description: 'Clean and simple design' },
    { id: 'modern', name: 'Modern Business', description: 'Professional business layout' },
    { id: 'elegant', name: 'Elegant Editorial', description: 'Magazine-style layout' },
    { id: 'tech', name: 'Tech Focus', description: 'Technology-focused design' }
  ];

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);

  // Store intended route for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('intended_route', '/domains');
    }
  }, [isAuthenticated]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      // First check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping domain load');
        setDomains([]);
        return;
      }

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);

        // Handle specific Supabase errors
        if (error.message?.includes('JWT')) {
          toast.error('Session expired. Please sign in again.');
        } else if (error.message?.includes('API key')) {
          toast.error('Database connection issue. Please refresh the page.');
        } else {
          toast.error('Failed to load domains');
        }
        return;
      }

      console.log(`Loaded ${data?.length || 0} domains for user`);
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateDomainFormat = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  const cleanDomain = (domain: string) => {
    return domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
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

    const cleanedDomain = cleanDomain(newDomain);

    if (!validateDomainFormat(cleanedDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    // Check if domain already exists
    const existingDomain = domains.find(d => d.domain === cleanedDomain);
    if (existingDomain) {
      toast.error('Domain already exists in your list');
      return;
    }

    setAddingDomain(true);

    try {
      // Check Supabase connection first
      const { data: connectionTest } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      console.log('Database connection test successful');

      // Add domain to database with minimal required fields
      const { data, error } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);

        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('Domain already exists in the system');
        } else if (error.message?.includes('JWT')) {
          throw new Error('Session expired. Please refresh and try again.');
        } else if (error.message?.includes('API key')) {
          throw new Error('Database connection issue. Please refresh the page.');
        } else {
          throw new Error(error.message || 'Failed to save domain');
        }
      }

      // Add to local state
      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      toast.success(`Domain ${cleanedDomain} added successfully`);

      // Auto-add to Netlify and fetch DNS records
      setTimeout(async () => {
        await addDomainToNetlify(data);
      }, 1000);

    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAddingDomain(false);
    }
  };

  const validateDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setValidatingDomains(prev => new Set(prev).add(domainId));

    try {
      // Update status to validating
      await supabase
        .from('domains')
        .update({ status: 'validating' })
        .eq('id', domainId);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, status: 'validating' } : d
      ));

      toast.info(`Validating ${domain.domain}...`);

      // Call Netlify validation function
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain.domain,
          domainId: domainId
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update domain status based on validation result
      const updateData = {
        status: result.success ? 'validated' : 'error',
        netlify_verified: result.netlifyVerified || false,
        dns_verified: result.dnsVerified || false,
        error_message: result.success ? null : result.error
      };

      await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updateData } : d
      ));

      if (result.success) {
        toast.success(`✅ ${domain.domain} validated successfully`);

        // If domain is validated and doesn't have a theme yet, trigger theme selection
        const updatedDomain = domains.find(d => d.id === domainId);
        if (updatedDomain && !updatedDomain.selected_theme && result.netlifyVerified && result.dnsVerified) {
          // Update status to theme_selection
          await supabase
            .from('domains')
            .update({ status: 'theme_selection' })
            .eq('id', domainId)
            .eq('user_id', user?.id);

          setDomains(prev => prev.map(d =>
            d.id === domainId ? { ...d, status: 'theme_selection' } : d
          ));

          // Auto-select default theme (minimal) for seamless workflow
          setTimeout(() => {
            setDomainTheme(domainId, 'minimal');
          }, 1000);
        }
      } else {
        toast.error(`❌ Validation failed for ${domain.domain}: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      
      // Update domain status to error
      const updateData = {
        status: 'error' as const,
        error_message: error.message
      };

      await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updateData } : d
      ));

      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setValidatingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  // Manually add domain to Netlify from button click
  const handleAddToNetlify = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) {
      toast.error('Domain not found');
      return;
    }

    setAddingToNetlify(prev => new Set(prev).add(domainId));

    try {
      toast.info(`🚀 Adding ${domain.domain} to Netlify...`);
      await addDomainToNetlify(domain);
    } catch (error: any) {
      console.error('Manual Netlify addition error:', error);
      toast.error(`Failed to add to Netlify: ${error.message}`);
    } finally {
      setAddingToNetlify(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  // Diagnose domain issues for troubleshooting
  const diagnoseDomainIssue = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) {
      toast.error('Domain not found');
      return;
    }

    setDiagnosingDomains(prev => new Set(prev).add(domainId));

    try {
      toast.info(`🔍 Running diagnostics for ${domain.domain}...`);

      const diagnosticResponse = await fetch('/.netlify/functions/diagnose-domain-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.domain })
      });

      if (!diagnosticResponse.ok) {
        throw new Error(`Diagnostic failed: ${diagnosticResponse.statusText}`);
      }

      const result = await diagnosticResponse.json();

      if (result.success) {
        const { diagnostics } = result;

        // Create a detailed diagnostic message
        let diagnosticMessage = `📊 Diagnostic Results for ${domain.domain}:\n\n`;

        diagnosticMessage += `Status: ${diagnostics.assessment.status.toUpperCase()}\n`;
        diagnosticMessage += `Can Add Domain: ${diagnostics.assessment.canAddDomain ? 'Yes' : 'No'}\n\n`;

        if (diagnostics.recommendations.length > 0) {
          diagnosticMessage += 'Recommendations:\n';
          diagnostics.recommendations.forEach((rec, i) => {
            diagnosticMessage += `${i + 1}. ${rec.message}\n   Action: ${rec.action}\n`;
          });
        }

        // Show detailed diagnostics in console for debugging
        console.log('🔍 Full diagnostic report:', diagnostics);

        if (diagnostics.assessment.status === 'critical') {
          toast.error('Critical issues found. Check console for details.');
        } else if (diagnostics.assessment.status === 'warning') {
          toast.warning('Some issues detected. Check console for details.');
        } else {
          toast.success('✅ Configuration looks good! Ready to retry.');
        }

        // Update error message with diagnostic info
        const shortDiagnostic = diagnostics.recommendations
          .filter(r => r.type === 'critical')
          .map(r => r.message)
          .join('; ') || 'Check console for diagnostic details';

        await supabase
          .from('domains')
          .update({
            error_message: `${domain.error_message} | Diagnostic: ${shortDiagnostic}`
          })
          .eq('id', domainId)
          .eq('user_id', user?.id);

        setDomains(prev => prev.map(d =>
          d.id === domainId ? {
            ...d,
            error_message: `${d.error_message} | Diagnostic: ${shortDiagnostic}`
          } : d
        ));

      } else {
        throw new Error(result.error || 'Diagnostic failed');
      }

    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
      setDiagnosingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  // Retry adding domain to Netlify with enhanced error handling
  const retryDomainToNetlify = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) {
      toast.error('Domain not found');
      return;
    }

    setRetryingDomains(prev => new Set(prev).add(domainId));

    try {
      toast.info(`🔄 Retrying ${domain.domain} addition to Netlify...`);

      // Reset domain status before retry
      await supabase
        .from('domains')
        .update({
          error_message: null
        })
        .eq('id', domainId)
        .eq('user_id', user?.id);

      // Clear error from local state
      setDomains(prev => prev.map(d =>
        d.id === domainId ? { ...d, error_message: null, status: 'validating' } : d
      ));

      // Use the same logic as addDomainToNetlify
      await addDomainToNetlify(domain);

    } catch (error: any) {
      console.error('Retry error:', error);
      toast.error(`Retry failed: ${error.message}`);
    } finally {
      setRetryingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  // Add domain to Netlify using the optimized function
  const addDomainToNetlify = async (domain: Domain) => {
    try {
      toast.info(`Adding ${domain.domain} to Netlify...`);

      // Update status to show we're processing
      await supabase
        .from('domains')
        .update({ status: 'validating' })
        .eq('id', domain.id)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d =>
        d.id === domain.id ? { ...d, status: 'validating' } : d
      ));

      // Use the new optimized Netlify API function
      const netlifyResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.domain,
          domainId: domain.id
        })
      });

      if (!netlifyResponse.ok) {
        // Get more detailed error information
        let errorDetails = netlifyResponse.statusText || 'Unknown error';

        try {
          const errorData = await netlifyResponse.text();
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData);
              errorDetails = parsedError.error || parsedError.message || errorData;
            } catch {
              errorDetails = errorData;
            }
          }
        } catch {
          // If we can't read the response, use the status
          errorDetails = `HTTP ${netlifyResponse.status}: ${netlifyResponse.statusText || 'Network error'}`;
        }

        throw new Error(`Failed to add domain: ${errorDetails}`);
      }

      const result = await netlifyResponse.json();

      if (result.success) {
        // Update domain with available fields only
        const updateData: any = {};

        // Only update fields that exist in the schema
        try {
          updateData.error_message = null;
          if (result.netlifyData?.site_id) {
            updateData.netlify_site_id = result.netlifyData.site_id;
          }
          if (result.dnsInstructions?.dnsRecords) {
            updateData.dns_records = result.dnsInstructions.dnsRecords;
          }
        } catch (schemaError) {
          console.log('Using basic update for domain');
        }

        const { error: updateError } = await supabase
          .from('domains')
          .update(updateData)
          .eq('id', domain.id)
          .eq('user_id', user?.id);

        if (updateError) {
          console.warn('Domain update error:', updateError);
        }

        setDomains(prev => prev.map(d =>
          d.id === domain.id ? {
            ...d,
            netlify_verified: true,
            status: 'dns_ready' as const,
            error_message: null
          } : d
        ));

        toast.success(`✅ ${domain.domain} successfully added to Netlify! Configure DNS records to activate.`);

        // Auto-validate after a short delay to check DNS
        setTimeout(() => {
          validateDomain(domain.id);
        }, 3000);
      } else {
        // Provide more specific error information
        const detailedError = result.error || 'Failed to add domain to Netlify';
        const errorContext = `Response status: ${netlifyResponse.status}. ${detailedError}`;
        throw new Error(errorContext);
      }
    } catch (error: any) {
      console.error('Error adding domain to Netlify:', error);

      // Create detailed error message
      let errorMessage = error.message;
      if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Check Netlify access token.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Permission denied. Check Netlify account permissions.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Netlify site not found. Check site ID configuration.';
      } else if (error.message.includes('422')) {
        errorMessage = 'Domain validation failed. Domain may already be in use.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
      } else if (!error.message || error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Check your internet connection and try again.';
      }

      // Update domain status to error with detailed message
      await supabase
        .from('domains')
        .update({
          status: 'error' as const,
          error_message: errorMessage
        })
        .eq('id', domain.id)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d =>
        d.id === domain.id ? { ...d, status: 'error', error_message: errorMessage } : d
      ));

      toast.error(`❌ Failed to add ${domain.domain} to Netlify: ${errorMessage}`);
    }
  };

  // Set theme for domain after validation
  const setDomainTheme = async (domainId: string, themeId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    try {
      const theme = BLOG_THEMES.find(t => t.id === themeId);
      if (!theme) return;

      toast.info(`Setting ${theme.name} theme for ${domain.domain}...`);

      const response = await fetch('/.netlify/functions/set-domain-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domain.id,
          domain: domain.domain,
          themeId: themeId
        })
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          // Update domain status to active
          const updateData = {
            status: 'active' as const,
            selected_theme: themeId,
            theme_name: theme.name,
            blog_enabled: true
          };

          await supabase
            .from('domains')
            .update(updateData)
            .eq('id', domain.id)
            .eq('user_id', user?.id);

          setDomains(prev => prev.map(d =>
            d.id === domain.id ? {
              ...d,
              status: 'active' as const,
              selected_theme: themeId,
              theme_name: theme.name,
              blog_enabled: true
            } : d
          ));

          toast.success(`${domain.domain} is now ready for blog generation with ${theme.name} theme!`);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Theme selection failed');
      }
    } catch (error: any) {
      console.error('Error setting domain theme:', error);
      toast.error(`Failed to set theme: ${error.message}`);
    }
  };

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to delete ${domainName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success(`Domain ${domainName} deleted successfully`);
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(`Failed to delete domain: ${error.message}`);
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
      case 'theme_selection':
        return <Badge variant="outline" className="border-purple-400 text-purple-600">Setting Theme</Badge>;
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
            Domain Manager
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
            Domain Manager
          </h1>
          <p className="text-xl text-gray-600">
            Add and validate domains for your Netlify account
          </p>
        </div>

        {/* Add Domain Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Domain
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
                className="min-w-[120px]"
              >
                {addingDomain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </>
                )}
              </Button>
            </div>
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{domain.domain}</h3>
                        {getStatusBadge(domain)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {domain.netlify_verified !== undefined ? (
                            domain.netlify_verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                          )}
                          <span>Netlify: {domain.netlify_verified ? 'Verified' : domain.netlify_verified === false ? 'Not Found' : 'Pending'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {domain.dns_verified !== undefined ? (
                            domain.dns_verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                          )}
                          <span>DNS: {domain.dns_verified ? 'Valid' : domain.dns_verified === false ? 'Invalid' : 'Pending'}</span>
                        </div>
                      </div>

                      {domain.error_message && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600 mb-2">
                            Error: {domain.error_message}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryDomainToNetlify(domain.id)}
                              disabled={retryingDomains.has(domain.id) || diagnosingDomains.has(domain.id)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {retryingDomains.has(domain.id) ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Retry Netlify
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => diagnoseDomainIssue(domain.id)}
                              disabled={diagnosingDomains.has(domain.id) || retryingDomains.has(domain.id)}
                              className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              {diagnosingDomains.has(domain.id) ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Diagnosing...
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Diagnose
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateDomain(domain.id)}
                        disabled={validatingDomains.has(domain.id)}
                      >
                        {validatingDomains.has(domain.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Validating
                          </>
                        ) : (
                          'Validate'
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToNetlify(domain.id)}
                        disabled={addingToNetlify.has(domain.id) || validatingDomains.has(domain.id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {addingToNetlify.has(domain.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-1" />
                            Add to Netlify
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDomain(domain.id, domain.domain)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default DomainsPage;
