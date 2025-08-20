#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// This script helps configure and test Netlify environment variables for domain functions

async function testEnvironmentAccess() {
  console.log('🔧 Testing Netlify Environment Variable Access\n');

  // Check local environment
  const localToken = process.env.NETLIFY_ACCESS_TOKEN;
  console.log('📋 Local Environment Check:');
  console.log(`   NETLIFY_ACCESS_TOKEN: ${localToken ? '✅ Set (length: ' + localToken.length + ')' : '❌ Not set'}`);

  if (!localToken) {
    console.log('\n❌ NETLIFY_ACCESS_TOKEN not found in local environment');
    console.log('📝 To fix this, you need to:');
    console.log('   1. Set the environment variable in your Netlify dashboard');
    console.log('   2. OR use DevServerControl to set it');
    console.log('   3. OR add it to your .env file (not recommended for production)');
    return false;
  }

  // Test Netlify API connectivity
  console.log('\n🌐 Testing Netlify API Connectivity:');
  try {
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${localToken}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      console.log(`   ✅ Connected as: ${user.email} (${user.full_name})`);
      
      // Test site access
      console.log('\n🏠 Testing Site Access:');
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites/ca6261e6-0a59-40b5-a2bc-5b5481ac8809', {
        headers: {
          'Authorization': `Bearer ${localToken}`
        }
      });

      if (siteResponse.ok) {
        const site = await siteResponse.json();
        console.log(`   ✅ Site: ${site.name} (${site.url})`);
        console.log(`   📍 Custom Domain: ${site.custom_domain || 'None set'}`);
        console.log(`   🔗 Domain Aliases: ${site.domain_aliases?.length || 0} domains`);
        return true;
      } else {
        console.log(`   ❌ Site access failed: HTTP ${siteResponse.status}`);
        return false;
      }
    } else {
      console.log(`   ❌ Authentication failed: HTTP ${response.status}`);
      const errorText = await response.text();
      console.log(`   📝 Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function testFunctionAccess() {
  console.log('\n🔧 Testing Function Environment Access:');
  
  try {
    // This would normally be done via the actual function endpoint
    // For now, we'll simulate what the function sees
    console.log('   📋 Function environment simulation:');
    console.log('   - Netlify.env.get() would access:', process.env.NETLIFY_ACCESS_TOKEN ? '✅ Available' : '❌ Not available');
    console.log('   - process.env access:', process.env.NETLIFY_ACCESS_TOKEN ? '✅ Available' : '❌ Not available');
    
    console.log('\n📡 Testing function endpoint (if dev server is running):');
    try {
      const testResponse = await fetch('http://localhost:8888/.netlify/functions/test-env-sync', {
        method: 'GET'
      });
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log('   ✅ Function test successful');
        console.log('   📊 Results:', JSON.stringify(result.environment_tests, null, 2));
        return true;
      } else {
        console.log(`   ⚠️  Function test failed: HTTP ${testResponse.status}`);
        console.log('   💡 This is normal if dev server is not running');
        return false;
      }
    } catch (error) {
      console.log('   ⚠️  Cannot reach function endpoint (dev server may not be running)');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Function test error: ${error.message}`);
    return false;
  }
}

async function generateNetlifyTomlConfig() {
  console.log('\n📝 Generating recommended netlify.toml configuration:');
  
  const config = `
# Add this to your netlify.toml for proper environment variable handling

[build.environment]
  NODE_VERSION = "18"
  # Ensure environment variables are passed to functions
  NETLIFY_TOKEN_CONFIGURED = "true"

[functions]
  directory = "netlify/functions"
  # Ensure all environment variables are available to functions
  included_files = ["**/*"]
  
# Context-specific environment variables
[context.production.environment]
  VITE_ENVIRONMENT = "production"
  NETLIFY_FUNCTIONS_ENABLED = "true"

[context.deploy-preview.environment]
  VITE_ENVIRONMENT = "preview"
  NETLIFY_FUNCTIONS_ENABLED = "true"

[context.branch-deploy.environment]
  VITE_ENVIRONMENT = "development"
  NETLIFY_FUNCTIONS_ENABLED = "true"
`;

  console.log(config);
  return config;
}

async function main() {
  console.log('🚀 Netlify Environment Configuration Tool\n');
  
  const envWorking = await testEnvironmentAccess();
  const functionsWorking = await testFunctionAccess();
  
  if (!envWorking) {
    console.log('\n❌ Environment variable setup needs attention');
    console.log('\n🔧 Quick fixes:');
    console.log('   1. Go to Netlify Dashboard → Site settings → Environment variables');
    console.log('   2. Add: NETLIFY_ACCESS_TOKEN = your_token_here');
    console.log('   3. Or use: DevServerControl.set_env_variable(["NETLIFY_ACCESS_TOKEN", "your_token"])');
  }
  
  if (!functionsWorking && envWorking) {
    console.log('\n⚠️  Environment variables set but functions may need restart');
    console.log('   Try: DevServerControl.restart() or npm run dev:netlify');
  }
  
  if (envWorking && functionsWorking) {
    console.log('\n🎉 Environment configuration is working correctly!');
    console.log('   Your /domains functions should now have access to NETLIFY_ACCESS_TOKEN');
  }
  
  await generateNetlifyTomlConfig();
  
  console.log('\n📚 Next steps:');
  console.log('   1. Test domain function: POST to /.netlify/functions/add-domain-with-ssl');
  console.log('   2. Use bulk script: node scripts/bulk-add-domains.js your-domains.txt');
  console.log('   3. Monitor in dashboard: /domains management interface');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testEnvironmentAccess, testFunctionAccess };
