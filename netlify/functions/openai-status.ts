import { Handler } from '@netlify/functions'

interface OpenAIStatusResponse {
  configured: boolean
  status: 'connected' | 'error' | 'not_configured'
  message: string
  responseTime: number
  modelCount?: number
  keyPreview?: string
  error?: string
}

const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const startTime = Date.now()

  try {
    // Check if API key is configured
    const hasApiKey = !!process.env.OPENAI_API_KEY
    const keyValid = hasApiKey && process.env.OPENAI_API_KEY!.startsWith('sk-')

    if (!keyValid) {
      const response: OpenAIStatusResponse = {
        configured: false,
        status: 'not_configured',
        message: 'OpenAI API key not configured or invalid',
        responseTime: Date.now() - startTime
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      }
    }

    // Test the actual API connection
    console.log('🔍 Testing OpenAI API connectivity via TypeScript function...')
    
    const apiResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - startTime

    if (apiResponse.ok) {
      const data = await apiResponse.json()
      const modelCount = data.data ? data.data.length : 0
      
      console.log(`✅ OpenAI API connected via TypeScript - ${modelCount} models available`)
      
      const response: OpenAIStatusResponse = {
        configured: true,
        status: 'connected',
        message: `OpenAI API connected - ${modelCount} models available`,
        responseTime,
        modelCount,
        keyPreview: process.env.OPENAI_API_KEY!.substring(0, 12) + '...'
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      }
    } else {
      const errorData = await apiResponse.text().catch(() => '')
      console.error('❌ OpenAI API error via TypeScript:', apiResponse.status, errorData)
      
      const response: OpenAIStatusResponse = {
        configured: true,
        status: 'error',
        message: `OpenAI API error: ${apiResponse.status} ${apiResponse.statusText}`,
        responseTime,
        error: errorData
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      }
    }

  } catch (error) {
    console.error('OpenAI TypeScript status check failed:', error)
    
    const response: OpenAIStatusResponse = {
      configured: !!process.env.OPENAI_API_KEY,
      status: 'error',
      message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    }
  }
}

export { handler }
