/**
 * Quick utility to set up the OpenAI API key in all required places
 */

const API_KEY = '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';

export function setupOpenAIApiKey() {
  console.log('🔧 Setting up OpenAI API key in all locations...');
  
  try {
    // 1. Set in localStorage for admin environment variables
    const existingVars = localStorage.getItem('admin_env_vars');
    let vars = existingVars ? JSON.parse(existingVars) : [];
    
    // Remove any existing OpenAI key
    vars = vars.filter((v: any) => v.key !== 'VITE_OPENAI_API_KEY');
    
    // Add the new key
    vars.push({
      id: crypto.randomUUID(),
      key: 'VITE_OPENAI_API_KEY',
      value: API_KEY,
      description: 'OpenAI API key for AI content generation',
      is_secret: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    localStorage.setItem('admin_env_vars', JSON.stringify(vars));
    console.log('✅ API key set in localStorage');
    
    // 2. Verify environment variable is set
    console.log('🔍 Environment variable check:');
    console.log('   import.meta.env.VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
    
    // 3. Test API key format
    if (API_KEY.startsWith('sk-proj-') && API_KEY.length > 100) {
      console.log('✅ API key format looks correct');
    } else {
      console.warn('⚠️ API key format may be incorrect');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup API key:', error);
    return false;
  }
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  setupOpenAIApiKey();
}
