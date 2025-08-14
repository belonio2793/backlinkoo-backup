/**
 * Test Client Content Generator
 * Quick test to verify client-side content generation works
 */

import { ClientContentGenerator } from '../services/clientContentGenerator';

export async function testClientContentGenerator(): Promise<void> {
  console.log('🧪 Testing client-side content generator...');
  
  try {
    const result = await ClientContentGenerator.generateContent({
      keyword: 'go high level',
      anchor_text: 'powerful marketing platform',
      target_url: 'https://example.com',
      word_count: 800,
      tone: 'professional'
    });
    
    if (result.success && result.data) {
      console.log('✅ Client-side content generation SUCCESSFUL!');
      console.log(`📝 Generated: "${result.data.title}"`);
      console.log(`📊 Word count: ${result.data.word_count}`);
      console.log(`🔗 Anchor text used: "${result.data.anchor_text_used}"`);
      console.log(`🎯 Target URL: ${result.data.target_url_used}`);
      console.log(`⚙️ Method: ${result.data.generation_method}`);
      
      // Check if content contains the anchor text link
      const hasAnchorLink = result.data.content.includes(`[${result.data.anchor_text_used}]`);
      console.log(`🔗 Anchor link included: ${hasAnchorLink ? '✅' : '❌'}`);
      
      if (hasAnchorLink) {
        console.log('🎉 Client-side content generator is working perfectly!');
      }
      
      return;
    } else {
      console.error('❌ Client-side content generation failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testClientContentGenerator = testClientContentGenerator;
  console.log('🔧 Client content test available: window.testClientContentGenerator()');
}

export default testClientContentGenerator;
