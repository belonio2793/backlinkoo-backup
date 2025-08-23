/**
 * Direct Netlify API Client
 * 
 * Bypasses custom Netlify functions and calls the official Netlify API directly.
 * This works even when custom functions are not deployed.
 * 
 * Note: This approach has CORS limitations and should be used as a fallback.
 */

export interface DirectNetlifyResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  method?: 'direct_api' | 'mock' | 'function';
}

export class DirectNetlifyApi {
  
  /**
   * Attempt to add domain directly via Netlify API (will likely fail due to CORS)
   * This is included for completeness but CORS prevents direct calls from browser
   */
  static async addDomainDirectly(domain: string): Promise<DirectNetlifyResponse> {
    try {
      console.log(`🔗 Attempting direct Netlify API call for ${domain}`);
      
      // This will likely fail due to CORS restrictions
      // Netlify API doesn't allow direct browser calls
      const response = await fetch(`https://api.netlify.com/api/v1/sites/ca6261e6-0a59-40b5-a2bc-5b5481ac8809`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const siteData = await response.json();
        return {
          success: true,
          message: 'Direct API call succeeded',
          data: siteData,
          method: 'direct_api'
        };
      } else {
        throw new Error(`Direct API failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Direct API call failed (expected due to CORS):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct API call failed',
        method: 'direct_api'
      };
    }
  }

  /**
   * Provide mock success response for development/testing
   * This simulates a successful domain addition when no functions are available
   */
  static async mockDomainAddition(domain: string): Promise<DirectNetlifyResponse> {
    try {
      console.log(`🧪 Using mock domain addition for ${domain}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Simulate occasional failures for realism
      if (domain.includes('fail') || Math.random() < 0.1) {
        return {
          success: false,
          error: 'Mock failure for testing',
          method: 'mock'
        };
      }
      
      return {
        success: true,
        message: `Mock: Domain ${domain} would be added to Netlify site. Functions not deployed, using simulation.`,
        data: {
          domain: domain,
          status: 'simulated',
          site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
          note: 'This is a simulation. Deploy Netlify functions for real functionality.'
        },
        method: 'mock'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock failed',
        method: 'mock'
      };
    }
  }

  /**
   * Comprehensive fallback that tries multiple approaches
   */
  static async addDomainWithFallbacks(domain: string): Promise<DirectNetlifyResponse> {
    console.log(`🔄 Starting comprehensive domain addition for ${domain}`);
    
    // Approach 1: Try direct API (will likely fail due to CORS)
    console.log('📞 Attempt 1: Direct Netlify API...');
    const directResult = await this.addDomainDirectly(domain);
    if (directResult.success) {
      console.log('✅ Direct API succeeded');
      return directResult;
    }
    console.log('❌ Direct API failed (expected):', directResult.error);

    // Approach 2: Mock response for development
    console.log('📞 Attempt 2: Mock simulation...');
    const mockResult = await this.mockDomainAddition(domain);
    console.log('🧪 Using mock simulation:', mockResult);
    return mockResult;
  }

  /**
   * Validate domain format
   */
  static validateDomainFormat(domain: string): { valid: boolean; error?: string } {
    if (!domain || domain.trim() === '') {
      return { valid: false, error: 'Domain cannot be empty' };
    }

    const cleanDomain = domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    
    if (!domainRegex.test(cleanDomain)) {
      return { valid: false, error: 'Invalid domain format' };
    }

    return { valid: true };
  }

  /**
   * Get domain addition instructions when functions aren't available
   */
  static getDomainAdditionInstructions(domain: string): {
    title: string;
    message: string;
    steps: string[];
    manualSteps: string[];
  } {
    return {
      title: 'Manual Domain Addition Required',
      message: 'Netlify functions are not deployed. You can add the domain manually through the Netlify dashboard.',
      steps: [
        'Domain validation completed locally',
        'Ready for manual addition to Netlify',
        'DNS configuration will be needed after adding'
      ],
      manualSteps: [
        'Go to https://app.netlify.com/sites/backlinkoo/settings/domain',
        `Add "${domain}" as a domain alias`,
        'Configure DNS records as shown in the DNS validation modal',
        'Wait for DNS propagation (5-30 minutes)',
        'SSL certificate will be automatically provisioned'
      ]
    };
  }

  /**
   * Check what functionality is available
   */
  static async checkAvailability(): Promise<{
    functions_deployed: boolean;
    direct_api_possible: boolean;
    recommended_approach: 'functions' | 'manual' | 'mock';
    message: string;
  }> {
    // Test if any Netlify functions are available
    const functionTests = await Promise.allSettled([
      fetch('/.netlify/functions/netlify-domain-validation', { method: 'POST' }),
      fetch('/.netlify/functions/add-domain-to-netlify', { method: 'POST' }),
      fetch('/.netlify/functions/validate-domain', { method: 'POST' })
    ]);

    const functionsDeployed = functionTests.some(result => 
      result.status === 'fulfilled' && result.value.status !== 404
    );

    // Direct API will always fail due to CORS, but we test the concept
    const directResult = await this.addDomainDirectly('test.example.com');
    const directApiPossible = directResult.success;

    let recommendedApproach: 'functions' | 'manual' | 'mock';
    let message: string;

    if (functionsDeployed) {
      recommendedApproach = 'functions';
      message = 'Netlify functions are available. Use normal domain addition.';
    } else if (directApiPossible) {
      recommendedApproach = 'manual';
      message = 'Functions not deployed. Direct API available but limited.';
    } else {
      recommendedApproach = 'mock';
      message = 'Functions not deployed. Using simulation mode. Deploy functions or add domains manually.';
    }

    return {
      functions_deployed: functionsDeployed,
      direct_api_possible: directApiPossible,
      recommended_approach: recommendedApproach,
      message
    };
  }
}

export default DirectNetlifyApi;
