import { supabase } from '@/integrations/supabase/client';

export interface DNSValidationResult {
  success: boolean;
  validated: boolean;
  domain: string;
  results: {
    txt_validated: boolean;
    a_validated: boolean;
    cname_validated: boolean;
    dns_validated: boolean;
    error?: string;
  };
  message: string;
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  description: string;
  validated: boolean;
  required: boolean;
}

export class DNSValidationService {

  /**
   * Validate domain DNS settings with fallback for development
   */
  static async validateDomain(domainId: string): Promise<DNSValidationResult> {
    try {
      // Try Netlify function first
      const result = await this.validateWithNetlifyFunction(domainId);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('Netlify DNS validation function not available, using fallback:', error);
    }

    // Fallback to local validation
    return await this.validateWithFallback(domainId);
  }

  /**
   * Validate using Netlify function (production service)
   */
  private static async validateWithNetlifyFunction(domainId: string): Promise<DNSValidationResult | null> {
    try {
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Function not deployed, use fallback
        }

        // Clone response to read body safely
        const responseClone = response.clone();
        let errorText = '';
        try {
          errorText = await responseClone.text();
        } catch {
          errorText = 'Unable to read error details';
        }
        throw new Error(`DNS validation service error: HTTP ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // If it's a fetch error (network/404), return null to trigger fallback
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('404') ||
        error.name === 'AbortError'
      )) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fallback validation for development mode
   */
  private static async validateWithFallback(domainId: string): Promise<DNSValidationResult> {
    try {
      // Get domain from Supabase
      const { data: domain, error } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single();

      if (error || !domain) {
        throw new Error('Domain not found');
      }

      // Simulate DNS validation for development
      console.log('🧪 Using fallback DNS validation for:', domain.domain);

      // In development, we'll mark validation as successful but note it's simulated
      const isDevMode = window.location.hostname.includes('localhost') ||
                       window.location.hostname.includes('127.0.0.1') ||
                       import.meta.env.DEV;

      const simulatedResult: DNSValidationResult = {
        success: true,
        validated: isDevMode, // Only mark as validated in dev mode
        domain: domain.domain,
        results: {
          txt_validated: isDevMode,
          a_validated: isDevMode,
          cname_validated: isDevMode,
          dns_validated: isDevMode,
          error: isDevMode ? undefined : 'Validation requires deployed Netlify functions'
        },
        message: isDevMode
          ? `✅ Development mode: DNS validation simulated for ${domain.domain}`
          : `⚠️ DNS validation requires deployed Netlify functions. Manual DNS setup required.`
      };

      // Update domain status in Supabase
      if (isDevMode) {
        await supabase
          .from('domains')
          .update({
            dns_validated: true,
            txt_record_validated: true,
            a_record_validated: true,
            cname_validated: true,
            status: 'active',
            last_validation_attempt: new Date().toISOString()
          })
          .eq('id', domainId);
      } else {
        await supabase
          .from('domains')
          .update({
            validation_error: 'DNS validation requires deployed Netlify functions',
            last_validation_attempt: new Date().toISOString()
          })
          .eq('id', domainId);
      }

      return simulatedResult;
    } catch (error) {
      console.error('Fallback DNS validation error:', error);
      throw new Error(`DNS validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  
  /**
   * Validate domain format
   */
  private static validateDomainFormat(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  }
  
  /**
   * Get DNS instructions for a domain
   */
  static getDNSInstructions(domain: any, hostingConfig: any): DNSRecord[] {
    const token = domain.verification_token || this.generateVerificationToken();
    
    return [
      {
        type: 'A',
        name: '@',
        value: hostingConfig.ip,
        description: 'Points your domain to our hosting server',
        validated: domain.a_record_validated || false,
        required: true
      },
      {
        type: 'CNAME',
        name: 'www',
        value: hostingConfig.cname,
        description: 'Redirects www subdomain to main domain',
        validated: domain.cname_validated || false,
        required: false
      },
      {
        type: 'TXT',
        name: '@',
        value: `blo-verification=${token}`,
        description: 'Verifies domain ownership (required for activation)',
        validated: domain.txt_record_validated || false,
        required: true
      }
    ];
  }
  
  /**
   * Generate verification token
   */
  private static generateVerificationToken(): string {
    return 'blo-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  

  /**
   * Check DNS service health
   */
  static async checkServiceHealth(): Promise<'online' | 'offline' | 'unknown'> {
    try {
      // Check if we're in development mode
      const isDevMode = window.location.hostname.includes('localhost') ||
                       window.location.hostname.includes('127.0.0.1') ||
                       import.meta.env.DEV;

      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: 'health-check' }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.status === 404) {
        return isDevMode ? 'offline' : 'unknown';
      } else {
        return 'online';
      }
    } catch (error) {
      // For development, mark as offline. For production, mark as unknown
      const isDevMode = window.location.hostname.includes('localhost') ||
                       window.location.hostname.includes('127.0.0.1') ||
                       import.meta.env.DEV;

      return isDevMode ? 'offline' : 'unknown';
    }
  }
  
}

export default DNSValidationService;
