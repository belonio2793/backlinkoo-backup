/**
 * Test utility to verify DNS validation service fixes
 */

import DNSValidationService from '@/services/dnsValidationService';

export async function testDNSValidationFix() {
  console.log('🧪 Testing DNS validation service fixes...');
  
  try {
    // Test 1: Check service health
    console.log('Test 1: Checking service health...');
    const healthStatus = await DNSValidationService.checkServiceHealth();
    console.log('✅ Service health check passed:', healthStatus);
    
    // Test 2: Validate domain
    console.log('Test 2: Testing domain validation...');
    const validationResult = await DNSValidationService.validateDomain('test-domain-id');
    console.log('✅ Domain validation passed:', validationResult);
    
    // Test 3: Check DNS records
    console.log('Test 3: Testing DNS records check...');
    const dnsRecords = await DNSValidationService.checkDNSRecords('example.com');
    console.log('✅ DNS records check passed:', dnsRecords);
    
    // Test 4: Get DNS instructions
    console.log('Test 4: Testing DNS instructions...');
    const instructions = DNSValidationService.getDNSInstructions(
      { domain: 'example.com' }, 
      { ip: '192.168.1.1' }
    );
    console.log('✅ DNS instructions generated:', instructions);
    
    console.log('🎉 All DNS validation service tests passed!');
    return {
      success: true,
      message: 'All DNS validation service tests passed',
      results: {
        healthCheck: healthStatus,
        domainValidation: validationResult,
        dnsRecords: dnsRecords,
        instructions: instructions
      }
    };
    
  } catch (error) {
    console.error('❌ DNS validation service test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      error: error
    };
  }
}

// Add to window for development testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testDNSValidationFix = testDNSValidationFix;
}
