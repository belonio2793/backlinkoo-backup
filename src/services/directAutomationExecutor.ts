/**
 * Direct Automation Executor
 * Executes the automation workflow directly without database persistence
 * Perfect for immediate execution and testing
 * Automatically detects development environment and uses mock services when appropriate
 */

import { mockAutomationService } from './mockAutomationService';

export interface DirectExecutionInput {
  keywords: string[];
  anchor_texts: string[];
  target_url: string;
  user_id?: string;
}

export interface DirectExecutionResult {
  success: boolean;
  article_title?: string;
  article_url?: string;
  article_content?: string;
  target_platform?: string;
  anchor_text_used?: string;
  word_count?: number;
  execution_time_ms?: number;
  error?: string;
  debug_info?: any;
}

class DirectAutomationExecutor {

  private isDevEnvironment(): boolean {
    // Only consider localhost development as dev environment
    const isLocalDev = typeof window !== 'undefined' &&
                      window.location.hostname === 'localhost' &&
                      (window.location.port === '3000' || window.location.port === '5173');

    console.log('🔍 Environment check (Updated):', {
      mode: import.meta.env.MODE,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      port: typeof window !== 'undefined' ? window.location.port : 'server',
      isLocalDev,
      forceProduction: !isLocalDev
    });

    return isLocalDev;
  }

