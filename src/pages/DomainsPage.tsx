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
  Trash2,
  Minus,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { callNetlifyDomainFunction } from '@/services/netlifyDomainMock';
import NetlifyApiService from '@/services/netlifyApiService';
import NetlifyDomainManager from '@/components/domains/NetlifyDomainManager';

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
  const [addingToNetlify, setAddingToNetlify] = useState<Set<string>>(new Set());
  const [selectedThemeForDomain, setSelectedThemeForDomain] = useState<{[key: string]: string}>({});
  const [dnsModalOpen, setDnsModalOpen] = useState(false);
  const [selectedDomainForDns, setSelectedDomainForDns] = useState<Domain | null>(null);
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(new Set());
  const [deletingDomains, setDeletingDomains] = useState<Set<string>>(new Set());
  const [removingFromNetlify, setRemovingFromNetlify] = useState<Set<string>>(new Set());

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

  // Remove domain from Netlify
  const handleRemoveFromNetlify = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) {
      toast.error('Domain not found');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to remove ${domain.domain} from Netlify?\n\n` +
      `This will:\n` +
      `• Remove the domain alias from your Netlify site\n` +
      `• Keep the domain in your database\n` +
      `• You can add it back to Netlify later\n\n` +
      `Continue with removal?`
    );

    if (!confirmed) {
      return;
    }

    setRemovingFromNetlify(prev => new Set(prev).add(domainId));

    try {
      toast.info(`Removing ${domain.domain} from Netlify...`);

      // Check if domain exists in Netlify first
      const netlifyCheck = await NetlifyApiService.quickDomainCheck(domain.domain);

      if (!netlifyCheck.exists) {
        toast.warning(`${domain.domain} is not currently in Netlify`);

        // Update database to reflect current state
        await supabase
          .from('domains')
          .update({
            netlify_verified: false,
            status: 'pending',
            error_message: 'Domain not found in Netlify'
          })
          .eq('id', domainId)
          .eq('user_id', user?.id);

        setDomains(prev => prev.map(d =>
          d.id === domainId ? {
            ...d,
            netlify_verified: false,
            status: 'pending' as const,
            error_message: 'Domain not found in Netlify'
          } : d
        ));

        return;
      }

      // Remove domain from Netlify using the API
      const removeResponse = await fetch('/.netlify/functions/netlify-domain-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeDomainAlias',
          domain: domain.domain
        })
      });

      if (!removeResponse.ok) {
        throw new Error(`Failed to remove from Netlify: HTTP ${removeResponse.status}`);
      }

      const removeResult = await removeResponse.json();

      if (removeResult.success) {
        // Update domain status in database
        await supabase
          .from('domains')
          .update({
            netlify_verified: false,
            status: 'pending',
            error_message: null
          })
          .eq('id', domainId)
          .eq('user_id', user?.id);

        // Update local state
        setDomains(prev => prev.map(d =>
          d.id === domainId ? {
            ...d,
            netlify_verified: false,
            status: 'pending' as const,
            error_message: null
          } : d
        ));

        toast.success(`${domain.domain} removed from Netlify successfully`);
      } else {
        throw new Error(removeResult.error || 'Failed to remove domain from Netlify');
      }

    } catch (error: any) {
      console.error('Error removing domain from Netlify:', error);

      let errorMessage = error.message;
      if (error.message.includes('404')) {
        errorMessage = 'Domain not found in Netlify (may already be removed)';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Check Netlify access token.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Permission denied. Check Netlify account permissions.';
      }

      toast.error(`Failed to remove ${domain.domain} from Netlify: ${errorMessage}`);
    } finally {
      setRemovingFromNetlify(prev => {
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

      // Use the official Netlify API to check domain status
      const result = await NetlifyApiService.quickDomainCheck(domain.domain);


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


      // Try official Netlify API first
      const apiResult = await NetlifyApiService.addDomainAlias(domain.domain);

      if (apiResult.success) {

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
          toast.error(`Automated addition failed. Manual addition required.`);

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

      toast.error(`Failed to add ${domain.domain} to Netlify: ${errorMessage}`);
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


  const deleteDomain = async (domainId: string, domainName: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${domainName}?\n\n` +
      `This will:\n` +
      `• Remove the domain from your database\n` +
      `• Attempt to remove it from your Netlify site\n` +
      `• This action cannot be undone\n\n` +
      `Continue with deletion?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingDomains(prev => new Set(prev).add(domainId));

    try {
      // Step 1: Try to remove from Netlify first
      toast.info(`Removing ${domainName} from Netlify...`);

      try {
        // Check if domain exists in Netlify
        const netlifyCheck = await NetlifyApiService.quickDomainCheck(domainName);

        if (netlifyCheck.exists) {
          // Try to remove using a direct API call
          const removeResponse = await fetch('/.netlify/functions/netlify-domain-validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'removeDomainAlias',
              domain: domainName
            })
          });

          if (!removeResponse.ok && removeResponse.status !== 404) {
            console.warn('Netlify removal failed, but continuing with database deletion');
            toast.warning(`Could not auto-remove ${domainName} from Netlify. You may need to remove it manually.`);
          } else if (removeResponse.ok) {
            const removeResult = await removeResponse.json();
            if (removeResult.success) {
              toast.success(`${domainName} removed from Netlify successfully`);
            } else {
              toast.warning(`Netlify removal status unclear for ${domainName}`);
            }
          }
        } else {
        }
      } catch (netlifyError: any) {
        console.warn('Netlify removal failed:', netlifyError);
        toast.warning(`Could not remove ${domainName} from Netlify: ${netlifyError.message}`);
      }

      // Step 2: Remove from database
      toast.info(`Removing ${domainName} from database...`);

      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      // Step 3: Update local state
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success(`${domainName} deleted successfully from database`);

      // Final success message
      setTimeout(() => {
        toast.success(`Domain ${domainName} deletion completed`);
      }, 1000);

    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(`Failed to delete domain: ${error.message}`);
    } finally {
      setDeletingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
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

        {/* Enhanced Domain Management with Two-Way Sync */}
        <DomainManagementTable />

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
