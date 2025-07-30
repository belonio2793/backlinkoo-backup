/**
 * Utility to validate OpenAI API keys
 */

interface KeyValidationResult {
  key: string;
  keyPreview: string;
  valid: boolean;
  error?: string;
  models?: string[];
}

export async function validateOpenAIKey(apiKey: string): Promise<KeyValidationResult> {
  const keyPreview = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      console.error(`API Key validation failed for ${keyPreview}:`);
      console.error('Status:', response.status);
      console.error('Error details:', JSON.stringify(errorData, null, 2));

      return {
        key: apiKey,
        keyPreview,
        valid: false,
        error: `${response.status}: ${errorData.error?.message || errorText || 'Unknown error'}`
      };
    }

    const data = await response.json();
    const models = data.data?.map((model: any) => model.id) || [];
    
    return {
      key: apiKey,
      keyPreview,
      valid: true,
      models: models.filter((model: string) => model.includes('gpt'))
    };

  } catch (error) {
    return {
      key: apiKey,
      keyPreview,
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function validateAllOpenAIKeys(): Promise<KeyValidationResult[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.log('🚨 No OpenAI API key configured');
    return [];
  }

  console.log('🔍 Validating OpenAI API key...');

  const result = await validateOpenAIKey(apiKey);

  if (result.valid) {
    console.log(`✅ API Key (${result.keyPreview}): Valid - ${result.models?.length} GPT models available`);
  } else {
    console.error(`❌ API Key (${result.keyPreview}): Invalid - ${result.error}`);
  }

  return [result];
}
