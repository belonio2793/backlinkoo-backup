// Quick debug to check API key in various sources
console.log('🔍 Debugging API Key Sources:');
console.log('');
console.log('1. Environment Variable (import.meta.env):');
console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 15) + '...' || 'NOT SET');
console.log('');
console.log('2. LocalStorage admin configs:');
try {
  const adminConfig = localStorage.getItem('admin_api_configurations');
  if (adminConfig) {
    const configs = JSON.parse(adminConfig);
    const openaiConfig = configs.find(c => c.service === 'OpenAI');
    console.log('Admin OpenAI config:', openaiConfig ? openaiConfig.apiKey?.substring(0, 15) + '...' : 'NOT FOUND');
  } else {
    console.log('Admin config not found in localStorage');
  }
} catch (e) {
  console.log('Error reading admin config:', e.message);
}
console.log('');
console.log('3. LocalStorage permanent configs:');
try {
  const permanentConfigs = localStorage.getItem('permanent_api_configs');
  if (permanentConfigs) {
    const configs = JSON.parse(permanentConfigs);
    const openaiConfig = configs.find(c => c.service === 'OpenAI');
    console.log('Permanent OpenAI config:', openaiConfig ? openaiConfig.apiKey?.substring(0, 15) + '...' : 'NOT FOUND');
  } else {
    console.log('Permanent config not found in localStorage');
  }
} catch (e) {
  console.log('Error reading permanent config:', e.message);
}
console.log('');
console.log('4. Temp key in localStorage:');
const tempKey = localStorage.getItem('temp_openai_key');
console.log('Temp key:', tempKey ? tempKey.substring(0, 15) + '...' : 'NOT SET');
console.log('');
console.log('Expected key should end with: ...1PsA');
console.log('Current key seems to end with: ...yW2v');
