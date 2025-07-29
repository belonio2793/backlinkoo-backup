// Test script to verify API tokens are working
import { huggingFaceService } from './src/services/api/huggingface.js';
import { cohereService } from './src/services/api/cohere.js';

async function testHuggingFace() {
  console.log('🧪 Testing HuggingFace API...');
  
  try {
    const result = await huggingFaceService.generateText('Write a short paragraph about AI', {
      model: 'microsoft/DialoGPT-large',
      maxLength: 100,
      temperature: 0.7
    });
    
    console.log('✅ HuggingFace Test Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ HuggingFace Test Failed:', error);
    return false;
  }
}

async function testCohere() {
  console.log('🧪 Testing Cohere API...');
  
  try {
    const result = await cohereService.generateText('Write a short paragraph about technology', {
      model: 'command',
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log('✅ Cohere Test Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Cohere Test Failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API token tests...\n');
  
  const hfResult = await testHuggingFace();
  console.log('\n');
  
  const cohereResult = await testCohere();
  console.log('\n');
  
  console.log('📊 Test Summary:');
  console.log(`HuggingFace: ${hfResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`Cohere: ${cohereResult ? '✅ Working' : '❌ Failed'}`);
  
  if (hfResult || cohereResult) {
    console.log('\n🎉 At least one API is working! Content generation should succeed.');
  } else {
    console.log('\n⚠️ No APIs are working. Will fall back to template generation.');
  }
}

runTests();
