/**
 * Secure Configuration Manager
 * 
 * This module manages application credentials and sensitive configuration.
 * Credentials are stored in encoded format and accessed programmatically.
 * 
 * Note: This is not encryption, just obfuscation for development team management.
 * Production systems should use proper secret management (env vars, vaults, etc.)
 */

// Base64 encoded configuration store
const SECURE_STORE = {
  // Database credentials
  db_host: 'ZGZoYW5hY3Ntc3Z2a3B1bnVybnAuc3VwYWJhc2UuY28=', // dfhanacsmsvvkpunurnp.supabase.co
  db_password: 'c2JwXzY1ZjEzZDNlZjg0ZmFlMDkzZGJiMmIyZDUzNjg1NzRmNjliM2NlYTI=', // sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2
  db_project_ref: 'ZGZoYW5hY3Ntc3Z2a3B1bnVybnA=', // dfhanacsmsvvkpunurnp
  
  // Supabase configuration
  supabase_url: 'aHR0cHM6Ly9kZmhhbmFjc21zdnZrcHVudXJucC5zdXBhYmFzZS5jbw==', // https://dfhanacsmsvvkpunurnp.supabase.co
  supabase_anon_key: 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1SbWFHRnVZV056YlhOMmRtdHdkVzUxY201d0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTlRJNU5UWTJORGNzSW1WNGNDSTZNakEyT0RVek1qWTBOMzAuTVpjQjRQX1RBT09Ua3RYU0c3Yk5LNUJzSU1BZjFiS1hWZ1Q4N1pxYTVSWQ==', // JWT token
  
  // Access tokens
  supabase_access_token: 'c2JwXzY1ZjEzZDNlZjg0ZmFlMDkzZGJiMmIyZDUzNjg1NzRmNjliM2NlYTI=', // sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2
  
  // Email service credentials (populated for production use)
  resend_api_key: 'cmVfZjJpeHlSQXdfRUExZHRRQ285S25BTmZKZ3JncWZYRkVx', // re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq
  smtp_host: '',
  smtp_password: '',
  
  // Payment service credentials (placeholder for future use)
  stripe_secret_key: '',
  stripe_webhook_secret: '',
  paypal_client_id: '',
  paypal_client_secret: '',
  
  // API keys removed for security - OpenAI calls now handled server-side only
  openai_api_key: '', // Removed - use Netlify functions for OpenAI calls
  anthropic_api_key: '', // VITE_ANTHROPIC_API_KEY - Set in Netlify if needed
  
  // Application secrets
  jwt_secret: '',
  encryption_key: '',
  
  // Domain configuration
  domain: 'YmFja2xpbmtvby5jb20=', // backlinkoo.com
  app_url: 'aHR0cHM6Ly9iYWNrbGlua29vLmNvbQ==', // https://backlinkoo.com
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
  
  // Database credentials
  static get DATABASE_PASSWORD(): string {
    return decode(SECURE_STORE.db_password);
  }
  
  static get DATABASE_HOST(): string {
    return decode(SECURE_STORE.db_host);
  }
  
  static get DATABASE_PROJECT_REF(): string {
    return decode(SECURE_STORE.db_project_ref);
  }
  
  // Supabase credentials
  static get SUPABASE_URL(): string {
    return decode(SECURE_STORE.supabase_url);
  }
  
  static get SUPABASE_ANON_KEY(): string {
    return decode(SECURE_STORE.supabase_anon_key);
  }
  
  static get SUPABASE_ACCESS_TOKEN(): string {
    return decode(SECURE_STORE.supabase_access_token);
  }
  
  // Domain configuration
  static get DOMAIN(): string {
    return decode(SECURE_STORE.domain);
  }
  
  static get APP_URL(): string {
    return decode(SECURE_STORE.app_url);
  }
  
  // Email service credentials
  static get RESEND_API_KEY(): string {
    return decode(SECURE_STORE.resend_api_key);
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
  
  static get GOOGLE_API_KEY(): string {
    return decode(SECURE_STORE.google_api_key);
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
