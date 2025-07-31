import { environmentVariablesService } from '@/services/environmentVariablesService';

export async function refreshAndTestApiKeys() {
  console.log('🔄 Forcing refresh of API keys from Supabase...');
  
  // Clear cache by resetting lastFetch
  (environmentVariablesService as any).lastFetch = 0;
  (environmentVariablesService as any).cache.clear();
  
  // Force refresh
  await (environmentVariablesService as any).refreshCache();
  
  // Test getting the API key
  const apiKey = await environmentVariablesService.getVariable('OPENAI_API_KEY');
  
  if (apiKey) {
    console.log('✅ API key successfully loaded from Supabase!');
    console.log('🔑 Key preview:', apiKey.substring(0, 15) + '...');
    
    // Test connection to OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI API connection successful!');
        console.log('📊 Available models:', data.data?.length || 0);
        return { success: true, apiKey, modelsCount: data.data?.length || 0 };
      } else {
        console.error('❌ OpenAI API connection failed:', response.status);
        return { success: false, error: `API returned ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Network error testing OpenAI:', error);
      return { success: false, error: 'Network error' };
    }
  } else {
    console.error('❌ No API key found in Supabase');
    return { success: false, error: 'No API key found' };
  }
}

// Auto-run when imported in browser
if (typeof window !== 'undefined') {
  refreshAndTestApiKeys().then(result => {
    if (result.success) {
      console.log('🎉 API key setup complete and tested!');
    } else {
      console.error('❌ API key setup failed:', result.error);
    }
  });
}
