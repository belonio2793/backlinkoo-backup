# OpenAI Content Generation Reference

This document provides a reference for using OpenAI API in the backlinkoo.com content generation system. The implementation now uses only OpenAI for content generation.

## Quick Start

### Environment Variables Setup

Add this environment variable to your `.env` file:

```bash
# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Basic Usage

```typescript
import { openAIService } from '@/services/api/openai';

// Generate blog content using OpenAI
const result = await openAIService.generateContent(
  'Write a comprehensive blog post about digital marketing...',
  {
    model: 'gpt-4',
    maxTokens: 3000,
    temperature: 0.7
  }
);

console.log(result.content);
```

## OpenAI Configuration

The system is configured to use OpenAI's GPT-4 model with:
- Automatic retry logic on failures
- Rate limit handling
- Error recovery mechanisms
- Content validation

## Features

- **Retry Logic**: Automatic retries on rate limits and server errors
- **Quality Validation**: Content length and keyword validation
- **Cost Tracking**: Token usage and cost estimation
- **Error Handling**: Comprehensive error messages and fallbacks

## Support

Only OpenAI is supported for content generation. All other AI providers have been removed from the system.
