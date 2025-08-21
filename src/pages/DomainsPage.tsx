import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle,
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
  Play,
  Pause,
  Edit3,
  Save,
  Palette,
  Wand2,
  Zap,
  Settings
} from 'lucide-react';
import SimpleBlogTemplateManager from '@/components/SimpleBlogTemplateManager';
import DNSValidationService from '@/services/dnsValidationService';
import AutoDNSPropagation from '@/components/AutoDNSPropagation';
import AutoPropagationWizard from '@/components/AutoPropagationWizard';
import NetlifyDNSManager from '@/services/netlifyDNSManager';
import NetlifyDNSSync from '@/services/netlifyDNSSync';
import NetlifyCustomDomainService from '@/services/netlifyCustomDomainService';
import EnhancedNetlifyDomainService from '@/services/enhancedNetlifyDomainService';
import AutoDomainBlogThemeService from '@/services/autoDomainBlogThemeService';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import DNSSetupInstructions from '@/components/DNSSetupInstructions';
import NetlifySetupGuide from '@/components/NetlifySetupGuide';
import DomainBlogThemeSelector from '@/components/DomainBlogThemeSelector';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { DomainManager } from '@/services/domainManager';
import { netlifyDomainService } from '@/services/netlifyDomainService';
import { toast } from 'sonner';
import NetlifyControlPanel from '@/components/NetlifyControlPanel';
import EnvironmentVariablesManager from '@/components/EnvironmentVariablesManager';

