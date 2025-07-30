/**
 * API Key Validation Utility
 */

export function decodeBase64(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return encoded; // Return as-is if not base64
  }
}

export function validateOpenAIKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // OpenAI keys should start with 'sk-' and be at least 20 characters
  return key.startsWith('sk-') && key.length >= 20;
}

export async function testOpenAIKey(key: string): Promise<{ valid: boolean; error?: string }> {
  if (!validateOpenAIKey(key)) {
    return { valid: false, error: 'Invalid key format' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else {
      const errorData = await response.text();
      return { 
        valid: false, 
        error: `HTTP ${response.status}: ${errorData.substring(0, 100)}` 
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
