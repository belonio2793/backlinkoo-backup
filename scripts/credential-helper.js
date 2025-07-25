#!/usr/bin/env node

/**
 * Credential Helper Utility
 * 
 * Helps manage credentials in the secure configuration store.
 * Use this to encode new credentials or verify existing ones.
 */

import { SecureConfig } from './secure-config.js';

class CredentialHelper {
  
  /**
   * Encode a new credential
   */
  static encode(value) {
    if (!value) {
      console.error('❌ Value is required');
      return;
    }
    
    const encoded = Buffer.from(value, 'utf-8').toString('base64');
    console.log('✅ Encoded credential:');
    console.log(`   Original: ${value}`);
    console.log(`   Encoded:  ${encoded}`);
    console.log('');
    console.log('📋 To use this credential:');
    console.log('1. Add it to SECURE_STORE in both secure-config files');
    console.log('2. Add a getter method in SecureConfig class');
    console.log('3. Update the documentation');
    
    return encoded;
  }
  
  /**
   * Decode and verify a credential
   */
  static decode(encoded) {
    if (!encoded) {
      console.error('❌ Encoded value is required');
      return;
    }
    
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      console.log('✅ Decoded credential:');
      console.log(`   Encoded:  ${encoded}`);
      console.log(`   Decoded:  ${decoded}`);
      return decoded;
    } catch (error) {
      console.error('❌ Invalid base64 encoding:', error.message);
      return null;
    }
  }
  
  /**
   * List all configured credentials
   */
  static list() {
    console.log('📋 Configured Credentials:');
    console.log('');
    
    const keys = SecureConfig.getAvailableKeys();
    
    keys.forEach(key => {
      const hasValue = SecureConfig.hasCredential(key);
      const status = hasValue ? '✅' : '❌';
      console.log(`   ${status} ${key}`);
    });
    
    console.log('');
    console.log(`Total: ${keys.length} credentials configured`);
  }
  
  /**
   * Test database credentials
   */
  static testDatabase() {
    console.log('🔧 Testing database credentials...');
    console.log('');
    
    try {
      const password = SecureConfig.DATABASE_PASSWORD;
      const host = SecureConfig.DATABASE_HOST;
      const projectRef = SecureConfig.DATABASE_PROJECT_REF;
      
      console.log('✅ Database credentials accessible:');
      console.log(`   Host: ${host}`);
      console.log(`   Project: ${projectRef}`);
      console.log(`   Password: ${password ? '***configured***' : '❌ missing'}`);
      
    } catch (error) {
      console.error('❌ Error accessing database credentials:', error.message);
    }
  }
  
  /**
   * Test Supabase credentials
   */
  static testSupabase() {
    console.log('🔧 Testing Supabase credentials...');
    console.log('');
    
    try {
      const url = SecureConfig.SUPABASE_URL;
      const anonKey = SecureConfig.SUPABASE_ANON_KEY;
      const accessToken = SecureConfig.SUPABASE_ACCESS_TOKEN;
      
      console.log('✅ Supabase credentials accessible:');
      console.log(`   URL: ${url}`);
      console.log(`   Anon Key: ${anonKey ? '***configured***' : '❌ missing'}`);
      console.log(`   Access Token: ${accessToken ? '***configured***' : '❌ missing'}`);
      
    } catch (error) {
      console.error('❌ Error accessing Supabase credentials:', error.message);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const value = process.argv[3];

  switch (command) {
    case 'encode':
      if (!value) {
        console.error('❌ Usage: node scripts/credential-helper.js encode "your-credential-here"');
        process.exit(1);
      }
      CredentialHelper.encode(value);
      break;
      
    case 'decode':
      if (!value) {
        console.error('❌ Usage: node scripts/credential-helper.js decode "base64-encoded-value"');
        process.exit(1);
      }
      CredentialHelper.decode(value);
      break;
      
    case 'list':
      CredentialHelper.list();
      break;
      
    case 'test-db':
      CredentialHelper.testDatabase();
      break;
      
    case 'test-supabase':
      CredentialHelper.testSupabase();
      break;
      
    case 'test':
      CredentialHelper.testDatabase();
      console.log('');
      CredentialHelper.testSupabase();
      break;
      
    default:
      console.log(`
🔐 Credential Helper Commands:

  encode <value>     - Encode a credential for storage
  decode <encoded>   - Decode a stored credential
  list              - List all configured credentials
  test-db           - Test database credential access
  test-supabase     - Test Supabase credential access
  test              - Test all credentials

Examples:
  node scripts/credential-helper.js encode "my-secret-key"
  node scripts/credential-helper.js decode "bXktc2VjcmV0LWtleQ=="
  node scripts/credential-helper.js list
  node scripts/credential-helper.js test
      `);
  }
}

export default CredentialHelper;
