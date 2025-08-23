import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { runNetworkDiagnostic, DiagnosticResult } from '@/utils/networkDiagnostic';
import { testNetlifyDomainFunction } from '@/utils/testNetlifyFunction';
import { callNetlifyDomainFunction } from '@/services/netlifyDomainMock';
import NetlifyApiService from '@/services/netlifyApiService';
import NetlifyFunctionDiagnostic from '@/utils/netlifyFunctionDiagnostic';
import { DnsValidationModal } from '@/components/DnsValidationModal';
import { BulkDomainManager } from '@/components/BulkDomainManager';
import { NetlifyApiTester } from '@/components/NetlifyApiTester';
import { NetlifyDeploymentChecker } from '@/components/NetlifyDeploymentChecker';
import { ManualDomainInstructions } from '@/components/ManualDomainInstructions';
import { FunctionStatusIndicator } from '@/components/FunctionStatusIndicator';
import ComprehensiveDomainStatus from '@/components/ComprehensiveDomainStatus';

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
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [dnsModalOpen, setDnsModalOpen] = useState(false);
  const [selectedDomainForDns, setSelectedDomainForDns] = useState<Domain | null>(null);
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(new Set());
  const [showManualInstructions, setShowManualInstructions] = useState<Set<string>>(new Set());
  const [selectedDomainForComprehensive, setSelectedDomainForComprehensive] = useState<Domain | null>(null);
  const [showComprehensiveValidation, setShowComprehensiveValidation] = useState(false);

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
        // Verify domain was actually added after a short delay
        setTimeout(async () => {
          await verifyDomainInNetlify(data);
        }, 2000);
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

    // Open DNS validation modal instead of running validation directly
    setSelectedDomainForDns(domain);
    setDnsModalOpen(true);
  };

  // Handle DNS validation completion from modal
  const handleDnsValidationComplete = async (success: boolean) => {
    if (!selectedDomainForDns) return;

    try {
      const updateData = {
        status: success ? 'validated' : 'error',
        dns_verified: success,
        error_message: success ? null : 'DNS validation failed'
      };

      await supabase
        .from('domains')
        .update(updateData)
        .eq('id', selectedDomainForDns.id)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d =>
        d.id === selectedDomainForDns.id ? { ...d, ...updateData } : d
      ));

      if (success) {
        toast.success(`${selectedDomainForDns.domain} DNS validated successfully`);

        // If domain is validated and doesn't have a theme yet, trigger theme selection
        if (!selectedDomainForDns.selected_theme) {
          setTimeout(() => {
            setDomainTheme(selectedDomainForDns.id, 'minimal');
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error updating domain after validation:', error);
      toast.error(`Failed to update domain status: ${error.message}`);
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
      toast.info(`Adding ${domain.domain} to Netlify...`);
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
      toast.info(`Running diagnostics for ${domain.domain}...`);

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
        let diagnosticMessage = `Diagnostic Results for ${domain.domain}:\n\n`;

        diagnosticMessage += `Status: ${diagnostics.assessment.status.toUpperCase()}\n`;
        diagnosticMessage += `Can Add Domain: ${diagnostics.assessment.canAddDomain ? 'Yes' : 'No'}\n\n`;

        if (diagnostics.recommendations.length > 0) {
          diagnosticMessage += 'Recommendations:\n';
          diagnostics.recommendations.forEach((rec, i) => {
            diagnosticMessage += `${i + 1}. ${rec.message}\n   Action: ${rec.action}\n`;
          });
        }

        // Show detailed diagnostics in console for debugging
        console.log('Full diagnostic report:', diagnostics);

        if (diagnostics.assessment.status === 'critical') {
          toast.error('Critical issues found. Check console for details.');
        } else if (diagnostics.assessment.status === 'warning') {
          toast.warning('Some issues detected. Check console for details.');
        } else {
          toast.success('Configuration looks good! Ready to retry.');
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
      toast.info(`Retrying ${domain.domain} addition to Netlify...`);

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

      // Verify domain was actually added
      setTimeout(async () => {
        await verifyDomainInNetlify(domain);
      }, 2000);

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

  // Verify domain exists in Netlify using official API
  const verifyDomainInNetlify = async (domain: Domain) => {
    if (!domain) return;

    setVerifyingDomains(prev => new Set(prev).add(domain.id));

    try {
      console.log(`Verifying ${domain.domain} in Netlify via official API...`);

      // Use the official Netlify API to check domain status
      const result = await NetlifyApiService.quickDomainCheck(domain.domain);

      console.log('Official API verification result:', result);

      if (result.error) {
        console.error('Verification API error:', result.error);
        toast.warning(`Could not verify ${domain.domain}: ${result.error}`);
        return;
      }

      if (result.exists) {
        // Update domain status to show it's verified in Netlify
        await supabase
          .from('domains')
          .update({
            netlify_verified: true,
            status: 'dns_ready',
            error_message: null
          })
          .eq('id', domain.id);

        setDomains(prev => prev.map(d =>
          d.id === domain.id ? {
            ...d,
            netlify_verified: true,
            status: 'dns_ready',
            error_message: null
          } : d
        ));

        const domainType = result.isCustomDomain ? 'custom domain' : 'domain alias';
        toast.success(`${domain.domain} verified in Netlify as ${domainType}!`);
      } else {
        // Domain not found in Netlify
        await supabase
          .from('domains')
          .update({
            netlify_verified: false,
            status: 'error',
            error_message: 'Domain not found in Netlify site configuration'
          })
          .eq('id', domain.id);

        setDomains(prev => prev.map(d =>
          d.id === domain.id ? {
            ...d,
            netlify_verified: false,
            status: 'error',
            error_message: 'Domain not found in Netlify site configuration'
          } : d
        ));

        toast.error(`${domain.domain} not found in Netlify site configuration`);
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      toast.warning(`Verification failed for ${domain.domain}: ${error.message}`);
    } finally {
      setVerifyingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domain.id);
        return newSet;
      });
    }
  };

  // Add domain to Netlify using the official Netlify API
  const addDomainToNetlify = async (domain: Domain) => {
    try {
      toast.info(`Adding ${domain.domain} to Netlify via official API...`);

      // Update status to show we're processing
      await supabase
        .from('domains')
        .update({ status: 'validating' })
        .eq('id', domain.id)
        .eq('user_id', user?.id);

      setDomains(prev => prev.map(d =>
        d.id === domain.id ? { ...d, status: 'validating' } : d
      ));

      console.log(`Adding domain via official Netlify API: ${domain.domain}`);

      // Run diagnostic first to understand function availability
      const diagnostic = await NetlifyFunctionDiagnostic.getDeploymentStatus();
      console.log('Function deployment status:', diagnostic);

      if (diagnostic.status === 'critical') {
        console.warn('No functions available, this will likely fail');
        toast.warning('Netlify functions not deployed. Domain addition may fail.');
      }

      // Try official Netlify API first
      const apiResult = await NetlifyApiService.addDomainAlias(domain.domain);

      if (apiResult.success) {
        console.log('Domain addition succeeded:', apiResult);

        // Determine the method used and update status accordingly
        const method = apiResult.data?.method || 'function';
        const isSimulation = method === 'mock';

        // Update domain with success status
        const updateData = {
          netlify_verified: !isSimulation, // Only mark as verified if not simulation
          status: isSimulation ? 'pending' as const : 'dns_ready' as const,
          error_message: null
        };

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
            netlify_verified: !isSimulation,
            status: isSimulation ? 'pending' as const : 'dns_ready' as const,
            error_message: null
          } : d
        ));

        // Customize success message based on method
        let successMessage = '';
        if (method === 'direct_api') {
          successMessage = `${domain.domain} added to Netlify via direct API! Configure DNS records to activate.`;
        } else if (method === 'function') {
          successMessage = `${domain.domain} successfully added to Netlify! Configure DNS records to activate.`;
        } else if (method === 'mock') {
          successMessage = `${domain.domain} simulated (functions not deployed). Add manually to Netlify for real functionality.`;
        } else {
          successMessage = `${domain.domain} processed successfully! Configure DNS records to activate.`;
        }

        toast.success(successMessage);

        // Only auto-validate for real additions, not simulations
        if (!isSimulation) {
          setTimeout(() => {
            validateDomain(domain.id);
          }, 3000);
        }

        return; // Success, exit early
      }

      // Fallback: Try the previous implementation
      console.warn('Official API failed, trying fallback method:', apiResult.error);

      let result;
      try {
        result = await callNetlifyDomainFunction(domain.domain, domain.id);
        console.log(`Fallback function result:`, result);
      } catch (functionError: any) {
        console.error('Error calling fallback function:', functionError);
        throw new Error(`Both official API and fallback failed. Official API: ${apiResult.error}. Fallback: ${functionError.message}`);
      }

      if (result.success) {
        // Update domain with available fields only
        const updateData: any = {
          netlify_verified: true,
          status: 'dns_ready' as const,
          error_message: null
        };

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

        toast.success(`${domain.domain} successfully added to Netlify via fallback method! Configure DNS records to activate.`);

        // Auto-validate after a short delay to check DNS
        setTimeout(() => {
          validateDomain(domain.id);
        }, 3000);
      } else {
        // Check if manual instructions are provided
        if (apiResult.data?.method === 'manual_required' && apiResult.data?.instructions) {
          const instructions = apiResult.data.instructions;

          // Update domain with manual instructions
          const updateData = {
            status: 'error' as const,
            error_message: `Automated addition failed. ${instructions.message}`
          };

          await supabase
            .from('domains')
            .update(updateData)
            .eq('id', domain.id)
            .eq('user_id', user?.id);

          setDomains(prev => prev.map(d =>
            d.id === domain.id ? { ...d, status: 'error', error_message: updateData.error_message } : d
          ));

          // Show detailed instructions to user
          console.log('Manual addition instructions:', instructions);
          toast.error(`Automated addition failed. Manual addition required.`);

          // Show manual instructions for this domain
          setShowManualInstructions(prev => new Set(prev).add(domain.id));

          return;
        }

        throw new Error(apiResult.error || 'All domain addition methods failed');
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
      } else if (!error.message || error.message === 'Failed to fetch' || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Could not connect to Netlify services. Please check your internet connection and try again.';
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

      // Show manual instructions for function deployment issues
      if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('404') || errorMessage.includes('function')) {
        setShowManualInstructions(prev => new Set(prev).add(domain.id));
        toast.error(`Functions not deployed. Manual addition required for ${domain.domain}.`);
      } else {
        toast.error(`Failed to add ${domain.domain} to Netlify: ${errorMessage}`);
      }
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

      let functionSuccess = false;

      // Try to call the Netlify function first
      try {
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
            functionSuccess = true;
            console.log('Netlify function successfully set theme');
          } else {
            console.warn('Netlify function returned error:', result.error);
          }
        } else {
          console.warn(`Netlify function failed with status ${response.status}`);
        }
      } catch (functionError) {
        console.warn('Netlify function call failed:', functionError);
      }

      // Fallback: Update directly via Supabase (always do this to ensure consistency)
      console.log('Updating domain theme via Supabase...');

      const updateData = {
        status: 'active' as const,
        selected_theme: themeId,
        theme_name: theme.name,
        blog_enabled: true
      };

      const { error: supabaseError } = await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domain.id)
        .eq('user_id', user?.id);

      if (supabaseError) {
        throw new Error(`Database update failed: ${supabaseError.message}`);
      }

      // Update local state
      setDomains(prev => prev.map(d =>
        d.id === domain.id ? {
          ...d,
          status: 'active' as const,
          selected_theme: themeId,
          theme_name: theme.name,
          blog_enabled: true
        } : d
      ));

      const successMessage = functionSuccess
        ? `${domain.domain} is now ready for blog generation with ${theme.name} theme!`
        : `${domain.domain} theme updated locally. Blog generation ready with ${theme.name} theme!`;

      toast.success(successMessage);

    } catch (error: any) {
      console.error('Error setting domain theme:', error);
      toast.error(`Failed to set theme: ${error.message}`);
    }
  };

  // Run network diagnostic to troubleshoot connectivity issues
  const runDiagnostic = async () => {
    setRunningDiagnostic(true);
    try {
      toast.info('Running network diagnostic...');
      const results = await runNetworkDiagnostic();
      setDiagnosticResults(results);

      const errorCount = results.filter(r => r.status === 'error').length;
      const warningCount = results.filter(r => r.status === 'warning').length;

      if (errorCount > 0) {
        toast.error(`Diagnostic found ${errorCount} critical issues. Check console for details.`);
      } else if (warningCount > 0) {
        toast.warning(`Diagnostic found ${warningCount} warnings. Check console for details.`);
      } else {
        toast.success('All connectivity tests passed!');
      }

      // Log detailed results to console
      console.log('Network Diagnostic Results:', results);
      results.forEach(result => {
        const indicator = result.status === 'success' ? 'SUCCESS' : result.status === 'warning' ? 'WARNING' : 'ERROR';
        console.log(`[${indicator}] ${result.service}: ${result.message}`, result.details);
      });

    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
      setRunningDiagnostic(false);
    }
  };

  // Test Netlify function directly for debugging
  const testNetlifyFunction = async () => {
    setRunningDiagnostic(true);
    try {
      toast.info('Testing Netlify function directly...');
      const result = await testNetlifyDomainFunction('leadpages.org');

      if (result.error) {
        toast.error(`Netlify function test failed: ${result.error}`);
        console.error('Function test failed:', result);
      } else {
        toast.success('Netlify function test passed!');
        console.log('Function test succeeded:', result);
      }
    } catch (error: any) {
      console.error('💥 Test execution failed:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setRunningDiagnostic(false);
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


        {/* Domain Addition Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Domains to Netlify
              </div>
              <FunctionStatusIndicator />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="single">Single Domain</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Addition</TabsTrigger>
                <TabsTrigger value="api">API Testing</TabsTrigger>
                <TabsTrigger value="comprehensive">Comprehensive Check</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-6">
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
                <p className="text-sm text-gray-600">
                  Domain will be automatically added as an alias to your Netlify site and configured via API
                </p>
              </TabsContent>

              <TabsContent value="bulk" className="mt-6">
                <BulkDomainManager onDomainsAdded={loadDomains} />
              </TabsContent>

              <TabsContent value="api" className="mt-6">
                <NetlifyApiTester />
              </TabsContent>

              <TabsContent value="comprehensive" className="mt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Comprehensive Domain Validation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get detailed validation results combining Netlify configuration, DNS records, SSL certificates, and connectivity checks.
                    </p>
                  </div>

                  {domains.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Domain to Validate:</label>
                      <div className="flex gap-2 flex-wrap">
                        {domains.map((domain) => (
                          <Button
                            key={domain.id}
                            variant={selectedDomainForComprehensive?.id === domain.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedDomainForComprehensive(domain);
                              setShowComprehensiveValidation(true);
                            }}
                          >
                            {domain.domain}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Add a domain first to run comprehensive validation</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Domains List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Domains ({domains.length})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadDomains}>
                  Refresh
                </Button>
              </div>
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
                  <Card key={domain.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-xl text-gray-900">{domain.domain}</h3>
                            {getStatusBadge(domain)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Added {new Date(domain.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Delete Action - Separate for safety */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDomain(domain.id, domain.domain)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Status Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {verifyingDomains.has(domain.id) ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          ) : domain.netlify_verified !== undefined ? (
                            domain.netlify_verified ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">Netlify Status</p>
                            <p className="text-xs text-gray-600">
                              {verifyingDomains.has(domain.id) ? 'Checking...' :
                               domain.netlify_verified ? 'Verified in Site' :
                               domain.netlify_verified === false ? 'Not Found in Site' : 'Pending Verification'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {domain.dns_verified !== undefined ? (
                            domain.dns_verified ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">DNS Status</p>
                            <p className="text-xs text-gray-600">
                              {domain.dns_verified ? 'Valid Configuration' :
                               domain.dns_verified === false ? 'Invalid Configuration' : 'Pending Validation'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Error Section */}
                      {domain.error_message && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-sm text-red-900 mb-2">Error Details</p>
                              <p className="text-sm text-red-700 mb-3">{domain.error_message}</p>
                              <div className="flex flex-wrap gap-2">
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
                                      Retry API
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
                          </div>
                        </div>
                      )}

                      {/* Manual Instructions Section */}
                      {showManualInstructions.has(domain.id) && (
                        <div className="mb-4">
                          <ManualDomainInstructions
                            domain={domain.domain}
                            isVisible={true}
                            onClose={() => {
                              setShowManualInstructions(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(domain.id);
                                return newSet;
                              });
                            }}
                          />
                        </div>
                      )}

                      {/* Actions Section */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-3">Available Actions</p>
                        <div className="flex flex-wrap gap-3">
                          {/* Primary Actions */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => validateDomain(domain.id)}
                            disabled={validatingDomains.has(domain.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {validatingDomains.has(domain.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking DNS...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                DNS Check
                              </>
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

                          {/* Secondary Actions */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyDomainInNetlify(domain)}
                            disabled={verifyingDomains.has(domain.id)}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                          >
                            {verifyingDomains.has(domain.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Verify Status
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDomainForComprehensive(domain);
                              setShowComprehensiveValidation(true);
                            }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Comprehensive Check
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Domain Validation Section */}
        {showComprehensiveValidation && selectedDomainForComprehensive && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Comprehensive Validation Results</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComprehensiveValidation(false);
                    setSelectedDomainForComprehensive(null);
                  }}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComprehensiveDomainStatus
                domain={selectedDomainForComprehensive.domain}
                domainId={selectedDomainForComprehensive.id}
                autoCheck={true}
                onStatusChange={(status) => {
                  console.log('Domain validation status updated:', status);
                  // You can update the domain status in the domains list here if needed
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />

      {/* DNS Validation Modal */}
      {selectedDomainForDns && (
        <DnsValidationModal
          isOpen={dnsModalOpen}
          onOpenChange={setDnsModalOpen}
          domain={selectedDomainForDns.domain}
          domainId={selectedDomainForDns.id}
          onValidationComplete={handleDnsValidationComplete}
        />
      )}
    </div>
  );
};

export default DomainsPage;
