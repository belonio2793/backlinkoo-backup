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
