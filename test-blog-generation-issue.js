/**
 * Blog Generation Issue Test Script
 * Tests to see if we're using LocalDevAPI instead of real OpenAI
 */

console.log('🔍 Testing blog generation issue...');

// Test environment detection
console.log('Environment:', import.meta.env.MODE);
console.log('DEV mode:', import.meta.env.DEV);
console.log('PROD mode:', import.meta.env.PROD);

// Check OpenAI key availability
console.log('OPENAI_API_KEY available:', !!import.meta.env.OPENAI_API_KEY);
console.log('VITE_OPENAI_API_KEY available:', !!import.meta.env.VITE_OPENAI_API_KEY);

// Check localStorage
const adminEnvVars = localStorage.getItem('admin_env_vars');
if (adminEnvVars) {
  const vars = JSON.parse(adminEnvVars);
  const openaiVar = vars.find(v => v.key === 'OPENAI_API_KEY');
  console.log('LocalStorage OPENAI_API_KEY:', !!openaiVar);
}

// Test LocalDevAPI
async function testLocalDevAPI() {
  try {
    const { LocalDevAPI } = await import('/src/services/localDevAPI.ts');
    console.log('Should use mock API:', LocalDevAPI.shouldUseMockAPI());
    
    const testResult = await LocalDevAPI.generateBlogPost({
      keyword: 'james bond',
      anchorText: 'movie reviews',
      targetUrl: 'https://example.com'
    });
    
    console.log('Mock API test result:', {
      success: testResult.success,
      contentLength: testResult.content?.length,
      isGeneric: testResult.content?.includes('Today\s digital landscape')
    });
  } catch (error) {
    console.error('Error testing LocalDevAPI:', error);
  }
}

// Test DirectOpenAI
async function testDirectOpenAI() {
  try {
    const { DirectOpenAIService } = await import('/src/services/directOpenAI.ts');
    
    console.log('Testing DirectOpenAI service...');
    const result = await DirectOpenAIService.generateBlogPost({
      keyword: 'james bond',
      anchorText: 'movie reviews',
      targetUrl: 'https://example.com'
    });
    
    console.log('DirectOpenAI test result:', {
      success: result.success,
      title: result.title,
      contentLength: result.content?.length,
      error: result.error
    });
  } catch (error) {
    console.error('Error testing DirectOpenAI:', error);
  }
}

// Run tests
testLocalDevAPI();
testDirectOpenAI();
