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
  
  // Comprehensive registrar configurations
  private static registrarConfigs: Record<string, RegistrarConfig> = {
    'cloudflare': {
      name: 'Cloudflare',
      code: 'cloudflare',
      apiEndpoint: 'https://api.cloudflare.com/client/v4',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'zone_settings', 'ssl', 'purge_cache'],
      docsUrl: 'https://developers.cloudflare.com/api/',
      setupInstructions: [
        'Go to Cloudflare Dashboard → My Profile → API Tokens',
        'Create a new API token with Zone:Edit permissions',
        'Copy the token and save it securely',
        'Optionally add Zone:Read permissions for verification'
      ]
    },
    'namecheap': {
      name: 'Namecheap',
      code: 'namecheap',
      apiEndpoint: 'https://api.namecheap.com/xml.response',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info', 'nameservers'],
      docsUrl: 'https://www.namecheap.com/support/api/',
      setupInstructions: [
        'Log into Namecheap account',
        'Go to Profile → Tools → API Access',
        'Enable API access and whitelist your IP address',
        'Generate API key and save username',
        'Note: API requires IP whitelisting'
      ]
    },
    'godaddy': {
      name: 'GoDaddy',
      code: 'godaddy',
      apiEndpoint: 'https://api.godaddy.com/v1',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info', 'nameservers'],
      docsUrl: 'https://developer.godaddy.com/',
      setupInstructions: [
        'Go to GoDaddy Developer Portal (developer.godaddy.com)',
        'Create a new API key',
        'Note both the API Key and Secret',
        'Select production environment for live domains'
      ]
    },
    'route53': {
      name: 'Amazon Route 53',
      code: 'route53',
      apiEndpoint: 'https://route53.amazonaws.com',
      authType: 'credentials',
      supportedOperations: ['dns_records', 'hosted_zones', 'health_checks'],
      docsUrl: 'https://docs.aws.amazon.com/route53/',
      setupInstructions: [
        'Create AWS IAM user with Route53FullAccess permissions',
        'Generate access key and secret access key',
        'Note the AWS region (usually us-east-1 for Route53)',
        'Ensure domain is using Route 53 hosted zone'
      ]
    },
    'digitalocean': {
      name: 'DigitalOcean',
      code: 'digitalocean',
      apiEndpoint: 'https://api.digitalocean.com/v2',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domains', 'load_balancers'],
      docsUrl: 'https://docs.digitalocean.com/reference/api/',
      setupInstructions: [
        'Go to DigitalOcean Control Panel',
        'Navigate to API → Personal Access Tokens',
        'Generate a new personal access token',
        'Ensure token has read and write permissions'
      ]
    },
    'google': {
      name: 'Google Domains',
      code: 'google',
      apiEndpoint: 'https://dns.googleapis.com/dns/v1',
      authType: 'oauth',
      supportedOperations: ['dns_records', 'zones'],
      docsUrl: 'https://developers.google.com/domains/',
      setupInstructions: [
        'Go to Google Cloud Console',
        'Enable Cloud DNS API',
        'Create service account credentials',
        'Download JSON key file',
        'Note: Requires Google Cloud DNS setup'
      ]
    },
    'hover': {
      name: 'Hover',
      code: 'hover',
      apiEndpoint: 'https://www.hover.com/api',
      authType: 'credentials',
      supportedOperations: ['dns_records'],
      docsUrl: 'https://hoverapi.docs.apiary.io/',
      setupInstructions: [
        'Contact Hover support for API access',
        'API access is limited and requires approval',
        'Use username and password authentication',
        'Note: Manual DNS setup recommended for Hover'
      ]
    },
    'networksolutions': {
      name: 'Network Solutions',
      code: 'networksolutions',
      apiEndpoint: 'https://api.networksolutions.com',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info'],
      docsUrl: 'https://www.networksolutions.com/api/',
      setupInstructions: [
        'Contact Network Solutions for API access',
        'API requires business account',
        'Manual DNS setup recommended',
        'Use web interface for DNS management'
      ]
    },
    'ionos': {
      name: '1&1 IONOS',
      code: 'ionos',
      apiEndpoint: 'https://api.ionos.com/cloudapi/v6',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domains'],
      docsUrl: 'https://developer.ionos.com/',
      setupInstructions: [
        'Log into IONOS Control Panel',
        'Go to Account → API Management',
        'Create new API key',
        'Select appropriate permissions for DNS management'
      ]
    },
    'bluehost': {
      name: 'Bluehost',
      code: 'bluehost',
      apiEndpoint: 'https://my.bluehost.com/api',
      authType: 'credentials',
      supportedOperations: ['dns_records'],
      docsUrl: 'https://www.bluehost.com/help/',
      setupInstructions: [
        'Log into Bluehost cPanel',
        'Navigate to Domains → Zone Editor',
        'Manage DNS records manually',
        'Note: Limited API access available'
      ]
    },
    'siteground': {
      name: 'SiteGround',
      code: 'siteground',
      apiEndpoint: 'https://api.siteground.com/general/v1',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domains'],
      docsUrl: 'https://www.siteground.com/kb/api/',
      setupInstructions: [
        'Log into SiteGround User Area',
        'Go to My Accounts → API',
        'Generate API key',
        'Enable DNS management permissions'
      ]
    },
    'domain_com': {
      name: 'Domain.com',
      code: 'domain_com',
      apiEndpoint: 'https://api.domain.com/v1',
      authType: 'api_key',
      supportedOperations: ['dns_records', 'domain_info'],
      docsUrl: 'https://www.domain.com/help/',
      setupInstructions: [
        'Contact Domain.com support for API access',
        'Manual DNS management recommended',
        'Use control panel for DNS changes',
        'Limited automation support'
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
   * Identify registrar by nameserver patterns with comprehensive detection
   */
  private static identifyRegistrarByNameservers(nameservers: string[]): { name: string; code: string; confidence: number } {
    const nsString = nameservers.join(' ').toLowerCase();

    // High confidence matches (exact nameserver patterns)

    // Cloudflare
    if (nsString.includes('cloudflare.com') ||
        nsString.includes('ns.cloudflare.com') ||
        /\b[a-z]+\.ns\.cloudflare\.com/.test(nsString)) {
      return { name: 'Cloudflare', code: 'cloudflare', confidence: 0.95 };
    }

    // Namecheap
    if (nsString.includes('namecheap.com') ||
        nsString.includes('registrar-servers.com') ||
        nsString.includes('dns1.registrar-servers.com') ||
        nsString.includes('dns2.registrar-servers.com')) {
      return { name: 'Namecheap', code: 'namecheap', confidence: 0.95 };
    }

    // GoDaddy
    if (nsString.includes('domaincontrol.com') ||
        nsString.includes('godaddy.com') ||
        nsString.includes('parkingcrew.net') ||
        /ns\d+\.domaincontrol\.com/.test(nsString)) {
      return { name: 'GoDaddy', code: 'godaddy', confidence: 0.95 };
    }

    // Amazon Route 53
    if (nsString.includes('awsdns') ||
        nsString.includes('amazonaws.com') ||
        /ns-\d+\.awsdns/.test(nsString)) {
      return { name: 'Amazon Route 53', code: 'route53', confidence: 0.95 };
    }

    // DigitalOcean
    if (nsString.includes('digitalocean.com') ||
        nsString.includes('ns1.digitalocean.com') ||
        nsString.includes('ns2.digitalocean.com') ||
        nsString.includes('ns3.digitalocean.com')) {
      return { name: 'DigitalOcean', code: 'digitalocean', confidence: 0.95 };
    }

    // Google Domains/Cloud DNS
    if (nsString.includes('googledomains.com') ||
        nsString.includes('dns.google') ||
        /ns-cloud-[a-z]\d+\.googledomains\.com/.test(nsString)) {
      return { name: 'Google Domains', code: 'google', confidence: 0.95 };
    }

    // Hover
    if (nsString.includes('hover.com') ||
        nsString.includes('dns.hover.com') ||
        /ns\d+\.hover\.com/.test(nsString)) {
      return { name: 'Hover', code: 'hover', confidence: 0.90 };
    }

    // Network Solutions
    if (nsString.includes('worldnic.com') ||
        nsString.includes('networksolutions.com') ||
        /ns\d+\.worldnic\.com/.test(nsString)) {
      return { name: 'Network Solutions', code: 'networksolutions', confidence: 0.90 };
    }

    // 1&1/IONOS
    if (nsString.includes('1and1.com') ||
        nsString.includes('ionos.com') ||
        nsString.includes('ui-dns.com') ||
        /ns\d+\.ui-dns\.com/.test(nsString)) {
      return { name: '1&1 IONOS', code: 'ionos', confidence: 0.90 };
    }

    // Bluehost
    if (nsString.includes('bluehost.com') ||
        nsString.includes('hostmonster.com') ||
        /ns\d+\.bluehost\.com/.test(nsString)) {
      return { name: 'Bluehost', code: 'bluehost', confidence: 0.85 };
    }

    // SiteGround
    if (nsString.includes('siteground.com') ||
        /ns\d+\.siteground\.(net|com)/.test(nsString)) {
      return { name: 'SiteGround', code: 'siteground', confidence: 0.85 };
    }

    // Domain.com
    if (nsString.includes('domain.com') ||
        /ns\d+\.domain\.com/.test(nsString)) {
      return { name: 'Domain.com', code: 'domain_com', confidence: 0.80 };
    }

    // Medium confidence matches (partial patterns)

    // Detect common hosting providers that may handle DNS
    if (nsString.includes('hostgator.com')) {
      return { name: 'HostGator', code: 'hostgator', confidence: 0.70 };
    }

    if (nsString.includes('dreamhost.com')) {
      return { name: 'DreamHost', code: 'dreamhost', confidence: 0.70 };
    }

    if (nsString.includes('wpengine.com')) {
      return { name: 'WP Engine', code: 'wpengine', confidence: 0.70 };
    }

    if (nsString.includes('squarespace.com')) {
      return { name: 'Squarespace', code: 'squarespace', confidence: 0.70 };
    }

    if (nsString.includes('wix.com')) {
      return { name: 'Wix', code: 'wix', confidence: 0.70 };
    }

    if (nsString.includes('shopify.com')) {
      return { name: 'Shopify', code: 'shopify', confidence: 0.70 };
    }

    // Default fallback
    return { name: 'Unknown Registrar', code: 'unknown', confidence: 0.0 };
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
   * Get registrar code from registrar name with enhanced mapping
   */
  private static getRegistrarCodeFromName(registrarName: string): string {
    const name = registrarName.toLowerCase();

    // Exact matches
    if (name.includes('cloudflare')) return 'cloudflare';
    if (name.includes('namecheap')) return 'namecheap';
    if (name.includes('godaddy') || name.includes('go daddy')) return 'godaddy';
    if (name.includes('amazon') || name.includes('aws') || name.includes('route 53')) return 'route53';
    if (name.includes('digitalocean') || name.includes('digital ocean')) return 'digitalocean';
    if (name.includes('google')) return 'google';
    if (name.includes('hover')) return 'hover';
    if (name.includes('network solutions') || name.includes('networksolutions')) return 'networksolutions';
    if (name.includes('1&1') || name.includes('ionos') || name.includes('1and1')) return 'ionos';
    if (name.includes('bluehost')) return 'bluehost';
    if (name.includes('siteground')) return 'siteground';
    if (name.includes('domain.com')) return 'domain_com';

    // Additional hosting providers
    if (name.includes('hostgator')) return 'hostgator';
    if (name.includes('dreamhost')) return 'dreamhost';
    if (name.includes('wpengine') || name.includes('wp engine')) return 'wpengine';
    if (name.includes('squarespace')) return 'squarespace';
    if (name.includes('wix')) return 'wix';
    if (name.includes('shopify')) return 'shopify';

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
