#!/usr/bin/env node

console.log('🧪 Testing AI system configuration...');

// Test environment variables
const requiredVars = [
  'VITE_OPENAI_API_KEY',
  'OPENAI_API_KEY', 
  'VITE_GROK_API_KEY',
  'GROK_API_KEY',
  'VITE_HF_ACCESS_TOKEN',
  'HF_ACCESS_TOKEN',
  'VITE_COHERE_API_KEY',
  'COHERE_API_KEY',
  'VITE_DEEPAI_API_KEY',
  'DEEPAI_API_KEY',
  'VITE_RYTR_API_KEY',
  'RYTR_API_KEY'
];

console.log('\n📋 Environment Variables Status:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const preview = value ? value.substring(0, 8) + '...' : 'Not set';
  console.log(`  ${status} ${varName}: ${preview}`);
}

// Test OpenAI API key format
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  const isValidFormat = openaiKey.startsWith('sk-proj-') && openaiKey.length > 50;
  console.log(`\n🔑 OpenAI Key Format: ${isValidFormat ? '✅ Valid' : '❌ Invalid'}`);
}

console.log('\n✅ AI Configuration Test Complete');
