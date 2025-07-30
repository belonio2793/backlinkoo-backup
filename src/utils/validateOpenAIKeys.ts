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
      const errorData = await response.json().catch(() => ({}));
      return {
        key: apiKey,
        keyPreview,
        valid: false,
        error: `${response.status}: ${errorData.error?.message || 'Unknown error'}`
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
  const apiKeys = [
    import.meta.env.VITE_OPENAI_API_KEY,
    import.meta.env.VITE_OPENAI_API_KEY_BACKUP_1,
    import.meta.env.VITE_OPENAI_API_KEY_BACKUP_2
  ].filter(key => key && key !== 'your-openai-api-key-here');

  console.log(`🔍 Validating ${apiKeys.length} OpenAI API keys...`);

  const results = await Promise.all(
    apiKeys.map(key => validateOpenAIKey(key))
  );

  results.forEach((result, index) => {
    if (result.valid) {
      console.log(`✅ Key ${index + 1} (${result.keyPreview}): Valid - ${result.models?.length} GPT models available`);
    } else {
      console.error(`❌ Key ${index + 1} (${result.keyPreview}): Invalid - ${result.error}`);
    }
  });

  const validKeys = results.filter(r => r.valid);
  console.log(`📊 Summary: ${validKeys.length}/${results.length} keys are valid`);

  return results;
}
