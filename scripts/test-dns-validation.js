#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDNSValidation() {
  console.log('🔍 Testing DNS validation service...');
  
  try {
    // Test the Netlify function directly
    const response = await fetch('/.netlify/functions/validate-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_id: 'test-validation-123' }),
      signal: AbortSignal.timeout(10000)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Service error response:', errorText);
      
      if (response.status === 404) {
        console.log('');
        console.log('🔧 DNS validation function not deployed or not accessible');
        console.log('Solutions:');
        console.log('1. Check if Netlify functions are deployed');
        console.log('2. Verify function exists at netlify/functions/validate-domain.js');
        console.log('3. Redeploy to Netlify');
        console.log('4. Check Netlify build logs');
      }
      return;
    }

    const result = await response.json();
    console.log('✅ DNS validation function is working');
    console.log('📋 Response:', result);
    
  } catch (error) {
    console.error('❌ Error testing DNS validation:', error);
    
    if (error.name === 'AbortError') {
      console.log('⏱️  DNS validation service timeout');
    } else if (error.message?.includes('Failed to fetch')) {
      console.log('🌐 Network error - function not accessible');
      console.log('');
      console.log('💡 This suggests the function is not deployed or not accessible');
      console.log('Solutions:');
      console.log('1. Redeploy to Netlify');
      console.log('2. Check Netlify function logs');
      console.log('3. Verify function is in netlify/functions/ directory');
    }
  }
}

async function testLocalDomains() {
  console.log('');
  console.log('🏠 Testing with actual domains in database...');
  
  try {
    const { data: domains, error } = await supabase
      .from('domains')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Error fetching domains:', error);
      return;
    }
    
    if (!domains || domains.length === 0) {
      console.log('📭 No domains found in database');
      return;
    }
    
    console.log(`📊 Found ${domains.length} domains:`);
    domains.forEach(domain => {
      console.log(`  • ${domain.domain} (${domain.status}) - Blog: ${domain.blog_enabled ? 'Enabled' : 'Disabled'}`);
    });
    
    // Test with first domain
    const testDomain = domains[0];
    console.log('');
    console.log(`🧪 Testing DNS validation with domain: ${testDomain.domain}`);
    
    const response = await fetch('/.netlify/functions/validate-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_id: testDomain.id }),
      signal: AbortSignal.timeout(15000)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Domain validation successful:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Domain validation failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing with domains:', error);
  }
}

async function checkDNSConfiguration() {
  console.log('');
  console.log('⚙️  Checking DNS configuration...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ Environment variables configured');
  
  // Check if function file exists locally
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const functionPath = path.join(__dirname, '..', 'netlify', 'functions', 'validate-domain.js');
    
    if (fs.existsSync(functionPath)) {
      console.log('✅ DNS validation function file exists locally');
    } else {
      console.error('❌ DNS validation function file not found locally');
      console.log('Path checked:', functionPath);
    }
  } catch (error) {
    console.warn('⚠️  Could not check local function file:', error.message);
  }
  
  return true;
}

// Run tests
async function runTests() {
  console.log('🚀 DNS Validation Service Test');
  console.log('================================');
  
  const configOk = await checkDNSConfiguration();
  if (!configOk) return;
  
  await testDNSValidation();
  await testLocalDomains();
  
  console.log('');
  console.log('🎯 Summary:');
  console.log('If you see 404 errors, the Netlify function is not deployed');
  console.log('If you see network errors, check your internet connection');
  console.log('If validation works, the service is operational');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
