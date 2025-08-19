import { supabase } from '@/integrations/supabase/client';

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  id?: string;
}

export interface RegistrarCredentials {
  registrarCode: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  zone?: string;
  userId?: string;
  additionalConfig?: Record<string, any>;
}

export interface DNSUpdateResult {
  success: boolean;
  recordsUpdated: number;
  recordsCreated: number;
  recordsFailed: number;
  errors: string[];
  details: Array<{
    record: DNSRecord;
    action: 'created' | 'updated' | 'failed';
    error?: string;
  }>;
}

export class RegistrarAPIService {
  
  /**
   * Test API credentials for a registrar
   */
  static async testCredentials(credentials: RegistrarCredentials): Promise<{
    success: boolean;
    message: string;
    accountInfo?: any;
  }> {
    try {
      console.log(`🔧 Testing credentials for ${credentials.registrarCode}...`);
      
      // Call our Netlify function to test credentials
      const response = await fetch('/.netlify/functions/test-registrar-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Credential test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error testing credentials'
      };
    }
  }

  /**
   * Get current DNS records from registrar
   */
  static async getCurrentDNSRecords(
    domain: string, 
    credentials: RegistrarCredentials
  ): Promise<{
    success: boolean;
    records: DNSRecord[];
    error?: string;
  }> {
    try {
      console.log(`📋 Fetching DNS records for ${domain} from ${credentials.registrarCode}...`);
      
      const response = await fetch('/.netlify/functions/get-dns-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, credentials }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Failed to get DNS records:', error);
      return {
        success: false,
        records: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update DNS records via registrar API
   */
  static async updateDNSRecords(
    domain: string,
    records: DNSRecord[],
    credentials: RegistrarCredentials
  ): Promise<DNSUpdateResult> {
    try {
      console.log(`🔄 Updating ${records.length} DNS records for ${domain}...`);
      
      const response = await fetch('/.netlify/functions/update-dns-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, records, credentials }),
        signal: AbortSignal.timeout(30000) // Longer timeout for updates
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('DNS update failed:', error);
      return {
        success: false,
        recordsUpdated: 0,
        recordsCreated: 0,
        recordsFailed: records.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        details: records.map(record => ({
          record,
          action: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      };
    }
  }

  /**
   * Save registrar credentials securely
   */
  static async saveCredentials(
    domainId: string,
    credentials: RegistrarCredentials
  ): Promise<boolean> {
    try {
      // Encrypt sensitive data before storage
      const encryptedCredentials = await this.encryptCredentials(credentials);
      
      const { error } = await supabase
        .from('domain_registrar_credentials')
        .upsert({
          domain_id: domainId,
          registrar_code: credentials.registrarCode,
          encrypted_credentials: encryptedCredentials,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'domain_id'
        });

      if (error) {
        console.error('Failed to save credentials:', error);
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  /**
   * Get saved registrar credentials
   */
  static async getCredentials(domainId: string): Promise<RegistrarCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('domain_registrar_credentials')
        .select('*')
        .eq('domain_id', domainId)
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt credentials
      const credentials = await this.decryptCredentials(data.encrypted_credentials);
      return credentials;
      
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Generate DNS records needed for domain validation
   */
  static generateRequiredRecords(
    domain: string,
    verificationToken: string,
    hostingConfig: { ip: string; cname: string }
  ): DNSRecord[] {
    return [
      {
        type: 'A',
        name: '@',
        content: hostingConfig.ip,
        ttl: 3600
      },
      {
        type: 'TXT',
        name: '@',
        content: `blo-verification=${verificationToken}`,
        ttl: 3600
      },
      {
        type: 'CNAME',
        name: 'www',
        content: hostingConfig.cname,
        ttl: 3600
      }
    ];
  }

  /**
   * Compare current records with required records
   */
  static compareRecords(
    currentRecords: DNSRecord[],
    requiredRecords: DNSRecord[]
  ): {
    missing: DNSRecord[];
    incorrect: Array<{ current: DNSRecord; required: DNSRecord }>;
    correct: DNSRecord[];
  } {
    const missing: DNSRecord[] = [];
    const incorrect: Array<{ current: DNSRecord; required: DNSRecord }> = [];
    const correct: DNSRecord[] = [];

    for (const required of requiredRecords) {
      const current = currentRecords.find(r => 
        r.type === required.type && 
        r.name === required.name
      );

      if (!current) {
        missing.push(required);
      } else if (current.content !== required.content) {
        incorrect.push({ current, required });
      } else {
        correct.push(current);
      }
    }

    return { missing, incorrect, correct };
  }

  /**
   * Get preview of changes that will be made
   */
  static async getUpdatePreview(
    domain: string,
    credentials: RegistrarCredentials,
    requiredRecords: DNSRecord[]
  ): Promise<{
    success: boolean;
    preview: {
      toCreate: DNSRecord[];
      toUpdate: Array<{ from: DNSRecord; to: DNSRecord }>;
      toKeep: DNSRecord[];
    };
    error?: string;
  }> {
    try {
      // Get current records
      const currentResult = await this.getCurrentDNSRecords(domain, credentials);
      
      if (!currentResult.success) {
        return {
          success: false,
          preview: { toCreate: [], toUpdate: [], toKeep: [] },
          error: currentResult.error
        };
      }

      // Compare records
      const comparison = this.compareRecords(currentResult.records, requiredRecords);
      
      const preview = {
        toCreate: comparison.missing,
        toUpdate: comparison.incorrect.map(item => ({
          from: item.current,
          to: item.required
        })),
        toKeep: comparison.correct
      };

      return { success: true, preview };
      
    } catch (error) {
      return {
        success: false,
        preview: { toCreate: [], toUpdate: [], toKeep: [] },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform automatic DNS propagation
   */
  static async performAutoPropagation(
    domainId: string,
    domain: string,
    verificationToken: string,
    hostingConfig: { ip: string; cname: string },
    credentials: RegistrarCredentials
  ): Promise<DNSUpdateResult> {
    try {
      // Generate required records
      const requiredRecords = this.generateRequiredRecords(
        domain,
        verificationToken,
        hostingConfig
      );

      // Update records via registrar API
      const result = await this.updateDNSRecords(domain, requiredRecords, credentials);

      // Log the auto-propagation attempt
      await this.logAutoPropagationAttempt(domainId, result);

      return result;
      
    } catch (error) {
      console.error('Auto-propagation failed:', error);
      
      const failureResult: DNSUpdateResult = {
        success: false,
        recordsUpdated: 0,
        recordsCreated: 0,
        recordsFailed: 3, // A, TXT, CNAME
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        details: []
      };

      await this.logAutoPropagationAttempt(domainId, failureResult);
      return failureResult;
    }
  }

  /**
   * Encrypt credentials for storage
   */
  private static async encryptCredentials(credentials: RegistrarCredentials): Promise<string> {
    // In production, use proper encryption
    // For now, use base64 encoding (NOT secure for production)
    const jsonString = JSON.stringify(credentials);
    return btoa(jsonString);
  }

  /**
   * Decrypt credentials from storage
   */
  private static async decryptCredentials(encryptedData: string): Promise<RegistrarCredentials> {
    // In production, use proper decryption
    // For now, use base64 decoding (NOT secure for production)
    const jsonString = atob(encryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Log auto-propagation attempt
   */
  private static async logAutoPropagationAttempt(
    domainId: string,
    result: DNSUpdateResult
  ): Promise<void> {
    try {
      await supabase
        .from('domain_auto_propagation_logs')
        .insert({
          domain_id: domainId,
          success: result.success,
          records_updated: result.recordsUpdated,
          records_created: result.recordsCreated,
          records_failed: result.recordsFailed,
          errors: result.errors,
          details: result.details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log auto-propagation attempt:', error);
      // Don't fail the main operation
    }
  }
}

export default RegistrarAPIService;
