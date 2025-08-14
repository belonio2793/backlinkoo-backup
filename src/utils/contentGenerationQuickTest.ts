/**
 * Quick Content Generation Test
 * Simple utility to test content generation functions
 */

export async function testContentGeneration(keyword: string = 'test keyword') {
  console.log('🧪 Quick content generation test...');
  
  const functions = [
    'working-content-generator',
    'ai-content-generator', 
    'generate-content',
    'generate-openai'
  ];
  
  for (const func of functions) {
    try {
      console.log(`Testing /.netlify/functions/${func}...`);
      
      const response = await fetch(`/.netlify/functions/${func}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          anchor_text: 'test link',
          target_url: 'https://example.com',
          word_count: 300,
          tone: 'professional'
        }),
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log(`❌ ${func} not found`);
        continue;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`✅ ${func} WORKS! Generated ${data.data?.word_count || 0} words`);
          return { function: func, success: true, data };
        } else {
          console.log(`❌ ${func} returned error:`, data.error);
        }
      } else {
        console.log(`❌ ${func} HTTP error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${func} network error:`, error.message);
    }
  }
  
  console.log('❌ No working content generation functions found');
  return { success: false };
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testContentGeneration = testContentGeneration;
  console.log('🔧 Content test available: window.testContentGeneration()');
}

export default testContentGeneration;
