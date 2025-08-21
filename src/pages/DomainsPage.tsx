import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Plus, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MinimalDomainsTable from '@/components/MinimalDomainsTable';
import NetlifySetupGuide from '@/components/NetlifySetupGuide';
import DomainBlogThemeSelector from '@/components/DomainBlogThemeSelector';
import DNSValidationService from '@/services/dnsValidationService';
import { netlifyPBNService, DNSRecord } from '@/services/netlifyPBNService';

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
  blog_theme?: string;
  netlify_domain_id?: string;
  dns_records?: DNSRecord[];
  is_publishing_platform?: boolean;
  netlify_state?: string;
}

const DomainsPage = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [validatingDomains, setValidatingDomains] = useState<Set<string>>(new Set());
  const [showNetlifySetup, setShowNetlifySetup] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedDomainForTheme, setSelectedDomainForTheme] = useState<Domain | null>(null);

  // Load domains from database
  const loadDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);
        toast.error('Failed to load domains');
        return;
      }

      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    loadDomains();
  }, []);

  // Clean domain name
  const cleanDomain = (domain: string) => {
    return domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  // Validate domain format
  const validateDomainFormat = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  // Generate verification token
  const generateVerificationToken = () => {
    return 'blo-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Add domain
  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    const domain = cleanDomain(newDomain);

    if (!validateDomainFormat(domain)) {
      toast.error(`Invalid domain format: ${newDomain}`);
      return;
    }

    setAddingDomain(true);

    try {
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain)
        .single();

      if (existingDomain) {
        toast.error('Domain already exists');
        return;
      }

      toast.info(`Adding ${domain} to Netlify hosting...`);

      // Add domain to Netlify first
      const netlifyResult = await netlifyPBNService.addDomainToPBN(domain);

      if (!netlifyResult.success) {
        throw new Error(`Netlify integration failed: ${netlifyResult.error}`);
      }

      // Add domain to database with Netlify information
      const { data, error } = await supabase
        .from('domains')
        .insert({
          domain,
          status: 'pending',
          verification_token: generateVerificationToken(),
          dns_validated: false,
          txt_record_validated: false,
          a_record_validated: false,
          cname_validated: false,
          ssl_enabled: false,
          blog_enabled: true, // Enable for PBN
          pages_published: 0,
          hosting_provider: 'netlify',
          netlify_domain_id: netlifyResult.domain?.id,
          dns_records: JSON.stringify(netlifyResult.dnsRecords),
          is_publishing_platform: false, // Will be true after validation
          netlify_state: netlifyResult.domain?.state
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDomains(prev => [data, ...prev]);
      setNewDomain('');

      toast.success(`✅ Domain ${domain} added to PBN hosting!`, {
        description: 'Configure DNS records to complete setup'
      });

      // Show DNS instructions
      if (netlifyResult.dnsRecords && netlifyResult.dnsRecords.length > 0) {
        const instructions = netlifyResult.dnsRecords.map(record =>
          `${record.type}: ${record.name} → ${record.value}`
        ).join('\n');

        console.log('DNS Instructions for', domain, ':\n', instructions);
      }

    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAddingDomain(false);
    }
  };

  // Validate domain
  const validateDomain = async (domainId: string) => {
    setValidatingDomains(prev => new Set(prev).add(domainId));

    try {
      const domain = domains.find(d => d.id === domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      toast.info(`Validating ${domain.domain} for PBN...`);

      // Validate with both our service and Netlify
      const [dnsResult, netlifyResult] = await Promise.all([
        DNSValidationService.validateDomain(domainId),
        netlifyPBNService.verifyDomain(domain.domain)
      ]);

      if (dnsResult.success && dnsResult.validated && netlifyResult.success) {
        toast.success(`✅ ${domain.domain} validated and ready for PBN!`);

        // Update domain status as active publishing platform
        await supabase
          .from('domains')
          .update({
            status: 'active',
            dns_validated: true,
            a_record_validated: true,
            txt_record_validated: true,
            cname_validated: true,
            is_publishing_platform: true, // Mark as available for /automation
            netlify_state: netlifyResult.domain?.state || 'verified'
          })
          .eq('id', domainId);

        await loadDomains();

        // Automatically set up for PBN - no theme selector needed
        toast.success(`🎉 ${domain.domain} is now active in your PBN!`, {
          description: 'Available for content publishing in /automation'
        });

        console.log(`✅ Domain ${domain.domain} added to PBN publishing platforms`);

      } else {
        const errorMsg = dnsResult.message || netlifyResult.error || 'Validation failed';
        toast.warning(`⚠️ ${errorMsg}`);

        // Update validation attempt
        await supabase
          .from('domains')
          .update({
            validation_error: errorMsg,
            last_validation_attempt: new Date().toISOString()
          })
          .eq('id', domainId);
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error(`❌ Validation failed: ${error.message}`);
    } finally {
      setValidatingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            Domains
          </h1>
        </div>

        {/* Add Domain */}
        <div className="max-w-md mx-auto mb-8">
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
            </Button>
          </div>
        </div>

        {/* Domains List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Domains ({domains.length})
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
              <MinimalDomainsTable
                domains={domains}
                validatingDomains={validatingDomains}
                onValidate={validateDomain}
              />
            )}
          </CardContent>
        </Card>

      </div>
      <Footer />

      {/* Netlify Setup Guide Modal */}
      <NetlifySetupGuide
        open={showNetlifySetup}
        onOpenChange={setShowNetlifySetup}
        onConfigured={() => {
          toast.success('✅ Netlify integration configured!');
        }}
      />

      {/* Domain Blog Theme Selector Modal */}
      {selectedDomainForTheme && (
        <DomainBlogThemeSelector
          open={showThemeSelector}
          onOpenChange={setShowThemeSelector}
          domain={selectedDomainForTheme.domain}
          onThemeSelected={async (themeId) => {
            try {
              await supabase
                .from('domains')
                .update({
                  blog_enabled: true,
                  blog_theme: themeId,
                  status: 'active'
                })
                .eq('id', selectedDomainForTheme.id);

              toast.success(`✅ ${selectedDomainForTheme.domain} is now ready for campaign publishing!`);
              await loadDomains();
            } catch (error: any) {
              toast.error(`Failed to save theme: ${error.message}`);
            }
            setSelectedDomainForTheme(null);
          }}
        />
      )}
    </div>
  );
};

export default DomainsPage;
