/**
 * Quick decoder to check current API key
 */

// The base64 encoded key from secure config
const encodedKey = 'c2stcHJvai15eEMyd09xQVhwN2ozZVZVRUhuMkR5a05TeFRFZnoyTDdtM001c2JBbDRXMUprRGEtaC1WaVNDTEkxcGZ2WXdfLWZ6NVlWNVVhalQzQmxia0ZKeDFIYVJjeHpVVGVXbFZlTnZsSC1uUkxkMkpOQTlpSHZsWjVrRDhybGdOWG9ZVUNFekdoT1VCdjAzNW12SElWWEV5aXhjdDRLTUE=';

function decodeBase64(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
}

// Decode and check the key
const decodedKey = decodeBase64(encodedKey);
console.log('🔑 Decoded API key:', decodedKey);
console.log('📏 Key length:', decodedKey.length);
console.log('✅ Starts with sk-:', decodedKey.startsWith('sk-'));
console.log('🎯 Key preview:', decodedKey.substring(0, 20) + '...');

// Check if it looks like a real OpenAI key format
const keyPattern = /^sk-proj-[A-Za-z0-9_-]{43}T3BlbkFJ[A-Za-z0-9_-]{20,}$/;
console.log('🔍 Matches OpenAI pattern:', keyPattern.test(decodedKey));

export { decodedKey };
