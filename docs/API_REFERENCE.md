# Multi-API Content Generation Reference

This document provides a comprehensive reference for using multiple AI APIs in the backlinkoo.com content generation system. The implementation supports OpenAI, xAI Grok, DeepAI, Hugging Face, Cohere, and Rytr APIs.

## Quick Start

### Environment Variables Setup

Add these environment variables to your `.env` file:

```bash
# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key
OPENAI_API_KEY=your_openai_api_key

# xAI Grok API  
VITE_GROK_API_KEY=your_grok_api_key
GROK_API_KEY=your_grok_api_key

# DeepAI API
VITE_DEEPAI_API_KEY=your_deepai_api_key
DEEPAI_API_KEY=your_deepai_api_key

# Hugging Face API
VITE_HF_ACCESS_TOKEN=your_huggingface_token
HF_ACCESS_TOKEN=your_huggingface_token

# Cohere API
VITE_COHERE_API_KEY=your_cohere_api_key
COHERE_API_KEY=your_cohere_api_key

# Rytr API
VITE_RYTR_API_KEY=your_rytr_api_key
RYTR_API_KEY=your_rytr_api_key
```

### Basic Usage

```typescript
import { multiApiContentGenerator } from '@/services/multiApiContentGenerator';

// Generate blog content using multiple APIs
const result = await multiApiContentGenerator.generateBlogContent(
  'digital marketing',
  'https://example.com',
  'best digital marketing tools'
);

console.log(result.bestResponse?.content);
```

## API Configurations

