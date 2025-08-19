// Quick test for domain validation function
async function testDomainValidation() {
  console.log('🧪 Testing domain validation function...');
  
  try {
    const response = await fetch('/.netlify/functions/validate-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        domain_id: 'test-domain-id-123'
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Function responded with error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Function response:', result);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDomainValidation();