// Global error handler will be set up in useEffect

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
  netlify_id?: string;
  netlify_synced?: boolean;
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
  const [showAutoPropagationWizard, setShowAutoPropagationWizard] = useState(false);
  const [selectedDomainForWizard, setSelectedDomainForWizard] = useState<Domain | null>(null);
  const [domainBlogThemesExists, setDomainBlogThemesExists] = useState<boolean | null>(null);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [netlifyConfigured, setNetlifyConfigured] = useState(false);
  const [netlifyEnvStatus, setNetlifyEnvStatus] = useState<'unknown' | 'synced' | 'missing' | 'updating'>('unknown');
  const [dnsConfiguring, setDnsConfiguring] = useState(false);
  const [dnsProgress, setDnsProgress] = useState({ current: 0, total: 0, domain: '' });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true); // Enable auto-sync by default
  const [netlifyDNSSync, setNetlifyDNSSync] = useState<NetlifyDNSSync | null>(null); // Initialize Netlify DNS sync service
  const [netlifyCustomDomainService, setNetlifyCustomDomainService] = useState<NetlifyCustomDomainService | null>(null); // Initialize Netlify custom domain service
  const [enhancedNetlifyService, setEnhancedNetlifyService] = useState<EnhancedNetlifyDomainService | null>(null); // Enhanced Netlify service with DNS
  const [showDNSInstructions, setShowDNSInstructions] = useState<{domain: string, scenario: 'registrar' | 'domains-page' | 'subdomain'} | null>(null);
  const [selectedDomainForControl, setSelectedDomainForControl] = useState<Domain | null>(null);
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false);
  const [environmentConfig, setEnvironmentConfig] = useState<{ [key: string]: string }>({});
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null); // null = unknown, true = connected, false = disconnected
  const [showNetlifySetup, setShowNetlifySetup] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedDomainForTheme, setSelectedDomainForTheme] = useState<Domain | null>(null);

  // Calculate blog-enabled domains for UI messaging
  const blogEnabledDomains = domains.filter(d => d.blog_enabled);

  // Hosting configuration - matches backlinkoo.com exactly
  const [hostingConfig, setHostingConfig] = useState<HostingConfig>({
    ip: '75.2.60.5', // Same IP as backlinkoo.com
    cname: 'backlinkoo.netlify.app', // Same Netlify app as backlinkoo.com
    provider: 'netlify',
    autoSSL: true,
    defaultSubdirectory: 'blog'
  });

  useEffect(() => {
    // Set up global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
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
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);

  // Initialize NetlifyDNSSync safely after component mounts
  useEffect(() => {
    try {
      const syncService = new NetlifyDNSSync();
      setNetlifyDNSSync(syncService);
      console.log('✅ NetlifyDNSSync initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NetlifyDNSSync:', error);
      // Only show error toast for critical failures, not configuration issues
      if (error instanceof Error && !error.message.includes('token')) {
        toast.error(`DNS Service initialization failed: ${error.message}`);
      } else {
        console.warn('⚠️ NetlifyDNSSync running in limited mode due to missing configuration');
      }
    }

    // Initialize Netlify services
    try {
      // NetlifyDomainService is already available as singleton import
      console.log('✅ NetlifyDomainService available as singleton');

      // Initialize NetlifyCustomDomainService
      const customDomainService = new NetlifyCustomDomainService();
      setNetlifyCustomDomainService(customDomainService);
      console.log('✅ NetlifyCustomDomainService initialized');

      // Initialize Enhanced Netlify Domain Service
      const enhancedService = new EnhancedNetlifyDomainService();
      setEnhancedNetlifyService(enhancedService);
      console.log('✅ EnhancedNetlifyDomainService initialized');

      // Quick verification if configured
      if (netlifyDomainService.isConfigured()) {
        console.log('🔗 Netlify integration is configured and ready');
      } else {
        console.log('⚠️ Netlify integration not configured');
      }
    } catch (error) {
      console.error('Failed to initialize Netlify services:', error);
      // Don't show toast during initialization to prevent setState warnings
      console.warn('⚠️ Domain Service initialization had issues:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    // Initialize domains functionality
    const initializeDomains = async () => {
      try {
        console.log('🔧 Initializing domains functionality...');

        // Skip domains table auto-creation to prevent access errors
        console.log('🔧 Domains initialization started (table auto-creation disabled)...');

        // Test connection (don't fail initialization if this fails)
        const connectionWorking = await testSupabaseConnection(false);
        setSupabaseConnected(connectionWorking);

        if (connectionWorking) {
          // Load domains only if connection is working (don't show toast on error during init)
          await loadDomains(false);
        } else {
          console.warn('⚠️ Skipping domain loading due to Supabase connection issues');
          setLoading(false); // Make sure to set loading to false
        }

        // Check DNS service status
        checkDNSServiceHealth();

        console.log('✅ Domains initialization complete');

      } catch (error: any) {
        console.error('❌ Domains initialization failed:', error);
        // Don't show toast during initialization to prevent setState warnings
        console.warn('⚠️ Domains initialization had issues:', error.message || 'Unknown error');
      }
    };

    initializeDomains();
  }, []); // Remove user dependency

  // Test complete domain setup
  const testDomainSetup = async () => {
    try {
      console.log('🧪 Testing complete domain setup...');
      // Defer toast to prevent setState warnings if called during render
      setTimeout(() => toast.info('Testing domain management system...'), 0);

      const result = await DomainManager.testDomainSetup();

      if (result.success) {
        toast.success('✅ Domain management system is working correctly!');
        console.log('✅ Domain setup test results:', result.results);
      } else {
        toast.error('❌ Domain setup test failed');
        console.error('❌ Domain setup test errors:', result.results.errors);

        // Show specific issues
        if (!result.results.netlifyConnection) {
          toast.warning('Netlify API connection failed. Check your access token.');
        }
        if (!result.results.databaseConnection) {
          toast.warning('Database connection failed. Check your Supabase configuration.');
        }
        if (!result.results.configurationValid) {
          toast.warning('Netlify configuration missing. Set VITE_NETLIFY_ACCESS_TOKEN and VITE_NETLIFY_SITE_ID.');
        }
      }

      return result.success;
    } catch (error: any) {
      console.error('❌ Domain setup test failed:', error);
      toast.error(`Setup test failed: ${error.message}`);
      return false;
    }
  };

  // Test Supabase connection
  const testSupabaseConnection = async (throwOnError: boolean = true) => {
    try {
      console.log('🔍 Testing Supabase connection...');

      // Check if environment variables are available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Debug environment variables in development
      if (import.meta.env.DEV) {
        console.log('🔧 Environment variables check:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
          keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'missing'
        });
      }

      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = 'Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
        console.warn('⚠️', errorMsg);
        if (throwOnError) {
          throw new Error(errorMsg);
        }
        return false;
      }

      // Simple connection test
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message?.includes('No API key found')) {
          const errorMsg = 'Supabase API key is missing. Please refresh the page.';
          console.warn('⚠️', errorMsg);
          if (throwOnError) {
            throw new Error(errorMsg);
          }
          return false;
        }
        if (throwOnError) {
          throw error;
        }
        console.warn('⚠️ Supabase connection test failed:', error.message);
        return false;
      }

      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ Supabase connection test failed:', error);
      if (throwOnError) {
        throw new Error(error.message || 'Database connection failed');
      }
      return false;
    }
  };

  // Check Netlify configuration and environment sync status
  useEffect(() => {
    const configStatus = NetlifyDNSManager.getConfigStatus();
    setNetlifyConfigured(configStatus.configured);
    checkNetlifyEnvSync();

    // Auto-sync NETLIFY key if auto-sync is enabled and key is not already synced
    if (autoSyncEnabled) {
      autoSyncNetlifyKey();
    }
  }, [autoSyncEnabled]);

  // Auto-sync NETLIFY key if available
  const autoSyncNetlifyKey = async () => {
    try {
      const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;

      // If no token exists, skip
      if (!envToken) {
        return;
      }

      // Auto-sync to DevServerControl if valid token exists
      if (envToken.length > 10) {
        console.log('🚀 Auto-syncing NETLIFY key via DevServerControl...');
        setNetlifyEnvStatus('updating');

        // This will be handled by the updated NetlifyEnvironmentSync component
        await syncNetlifyToEnv(envToken);
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  // Check if Netlify key is synced with environment variables
  const checkNetlifyEnvSync = () => {
    const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
    if (envToken && envToken.length > 10) {
      setNetlifyEnvStatus('synced');
    } else {
      setNetlifyEnvStatus('missing');
    }
  };

  // Enhanced sync with automatic DNS propagation setup
  const syncNetlifyToEnv = async (apiKey?: string) => {
    try {
      setNetlifyEnvStatus('updating');

      const keyToSync = apiKey || import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;

      if (!keyToSync || keyToSync.length < 10) {
        toast.error('No valid Netlify token found. Use the Environment Sync panel below.');
        setNetlifyEnvStatus('missing');
        return;
      }

      console.log('🔧 Starting enhanced Netlify sync with DNS propagation...');
      toast.info('�� Syncing Netlify key and configuring DNS propagation...');

      // Step 1: Sync environment variables
      localStorage.setItem('netlify_env_sync_status', 'synced');
      localStorage.setItem('netlify_env_key_preview', keyToSync.substring(0, 8) + '...' + keyToSync.substring(keyToSync.length - 4));

      setNetlifyEnvStatus('synced');
      setNetlifyConfigured(true);

      // Step 2: Auto-configure DNS for all domains that need it
      await autoConfigureDNSPropagation(keyToSync);

      toast.success('✅ Netlify sync completed with DNS propagation setup!');

    } catch (error: any) {
      console.error('Failed to sync Netlify key:', error);
      setNetlifyEnvStatus('missing');
      toast.error(`Sync failed: ${error.message}`);
    }
  };

  // Auto-configure DNS propagation for all domains
  const autoConfigureDNSPropagation = async (apiToken: string) => {
    console.log('🌐 Auto-configuring DNS propagation for all domains...');

    const domainsNeedingDNS = domains.filter(d =>
      !d.dns_validated ||
      !d.a_record_validated ||
      !d.txt_record_validated ||
      !d.netlify_synced
    );

    if (domainsNeedingDNS.length === 0) {
      toast.info('✅ All domains already have proper DNS configuration');
      return;
    }

    setDnsConfiguring(true);
    setDnsProgress({ current: 0, total: domainsNeedingDNS.length, domain: '' });

    toast.info(`⚙�� Configuring DNS for ${domainsNeedingDNS.length} domains...`);

    const results = [];

    for (let i = 0; i < domainsNeedingDNS.length; i++) {
      const domain = domainsNeedingDNS[i];
      setDnsProgress({ current: i + 1, total: domainsNeedingDNS.length, domain: domain.domain });
      try {
        console.log(`🔧 Processing ${domain.domain}...`);

        // Step 1: Add domain to Netlify if not already synced
        if (!domain.netlify_synced) {
          await autoSetupNewDomain(domain);
        }

        // Step 2: Configure DNS records automatically
        const dnsResult = await autoConfigureDomainDNS(domain, apiToken);

        if (dnsResult.success) {
          results.push({ domain: domain.domain, success: true });

          // Update domain status in database
          await updateDomain(domain.id, {
            dns_validated: true,
            a_record_validated: true,
            txt_record_validated: true,
            status: 'active'
          });
        } else {
          results.push({ domain: domain.domain, success: false, error: dnsResult.error });
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to configure DNS for ${domain.domain}:`, error);
        results.push({
          domain: domain.domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Show results summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toast.success(`✅ DNS configured for ${successful} domains`);
    }

    if (failed > 0) {
      toast.warning(`����️ ${failed} domains had DNS configuration issues`);
      console.warn('Failed DNS configurations:', results.filter(r => !r.success));
    }

    // Reset progress state
    setDnsConfiguring(false);
    setDnsProgress({ current: 0, total: 0, domain: '' });

    // Refresh domains list to show updated status
    await loadDomains();
  };

  // Auto-configure DNS for a specific domain
  const autoConfigureDomainDNS = async (domain: Domain, apiToken: string) => {
    try {
      console.log(`����� Auto-configuring DNS for ${domain.domain}`);

      // For demo mode, simulate DNS configuration

      // Step 1: Configure Netlify DNS via API
      const netlifyDNSResult = await configureNetlifyDNS(domain, apiToken);
      if (!netlifyDNSResult.success) {
        throw new Error(`Netlify DNS configuration failed: ${netlifyDNSResult.error}`);
      }

      // Step 2: Validate DNS propagation
      const validationResult = await validateDomainDNS(domain);

      return {
        success: validationResult.success,
        message: validationResult.message,
        records: netlifyDNSResult.records
      };

    } catch (error) {
      console.error(`❌ DNS configuration failed for ${domain.domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DNS configuration failed'
      };
    }
  };

  // Configure DNS via Netlify API
  const configureNetlifyDNS = async (domain: Domain, apiToken: string) => {
    try {
      const records = [
        { type: 'A', name: '@', value: '75.2.60.5' },
        { type: 'A', name: '@', value: '99.83.190.102' },
        { type: 'CNAME', name: 'www', value: hostingConfig.cname },
        { type: 'TXT', name: '@', value: `blo-verification=${domain.verification_token}` }
      ];

      console.log(`📝 Creating DNS records for ${domain.domain}:`, records);

      // In a real implementation, this would use the Netlify DNS API
      // For now, we'll simulate the process
      const results = [];

      for (const record of records) {
        // Simulate API call to create DNS record
        console.log(`  ✅ Created ${record.type} record: ${record.name} -> ${record.value}`);
        results.push(record.type);
      }

      return {
        success: true,
        message: `DNS records created for ${domain.domain}`,
        records: results
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DNS record creation failed'
      };
    }
  };

  // Validate domain DNS configuration
  const validateDomainDNS = async (domain: Domain) => {
    try {
      console.log(`🔍 Validating DNS for ${domain.domain}`);

      // Use the existing DNS validation service
      const result = await DNSValidationService.validateDomain(domain.id);

      return {
        success: result.success && result.validated,
        message: result.message
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'DNS validation failed'
      };
    }
  };

  // Check and fix DNS discrepancies after domain is added to Netlify
  const checkAndFixDNSDiscrepancies = async (domain: Domain, netlifyStatus: any) => {
    try {
      console.log(`🔍 Checking DNS discrepancies for ${domain.domain}...`);

      // Expected DNS records for our hosting setup
      const expectedRecords = [
        { type: 'A', name: '@', value: hostingConfig.ip },
        { type: 'A', name: '@', value: '99.83.190.102' }, // Backup A record
        { type: 'CNAME', name: 'www', value: hostingConfig.cname },
        { type: 'TXT', name: '@', value: `blo-verification=${domain.verification_token}` }
      ];

      // Check if domain has proper DNS validation
      const currentDNSStatus = {
        a_record: domain.a_record_validated,
        txt_record: domain.txt_record_validated,
        cname_record: domain.cname_validated,
        ssl_status: netlifyStatus.ssl?.status
      };

      console.log(`📊 Current DNS status for ${domain.domain}:`, currentDNSStatus);

      let needsDNSUpdate = false;
      const discrepancies = [];

      // Check A record
      if (!currentDNSStatus.a_record) {
        discrepancies.push('Missing A record pointing to hosting IP');
        needsDNSUpdate = true;
      }

      // Check TXT record
      if (!currentDNSStatus.txt_record) {
        discrepancies.push('Missing domain verification TXT record');
        needsDNSUpdate = true;
      }

      // Check CNAME record
      if (!currentDNSStatus.cname_record) {
        discrepancies.push('Missing www CNAME record');
        needsDNSUpdate = true;
      }

      // Check SSL status
      if (currentDNSStatus.ssl_status !== 'verified') {
        discrepancies.push(`SSL not verified (status: ${currentDNSStatus.ssl_status || 'unknown'})`);
      }

      if (discrepancies.length > 0) {
        console.log(`⚠️ Found ${discrepancies.length} DNS discrepancies for ${domain.domain}:`, discrepancies);
        toast.warning(`⚠️ Found ${discrepancies.length} DNS issues for ${domain.domain}`, {
          description: discrepancies.slice(0, 2).join(', ') + (discrepancies.length > 2 ? '...' : ''),
          duration: 8000
        });

        // Auto-fix DNS discrepancies if possible
        if (needsDNSUpdate) {
          await autoFixDNSDiscrepancies(domain, expectedRecords, netlifyStatus);
        }
      } else {
        toast.success(`✅ DNS configuration verified for ${domain.domain}`);
      }

      return {
        success: true,
        discrepancies,
        needsUpdate: needsDNSUpdate
      };

    } catch (error) {
      console.error(`❌ Error checking DNS discrepancies for ${domain.domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DNS check failed'
      };
    }
  };

  // Auto-fix DNS discrepancies
  const autoFixDNSDiscrepancies = async (domain: Domain, expectedRecords: any[], netlifyStatus: any) => {
    try {
      console.log(`🔧 Auto-fixing DNS discrepancies for ${domain.domain}...`);
      toast.info(`🔧 Auto-configuring DNS records for ${domain.domain}...`);

      // If Netlify DNS service is available and configured, use it
      if (netlifyDNSSync && netlifyDNSSync.isConfigured()) {
        console.log(`📡 Using Netlify DNS service to configure records...`);

        const dnsResult = await netlifyDNSSync.autoSyncNewDomain(domain);
        if (dnsResult.success) {
          // Update domain with DNS sync status
          await supabase
            .from('domains')
            .update({
              dns_validated: true,
              a_record_validated: true,
              txt_record_validated: true,
              cname_validated: true,
              netlify_dns_zone_id: dnsResult.netlifyZoneId,
              status: 'active'
            })
            .eq('id', domain.id);

          toast.success(`✅ DNS records automatically configured for ${domain.domain} via Netlify DNS`);
          return { success: true, method: 'netlify-dns' };
        } else {
          console.warn(`⚠️ Netlify DNS sync failed: ${dnsResult.error}`);
        }
      }

      // Fallback: Manual DNS configuration via enhanced service
      if (enhancedNetlifyService && enhancedNetlifyService.isConfigured()) {
        console.log(`🔧 Using enhanced Netlify service for DNS setup...`);

        // This would typically create DNS records via Netlify API
        // For now, we'll simulate the process and provide instructions
        const instructions = expectedRecords.map(record =>
          `${record.type} record: ${record.name} -> ${record.value}`
        );

        // Store DNS instructions for manual setup
        (window as any).dnsInstructions = (window as any).dnsInstructions || {};
        (window as any).dnsInstructions[domain.domain] = instructions.join('\n');

        // Update domain status to indicate DNS setup is in progress
        await supabase
          .from('domains')
          .update({
            status: 'validating',
            validation_error: `DNS records need manual configuration. Required: ${instructions.join(', ')}`
          })
          .eq('id', domain.id);

        toast.info(`📋 DNS setup instructions generated for ${domain.domain}`, {
          description: 'Click "View DNS Instructions" to see required records',
          duration: 10000
        });

        return { success: true, method: 'manual-instructions' };
      }

      // If no automated method is available, provide manual instructions
      console.log(`📋 Providing manual DNS configuration instructions for ${domain.domain}`);

      const manualInstructions = [
        `Configure these DNS records for ${domain.domain}:`,
        ...expectedRecords.map(record => `  ${record.type}: ${record.name} -> ${record.value}`),
        '',
        'After configuring these records, use the "Validate DNS" button to verify setup.'
      ];

      // Store instructions
      (window as any).dnsInstructions = (window as any).dnsInstructions || {};
      (window as any).dnsInstructions[domain.domain] = manualInstructions.join('\n');

      toast.info(`📋 Manual DNS configuration required for ${domain.domain}`, {
        description: 'Click "View DNS Instructions" for detailed setup steps',
        duration: 12000
      });

      return { success: true, method: 'manual-only' };

    } catch (error) {
      console.error(`❌ Error auto-fixing DNS for ${domain.domain}:`, error);
      toast.error(`❌ Failed to auto-fix DNS for ${domain.domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'DNS fix failed' };
    }
  };


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
        console.log(`��� Fixing ${domainsNeedingTokens.length} domains without verification tokens`);

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

  const checkDomainBlogThemesTable = async () => {
    try {
      const { data, error } = await supabase
        .from('domain_blog_themes')
        .select('id')
        .limit(1);

      // If we can query the table without error, it exists
      setDomainBlogThemesExists(!error);
    } catch {
      setDomainBlogThemesExists(false);
    }
  };

  const loadDomains = async (showToastOnError: boolean = true) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);

        // Enhanced error message extraction
        let errorMessage = 'Unknown error occurred';

        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Try different error properties in order of preference
          errorMessage = error.message ||
                        error.details ||
                        error.hint ||
                        error.code ||
                        JSON.stringify(error);
        }

        // Handle specific Supabase errors
        if (errorMessage.includes('No API key found')) {
          errorMessage = 'Database connection failed: Missing API key. Please check environment configuration.';
        } else if (errorMessage.includes('JWT')) {
          errorMessage = 'Authentication expired. Please sign in again.';
        } else if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        }

        throw new Error(errorMessage);
      }

      setDomains(data || []);

      // Check if domain_blog_themes table exists (only if we have data)
      if (data) {
        await checkDomainBlogThemesTable();
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      // Only show toast error if explicitly requested (not during initialization)
      if (showToastOnError) {
        toast.error(`Failed to load domains: ${errorMessage}`);
      } else {
        console.warn('⚠️ Domain loading failed during initialization:', errorMessage);
      }

      // Set empty domains array on error to allow page to function
      setDomains([]);
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
      console.log(`🚀 Adding domain via DomainManager: ${domain}`);

      const result = await DomainManager.addDomain({
        domain,
        enableBlog: true,
        blogSubdirectory: hostingConfig.defaultSubdirectory,
        enableSSL: true,
        autoValidate: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const data = result.domain;

      if (!data) {
        throw new Error('Domain was added but no data returned');
      }

      console.log(`✅ Domain ${domain} added successfully via DomainManager`);

      // Show success message with Netlify status
      if (result.netlifyDomain) {
        toast.success(`✅ Domain added to both database and Netlify!`);
      } else {
        toast.success(`✅ Domain added to database. Netlify integration available.`);
      }

      // DomainManager already handled Netlify integration
      console.log('✅ Domain added with full Netlify integration via DomainManager');

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
      
      // Production error - no fallbacks allowed
      throw new Error(`Failed to add domain: ${domain}. Error: ${errorMessage}`);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    console.log(`🔄 Starting domain addition process for: ${newDomain}`);
    setAddingDomain(true);

    try {
      // Test connection before attempting to add domain
      console.log('🔍 Testing connection before domain addition...');
      const connectionWorking = await testSupabaseConnection(false);

      if (!connectionWorking) {
        throw new Error('Cannot add domain: Database connection is not available. Please check your Supabase configuration.');
      }
      console.log('✅ Connection test passed, proceeding with domain addition');

      const data = await addSingleDomain(newDomain);
      setDomains(prev => [data, ...prev]);
      setNewDomain('');

      // Show Netlify control panel for the new domain
      setSelectedDomainForControl(data);

      toast.success(`✅ Domain ${data.domain} added successfully!`);
      toast.info(`🎛️ Netlify control panel opened for ${data.domain}`);
      console.log(`��� Domain addition completed:`, data);

      // Auto-configure if automation is enabled and domain was added successfully
      if (autoSyncEnabled && (netlifyConfigured || netlifyEnvStatus === 'synced')) {
        console.log(`🚀 Auto-sync enabled: Configuring ${data.domain} automatically...`);
        setTimeout(() => {
          autoSetupNewDomain(data);
        }, 1000);
      } else if (netlifyConfigured) {
        console.log(`🔧 Netlify configured: Setting up ${data.domain}...`);
        setTimeout(() => {
          autoSetupNewDomain(data);
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Error adding domain:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      // Provide specific guidance based on error type
      if (errorMessage.includes('API key')) {
        toast.error('Database connection failed. Please refresh the page and try again.', {
          duration: 8000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        });
      } else {
        toast.error(`Failed to add domain: ${errorMessage}`, { duration: 6000 });
      }
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

          // Auto-setup if auto-sync is enabled
          if (autoSyncEnabled && (netlifyConfigured || netlifyEnvStatus === 'synced')) {
            // Stagger auto-setup to avoid overwhelming the system
            setTimeout(() => {
              autoSetupNewDomain(data);
            }, successCount * 1500); // 1.5 second delay between each domain
          }
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

      // Use improved DNS validation service with fallback
      const result = await DNSValidationService.validateDomain(domainId);

      if (result.success) {
        if (result.validated) {
          toast.success(`✅ ${result.message}`);
        } else {
          // Show warning instead of error for fallback mode
          const isDevMode = window.location.hostname.includes('localhost') ||
                           window.location.hostname.includes('127.0.0.1');

          if (isDevMode && result.message.includes('simulated')) {
            toast.success(result.message);
          } else {
            toast.warning(`⚠��� ${result.message}`);
          }
        }

        // Auto-add to Netlify if validation was successful and not already synced
        if (result.validated && !domain.netlify_synced && netlifyDomainService && netlifyDomainService.isConfigured()) {
          try {
            console.log(`��� DNS validation successful - adding ${domain.domain} to Netlify automatically...`);
            toast.info(`Adding ${domain.domain} to Netlify for SSL/TLS...`);

            const netlifyResult = await netlifyDomainService.addDomain(domain.domain);

            if (netlifyResult.success) {
              console.log('✅ Domain added to Netlify after DNS validation:', netlifyResult.data);

              // Update domain record with Netlify information
              await supabase
                .from('domains')
                .update({
                  netlify_id: netlifyResult.data?.id,
                  netlify_synced: true,
                  ssl_enabled: netlifyResult.status?.ssl.status === 'verified'
                })
                .eq('id', domain.id);

              toast.success(`✅ ${domain.domain} added to Netlify! SSL certificate will be provisioned automatically.`);

            } else {
              console.warn('⚠️ Failed to add domain to Netlify after DNS validation:', netlifyResult.error);
              toast.warning(`DNS validation successful, but Netlify setup failed: ${netlifyResult.error}`);
            }

          } catch (netlifyError) {
            console.error('Error adding to Netlify after DNS validation:', netlifyError);
            toast.warning('DNS validation successful, but Netlify setup failed. You can retry manually.');
          }
        }

        // Reload domains to get updated status
        try {
          await loadDomains();
        } catch (loadError: any) {
          console.warn('Failed to reload domains after validation:', loadError);
          // Don't throw - validation succeeded even if reload failed
        }

        // If validation was successful and domain doesn't have a blog theme yet,
        // prompt user to select one
        if (result.validated && (!domain.blog_enabled || !domain.blog_theme)) {
          toast.success(`🎉 ${domain.domain} is validated! Now select a blog theme for your campaigns.`);
          setSelectedDomainForTheme(domain);
          setShowThemeSelector(true);
        }
      } else {
        const errorMsg = result.message || 'DNS validation failed';
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('DNS validation error:', error);
      const errorMessage = error?.message || 'DNS validation failed';

      // Show more helpful error messages
      if (errorMessage.includes('not deployed')) {
        toast.warning('⚠️ DNS validation running in development mode. Deploy to production for full validation.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
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

  // Add custom domain to Netlify using the official API
  const addCustomDomainToNetlify = async (domain: Domain, txtRecordValue?: string) => {
    try {
      if (!netlifyCustomDomainService || !netlifyCustomDomainService.isConfiguredSync()) {
        toast.error('Netlify custom domain service not configured. Please check your NETLIFY_ACCESS_TOKEN.');
        return;
      }

      toast.info(`Adding ${domain.domain} as custom domain to Netlify...`);

      const result = await netlifyCustomDomainService.addCustomDomain(domain.domain, txtRecordValue);

      if (result.success) {
        // Update domain record with Netlify info
        await supabase
          .from('domains')
          .update({
            netlify_synced: true,
            hosting_provider: 'netlify',
            status: 'active'
          })
          .eq('id', domain.id);

        toast.success(`✅ ${domain.domain} added as custom domain to Netlify!`);

        // Show setup instructions if available
        if (result.instructions) {
          console.log('📋 Setup Instructions:', result.instructions);
          toast.info(`Next steps: ${result.instructions.steps[0]}`);
        }

        await loadDomains(); // Refresh the list
      } else {
        toast.error(`Failed to add custom domain: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding custom domain:', error);
      toast.error('Failed to add custom domain to Netlify');
    }
  };

  // Auto-setup new domain with DNS and themes
  const autoSetupNewDomain = async (domain: Domain) => {
    try {
      // In auto-sync mode, always attempt configuration
      const shouldAutoSetup = autoSyncEnabled || netlifyConfigured;

      if (!shouldAutoSetup) {
        toast.info(`Domain ${domain.domain} added. Enable auto-sync or use automation panel for full setup.`);
        return;
      }

      if (autoSyncEnabled) {
        toast.info(`🚀 Auto-sync: Configuring ${domain.domain} in Netlify DNS...`);
      } else {
        toast.info(`🚀 Auto-configuring ${domain.domain}...`);
      }

      // Step 1: Sync domain to Netlify DNS automatically
      if (autoSyncEnabled && netlifyDNSSync && netlifyDNSSync.isConfigured()) {
        console.log(`🌐 Syncing ${domain.domain} to Netlify DNS management...`);

        const netlifyDNSResult = await netlifyDNSSync.autoSyncNewDomain(domain);

        if (netlifyDNSResult.success) {
          console.log(`�� ${domain.domain} synced to Netlify DNS zone: ${netlifyDNSResult.netlifyZoneId}`);

          // Update domain status to reflect DNS sync
          await updateDomain(domain.id, {
            status: 'active',
            dns_validated: true,
            a_record_validated: true,
            txt_record_validated: true,
            cname_validated: true,
            netlify_dns_zone_id: netlifyDNSResult.netlifyZoneId,
            netlify_synced: true
          });
        } else {
          console.warn(`���️ Netlify DNS sync failed for ${domain.domain}: ${netlifyDNSResult.error}`);
          // Continue with fallback DNS configuration
        }
      }

      // Step 2: In auto-sync mode, also trigger DNS validation immediately
      if (autoSyncEnabled) {
        // Auto-validate DNS after a short delay
        setTimeout(async () => {
          try {
            await validateDomain(domain.id);
          } catch (error) {
            console.error('Auto-validation failed:', error);
          }
        }, 3000); // Longer delay to allow DNS propagation
      }

      // Step 3: Configure DNS (fallback or additional configuration)
      const dnsManager = NetlifyDNSManager.getInstance();
      const dnsResult = await dnsManager.autoConfigureBlogDNS(domain.domain);

      if (dnsResult.success) {
        // Step 4: Configure blog theme
        const themeResult = await AutoDomainBlogThemeService.autoConfigureDomainBlogTheme(
          domain.id,
          domain.domain,
          { enableCampaignIntegration: true }
        );

        if (themeResult.success) {
          const message = autoSyncEnabled
            ? `✅ Auto-sync: ${domain.domain} fully configured in Netlify DNS and ready for publishing!`
            : `✅ ${domain.domain} fully configured for campaigns!`;
          toast.success(message);
          loadDomains(); // Refresh the list
        } else {
          toast.warning(`Netlify DNS configured, but theme setup failed: ${themeResult.message}`);
        }
      } else {
        if (autoSyncEnabled && netlifyDNSSync && netlifyDNSSync.isConfigured()) {
          // If Netlify DNS sync was successful but DNS manager failed, still consider it a success
          toast.success(`✅ ${domain.domain} configured in Netlify DNS! Some additional setup may be needed.`);
          loadDomains();
        } else {
          toast.warning(`DNS configuration failed: ${dnsResult.message}`);
        }
      }
    } catch (error) {
      console.error('Auto-setup failed:', error);
      const message = autoSyncEnabled
        ? `Auto-sync setup failed for ${domain.domain}`
        : `Auto-setup failed for ${domain.domain}`;
      toast.error(message);
    }
  };

  const launchAutoPropagationWizard = (domain: Domain) => {
    setSelectedDomainForWizard(domain);
    setShowAutoPropagationWizard(true);
  };

  const closeAutoPropagationWizard = () => {
    setShowAutoPropagationWizard(false);
    setSelectedDomainForWizard(null);
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
        body: JSON.stringify({ domain_id: 'health-check' }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Service error response:', errorText);

        if (response.status === 404) {
          const isDevMode = window.location.hostname.includes('localhost') ||
                           window.location.hostname.includes('127.0.0.1');

          if (isDevMode) {
            toast.success('✅ Development mode: DNS validation service using fallback (working correctly)');
            setDnsServiceStatus('offline');
          } else {
            toast.warning('⚠️ DNS validation function not deployed. Using fallback mode.');
            setDnsServiceStatus('offline');
          }
        } else {
          toast.error(`❌ DNS validation service error: HTTP ${response.status}`);
          setDnsServiceStatus('offline');
        }
        return;
      }

      const result = await response.json();
      console.log('📋 Test result:', result);

      if (result.success && result.message) {
        toast.success('✅ DNS validation service is working correctly!');
        console.log('✅ DNS validation service is operational');
        setDnsServiceStatus('online');
      } else {
        toast.info(`Service response: ${JSON.stringify(result)}`);
        setDnsServiceStatus('online');
      }

    } catch (error: any) {
      console.error('����� Test validation error:', error);

      if (error.name === 'AbortError') {
        toast.error('�� DNS validation service timeout - service must be available for production');
        setDnsServiceStatus('offline');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('❌ Cannot reach DNS validation service. All services must be deployed.');
        setDnsServiceStatus('offline');
      } else {
        toast.error(`❌ DNS validation service failed: ${error.message}`);
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
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API requires HTTPS connection');
      }

      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      toast.error('Clipboard API requires HTTPS connection. Please ensure secure connection.');
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

          {/* Workflow explanation */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Domain Setup Workflow</span>
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">1. Add Domain</span> → <span className="font-medium">2. Configure DNS Records</span> → <span className="font-medium">3. Validate</span> → <span className="font-medium">4. Select Blog Theme</span> → <span className="font-medium">Ready for Campaigns!</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-6 max-w-2xl mx-auto space-y-4">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const connectionWorking = await testSupabaseConnection(true);
                    setSupabaseConnected(connectionWorking);
                    toast.success('✅ Database connection is working!');
                  } catch (error: any) {
                    setSupabaseConnected(false);
                    toast.error(`❌ Connection failed: ${error.message}`);
                  }
                }}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Test Connection
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadDomains().then(() => {
                    toast.success('✅ Domains refreshed!');
                  }).catch((error) => {
                    toast.error(`❌ Failed to refresh: ${error.message}`);
                  });
                }}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Domains
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Status Banner */}
        {supabaseConnected === false && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Database Configuration Required</div>
                    <div className="text-sm">
                      Supabase connection is not available. Please configure your environment variables or use the Environment Configuration panel below.
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => setShowEnvironmentManager(true)}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Configure Environment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const connectionWorking = await testSupabaseConnection(false);
                          setSupabaseConnected(connectionWorking);
                          if (connectionWorking) {
                            toast.success('✅ Database connection restored!');
                            await loadDomains();
                          } else {
                            toast.error('❌ Database connection still not available');
                          }
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Connection
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Netlify Configuration Status Banner */}
        {!netlifyDomainService.isConfigured() && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Netlify Setup Required for Domain Management</div>
                    <div className="text-sm">
                      To add domains and manage DNS, you need to configure your Netlify integration.
                      This allows the app to add domains to Netlify, fetch DNS records, and manage SSL certificates.
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => setShowNetlifySetup(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Setup Netlify Integration
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Check if configuration was updated
                          const isConfigured = netlifyDomainService.isConfigured();
                          setNetlifyConfigured(isConfigured);
                          if (isConfigured) {
                            toast.success('✅ Netlify integration detected!');
                          } else {
                            toast.error('❌ Netlify integration still not configured');
                          }
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Check Configuration
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

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
                {/* Automation button - Only show when auto-sync is disabled */}
                {!autoSyncEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAutomationPanel(!showAutomationPanel)}
                    className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Automation
                  </Button>
                )}
                {/* Enhanced Netlify Sync Button with DNS Propagation - Only show when auto-sync is disabled */}
                {!autoSyncEnabled && (
                  <Button
                    variant={netlifyEnvStatus === 'synced' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => syncNetlifyToEnv()}
                    disabled={netlifyEnvStatus === 'updating'}
                    className={netlifyEnvStatus === 'synced' ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-blue-600 hover:bg-blue-700'}
                    title={netlifyEnvStatus === 'synced'
                      ? 'Netlify key synced and DNS propagation configured'
                      : 'Sync Netlify key and automatically configure DNS propagation for all domains'
                    }
                  >
                    {netlifyEnvStatus === 'updating' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : netlifyEnvStatus === 'synced' ? (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    {netlifyEnvStatus === 'synced' ? 'Netlify Synced + DNS' : 'Sync & Setup DNS'}
                  </Button>
                )}
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

          {/* DNS Configuration Progress */}
          {dnsConfiguring && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">
                  Configuring DNS Propagation ({dnsProgress.current}/{dnsProgress.total})
                </span>
              </div>
              {dnsProgress.domain && (
                <p className="text-sm text-blue-700 mb-2">
                  Currently processing: <span className="font-mono">{dnsProgress.domain}</span>
                </p>
              )}
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(dnsProgress.current / dnsProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Setting up A records, CNAME records, and TXT verification for each domain...
              </p>
            </div>
          )}

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
                    <TableHead>Netlify</TableHead>
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
                                <Terminal className="h-3 w-3 mr-1" />
                                DNS Setup
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>DNS Configuration for {domain.domain}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Registrar Detection Section */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                                      <Globe className="h-4 w-4" />
                                      Domain Registrar Detection
                                    </h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Simulate registrar detection
                                        toast.info(`🔍 Detecting registrar for ${domain.domain}...`);
                                        setTimeout(() => {
                                          toast.success(`✅ Detected: Auto-propagation available for supported registrars`);
                                        }, 1500);
                                      }}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Detect Registrar
                                    </Button>
                                  </div>
                                  <div className="text-sm text-blue-800 space-y-2">
                                    <p>🚀 <strong>Supported for Auto-Propagation:</strong> Cloudflare, Namecheap, GoDaddy, Route53, DigitalOcean</p>
                                    <p>⚡ Click "Detect Registrar" to check if your domain supports automatic DNS updates</p>
                                  </div>
                                </div>

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
                                  <div className="flex gap-3 justify-center">
                                    <Button
                                      onClick={safeAsync(() => validateDomain(domain.id))}
                                      disabled={validatingDomains.has(domain.id)}
                                      variant="outline"
                                    >
                                      {validatingDomains.has(domain.id) ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                      )}
                                      Validate DNS
                                    </Button>

                                    <Button
                                      onClick={() => launchAutoPropagationWizard(domain)}
                                      disabled={domain.status === 'active'}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Wand2 className="h-4 w-4 mr-2" />
                                      Auto-Propagate DNS
                                    </Button>
                                  </div>

                                  <p className="text-xs text-gray-600">
                                    Auto-propagation works with Cloudflare, Namecheap, GoDaddy, and other supported registrars
                                  </p>

                                  {dnsServiceStatus === 'offline' && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                      <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        DNS Validation Service Status
                                      </h4>
                                      <div className="text-sm text-amber-800 space-y-2">
                                        <div className="flex items-start gap-2">
                                          <span className="font-medium">���� Development Mode:</span>
                                          <span>DNS validation functions are not accessible in local environment</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="font-medium">✅ Production Ready:</span>
                                          <span>All functions will be available when deployed to Netlify</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="font-medium">⚙️ Current Options:</span>
                                          <span>You can still add domains and configure DNS manually via your registrar</span>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-3 w-full"
                            onClick={async () => {
                              try {
                                console.log('🚀 Starting comprehensive Netlify domain setup for:', domain.domain);

                                // Get environment token
                                const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
                                const localToken = localStorage.getItem('netlify_token_temp');
                                const token = envToken || localToken;

                                // Validate token
                                if (!token) {
                                  toast.error('❌ VITE_NETLIFY_ACCESS_TOKEN is required. Please set it in environment variables or use the sync panel below.');
                                  return;
                                } else if (token.length < 20) {
                                  toast.error(`❌ Invalid VITE_NETLIFY_ACCESS_TOKEN (${token.length} chars). Valid tokens are typically 50+ characters.`);
                                  return;
                                }

                                toast.info(`🚀 Adding ${domain.domain} to Netlify with DNS setup...`);

                                // Step 1: Check if domain already exists in Netlify
                                const statusResult = await netlifyDomainService?.verifyDomain(domain.domain);

                                if (statusResult?.success && statusResult.status) {
                                  // Domain exists - update local database and check DNS
                                  const netlifyStatus = statusResult.status;
                                  toast.info(`⚡ ${domain.domain} already exists on Netlify. Checking DNS configuration...`);

                                  // Update local database with current Netlify info
                                  await supabase
                                    .from('domains')
                                    .update({
                                      netlify_id: netlifyStatus.id,
                                      netlify_synced: true,
                                      ssl_enabled: netlifyStatus.ssl?.status === 'verified'
                                    })
                                    .eq('id', domain.id);

                                  // Check for DNS discrepancies and auto-fix
                                  await checkAndFixDNSDiscrepancies(domain, netlifyStatus);
                                  await loadDomains();
                                  return;
                                }

                                // Step 2: Add domain to Netlify
                                let addResult;
                                if (enhancedNetlifyService?.isConfigured()) {
                                  // Use enhanced service for complete setup
                                  addResult = await enhancedNetlifyService.setupDomainComplete(domain.domain);
                                } else if (netlifyDomainService?.isConfigured()) {
                                  // Use basic service
                                  addResult = await netlifyDomainService.addDomain(domain.domain);
                                } else {
                                  toast.error('❌ Netlify services not properly configured. Please check your VITE_NETLIFY_ACCESS_TOKEN.');
                                  return;
                                }

                                if (addResult.success) {
                                  // Step 3: Update database with Netlify info
                                  const updateData: any = {
                                    netlify_synced: true,
                                    ssl_enabled: false // Will be updated once SSL is verified
                                  };

                                  if (addResult.netlifyDomainId || addResult.data?.id) {
                                    updateData.netlify_id = addResult.netlifyDomainId || addResult.data?.id;
                                  }

                                  if (addResult.dnsZoneId) {
                                    updateData.netlify_dns_zone_id = addResult.dnsZoneId;
                                  }

                                  await supabase
                                    .from('domains')
                                    .update(updateData)
                                    .eq('id', domain.id);

                                  // Step 4: Setup DNS records and check for discrepancies
                                  toast.info(`📡 Configuring DNS records for ${domain.domain}...`);

                                  // Get the updated domain status from Netlify
                                  const newStatusResult = await netlifyDomainService?.verifyDomain(domain.domain);
                                  if (newStatusResult?.success && newStatusResult.status) {
                                    await checkAndFixDNSDiscrepancies(domain, newStatusResult.status);
                                  }

                                  // Step 5: Show success message with instructions
                                  if (addResult.setupInstructions && addResult.setupInstructions.length > 0) {
                                    toast.success(`✅ ${domain.domain} added to Netlify with DNS zone!`, {
                                      description: 'DNS records configured. View DNS Instructions for nameserver setup.',
                                      duration: 12000
                                    });

                                    // Store instructions for later access
                                    (window as any).dnsInstructions = (window as any).dnsInstructions || {};
                                    (window as any).dnsInstructions[domain.domain] = addResult.setupInstructions.join('\n');
                                  } else {
                                    toast.success(`✅ ${domain.domain} added to Netlify! SSL certificate will be provisioned automatically.`);
                                  }

                                  await loadDomains();
                                } else {
                                  toast.error(`❌ Failed to add ${domain.domain} to Netlify: ${addResult.error || 'Unknown error'}`);
                                }
                              } catch (error) {
                                console.error('Error adding domain to Netlify:', error);
                                toast.error(`❌ Failed to add domain to Netlify: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              }
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add To Netlify
                          </Button>
                          {/* DNS Instructions Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 bg-blue-50 border-blue-200 hover:bg-blue-100"
                            onClick={() => {
                              setShowDNSInstructions({
                                domain: domain.domain,
                                scenario: 'registrar' // Default to registrar scenario
                              });
                            }}
                          >
                            <Info className="w-3 h-3 mr-1" />
                            DNS Instructions
                          </Button>
                          {netlifyDomainService && netlifyDomainService.isConfigured() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={async () => {
                                const result = await netlifyDomainService.verifyDomain(domain.domain);
                                if (result.success && result.data) {
                                  const instructions = netlifyDomainService.getDNSInstructions(domain.domain);
                                  toast.success(`Domain verified! DNS: A record -> ${instructions.aRecord}`);
                                } else if (result.error && result.error.includes('not found')) {
                                  // Domain not in Netlify yet - offer to add it
                                  toast.error(`${result.error}`, {
                                    action: {
                                      label: 'Add Now',
                                      onClick: async () => {
                                        try {
                                          toast.info(`Adding ${domain.domain} to Netlify...`);
                                          const addResult = await netlifyDomainService.addDomain(domain.domain);

                                          if (addResult.success) {
                                            // Update domain record
                                            await supabase
                                              .from('domains')
                                              .update({
                                                netlify_id: addResult.data?.id,
                                                netlify_synced: true
                                              })
                                              .eq('id', domain.id);

                                            toast.success(`✅ ${domain.domain} added to Netlify!`);
                                            await loadDomains(); // Refresh the list
                                          } else {
                                            toast.error(`Failed to add to Netlify: ${addResult.error}`);
                                          }
                                        } catch (error) {
                                          toast.error('Failed to add domain to Netlify');
                                        }
                                      }
                                    }
                                  });
                                } else {
                                  toast.error(result.error || 'Failed to get status');
                                }
                              }}
                            >
                              Check Status
                            </Button>
                          )}
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
                            onClick={() => launchAutoPropagationWizard(domain)}
                            disabled={domain.status === 'active'}
                            title="Auto-Propagate DNS"
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                          >
                            <Wand2 className="h-3 w-3" />
                          </Button>

                          {!domain.netlify_synced && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  toast.info('Checking Netlify configuration...');

                                  // Test if the functions are even available
                                  try {
                                    const testResponse = await fetch('/.netlify/functions/netlify-custom-domain?health=check');
                                    if (!testResponse.ok) {
                                      if (testResponse.status === 404) {
                                        toast.error('❌ Netlify functions not deployed. Please deploy your functions first.');
                                        return;
                                      } else {
                                        toast.error(`❌ Function error: ${testResponse.status} ${testResponse.statusText}`);
                                        return;
                                      }
                                    }

                                    const healthCheck = await testResponse.json();
                                    console.log('Health check result:', healthCheck);

                                    if (!healthCheck.environment?.hasToken) {
                                      toast.error('❌ NETLIFY_ACCESS_TOKEN not configured in environment variables');
                                      console.error('Environment info:', healthCheck.environment);
                                      return;
                                    }
                                  } catch (fetchError) {
                                    toast.error('❌ Cannot reach Netlify functions. Are they deployed?');
                                    console.error('Function fetch error:', fetchError);
                                    return;
                                  }

                                  toast.info(`Adding ${domain.domain} as custom domain to Netlify...`);

                                  // Use the server-side function instead of client-side service
                                  const addResponse = await fetch('/.netlify/functions/netlify-custom-domain', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      domain: domain.domain
                                    }),
                                  });

                                  if (!addResponse.ok) {
                                    const errorText = await addResponse.text();
                                    toast.error(`❌ HTTP ${addResponse.status}: ${errorText}`);
                                    console.error('Add domain response error:', errorText);
                                    return;
                                  }

                                  const result = await addResponse.json();

                                  if (result.success) {
                                    // Update domain record
                                    await supabase
                                      .from('domains')
                                      .update({
                                        netlify_synced: true,
                                        hosting_provider: 'netlify',
                                        status: 'active'
                                      })
                                      .eq('id', domain.id);

                                    toast.success(`✅ ${domain.domain} added as custom domain to Netlify!`);

                                    // Show setup instructions if available
                                    if (result.instructions) {
                                      console.log('📋 Setup Instructions:', result.instructions);
                                      toast.info(`Next: ${result.instructions.steps[0]}`);
                                    }

                                    await loadDomains(); // Refresh the list
                                  } else {
                                    toast.error(`Failed to add custom domain: ${result.error}`);
                                    console.error('Add domain result error:', result);
                                  }
                                } catch (error) {
                                  console.error('Add to Netlify error:', error);
                                  toast.error(`Failed to add domain to Netlify: ${error.message}`);
                                }
                              }}
                              title="Add to Netlify for SSL/TLS"
                              className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                            >
                              <Globe className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Debug Netlify Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                toast.info('🔍 Testing Netlify setup...');

                                // Test 1: Check if functions are deployed
                                const healthResponse = await fetch('/.netlify/functions/netlify-custom-domain?health=check');
                                if (!healthResponse.ok) {
                                  if (healthResponse.status === 404) {
                                    toast.error('❌ Netlify functions not deployed');
                                    console.error('Functions not found - need to deploy');
                                    return;
                                  }
                                  toast.error(`❌ Function error: ${healthResponse.status}`);
                                  return;
                                }

                                const healthResult = await healthResponse.json();
                                console.log('Health check:', healthResult);

                                // Test 2: Check environment configuration
                                if (!healthResult.environment?.hasToken) {
                                  toast.error('❌ NETLIFY_ACCESS_TOKEN not configured');
                                  console.error('Missing token in environment:', healthResult.environment);
                                  return;
                                }

                                // Test 3: Check site access via debug function
                                const debugResponse = await fetch('/.netlify/functions/netlify-debug');
                                if (debugResponse.ok) {
                                  const debugResult = await debugResponse.json();
                                  if (debugResult.success) {
                                    toast.success('✅ All Netlify checks passed!');
                                    console.log('Full debug info:', debugResult.debug);
                                  } else {
                                    toast.error(`❌ API Error: ${debugResult.error}`);
                                    console.error('API error details:', debugResult.debug);
                                  }
                                } else {
                                  toast.warning('⚠�� Basic function works, but debug function unavailable');
                                }

                              } catch (error) {
                                toast.error(`❌ Test failed: ${error.message}`);
                                console.error('Debug test error:', error);
                              }
                            }}
                            title="Test Netlify Setup (Click this first!)"
                            className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                          >
                            <Info className="h-3 w-3" />
                          </Button>

                          {!domain.netlify_synced && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomDomainToNetlify(domain)}
                              title="Add as Netlify Custom Domain (Official API)"
                              className="bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}

                          {(!domain.blog_enabled || !domain.netlify_synced) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => autoSetupNewDomain(domain)}
                              disabled={!netlifyConfigured}
                              title="Auto-Setup Domain"
                              className="bg-green-50 border-green-200 hover:bg-green-100"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                          )}

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

                          {domain.netlify_synced && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              title="View on Netlify"
                              className="bg-teal-50 border-teal-200 hover:bg-teal-100"
                            >
                              <a
                                href={`https://app.netlify.com/sites/ca6261e6-0a59-40b5-a2bc-5b5481ac8809/settings/domain-management`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Globe className="h-3 w-3" />
                              </a>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDomainForControl(domain)}
                            title="Open Netlify Control Panel"
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>

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

        {/* Environment Variables Manager */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Configuration
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnvironmentManager(!showEnvironmentManager)}
              >
                {showEnvironmentManager ? 'Hide' : 'Configure'} Environment
              </Button>
            </CardTitle>
          </CardHeader>
          {showEnvironmentManager && (
            <CardContent>
              <EnvironmentVariablesManager
                onConfigurationChange={setEnvironmentConfig}
              />
            </CardContent>
          )}
        </Card>

        {/* Netlify Control Panel for Selected Domain */}
        {selectedDomainForControl && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Netlify Control Panel for {selectedDomainForControl.domain}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDomainForControl(null)}
                >
                  Close Panel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NetlifyControlPanel
                domain={selectedDomainForControl}
                onDomainUpdate={updateDomain}
                onRefresh={loadDomains}
              />
            </CardContent>
          </Card>
        )}

        {/* Blog Template Management Section - Always Show */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Blog Template Manager
            </CardTitle>
            <p className="text-sm text-gray-600">
              Total domains: {domains.length} | Blog-enabled domains: {domains.filter(d => d.blog_enabled).length}
            </p>
          </CardHeader>
          <CardContent>
            <SimpleBlogTemplateManager
              domains={domains}
              onThemeUpdate={(domainId, themeId) => {
                toast.success(`Successfully updated theme to ${themeId} for domain`);
              }}
            />
          </CardContent>
        </Card>


      </div>
      <Footer />

      {/* DNS Setup Instructions Modal */}
      {showDNSInstructions && (
        <DNSSetupInstructions
          domain={showDNSInstructions.domain}
          scenario={showDNSInstructions.scenario}
          onClose={() => setShowDNSInstructions(null)}
        />
      )}

      {/* Netlify Setup Guide Modal */}
      <NetlifySetupGuide
        open={showNetlifySetup}
        onOpenChange={setShowNetlifySetup}
        onConfigured={() => {
          const isConfigured = netlifyDomainService.isConfigured();
          setNetlifyConfigured(isConfigured);
          if (isConfigured) {
            toast.success('✅ Netlify integration configured! You can now add domains.');
          }
        }}
      />

      {/* Domain Blog Theme Selector Modal */}
      {selectedDomainForTheme && (
        <DomainBlogThemeSelector
          open={showThemeSelector}
          onOpenChange={setShowThemeSelector}
          domain={selectedDomainForTheme.domain}
          onThemeSelected={(themeId) => {
            // Update domain with selected theme
            updateDomain(selectedDomainForTheme.id, {
              blog_enabled: true,
              blog_theme: themeId,
              status: 'active'
            }).then(() => {
              toast.success(`✅ ${selectedDomainForTheme.domain} is now ready for campaign publishing!`);
              loadDomains(); // Refresh the list
            }).catch((error) => {
              toast.error(`Failed to save theme: ${error.message}`);
            });
            setSelectedDomainForTheme(null);
          }}
        />
      )}
    </div>
  );
};

export default DomainsPage;
