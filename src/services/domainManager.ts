/**
 * Domain Manager Service
 * Integrates Netlify API with Supabase database for complete domain management
 */

import { supabase } from '@/integrations/supabase/client';
import { netlifyDomainService, NetlifyDomain } from './netlifyDomainService';
import { toast } from 'sonner';

export interface Domain {
  id: string;
  user_id?: string;
  domain: string;
  status: 'pending' | 'validating' | 'active' | 'failed' | 'expired';
  verification_token: string;
  required_a_record?: string;
  required_cname?: string;
  hosting_provider: string;
  dns_validated: boolean;
  txt_record_validated: boolean;
  a_record_validated: boolean;
  cname_validated: boolean;
  ssl_enabled: boolean;
  last_validation_attempt?: string;
  validation_error?: string;
  auto_retry_count: number;
  max_retries: number;
  blog_enabled: boolean;
  blog_subdirectory: string;
  pages_published: number;
  created_at: string;
  updated_at: string;
  netlify_domain_id?: string;
  netlify_status?: string;
}

export interface AddDomainOptions {
  domain: string;
  enableBlog?: boolean;
  blogSubdirectory?: string;
  enableSSL?: boolean;
  autoValidate?: boolean;
}

export class DomainManager {
  /**
   * Add a new domain with full Netlify integration
   */
  static async addDomain(options: AddDomainOptions): Promise<{
    success: boolean;
    error?: string;
    domain?: Domain;
    netlifyDomain?: NetlifyDomain;
  }> {
    try {
      const { domain, enableBlog = true, blogSubdirectory = 'blog', enableSSL = true, autoValidate = true } = options;
      
      console.log(`🌐 Adding domain: ${domain}`);

      // Step 1: Add domain to Netlify
      const netlifyResult = await netlifyDomainService.addDomain(domain);
      if (!netlifyResult.success) {
        // Check if domain already exists
        if (netlifyResult.error?.includes('already exists') || netlifyResult.error?.includes('already added')) {
          console.log(`ℹ️ Domain ${domain} already exists in Netlify, proceeding...`);
        } else {
          return { success: false, error: `Netlify: ${netlifyResult.error}` };
        }
      }

      // Step 2: Get DNS configuration from Netlify
      const dnsInstructions = netlifyDomainService.getDNSInstructions(domain);

      // Step 3: Save to database
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain,
          status: 'pending',
          hosting_provider: 'netlify',
          required_a_record: dnsInstructions.aRecord,
          required_cname: dnsInstructions.cnameRecord,
          blog_enabled: enableBlog,
          blog_subdirectory: blogSubdirectory,
          ssl_enabled: enableSSL,
          netlify_domain_id: netlifyResult.data?.id,
          netlify_status: netlifyResult.data?.state
        })
        .select()
        .single();

      if (dbError) {
        // If database save fails, try to remove from Netlify
        if (netlifyResult.success) {
          await netlifyDomainService.removeDomain(domain);
        }
        return { success: false, error: `Database: ${dbError.message}` };
      }

      console.log(`✅ Domain ${domain} added successfully`);

      // Step 4: Auto-validate if requested
      if (autoValidate) {
        setTimeout(() => {
          this.validateDomain(domain).catch(console.error);
        }, 2000);
      }

      // Step 5: Enable SSL if requested
      if (enableSSL && netlifyResult.success) {
        setTimeout(() => {
          netlifyDomainService.enableSSL(domain).catch(console.error);
        }, 5000);
      }

