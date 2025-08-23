/**
 * Test Script for Netlify Domain Integration
 * 
 * This script tests the new Netlify domain addition functionality
 * Run this in the browser console on the domains page to test
 */

async function testNetlifyDomainIntegration() {
  console.log('🧪 Testing Netlify Domain Integration...');
  
  const testDomain = 'test-example-domain.com';
  
  try {
    // Test 1: Check environment variables are set
    console.log('\n1️⃣ Testing environment configuration...');
    
    const envResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'test-check.com' })
    });
    
    const envResult = await envResponse.json();
    
    if (envResult.error && envResult.error.includes('token not configured')) {
      console.error('❌ Netlify access token not configured');
      return false;
    }
    
    console.log('✅ Environment configuration looks good');
    
    // Test 2: Test domain validation
    console.log('\n2️⃣ Testing domain validation...');
    
    const invalidDomainResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'invalid..domain' })
    });
    
    const invalidResult = await invalidDomainResponse.json();
    
    if (invalidResult.success) {
      console.error('❌ Domain validation failed - should reject invalid domains');
      return false;
    }
    
    console.log('✅ Domain validation working correctly');
    
    // Test 3: Test API method validation
    console.log('\n3️⃣ Testing API method validation...');
    
    const getResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'GET'
    });
    
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.error('❌ Method validation failed - should only allow POST');
      return false;
    }
    
    console.log('✅ Method validation working correctly');
    
    // Test 4: Test with a real domain (this might actually add it)
    console.log(`\n4️⃣ Testing with domain: ${testDomain}...`);
    console.warn('⚠️ This will attempt to add the domain to Netlify!');
    
    const realDomainResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        domain: testDomain,
        domainId: 'test-uuid-' + Date.now()
      })
    });
    
    const realResult = await realDomainResponse.json();
    
    console.log('Result:', realResult);
    
    if (realResult.success) {
      console.log('✅ Domain addition successful!');
      console.log('📋 DNS Instructions:', realResult.dnsInstructions);
      console.log('🏗️ Netlify Data:', realResult.netlifyData);
    } else {
      console.log('ℹ️ Domain addition failed (expected for test domain)');
      console.log('Error:', realResult.error);
    }
    
    console.log('\n🎉 All tests completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Function to test DNS instructions generation
function testDNSInstructions() {
  console.log('\n📋 Testing DNS Instructions...');
  
  // Test root domain
  console.log('\n🌐 Root Domain Instructions:');
  fetch('/.netlify/functions/add-domain-to-netlify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'example.com' })
  })
  .then(response => response.json())
  .then(result => {
    if (result.dnsInstructions) {
      console.log('Type:', result.dnsInstructions.type);
      console.log('Records:', result.dnsInstructions.dnsRecords);
    }
  });
  
  // Test subdomain
  console.log('\n🏠 Subdomain Instructions:');
  fetch('/.netlify/functions/add-domain-to-netlify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'blog.example.com' })
  })
  .then(response => response.json())
  .then(result => {
    if (result.dnsInstructions) {
      console.log('Type:', result.dnsInstructions.type);
      console.log('Records:', result.dnsInstructions.dnsRecords);
    }
  });
}

// Function to test the full workflow
async function testFullWorkflow() {
  console.log('\n🔄 Testing Full Domain Addition Workflow...');
  
  // Simulate what happens in DomainsPage
  const testDomain = {
    id: 'test-domain-id',
    domain: 'workflow-test.com',
    status: 'pending'
  };
  
  try {
    // Step 1: Add to Netlify
    console.log('Step 1: Adding to Netlify...');
    const netlifyResponse = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        domain: testDomain.domain,
        domainId: testDomain.id
      })
    });
    
    const netlifyResult = await netlifyResponse.json();
    console.log('Netlify Result:', netlifyResult);
    
    if (netlifyResult.success) {
      // Step 2: Validate domain
      console.log('Step 2: Validating domain...');
      const validateResponse = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: testDomain.domain,
          domainId: testDomain.id
        })
      });
      
      const validateResult = await validateResponse.json();
      console.log('Validation Result:', validateResult);
    }
    
  } catch (error) {
    console.error('Workflow test failed:', error);
  }
}

// Make functions available globally for testing
window.testNetlifyDomainIntegration = testNetlifyDomainIntegration;
window.testDNSInstructions = testDNSInstructions;
window.testFullWorkflow = testFullWorkflow;

console.log(`
🧪 Netlify Domain Integration Test Functions Available:

1. testNetlifyDomainIntegration() - Run comprehensive tests
2. testDNSInstructions() - Test DNS instruction generation
3. testFullWorkflow() - Test the complete domain addition workflow

Run any of these functions in the browser console to test the integration.
`);

// Auto-run basic test on load
// testNetlifyDomainIntegration();
