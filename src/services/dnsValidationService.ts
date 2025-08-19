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
   * Get manual DNS propagation instructions for a domain
   */
  static getManualPropagationInstructions(domain: string): string[] {
    return [
      `Check if your domain ${domain} is pointing to our servers`,
      `Verify A record points to the correct IP address`,
      `Ensure CNAME record for www subdomain is configured`,
      `Confirm TXT record for verification is present`,
      `Use online DNS checker tools like whatsmydns.net`,
      `Allow 24-48 hours for full global DNS propagation`,
      `Clear your local DNS cache if changes aren't visible`,
      `Check with your domain registrar if records aren't updating`
    ];
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
  
}

export default DNSValidationService;
