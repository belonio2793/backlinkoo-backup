#!/usr/bin/env node
/**
 * Netlify Configuration Test Script
 * Tests Netlify API connectivity and site access
 * 
 * Usage:
 *   node scripts/test-netlify-config.js
 *   NETLIFY_ACCESS_TOKEN=your_token node scripts/test-netlify-config.js
 *   NETLIFY_ACCESS_TOKEN=your_token NETLIFY_SITE_ID=your_site_id node scripts/test-netlify-config.js
 */

const https = require('https');
require('dotenv').config();

// Configuration
const API_TOKEN = process.env.NETLIFY_ACCESS_TOKEN || process.env.VITE_NETLIFY_ACCESS_TOKEN;
const SITE_ID = process.env.NETLIFY_SITE_ID || process.argv[2];

console.log('🧪 Netlify Configuration Test');
console.log('==============================');

if (!API_TOKEN) {
  console.log('❌ No API token found.');
  console.log('💡 Set NETLIFY_ACCESS_TOKEN environment variable or use demo mode.');
  console.log('');
  console.log('Demo mode test:');
  testDemoMode();
  process.exit(1);
}

console.log(`📋 Configuration:`);
console.log(`   API Token: ${API_TOKEN.substring(0, 8)}...${API_TOKEN.substring(API_TOKEN.length - 4)}`);
console.log(`   Site ID: ${SITE_ID || 'Auto-detect'}`);
console.log('');

// Test functions
async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Config-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAuthentication() {
  console.log('🔑 Testing authentication...');
  try {
    const response = await makeRequest('/user');
    if (response.status === 200) {
      console.log(`✅ Authentication successful`);
      console.log(`   User: ${response.data.full_name || response.data.email}`);
      console.log(`   Account: ${response.data.slug || 'Personal'}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${response.status}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

async function listSites() {
  console.log('\n🏠 Fetching sites...');
  try {
    const response = await makeRequest('/sites');
    if (response.status === 200) {
      const sites = response.data;
      console.log(`✅ Found ${sites.length} sites:`);
      
      if (sites.length === 0) {
        console.log('   (No sites found - you may need to create a site first)');
        return null;
      }
      
      sites.slice(0, 5).forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} (${site.id})`);
        if (site.custom_domain) {
          console.log(`      Custom domain: ${site.custom_domain}`);
        }
        if (site.url) {
          console.log(`      URL: ${site.url}`);
        }
      });
      
      if (sites.length > 5) {
        console.log(`   ... and ${sites.length - 5} more sites`);
      }
      
      return sites[0]; // Return first site for testing
    } else {
      console.log(`❌ Failed to fetch sites: ${response.status}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Sites fetch error: ${error.message}`);
    return null;
  }
}

async function testSiteAccess(siteId) {
  console.log(`\n🌐 Testing site access (${siteId})...`);
  try {
    const response = await makeRequest(`/sites/${siteId}`);
    if (response.status === 200) {
      const site = response.data;
      console.log(`✅ Site access successful`);
      console.log(`   Name: ${site.name}`);
      console.log(`   State: ${site.state}`);
      console.log(`   URL: ${site.url}`);
      if (site.custom_domain) {
        console.log(`   Custom domain: ${site.custom_domain}`);
      }
      return true;
    } else {
      console.log(`❌ Site access failed: ${response.status}`);
      if (response.status === 404) {
        console.log(`   The site ${siteId} was not found`);
      } else {
        console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Site access error: ${error.message}`);
    return false;
  }
}

async function testDomainPermissions(siteId) {
  console.log(`\n🔗 Testing domain permissions (${siteId})...`);
  try {
    const response = await makeRequest(`/sites/${siteId}/domains`);
    if (response.status === 200) {
      const domains = response.data;
      console.log(`✅ Domain access successful`);
      console.log(`   Current domains: ${domains.length}`);
      domains.forEach((domain, index) => {
        console.log(`   ${index + 1}. ${domain.domain} (${domain.state || 'unknown state'})`);
      });
      return true;
    } else {
      console.log(`❌ Domain access failed: ${response.status}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      if (response.status === 403) {
        console.log(`   Your API token may not have domain management permissions`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Domain permissions error: ${error.message}`);
    return false;
  }
}

function testDemoMode() {
  console.log('🧪 Demo Mode Test');
  console.log('================');
  console.log('✅ Demo mode would work with token: "demo-token"');
  console.log('✅ All API calls would be simulated');
  console.log('✅ UI would show demo indicators');
  console.log('');
  console.log('To use demo mode in the app:');
  console.log('1. Set API token to "demo-token"');
  console.log('2. Leave site ID empty or use "demo-site-id"');
  console.log('3. All Netlify operations will be simulated');
}

async function runTests() {
  console.log('Starting Netlify API tests...\n');
  
  // Test 1: Authentication
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Please check your API token.');
    console.log('💡 Get your token from: https://app.netlify.com/user/applications#personal-access-tokens');
    return;
  }
  
  // Test 2: List sites
  const firstSite = await listSites();
  
  // Test 3: Site access
  const targetSiteId = SITE_ID || (firstSite ? firstSite.id : null);
  if (targetSiteId) {
    const siteSuccess = await testSiteAccess(targetSiteId);
    if (siteSuccess) {
      // Test 4: Domain permissions
      await testDomainPermissions(targetSiteId);
    }
  } else {
    console.log('\n⚠️ No site ID provided and no sites found');
    console.log('💡 Create a site in Netlify first, then run this test again');
  }
  
  console.log('\n🎉 Test completed!');
  console.log('\n💡 Configuration for your app:');
  console.log(`   NETLIFY_ACCESS_TOKEN=${API_TOKEN}`);
  if (targetSiteId) {
    console.log(`   NETLIFY_SITE_ID=${targetSiteId}`);
  }
}

// Run the tests
if (API_TOKEN && !API_TOKEN.includes('demo')) {
  runTests().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
} else if (API_TOKEN && API_TOKEN.includes('demo')) {
  testDemoMode();
} else {
  console.log('❌ No valid API token provided');
  process.exit(1);
}
