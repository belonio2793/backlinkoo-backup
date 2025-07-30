/**
 * Test utility to verify BlogClaimService fixes
 */

import { BlogClaimService } from '@/services/blogClaimService';

export async function testBlogClaimServiceFixes() {
  console.log('🧪 Testing BlogClaimService fixes...');
  
  try {
    // Test 1: Basic fetch with improved error handling
    console.log('🔧 Test 1: Testing getClaimablePosts with improved error handling...');
    const posts = await BlogClaimService.getClaimablePosts(5);
    console.log(`✅ Test 1 passed: Retrieved ${posts.length} posts`);
    
    // Test 2: Test diagnostic utility
    console.log('🔧 Test 2: Testing diagnostic utility...');
    const { BlogClaimDiagnostic } = await import('@/utils/blogClaimDiagnostic');
    const diagnostic = await BlogClaimDiagnostic.runFullDiagnostic();
    console.log(`✅ Test 2 completed: Diagnostic ${diagnostic.success ? 'passed' : 'found issues'}`, diagnostic);
    
    // Test 3: Quick connection test
    console.log('🔧 Test 3: Testing quick connection...');
    const connectionOk = await BlogClaimDiagnostic.quickConnectionTest();
    console.log(`✅ Test 3 completed: Connection ${connectionOk ? 'OK' : 'Failed'}`);
    
    return {
      success: true,
      results: {
        postsRetrieved: posts.length,
        diagnosticPassed: diagnostic.success,
        connectionOk,
        issues: diagnostic.issues
      }
    };
    
  } catch (error: any) {
    console.error('❌ BlogClaimService test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testBlogClaimServiceFixes = testBlogClaimServiceFixes;
  console.log('🧪 BlogClaimService test available via window.testBlogClaimServiceFixes()');
}
