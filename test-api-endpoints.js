/**
 * API Endpoint Testing Script
 * Tests all domain management endpoints
 */

const BASE_URL = 'http://localhost:8888/.netlify/functions';

async function testEndpoint(endpoint, data = {}) {
  try {
    console.log(`\n🧪 Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');

  // Test 1: Domain Validation Function - Get Site Info
  await testEndpoint('netlify-domain-validation', { action: 'getSiteInfo' });

  // Test 2: Domain Validation Function - List Domain Aliases
  await testEndpoint('netlify-domain-validation', { action: 'listDomainAliases' });

  // Test 3: Add Domain Function
  await testEndpoint('add-domain-to-netlify', { 
    domain: 'test-endpoint.com', 
    domainId: 'test-123' 
  });

  // Test 4: Domain Validation Function - Add Domain Alias
  await testEndpoint('netlify-domain-validation', { 
    action: 'addDomainAlias', 
    domain: 'test-alias.com' 
  });

  // Test 5: Domain Validation Function - Remove Domain Alias
  await testEndpoint('netlify-domain-validation', { 
    action: 'removeDomainAlias', 
    domain: 'test-alias.com' 
  });

  // Test 6: DNS Validation
  await testEndpoint('validate-domain', { domain: 'example.com' });

  // Test 7: Comprehensive Domain Status
  await testEndpoint('comprehensive-domain-status', { domain: 'example.com' });

  console.log('\n🏁 API Endpoint Testing Complete!');
}

runTests().catch(console.error);
