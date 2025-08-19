export interface RegistrarInfo {
  registrar: string;
  registrarCode: string;
  nameservers: string[];
  whoisServer?: string;
  registryDomainId?: string;
  creationDate?: string;
  expirationDate?: string;
  lastUpdated?: string;
  status: string[];
  apiSupported: boolean;
  autoUpdateAvailable: boolean;
}

export interface RegistrarConfig {
  name: string;
  code: string;
  apiEndpoint?: string;
  authType: 'api_key' | 'oauth' | 'credentials';
  supportedOperations: string[];
  docsUrl: string;
  setupInstructions: string[];
}

export class RegistrarDetectionService {
  
  // Major registrar configurations
  private static registrarConfigs: Record<string, RegistrarConfig> = {
    'cloudflare': {
      name: 'Cloudflare',
      code: 'cloudflare',
      apiEndpoint: 'https://api.cloudflare.com/client/v4',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'zone_settings', 'ssl'],
      docsUrl: 'https://developers.cloudflare.com/api/',
      setupInstructions: [
        'Go to Cloudflare Dashboard → My Profile → API Tokens',
        'Create a new API token with Zone:Edit permissions',
        'Copy the token and save it securely'
      ]
    },
    'namecheap': {
      name: 'Namecheap',
      code: 'namecheap',
      apiEndpoint: 'https://api.namecheap.com/xml.response',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info'],
      docsUrl: 'https://www.namecheap.com/support/api/',
      setupInstructions: [
        'Log into Namecheap account',
        'Go to Profile → Tools → API Access',
        'Enable API access and whitelist your IP',
        'Generate API key'
      ]
    },
    'godaddy': {
      name: 'GoDaddy',
      code: 'godaddy',
      apiEndpoint: 'https://api.godaddy.com/v1',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info'],
      docsUrl: 'https://developer.godaddy.com/',
      setupInstructions: [
        'Go to GoDaddy Developer Portal',
        'Create a new API key',
        'Note the API Key and Secret'
      ]
    },
    'route53': {
      name: 'Amazon Route 53',
      code: 'route53',
      apiEndpoint: 'https://route53.amazonaws.com',
      authType: 'credentials',
      supportedOperations: ['dns_records', 'hosted_zones'],
      docsUrl: 'https://docs.aws.amazon.com/route53/',
      setupInstructions: [
        'Create AWS IAM user with Route53 permissions',
        'Generate access key and secret',
        'Note the AWS region'
      ]
    },
    'digitalocean': {
      name: 'DigitalOcean',
      code: 'digitalocean',
      apiEndpoint: 'https://api.digitalocean.com/v2',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domains'],
      docsUrl: 'https://docs.digitalocean.com/reference/api/',
      setupInstructions: [
        'Go to DigitalOcean Control Panel',
        'Navigate to API → Tokens',
        'Generate a new personal access token'
      ]
    }
  };

  /**
   * Detect registrar information for a domain
   */
  static async detectRegistrar(domain: string): Promise<RegistrarInfo> {
    try {
      console.log(`🔍 Detecting registrar for ${domain}...`);
      
      // Try WHOIS lookup via our Netlify function
      const whoisData = await this.performWHOISLookup(domain);
      
      if (whoisData.success) {
        return this.parseWHOISData(whoisData.data, domain);
      }
      
      // Fallback: detect by nameservers
      const nsDetection = await this.detectByNameservers(domain);
      return nsDetection;
      
    } catch (error) {
      console.error('Error detecting registrar:', error);
      return this.createFallbackRegistrarInfo(domain);
    }
  }

  /**
   * Perform WHOIS lookup via Netlify function
   */
  private static async performWHOISLookup(domain: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/whois-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.warn('WHOIS lookup via function failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Detect registrar by nameservers (fallback method)
   */
  private static async detectByNameservers(domain: string): Promise<RegistrarInfo> {
    try {
      // Get nameservers using DNS lookup
      const nameservers = await this.getNameservers(domain);
      const registrar = this.identifyRegistrarByNameservers(nameservers);
      
      return {
        registrar: registrar.name,
        registrarCode: registrar.code,
        nameservers,
        status: ['ok'],
        apiSupported: !!this.registrarConfigs[registrar.code],
        autoUpdateAvailable: !!this.registrarConfigs[registrar.code]
      };
      
    } catch (error) {
      console.error('Nameserver detection failed:', error);
      return this.createFallbackRegistrarInfo(domain);
    }
  }

  /**
   * Get nameservers for a domain
   */
  private static async getNameservers(domain: string): Promise<string[]> {
    try {
      // Try our DNS lookup function
      const response = await fetch('/.netlify/functions/dns-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, type: 'NS' }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const result = await response.json();
        return result.records || [];
      }
      
      // Fallback to common patterns
      return this.guessNameservers(domain);
      
    } catch (error) {
      console.warn('Nameserver lookup failed:', error);
      return this.guessNameservers(domain);
    }
  }

  /**
   * Guess nameservers based on common patterns
   */
  private static guessNameservers(domain: string): string[] {
    const tld = domain.split('.').pop()?.toLowerCase();
    
    // Common nameserver patterns
    return [
      `ns1.${domain}`,
      `ns2.${domain}`,
      `dns1.${domain}`,
      `dns2.${domain}`
    ];
  }

  /**
   * Identify registrar by nameserver patterns
   */
  private static identifyRegistrarByNameservers(nameservers: string[]): { name: string; code: string } {
    const nsString = nameservers.join(' ').toLowerCase();
    
    // Cloudflare
    if (nsString.includes('cloudflare.com') || nsString.includes('ns.cloudflare.com')) {
      return { name: 'Cloudflare', code: 'cloudflare' };
    }
    
    // Namecheap
    if (nsString.includes('namecheap.com') || nsString.includes('registrar-servers.com')) {
      return { name: 'Namecheap', code: 'namecheap' };
    }
    
    // GoDaddy
    if (nsString.includes('domaincontrol.com') || nsString.includes('godaddy.com')) {
      return { name: 'GoDaddy', code: 'godaddy' };
    }
    
    // Route 53
    if (nsString.includes('awsdns') || nsString.includes('amazonaws.com')) {
      return { name: 'Amazon Route 53', code: 'route53' };
    }
    
    // DigitalOcean
    if (nsString.includes('digitalocean.com') || nsString.includes('ns1.digitalocean.com')) {
      return { name: 'DigitalOcean', code: 'digitalocean' };
    }
    
    // Google Cloud DNS
    if (nsString.includes('googledomains.com') || nsString.includes('google.com')) {
      return { name: 'Google Domains', code: 'google' };
    }
    
    // Default
    return { name: 'Unknown Registrar', code: 'unknown' };
  }

  /**
   * Parse WHOIS data to extract registrar information
   */
  private static parseWHOISData(whoisData: any, domain: string): RegistrarInfo {
    const registrarName = whoisData.registrar || whoisData.registrar_name || 'Unknown';
    const registrarCode = this.getRegistrarCodeFromName(registrarName);
    
    return {
      registrar: registrarName,
      registrarCode,
      nameservers: whoisData.nameservers || whoisData.name_servers || [],
      whoisServer: whoisData.whois_server,
      registryDomainId: whoisData.registry_domain_id,
      creationDate: whoisData.creation_date,
      expirationDate: whoisData.expiration_date,
      lastUpdated: whoisData.updated_date,
      status: whoisData.status || ['unknown'],
      apiSupported: !!this.registrarConfigs[registrarCode],
      autoUpdateAvailable: !!this.registrarConfigs[registrarCode]
    };
  }

  /**
   * Get registrar code from registrar name
   */
  private static getRegistrarCodeFromName(registrarName: string): string {
    const name = registrarName.toLowerCase();
    
    if (name.includes('cloudflare')) return 'cloudflare';
    if (name.includes('namecheap')) return 'namecheap';
    if (name.includes('godaddy')) return 'godaddy';
    if (name.includes('amazon') || name.includes('aws')) return 'route53';
    if (name.includes('digitalocean')) return 'digitalocean';
    if (name.includes('google')) return 'google';
    
    return 'unknown';
  }

  /**
   * Create fallback registrar info when detection fails
   */
  private static createFallbackRegistrarInfo(domain: string): RegistrarInfo {
    return {
      registrar: 'Unknown Registrar',
      registrarCode: 'unknown',
      nameservers: [],
      status: ['unknown'],
      apiSupported: false,
      autoUpdateAvailable: false
    };
  }

  /**
   * Get registrar configuration
   */
  static getRegistrarConfig(registrarCode: string): RegistrarConfig | null {
    return this.registrarConfigs[registrarCode] || null;
  }

  /**
   * Get all supported registrars
   */
  static getSupportedRegistrars(): RegistrarConfig[] {
    return Object.values(this.registrarConfigs);
  }

  /**
   * Check if auto-update is supported for a registrar
   */
  static isAutoUpdateSupported(registrarCode: string): boolean {
    return !!this.registrarConfigs[registrarCode];
  }

  /**
   * Get setup instructions for a registrar
   */
  static getSetupInstructions(registrarCode: string): string[] {
    const config = this.registrarConfigs[registrarCode];
    return config?.setupInstructions || [
      'Manual DNS setup required',
      'Check your registrar\'s documentation',
      'Add DNS records manually in your registrar\'s control panel'
    ];
  }
}

export default RegistrarDetectionService;
