/**
 * Secure Configuration Manager (Node.js version)
 * 
 * Server-side credential management for build scripts and utilities.
 * Credentials are stored in encoded format for team development management.
 */

// Base64 encoded configuration store
const SECURE_STORE = {
  // Database credentials
  db_host: 'ZGZoYW5hY3Ntc3Z2a3B1bnVybnAuc3VwYWJhc2UuY28=', // dfhanacsmsvvkpunurnp.supabase.co
  db_password: 'c2JwXzY1ZjEzZDNlZjg0ZmFlMDkzZGJiMmIyZDUzNjg1NzRmNjliM2NlYTI=', // sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2
  db_project_ref: 'ZGZoYW5hY3Ntc3Z2a3B1bnVybnA=', // dfhanacsmsvvkpunurnp
  
  // Supabase configuration
  supabase_url: 'aHR0cHM6Ly9kZmhhbmFjc21zdnZrcHVudXJucC5zdXBhYmFzZS5jbw==', // https://dfhanacsmsvvkpunurnp.supabase.co
  supabase_anon_key: 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1SbWFHRnVZV056YlhOMmRtdHdkVzUxY201d0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTlRJNU5UWTJORGNzSW1WNGNDSTZNakEyT0RVek1qWTBOMzAuTVpjQjRQX1RBT09Ua3RYU0c3Yk5LNUJzSU1BZjFiS1hWZ1Q4N1pxYTVSWQ==', // Updated JWT token with new expiration
  
  // Access tokens
  supabase_access_token: 'c2JwXzY1ZjEzZDNlZjg0ZmFlMDkzZGJiMmIyZDUzNjg1NzRmNjliM2NlYTI=', // sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2

  // Email service credentials
  resend_api_key: 'cmVfZjJpeHlSQXdfRUExZHRRQ285S25BTmZKZ3JncWZYRkVx', // re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq

  // API keys for external services
  openai_api_key: 'c2stcHJvai15eEMyd09xQVhwN2ozZVZVRUhuMkR5a05TeFRFZnoyTDdtM001c2JBbDRXMUprRGEtaC1WaVNDTEkxcGZ2WXdfLWZ6NVlWNVVhalQzQmxia0ZKeDFIYVJjeHpVVGVXbFZlTnZsSC1uUkxkMkpOQTlpSHZsWjVrRDhybGdOWG9ZVUNFekdoT1VCdjAzNW12SElWWEV5aXhjdDRLTUE=', // Encoded OpenAI API key
};

/**
 * Decode a base64 encoded credential
 */
function decode(encoded) {
  if (!encoded) return '';
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return encoded; // Return as-is if not base64
  }
}

/**
 * Encode a credential to base64
 */
function encode(value) {
  if (!value) return '';
  try {
    return Buffer.from(value, 'utf-8').toString('base64');
  } catch {
    return value; // Return as-is if encoding fails
  }
}

/**
 * Secure credential accessor
 */
export class SecureConfig {
  
  // Database credentials
  static get DATABASE_PASSWORD() {
    return decode(SECURE_STORE.db_password);
  }
  
  static get DATABASE_HOST() {
    return decode(SECURE_STORE.db_host);
  }
  
  static get DATABASE_PROJECT_REF() {
    return decode(SECURE_STORE.db_project_ref);
  }
  
  // Supabase credentials
  static get SUPABASE_URL() {
    return decode(SECURE_STORE.supabase_url);
  }
  
  static get SUPABASE_ANON_KEY() {
    return decode(SECURE_STORE.supabase_anon_key);
  }
  
  static get SUPABASE_ACCESS_TOKEN() {
    return decode(SECURE_STORE.supabase_access_token);
  }

  // API keys
  static get OPENAI_API_KEY() {
    return decode(SECURE_STORE.openai_api_key);
  }

  /**
   * Helper method to add new credentials (for development use)
   */
  static encodeCredential(value) {
    return encode(value);
  }
  
  /**
   * Get all available configuration keys (for debugging)
   */
  static getAvailableKeys() {
    return Object.keys(SECURE_STORE);
  }
  
  /**
   * Check if a credential is configured
   */
  static hasCredential(key) {
    return Boolean(SECURE_STORE[key]);
  }
}

export default SecureConfig;
