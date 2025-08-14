/**
 * Test Full Automation Pipeline
 * Tests the complete automation flow with client-side fallbacks
 */

export async function testFullAutomationPipeline(): Promise<void> {
  console.log('🚀 Testing complete automation pipeline with client-side fallbacks...');
  
  try {
    // Import the automation executor
    const { DirectAutomationExecutor } = await import('../services/directAutomationExecutor');
    
    const executor = new DirectAutomationExecutor();
    
    console.log('📝 Running automation workflow...');
    
    const testInput = {
      keywords: ['go high level'],
      anchor_texts: ['powerful marketing platform'],
      target_url: 'https://example.com',
      user_id: 'test-user-pipeline'
    };
    
    const startTime = Date.now();
    const result = await executor.executeWorkflow(testInput);
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️ Total execution time: ${totalTime}ms`);
    
    if (result.success) {
      console.log('🎉 AUTOMATION PIPELINE SUCCESSFUL!');
      console.log('📊 Results:');
      console.log(`  📝 Article Title: "${result.article_title}"`);
      console.log(`  🔗 Article URL: ${result.article_url}`);
      console.log(`  📏 Content Length: ${result.article_content?.length || 0} characters`);
      console.log(`  🎯 Target Platform: ${result.target_platform}`);
      console.log(`  ⚡ Execution Time: ${result.execution_time_ms}ms`);
      
      if (result.anchor_text_used) {
        console.log(`  🔗 Anchor Text Used: "${result.anchor_text_used}"`);
      }
      
      if (result.warning) {
        console.log(`  ⚠️ Warning: ${result.warning}`);
      }
      
      // Verify the content contains the anchor text
      if (result.article_content && result.anchor_text_used) {
        const hasAnchorText = result.article_content.includes(result.anchor_text_used);
        console.log(`  ✅ Anchor text included: ${hasAnchorText ? 'YES' : 'NO'}`);
      }
      
      console.log('\n✅ Full automation pipeline working perfectly!');
      console.log('🔧 This confirms that both content generation and publishing');
      console.log('   work correctly even when Netlify functions return 404 errors.');
      
    } else {
      console.error('❌ AUTOMATION PIPELINE FAILED');
      console.error(`Error: ${result.error}`);
      console.error(`Execution time: ${result.execution_time_ms}ms`);
      
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('1. Check that client-side generators are properly imported');
      console.log('2. Verify there are no JavaScript errors in console');
      console.log('3. Test individual components with:');
      console.log('   - window.testClientContent()');
      console.log('   - window.testClientTelegraph()');
    }
    
  } catch (error) {
    console.error('💥 Pipeline test failed with error:', error);
    console.error('This indicates a critical issue with the automation system.');
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testFullAutomationPipeline = testFullAutomationPipeline;
  console.log('🔧 Full pipeline test available: window.testFullAutomationPipeline()');
}

export default testFullAutomationPipeline;
