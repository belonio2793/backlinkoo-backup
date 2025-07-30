/**
 * Immediate API Key Setup Utility
 * Sets the OpenAI API key in all required locations for immediate use
 */

const NEW_API_KEY = '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';

export function setupNewApiKey() {
  console.log('🔧 Setting up new OpenAI API key...');
  
  try {
    // 1. Update localStorage for admin environment variables
    const existingVars = localStorage.getItem('admin_env_vars');
    let vars = existingVars ? JSON.parse(existingVars) : [];
    
    // Remove any existing OpenAI key
    vars = vars.filter((v: any) => v.key !== 'VITE_OPENAI_API_KEY');
    
    // Add the new key
    vars.push({
      id: crypto.randomUUID(),
      key: 'VITE_OPENAI_API_KEY',
      value: NEW_API_KEY,
      description: 'OpenAI API key for AI content generation and blog creation',
      is_secret: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    localStorage.setItem('admin_env_vars', JSON.stringify(vars));
    console.log('✅ API key updated in localStorage');
    
    // 2. Verify the key format
    if (NEW_API_KEY.startsWith('sk-proj-') && NEW_API_KEY.length > 100) {
      console.log('✅ API key format validated');
    } else {
      console.warn('⚠️ API key format may be incorrect');
    }
    
    // 3. Check environment variable
    console.log('🔍 Environment variable status:');
    console.log('   VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
    
    console.log('🎉 API key setup completed!');
    console.log('🔑 Key preview:', NEW_API_KEY.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup API key:', error);
    return false;
  }
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  setupNewApiKey();
}