      return {
        success: true,
        domain: dbDomain,
        netlifyDomain: netlifyResult.data
      };

    } catch (error: any) {
      console.error(`❌ Failed to add domain ${options.domain}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a domain from both Netlify and database
   */
  static async removeDomain(domainName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Removing domain: ${domainName}`);

      // Step 1: Remove from Netlify
      const netlifyResult = await netlifyDomainService.removeDomain(domainName);
      if (!netlifyResult.success) {
        console.warn(`⚠️ Netlify removal failed: ${netlifyResult.error}`);
      }

      // Step 2: Remove from database
      const { error: dbError } = await supabase
        .from('domains')
        .delete()
        .eq('domain', domainName);

      if (dbError) {
        return { success: false, error: `Database: ${dbError.message}` };
      }

      console.log(`✅ Domain ${domainName} removed successfully`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Failed to remove domain ${domainName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate domain configuration
   */
  static async validateDomain(domainName: string): Promise<{ success: boolean; error?: string; domain?: Domain }> {
    try {
      console.log(`🔍 Validating domain: ${domainName}`);

      // Step 1: Get domain from database
      const { data: domain, error: fetchError } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', domainName)
        .single();

      if (fetchError) {
        return { success: false, error: `Domain not found: ${fetchError.message}` };
      }

      // Step 2: Check Netlify status
      const netlifyResult = await netlifyDomainService.verifyDomain(domainName);
      let netlifyStatus = 'unknown';
      let dnsValidated = false;

      if (netlifyResult.success && netlifyResult.data) {
        netlifyStatus = netlifyResult.data.state;
        dnsValidated = netlifyResult.data.state === 'verified' || netlifyResult.data.state === 'live';
      }

      // Step 3: Update domain status
      const newStatus = dnsValidated ? 'active' : 'validating';
      
      const { data: updatedDomain, error: updateError } = await supabase
        .from('domains')
        .update({
          status: newStatus,
          dns_validated: dnsValidated,
          netlify_status: netlifyStatus,
          last_validation_attempt: new Date().toISOString(),
          validation_error: netlifyResult.error || null,
          auto_retry_count: domain.auto_retry_count + 1
        })
        .eq('domain', domainName)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: `Update failed: ${updateError.message}` };
      }

      console.log(`✅ Domain ${domainName} validated: ${newStatus}`);
      return { success: true, domain: updatedDomain };

    } catch (error: any) {
      console.error(`❌ Domain validation failed for ${domainName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk validate all domains
   */
  static async validateAllDomains(): Promise<{ success: boolean; results: Array<{ domain: string; success: boolean; error?: string }> }> {
    try {
      console.log('🔍 Starting bulk domain validation...');

      // Get all domains
      const { data: domains, error: fetchError } = await supabase
        .from('domains')
        .select('domain')
        .in('status', ['pending', 'validating', 'failed']);

      if (fetchError) {
        return { success: false, results: [{ domain: 'fetch', success: false, error: fetchError.message }] };
      }

      const results = [];
      for (const domain of domains || []) {
        const result = await this.validateDomain(domain.domain);
        results.push({
          domain: domain.domain,
          success: result.success,
          error: result.error
        });

        // Small delay between validations
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Bulk validation complete: ${successCount}/${results.length} successful`);

      return { success: true, results };

    } catch (error: any) {
      console.error('❌ Bulk validation failed:', error);
      return { success: false, results: [{ domain: 'bulk', success: false, error: error.message }] };
    }
  }

  /**
   * Sync domains with Netlify
   */
  static async syncWithNetlify(): Promise<{ success: boolean; error?: string; synced?: number }> {
    try {
      console.log('🔄 Syncing domains with Netlify...');

      // Get Netlify domains
      const netlifyResult = await netlifyDomainService.getDomains();
      if (!netlifyResult.success) {
        return { success: false, error: `Netlify: ${netlifyResult.error}` };
      }

      // Get database domains
      const { data: dbDomains, error: dbError } = await supabase
        .from('domains')
        .select('domain, netlify_domain_id, netlify_status');

      if (dbError) {
        return { success: false, error: `Database: ${dbError.message}` };
      }

      let syncedCount = 0;
      const netlifyDomains = netlifyResult.data || [];

      for (const netlifyDomain of netlifyDomains) {
        const dbDomain = dbDomains?.find(d => d.domain === netlifyDomain.name);
        
        if (dbDomain && (dbDomain.netlify_status !== netlifyDomain.state)) {
          // Update status in database
          await supabase
            .from('domains')
            .update({
              netlify_status: netlifyDomain.state,
              netlify_domain_id: netlifyDomain.id,
              dns_validated: netlifyDomain.state === 'verified' || netlifyDomain.state === 'live',
              status: netlifyDomain.state === 'verified' || netlifyDomain.state === 'live' ? 'active' : 'validating'
            })
            .eq('domain', netlifyDomain.name);

          syncedCount++;
        }
      }

      console.log(`✅ Synced ${syncedCount} domains with Netlify`);
      return { success: true, synced: syncedCount };

    } catch (error: any) {
      console.error('❌ Netlify sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get domain blog configuration
   */
  static async getDomainBlogConfig(domainName: string): Promise<{
    success: boolean;
    error?: string;
    config?: {
      blogEnabled: boolean;
      subdirectory: string;
      pagesPublished: number;
      blogUrl: string;
    };
  }> {
    try {
      const { data: domain, error } = await supabase
        .from('domains')
        .select('blog_enabled, blog_subdirectory, pages_published')
        .eq('domain', domainName)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        config: {
          blogEnabled: domain.blog_enabled,
          subdirectory: domain.blog_subdirectory,
          pagesPublished: domain.pages_published,
          blogUrl: `https://${domainName}/${domain.blog_subdirectory}`
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test full domain setup
   */
  static async testDomainSetup(): Promise<{ success: boolean; results: any }> {
    const results = {
      netlifyConnection: false,
      databaseConnection: false,
      configurationValid: false,
      errors: [] as string[]
    };

    try {
      // Test Netlify connection
      const netlifyTest = await netlifyDomainService.testConnection();
      results.netlifyConnection = netlifyTest.success;
      if (!netlifyTest.success) {
        results.errors.push(`Netlify: ${netlifyTest.error}`);
      }

      // Test database connection
      const { data, error } = await supabase.from('domains').select('id').limit(1);
      results.databaseConnection = !error;
      if (error) {
        results.errors.push(`Database: ${error.message}`);
      }

      // Test configuration
      results.configurationValid = netlifyDomainService.isConfigured();
      if (!results.configurationValid) {
        results.errors.push('Netlify API configuration missing');
      }

      const success = results.netlifyConnection && results.databaseConnection && results.configurationValid;
      return { success, results };

    } catch (error: any) {
      results.errors.push(`Test failed: ${error.message}`);
      return { success: false, results };
    }
  }
}