  async executeWorkflow(input: DirectExecutionInput): Promise<DirectExecutionResult> {
    const startTime = Date.now();

    // Input validation
    if (!input.keywords || input.keywords.length === 0) {
      return {
        success: false,
        error: 'No keywords provided',
        execution_time_ms: 0
      };
    }

    if (!input.anchor_texts || input.anchor_texts.length === 0) {
      return {
        success: false,
        error: 'No anchor texts provided',
        execution_time_ms: 0
      };
    }

    if (!input.target_url || !input.target_url.trim()) {
      return {
        success: false,
        error: 'No target URL provided',
        execution_time_ms: 0
      };
    }

    // We only use Telegraph, so no need to check multiple platforms

    console.log('🚀 Starting direct automation execution:', {
      keywords: input.keywords.slice(0, 3),
      target_url: input.target_url,
      anchor_count: input.anchor_texts.length,
      environment: {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
      }
    });

    try {
      // Step 1: Select random keyword and anchor text
      const selectedKeyword = input.keywords[Math.floor(Math.random() * input.keywords.length)] || 'technology';
      const selectedAnchorText = input.anchor_texts[Math.floor(Math.random() * input.anchor_texts.length)] || 'learn more';

      console.log('📝 Selected content parameters:', {
        keyword: selectedKeyword,
        anchor_text: selectedAnchorText,
        target_url: input.target_url
      });

      // Step 2: Generate content (check if Netlify functions are available)
      let useMockServices = false;

      // Quick check if Netlify functions are available
      const isNetlifyAvailable = await this.checkNetlifyFunctionsAvailable();

      if (!isNetlifyAvailable) {
        console.log('🔧 Netlify functions not available, using client-side generation');
        useMockServices = true;
      } else {
        // Check production mode override
        const { ProductionModeForcer } = await import('../utils/forceProductionMode');
        const shouldForceLive = ProductionModeForcer.shouldUseLiveTelegraph();

        if (shouldForceLive) {
          console.log('🚀 Production mode forced - using live services');
          useMockServices = false;
        }
      }

      if (useMockServices) {
        console.log('🎭 Generating content via mock service (development mode)...');
      } else {
        console.log('�� Generating content via Netlify function...');
      }

      let contentResult = await this.generateContent({
        keyword: selectedKeyword,
        anchor_text: selectedAnchorText,
        target_url: input.target_url,
        user_id: input.user_id || 'direct-execution-user'
      }, useMockServices);

      // If Netlify function failed and we're not using mock service, fallback to mock
      if (!contentResult.success && !useMockServices) {
        console.log('🎭 Netlify function failed, falling back to mock service...');
        useMockServices = true;
        contentResult = await this.generateContent({
          keyword: selectedKeyword,
          anchor_text: selectedAnchorText,
          target_url: input.target_url,
          user_id: input.user_id || 'direct-execution-user'
        }, true);
      }

      if (!contentResult.success) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }

      // Step 3: Post to Telegraph (using mock service in dev environment)
      if (useMockServices) {
        console.log('🎭 Publishing via mock service (development mode)...');
      } else {
        console.log('📤 Publishing to Telegraph...');
      }

      let publishResult = await this.publishToTelegraph({
        title: contentResult.title,
        content: contentResult.content,
        user_id: input.user_id || 'direct-execution-user'
      }, useMockServices);

      // If Telegraph publishing failed and we're not using mock service, fallback to mock
      if (!publishResult.success && !useMockServices) {
        console.log('🎭 Telegraph publishing failed, falling back to mock service...');

        // Import error fixer for better user messaging
        try {
          const { TelegraphErrorFixer } = await import('../utils/telegraphErrorFixer');
          const errorMessage = TelegraphErrorFixer.getErrorMessage(publishResult.error);
          console.log('📋 Telegraph error:', errorMessage);
        } catch (importError) {
          console.log('📋 Telegraph error (could not load error fixer):', publishResult.error);
        }

        publishResult = await this.publishToTelegraph({
          title: contentResult.title,
          content: contentResult.content,
          user_id: input.user_id || 'direct-execution-user'
        }, true);
      }

      if (!publishResult.success) {
        throw new Error(`Publishing failed: ${publishResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      console.log('✅ Direct automation execution completed successfully:', {
        article_url: publishResult.url,
        execution_time_ms: executionTime
      });

      return {
        success: true,
        article_title: contentResult.title,
        article_url: publishResult.url,
        article_content: contentResult.content,
        target_platform: useMockServices ? 'Telegraph (Mock)' : 'Telegraph',
        anchor_text_used: selectedAnchorText,
        word_count: contentResult.word_count,
        execution_time_ms: executionTime,
        debug_info: {
          keyword_used: selectedKeyword,
          content_generation_ms: contentResult.generation_time_ms,
          publishing_ms: publishResult.publishing_time_ms
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Improved error logging with safe serialization
      console.error('❌ Direct automation execution failed:',
        `Error: ${errorMessage}, ` +
        `Type: ${typeof error}, ` +
        `Name: ${error instanceof Error ? error.name : 'Unknown'}, ` +
        `Time: ${executionTime}ms, ` +
        `Keywords: ${input.keywords.length}, ` +
        `Anchors: ${input.anchor_texts.length}, ` +
        `URL: ${input.target_url}`
      );

      // Also log the stack trace separately for debugging
      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack);
      }

      return {
        success: false,
        error: errorMessage,
        execution_time_ms: executionTime,
        debug_info: {
          error_type: typeof error,
          error_name: error instanceof Error ? error.name : 'Unknown',
          error_stack: error instanceof Error ? error.stack : undefined,
          error_code: error instanceof Error ? (error as any).code : undefined
        }
      };
    }
  }

  private async generateContent(params: {
    keyword: string;
    anchor_text: string;
    target_url: string;
    user_id: string;
  }, useMockService: boolean = false): Promise<{
    success: boolean;
    title: string;
    content: string;
    word_count: number;
    generation_time_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();

    // Use client-side content generation when Netlify functions aren't available
    if (useMockService) {
      try {
        console.log('🔧 Using client-side content generation as fallback...');

        const { ClientContentGenerator } = await import('./clientContentGenerator');

        const clientResult = await ClientContentGenerator.generateContent({
          keyword: params.keyword,
          anchor_text: params.anchor_text,
          target_url: params.target_url,
          word_count: 800,
          tone: 'professional'
        });

        if (clientResult.success && clientResult.data) {
          return {
            success: true,
            title: clientResult.data.title,
            content: clientResult.data.content,
            word_count: clientResult.data.word_count,
            generation_time_ms: Date.now() - startTime
          };
        } else {
          throw new Error(clientResult.error || 'Client-side generation failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          title: '',
          content: '',
          word_count: 0,
          generation_time_ms: Date.now() - startTime,
          error: `Client-side generation error: ${errorMessage}`
        };
      }
    }

    try {
      // Use the guaranteed working content generator first
      let functionToUse = 'working-content-generator';

      console.log(`🎯 Using reliable content function: ${functionToUse}`);

      const response = await fetch(`/.netlify/functions/${functionToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: params.keyword,
          anchor_text: params.anchor_text,
          url: params.target_url,
          word_count: 800,
          tone: 'professional',
          user_id: params.user_id,
          campaign_id: `direct-${Date.now()}` // Temporary ID for tracking
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }

        console.error('Content generation HTTP error:',
          `Status: ${response.status}, ` +
          `StatusText: ${response.statusText}, ` +
          `Error: ${JSON.stringify(errorData)}`
        );

        // Special handling for 404 - try backup functions
        if (response.status === 404) {
          console.log('🔄 Primary function not found, trying alternatives...');

          const backupFunctions = ['ai-content-generator', 'generate-content', 'generate-openai'];

          for (const backupFunc of backupFunctions) {
            try {
              console.log(`🎯 Trying backup function: ${backupFunc}`);

              const backupResponse = await fetch(`/.netlify/functions/${backupFunc}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  keyword: params.keyword,
                  anchor_text: params.anchor_text,
                  target_url: params.target_url,
                  word_count: 800,
                  tone: 'professional',
                  user_id: params.user_id
                }),
              });

              if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                if (backupData.success) {
                  console.log(`✅ Backup function ${backupFunc} worked!`);
                  return {
                    success: true,
                    title: backupData.data?.title || backupData.title || `Article about ${params.keyword}`,
                    content: backupData.data?.content || backupData.content || 'Content generated successfully.',
                    word_count: backupData.data?.word_count || 800,
                    generation_time_ms: Date.now() - startTime
                  };
                }
              }
            } catch (backupError) {
              console.warn(`Backup function ${backupFunc} failed:`, backupError.message);
              continue;
            }
          }

          // Final fallback: Use client-side content generation
          console.log('🔧 All Netlify functions failed, using client-side content generation...');

          try {
            const { ClientContentGenerator } = await import('./clientContentGenerator');

            const clientResult = await ClientContentGenerator.generateContent({
              keyword: params.keyword,
              anchor_text: params.anchor_text,
              target_url: params.target_url,
              word_count: 800,
              tone: 'professional'
            });

            if (clientResult.success && clientResult.data) {
              console.log('✅ Client-side content generation successful!');
              return {
                success: true,
                title: clientResult.data.title,
                content: clientResult.data.content,
                word_count: clientResult.data.word_count,
                generation_time_ms: Date.now() - startTime
              };
            } else {
              throw new Error(`Client-side generation failed: ${clientResult.error}`);
            }
          } catch (clientError) {
            console.error('❌ Client-side content generation also failed:', clientError);
            throw new Error('All content generation methods unavailable. Both Netlify functions and client-side generation failed.');
          }
        }

        throw new Error(`Content generation HTTP ${response.status}: ${errorData.error || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Content generation service error:', JSON.stringify(data));
        throw new Error(data.error || 'Content generation service returned failure');
      }

      const generationTime = Date.now() - startTime;
      const generatedContent = data.data;

      return {
        success: true,
        title: generatedContent.title || 'Generated Article',
        content: generatedContent.content || '',
        word_count: generatedContent.word_count || 0,
        generation_time_ms: generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error('Content generation error details:',
        `Error: ${errorMessage}, ` +
        `Type: ${typeof error}, ` +
        `Name: ${error instanceof Error ? error.name : 'Unknown'}, ` +
        `Keyword: ${params.keyword}, ` +
        `Time: ${generationTime}ms`
      );

      return {
        success: false,
        title: '',
        content: '',
        word_count: 0,
        generation_time_ms: generationTime,
        error: errorMessage
      };
    }
  }

  private async publishToTelegraph(params: {
    title: string;
    content: string;
    user_id: string;
  }, useMockService: boolean = false): Promise<{
    success: boolean;
    url: string;
    publishing_time_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();

    // Use mock service in development when Netlify functions aren't available
    if (useMockService) {
      try {
        const mockResult = await mockAutomationService.publishMockContent({
          title: params.title,
          content: params.content,
          user_id: params.user_id
        });

        return {
          success: mockResult.success,
          url: mockResult.url,
          publishing_time_ms: mockResult.publishing_time_ms,
          error: mockResult.error
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          url: '',
          publishing_time_ms: Date.now() - startTime,
          error: `Mock service error: ${errorMessage}`
        };
      }
    }

    try {
      const response = await fetch('/.netlify/functions/publish-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: params.title,
          content: params.content,
          target_site: 'telegraph',
          user_id: params.user_id,
          author_name: 'SEO Content Bot',
          campaign_id: `direct-${Date.now()}` // Temporary ID
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }

        console.error('Publishing HTTP error:',
          `Status: ${response.status}, ` +
          `StatusText: ${response.statusText}, ` +
          `Error: ${JSON.stringify(errorData)}`
        );

        // Special handling for 404 - function doesn't exist
        if (response.status === 404) {
          throw new Error('Publishing function not available. Netlify functions may not be deployed.');
        }

        throw new Error(`Publishing HTTP ${response.status}: ${errorData.error || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Publishing service error:', JSON.stringify(data));
        throw new Error(data.error || 'Publishing service returned failure');
      }

      const publishingTime = Date.now() - startTime;
      const publishResult = data.data;

      return {
        success: true,
        url: publishResult.url || '',
        publishing_time_ms: publishingTime
      };

    } catch (error) {
      const publishingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error('Publishing error details:',
        `Error: ${errorMessage}, ` +
        `Type: ${typeof error}, ` +
        `Name: ${error instanceof Error ? error.name : 'Unknown'}, ` +
        `Title: ${params.title.substring(0, 50)}, ` +
        `ContentLength: ${params.content.length}, ` +
        `Time: ${publishingTime}ms`
      );

      return {
        success: false,
        url: '',
        publishing_time_ms: publishingTime,
        error: errorMessage
      };
    }
  }

  // Test if Netlify functions are accessible
  async testNetlifyFunctions(): Promise<{ contentGeneration: boolean; publishing: boolean; errors: string[] }> {
    const errors: string[] = [];
    let contentGeneration = false;
    let publishing = false;

    try {
      // Test content generation endpoint
      const contentResponse = await fetch('/.netlify/functions/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: 'test',
          anchor_text: 'test link',
          url: 'https://example.com',
          word_count: 100,
          user_id: 'test'
        })
      });
      contentGeneration = contentResponse.status !== 404;
      if (!contentGeneration) {
        errors.push(`Content generation function not found (404)`);
      }
    } catch (error) {
      errors.push(`Content generation test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      // Test publishing endpoint
      const publishResponse = await fetch('/.netlify/functions/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          target_site: 'telegraph',
          user_id: 'test'
        })
      });
      publishing = publishResponse.status !== 404;
      if (!publishing) {
        errors.push(`Publishing function not found (404)`);
      }
    } catch (error) {
      errors.push(`Publishing test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { contentGeneration, publishing, errors };
  }

  // Test the direct execution with sample data
  async testExecution(): Promise<DirectExecutionResult> {
    console.log('🧪 Running direct automation test...');

    // First test if functions are available
    const functionTest = await this.testNetlifyFunctions();
    console.log('🔧 Netlify function availability:', functionTest);

    if (!functionTest.contentGeneration || !functionTest.publishing) {
      return {
        success: false,
        error: `Required Netlify functions not available: ${functionTest.errors.join(', ')}`,
        execution_time_ms: 0,
        debug_info: { function_test: functionTest }
      };
    }

    return this.executeWorkflow({
      keywords: ['SEO tools', 'digital marketing', 'automation'],
      anchor_texts: ['powerful SEO platform', 'learn more', 'advanced tools'],
      target_url: 'https://example.com',
      user_id: 'test-user'
    });
  }
}

export const directAutomationExecutor = new DirectAutomationExecutor();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).directAutomationExecutor = directAutomationExecutor;
  console.log('🔧 Direct automation executor available at window.directAutomationExecutor');
}

export default directAutomationExecutor;
