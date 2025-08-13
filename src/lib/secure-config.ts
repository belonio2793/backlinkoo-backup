/**
 * Secure Configuration Manager
 * 
 * This module manages application credentials and sensitive configuration.
 * Credentials are stored in encoded format and accessed programmatically.
 * 
 * Note: This is not encryption, just obfuscation for development team management.
 * Production systems should use proper secret management (env vars, vaults, etc.)
 */

// Environment-based configuration store
const SECURE_STORE = {
  // Database credentials - use environment variables only
  db_host: '',
  db_password: '',
  db_project_ref: '',

  // Supabase configuration - use environment variables only
  supabase_url: '',
  supabase_anon_key: '',

  // Access tokens - use environment variables only
  supabase_access_token: '',

  // Email service credentials - use environment variables only
  resend_api_key: '',
  smtp_host: '',
  smtp_password: '',

  // Payment service credentials - use environment variables only
  stripe_secret_key: '',
  stripe_webhook_secret: '',
  paypal_client_id: '',
  paypal_client_secret: '',

  // API keys - use environment variables only
  openai_api_key: '',
  anthropic_api_key: '',

  // Application secrets - use environment variables only
  jwt_secret: '',
  encryption_key: '',

  // Domain configuration - use environment variables only
  domain: '',
  app_url: '',
};

/**
 * Decode a base64 encoded credential
 */
function decode(encoded: string): string {
  if (!encoded) return '';
  try {
    return atob(encoded);
  } catch {
    return encoded; // Return as-is if not base64
  }
}

/**
 * Encode a credential to base64
 */
function encode(value: string): string {
  if (!value) return '';
  try {
    return btoa(value);
  } catch {
    return value; // Return as-is if encoding fails
  }
}

/**
 * Secure credential accessor
 */
export class SecureConfig {
  
  // Database credentials - from environment variables
  static get DATABASE_PASSWORD(): string {
    return import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  static get DATABASE_HOST(): string {
    return import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '') || 'dfhanacsmsvvkpunurnp';
  }

  static get DATABASE_PROJECT_REF(): string {
    return import.meta.env.VITE_SUPABASE_URL?.split('.')[0]?.split('//')[1] || 'dfhanacsmsvvkpunurnp';
  }

  // Supabase credentials - from environment variables
  static get SUPABASE_URL(): string {
    return import.meta.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
  }

  static get SUPABASE_ANON_KEY(): string {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  static get SUPABASE_ACCESS_TOKEN(): string {
    return import.meta.env.SUPABASE_ACCESS_TOKEN || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  // Domain configuration - from environment variables
  static get DOMAIN(): string {
    return import.meta.env.VITE_APP_DOMAIN || 'backlinkoo.com';
  }

  static get APP_URL(): string {
    return import.meta.env.VITE_APP_URL || 'https://backlinkoo.com';
  }

  // Email service credentials - from environment variables
  static get RESEND_API_KEY(): string {
    return import.meta.env.RESEND_API_KEY || '';
  }
  
  static get SMTP_HOST(): string {
    return decode(SECURE_STORE.smtp_host);
  }
  
  static get SMTP_PASSWORD(): string {
    return decode(SECURE_STORE.smtp_password);
  }
  
  // Payment service credentials
  static get STRIPE_SECRET_KEY(): string {
    return decode(SECURE_STORE.stripe_secret_key);
  }
  
  static get STRIPE_WEBHOOK_SECRET(): string {
    return decode(SECURE_STORE.stripe_webhook_secret);
  }
  
  static get PAYPAL_CLIENT_ID(): string {
    return decode(SECURE_STORE.paypal_client_id);
  }
  
  static get PAYPAL_CLIENT_SECRET(): string {
    return decode(SECURE_STORE.paypal_client_secret);
  }
  
  // API keys - Security: OpenAI calls moved to server-side only
  static get OPENAI_API_KEY(): string {
    // Return empty for security - all OpenAI calls should go through Netlify functions
    console.warn('⚠️ OpenAI API calls should use server-side functions only for security');
    return '';
  }
  
  static get ANTHROPIC_API_KEY(): string {
    return decode(SECURE_STORE.anthropic_api_key);
  }
  
  
  // Application secrets
  static get JWT_SECRET(): string {
    return decode(SECURE_STORE.jwt_secret);
  }
  
  static get ENCRYPTION_KEY(): string {
    return decode(SECURE_STORE.encryption_key);
  }
  
  /**
   * Helper method to add new credentials (for development use)
   */
  static encodeCredential(value: string): string {
    return encode(value);
  }
  
  /**
   * Get all available configuration keys (for debugging)
   */
  static getAvailableKeys(): string[] {
    return Object.keys(SECURE_STORE);
  }
  
  /**
   * Check if a credential is configured
   */
  static hasCredential(key: keyof typeof SECURE_STORE): boolean {
    return Boolean(SECURE_STORE[key]);
  }
  
  /**
   * Get environment-specific configuration
   * Falls back to secure store if environment variables aren't available
   */
  static getConfig() {
    return {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || this.SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || this.SUPABASE_ANON_KEY,
        accessToken: this.SUPABASE_ACCESS_TOKEN,
        projectRef: this.DATABASE_PROJECT_REF,
      },
      database: {
        password: this.DATABASE_PASSWORD,
        host: this.DATABASE_HOST,
      },
      app: {
        domain: this.DOMAIN,
        url: this.APP_URL,
      },
      // Add other service configurations as needed
    };
  }
}

/**
 * Development helper to generate encoded credentials
 * Usage: SecureConfig.encodeCredential('your-secret-here')
 */
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only expose in development
  (window as any).SecureConfig = SecureConfig;
}
