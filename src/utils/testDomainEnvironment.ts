/**
 * Test domain environment configuration
 */

import { netlifyDomainService } from '@/services/netlifyDomainService';
import { DomainManager } from '@/services/domainManager';

export async function testDomainEnvironment(): Promise<void> {
  console.log('🔧 Testing domain environment configuration...');
  
  // Test environment variables
  console.log('📋 Environment Variables:');
  console.log('  VITE_NETLIFY_ACCESS_TOKEN:', import.meta.env.VITE_NETLIFY_ACCESS_TOKEN ? 'SET' : 'MISSING');
  console.log('  VITE_NETLIFY_SITE_ID:', import.meta.env.VITE_NETLIFY_SITE_ID ? 'SET' : 'MISSING');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

  // Test Netlify service configuration
  console.log('📋 Netlify Service Configuration:');
  console.log('  Configured:', netlifyDomainService.isConfigured());

  if (netlifyDomainService.isConfigured()) {
    console.log('🧪 Testing Netlify API connection...');
    const netlifyTest = await netlifyDomainService.testConnection();
    console.log('  Connection:', netlifyTest.success ? '✅ SUCCESS' : '❌ FAILED');
    if (netlifyTest.error) {
      console.log('  Error:', netlifyTest.error);
    }
    if (netlifyTest.data) {
      console.log('  Site Info:', netlifyTest.data);
    }
  }

  // Test complete domain setup
  console.log('🧪 Testing complete domain setup...');
  const setupTest = await DomainManager.testDomainSetup();
  console.log('  Setup Test:', setupTest.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  Results:', setupTest.results);

  console.log('✅ Domain environment test complete!');
}

// Auto-run in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testDomainEnvironment();
  }, 2000);
}
