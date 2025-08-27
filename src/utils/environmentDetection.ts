/**
 * Environment Detection Utility
 * Detects the current environment and provides appropriate configurations
 */

export type Environment = 'development' | 'preview' | 'production';
export type PaymentMode = 'mock' | 'stripe-test' | 'stripe-live';

export interface EnvironmentConfig {
  environment: Environment;
  paymentMode: PaymentMode;
  isProduction: boolean;
  isDevelopment: boolean;
  isPreview: boolean;
  hasNetlifyFunctions: boolean;
  baseUrl: string;
  paymentEndpoint: string;
  subscriptionEndpoint: string;
}

export class EnvironmentDetector {
  private static config: EnvironmentConfig | null = null;

  /**
   * Get the current environment configuration
   */
  public static getConfig(): EnvironmentConfig {
    if (!this.config) {
      this.config = this.detectEnvironment();
    }
    return this.config;
  }

  /**
   * Detect the current environment and return appropriate configuration
   */
  private static detectEnvironment(): EnvironmentConfig {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const isDev = import.meta.env.DEV;
    const mode = import.meta.env.MODE;

    console.log('🔍 Environment Detection:', {
      hostname,
      origin,
      isDev,
      mode,
      env: import.meta.env.VITE_ENVIRONMENT
    });

    // Production environment (backlinkoo.com and variants)
    if (hostname.includes('backlinkoo.com') || hostname.includes('backlink-infinity.netlify.app')) {
      return {
        environment: 'production',
        paymentMode: 'stripe-live',
        isProduction: true,
        isDevelopment: false,
        isPreview: false,
        hasNetlifyFunctions: true,
        baseUrl: origin,
        paymentEndpoint: '/.netlify/functions/create-payment',
        subscriptionEndpoint: '/.netlify/functions/create-subscription'
      };
    }

    // Preview/staging environment (Netlify deploys)
    if (hostname.includes('netlify.app') || hostname.includes('deploy-preview')) {
      return {
        environment: 'preview',
        paymentMode: 'stripe-test',
        isProduction: false,
        isDevelopment: false,
        isPreview: true,
        hasNetlifyFunctions: true,
        baseUrl: origin,
        paymentEndpoint: '/.netlify/functions/create-payment',
        subscriptionEndpoint: '/.netlify/functions/create-subscription'
      };
    }

    // Development environment (localhost, fly.dev previews, etc.)
    return {
      environment: 'development',
      paymentMode: 'mock',
      isProduction: false,
      isDevelopment: true,
      isPreview: false,
      hasNetlifyFunctions: false,
      baseUrl: origin,
      paymentEndpoint: '/api/dev-payment',
      subscriptionEndpoint: '/api/dev-subscription'
    };
  }

  /**
   * Check if we're in a production environment
   */
  public static isProduction(): boolean {
    return this.getConfig().isProduction;
  }

  /**
   * Check if we're in a development environment
   */
  public static isDevelopment(): boolean {
    return this.getConfig().isDevelopment;
  }

  /**
   * Check if we're in a preview environment
   */
  public static isPreview(): boolean {
    return this.getConfig().isPreview;
  }

  /**
   * Get the appropriate payment endpoint for the current environment
   */
  public static getPaymentEndpoint(): string {
    return this.getConfig().paymentEndpoint;
  }

  /**
   * Get the appropriate subscription endpoint for the current environment
   */
  public static getSubscriptionEndpoint(): string {
    return this.getConfig().subscriptionEndpoint;
  }

  /**
   * Get the payment mode for the current environment
   */
  public static getPaymentMode(): PaymentMode {
    return this.getConfig().paymentMode;
  }

  /**
   * Check if Netlify functions are available
   */
  public static hasNetlifyFunctions(): boolean {
    return this.getConfig().hasNetlifyFunctions;
  }

  /**
   * Log current environment info (for debugging)
   */
  public static logEnvironmentInfo(): void {
    const config = this.getConfig();
    console.log('🌍 Environment Configuration:', {
      environment: config.environment,
      paymentMode: config.paymentMode,
      paymentEndpoint: config.paymentEndpoint,
      subscriptionEndpoint: config.subscriptionEndpoint,
      hasNetlifyFunctions: config.hasNetlifyFunctions
    });
  }

  /**
   * Force refresh the environment detection (useful for testing)
   */
  public static refresh(): EnvironmentConfig {
    this.config = null;
    return this.getConfig();
  }
}

// Export singleton methods for convenience
export const {
  getConfig,
  isProduction,
  isDevelopment,
  isPreview,
  getPaymentEndpoint,
  getSubscriptionEndpoint,
  getPaymentMode,
  hasNetlifyFunctions,
  logEnvironmentInfo
} = EnvironmentDetector;

// Log environment info on module load (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setTimeout(() => {
    EnvironmentDetector.logEnvironmentInfo();
  }, 1000);
}
