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
   * Validate domain DNS settings using production services only
   */
  static async validateDomain(domainId: string): Promise<DNSValidationResult> {
    const result = await this.validateWithNetlifyFunction(domainId);
    if (!result) {
      throw new Error('DNS validation service is not available. Please ensure all services are deployed.');
    }
    return result;
  }
  
  /**
   * Validate using Netlify function (production service required)
   */
  private static async validateWithNetlifyFunction(domainId: string): Promise<DNSValidationResult | null> {
    const response = await fetch('/.netlify/functions/validate-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_id: domainId }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        throw new Error('DNS validation service not deployed. Please deploy all required Netlify functions.');
      }
      throw new Error(`DNS validation service error: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }
  
  /**
   * Fallback validation for development/when Netlify functions unavailable
   */
  private static async validateWithFallback(domainId: string): Promise<DNSValidationResult> {
    try {
      // Get domain from database
      const { data: domain, error } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single();
      
      if (error || !domain) {
        throw new Error('Domain not found');
      }
      
      // Simulate validation based on domain format and requirements
      const isValidFormat = this.validateDomainFormat(domain.domain);
      const hasVerificationToken = !!domain.verification_token;
      const hasRequiredRecords = !!domain.required_a_record;
      
      // For development, consider domain valid if it has proper format and setup
      const isValid = isValidFormat && hasVerificationToken && hasRequiredRecords;
      
      // Update domain status
      const updateData = {
        dns_validated: isValid,
        txt_record_validated: hasVerificationToken,
        a_record_validated: hasRequiredRecords,
        cname_validated: true, // Optional record
        last_validation_attempt: new Date().toISOString(),
        validation_error: isValid ? null : 'Fallback validation - DNS service unavailable',
        status: isValid ? 'active' : 'pending'
      };
      
      const { error: updateError } = await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId);
      
      if (updateError) {
        console.error('Failed to update domain:', updateError);
      }
      
      const message = isValid 
        ? 'Domain validated using fallback method (DNS service unavailable)'
        : 'Domain validation pending - DNS service unavailable, manual verification recommended';
      
      return {
        success: true,
        validated: isValid,
        domain: domain.domain,
        results: {
          txt_validated: hasVerificationToken,
          a_validated: hasRequiredRecords,
          cname_validated: true,
          dns_validated: isValid,
          error: isValid ? undefined : 'DNS service unavailable'
        },
        message,
        isUsingFallback: true
      };
      
    } catch (error) {
      console.error('Fallback validation failed:', error);
      
      return {
        success: false,
        validated: false,
        domain: 'unknown',
        results: {
          txt_validated: false,
          a_validated: false,
          cname_validated: false,
          dns_validated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isUsingFallback: true
      };
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
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: 'health-check' }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.status === 404) {
        return 'offline';
      } else {
        return 'online';
      }
    } catch (error) {
      return 'offline';
    }
  }
  
  /**
   * Manual DNS propagation check instructions
   */
  static getManualPropagationInstructions(domain: string): string[] {
    return [
      `Use online DNS checkers like whatsmydns.net or dnschecker.org`,
      `Check if your A record points to the correct IP address`,
      `Verify TXT record contains your verification token`,
      `Allow 24-48 hours for full DNS propagation worldwide`,
      `Contact your domain registrar if records don't update`,
      `Try flushing your local DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)`
    ];
  }
}

export default DNSValidationService;
