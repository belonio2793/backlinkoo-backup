import { SecurityProtocolRemoval } from './src/utils/disableSecurityProtocols.ts';

// Test the security removal functionality
async function testSecurityRemoval() {
  console.log('🔓 Testing security protocol removal...');
  
  try {
    // Remove all security protocols
    const removeResult = await SecurityProtocolRemoval.disableAllSecurityProtocols();
    console.log('Security removal result:', removeResult);
    
    // Test unrestricted access
    const testResult = await SecurityProtocolRemoval.testUnrestrictedAccess();
    console.log('Unrestricted access test:', testResult);
    
    // Show current security status
    const securityStatus = await SecurityProtocolRemoval.showCurrentSecurity();
    console.log('Current security status:', securityStatus);
    
  } catch (error) {
    console.error('❌ Error testing security removal:', error);
  }
}

testSecurityRemoval();