### 1. OpenAI API
- **Base URL**: `https://api.openai.com/v1`
- **Model**: `gpt-4o`
- **Endpoint**: `/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Rate Limits**: Varies by plan
- **Documentation**: [OpenAI Platform Docs](https://platform.openai.com/docs)

**Example Response Structure:**
```json
{
  "choices": [
    {
      "message": {
        "content": "Generated content here..."
      }
    }
  ]
}
```

### 2. xAI Grok API
- **Base URL**: `https://api.x.ai/v1`
- **Model**: `grok-beta`
- **Endpoint**: `/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Compatible**: OpenAI SDK compatible
- **Documentation**: [xAI API Docs](https://docs.x.ai)

**Example Request:**
```json
{
  "model": "grok-beta",
  "messages": [
    {
      "role": "user", 
      "content": "Your prompt here"
    }
  ]
}
```

### 3. DeepAI API
- **Base URL**: `https://api.deepai.org/api`
- **Endpoint**: `/text-generator`
- **Authentication**: api-key header
- **Format**: URLSearchParams for body
- **Documentation**: [DeepAI Docs](https://deepai.org/docs)

**Example Request:**
```javascript
const body = new URLSearchParams({ text: 'Your prompt here' });
```

### 4. Hugging Face API
- **Base URL**: `https://router.huggingface.co/v1`
- **Model**: `meta-llama/Llama-3.1-8B-Instruct`
- **Endpoint**: `/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Documentation**: [Hugging Face Docs](https://huggingface.co/docs)

### 5. Cohere API
- **Base URL**: `https://api.cohere.ai/v1`
- **Endpoint**: `/chat`
- **Authentication**: Bearer token in Authorization header
- **Documentation**: [Cohere Docs](https://docs.cohere.com)

**Example Request:**
```json
{
  "message": "Your prompt here"
}
```

### 6. Rytr API
- **Base URL**: `https://api.rytr.me/v1`
- **Endpoint**: `/contents`
- **Authentication**: Bearer token in Authorization header
- **Use Case**: `blog-idea`
- **Documentation**: [Rytr API Docs](https://rytr.me/api-docs)

**Example Request:**
```json
{
  "useCaseId": "blog-idea",
  "input": {"topic": "Your topic here"},
  "toneId": "formal",
  "languageId": "en"
}
```

## Service Methods

### `generateContent(request: ContentGenerationRequest)`

Generates content from multiple API providers concurrently.

**Parameters:**
- `prompt`: The content generation prompt
- `providers?`: Array of provider names to use (optional)
- `maxConcurrent?`: Maximum concurrent requests (default: 3)

**Returns:** `ContentGenerationResult`

```typescript
const result = await multiApiContentGenerator.generateContent({
  prompt: 'Write about AI in content creation',
  providers: ['openai', 'grok'],
  maxConcurrent: 2
});
```

### `generateBlogContent(keyword, targetUrl, anchorText)`

Specialized method for SEO blog content generation.

```typescript
const result = await multiApiContentGenerator.generateBlogContent(
  'SEO strategies',
  'https://example.com',
  'best SEO tools'
);
```

### `getAvailableProviders()`

Returns list of configured API providers with availability status.

```typescript
const providers = await multiApiContentGenerator.getAvailableProviders();
```

### `testProviders()`

Tests connectivity to all configured API providers.

```typescript
const status = await multiApiContentGenerator.testProviders();
```

## Response Interfaces

### ApiResponse
```typescript
interface ApiResponse {
  provider: string;      // Provider name (e.g., "OpenAI")
  content: string;       // Generated content
  success: boolean;      // Whether the request succeeded
  error?: string;        // Error message if failed
  processingTime: number; // Time taken in milliseconds
}
```

### ContentGenerationResult
```typescript
interface ContentGenerationResult {
  success: boolean;           // Overall success status
  responses: ApiResponse[];   // All provider responses
  bestResponse?: ApiResponse; // Best response (longest content)
  aggregatedContent?: string; // Combined content
  processingTime: number;     // Total processing time
}
```

## Integration with Existing System

The multi-API service is integrated into the existing `aiTestWorkflow`:

1. **Priority**: Multi-API generation is attempted first
2. **Fallback**: Falls back to existing global blog generator if needed
3. **Metadata**: Includes provider information in blog metadata
4. **Error Handling**: Graceful degradation if providers fail

## Error Handling

The service handles various error conditions:

- **Missing API Keys**: Skips providers without configured keys
- **Rate Limits**: Returns error information for debugging
- **Network Issues**: Includes timeout and retry logic
- **Invalid Responses**: Validates response format

## Rate Limit Management

- **Concurrent Limits**: Default maximum of 3 concurrent requests
- **Provider Selection**: Automatically skips unavailable providers
- **Fallback Logic**: Uses working providers when others fail

## Best Practices

1. **API Key Security**: Store keys in environment variables, never in code
2. **Error Monitoring**: Log provider failures for debugging
3. **Content Quality**: Review generated content before publishing
4. **Rate Limits**: Monitor API usage to avoid exceeding limits
5. **Fallback Strategy**: Always have backup content generation methods

## Troubleshooting

### Common Issues

**API Key Not Working:**
- Verify key is correct and has proper permissions
- Check if key is expired or has usage limits
- Ensure environment variable names match exactly

**Provider Not Responding:**
- Check provider status pages for outages
- Verify network connectivity
- Review rate limit status

**Content Quality Issues:**
- Adjust prompts for better results
- Try different provider combinations
- Review generated content for accuracy

### Debug Information

Enable debug logging to see detailed information:

```typescript
// The service automatically logs to console
console.log('🚀 Multi-API Content Generation:', {
  requested: providers,
  available: availableProviders,
  prompt: prompt.substring(0, 50) + '...'
});
```

## Usage Examples

### Generate Blog Ideas
```typescript
const ideas = await multiApiContentGenerator.generateContent({
  prompt: 'Generate 3 blog post ideas about sustainable technology',
  providers: ['openai', 'cohere', 'grok']
});

ideas.responses.forEach(response => {
  if (response.success) {
    console.log(`${response.provider}: ${response.content}`);
  }
});
```

### SEO-Optimized Blog Post
```typescript
const blogPost = await multiApiContentGenerator.generateBlogContent(
  'artificial intelligence',
  'https://mysite.com/ai-services',
  'cutting-edge AI solutions'
);

if (blogPost.success) {
  console.log('Best content from:', blogPost.bestResponse?.provider);
  console.log('Content length:', blogPost.bestResponse?.content.length);
}
```

### Test All Providers
```typescript
const status = await multiApiContentGenerator.testProviders();

Object.entries(status).forEach(([provider, info]) => {
  console.log(`${provider}: ${info.available ? '✅' : '❌'} ${info.error || ''}`);
});
```

## Support

For issues with specific API providers, consult their documentation:
- [OpenAI Support](https://help.openai.com/)
- [xAI Documentation](https://docs.x.ai)
- [DeepAI Support](https://deepai.org/contact)
- [Hugging Face Community](https://huggingface.co/support)
- [Cohere Support](https://docs.cohere.com/support)
- [Rytr Help](https://rytr.me/help)

For implementation questions, check the service code at `src/services/multiApiContentGenerator.ts`.
