/**
 * Test Client Telegraph Publisher
 * Quick test to verify client-side Telegraph publishing works
 */

import { ClientTelegraphPublisher } from '../services/clientTelegraphPublisher';

export async function testClientTelegraphPublisher(): Promise<void> {
  console.log('🧪 Testing client-side Telegraph publisher...');
  
  const testContent = `# Test Article: Go High Level Marketing

This is a comprehensive test article about go high level marketing strategies.

## Introduction

Go high level marketing represents a sophisticated approach to digital marketing that encompasses multiple channels and strategies.

## Key Benefits

When implementing go high level strategies, businesses typically see:

- Increased lead generation
- Better customer retention  
- Higher conversion rates
- Improved ROI

## Getting Started

To begin with go high level marketing, consider using [powerful marketing platform](https://example.com) for comprehensive automation and management.

## Best Practices

1. **Start with clear objectives**
2. **Implement tracking and analytics**
3. **Focus on customer experience**
4. **Continuously optimize campaigns**

## Conclusion

Go high level marketing offers tremendous potential for businesses ready to invest in comprehensive strategies and tools.`;

  try {
    const result = await ClientTelegraphPublisher.publishArticle({
      title: 'Test Article: Go High Level Marketing Strategies',
      content: testContent,
      author_name: 'Test Publisher',
      user_id: 'test-user'
    });
    
    if (result.success) {
      console.log('✅ Client-side Telegraph publishing SUCCESSFUL!');
      console.log(`📄 Published: "${result.title}"`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`📊 Views: ${result.views || 'N/A'}`);
      console.log(`📝 Path: ${result.path}`);
      
      if (result.warning) {
        console.log(`⚠️ Warning: ${result.warning}`);
      }
      
      // Test content validation
      const validation = ClientTelegraphPublisher.validateContent(
        'Test Article Title',
        testContent
      );
      
      console.log(`✅ Content validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
      if (!validation.valid) {
        console.log('❌ Validation issues:', validation.issues);
      }
      
      console.log('🎉 Client-side Telegraph publisher is working perfectly!');
      
      return;
    } else {
      console.error('❌ Client-side Telegraph publishing failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testClientTelegraphPublisher = testClientTelegraphPublisher;
  console.log('🔧 Client Telegraph test available: window.testClientTelegraphPublisher()');
}

export default testClientTelegraphPublisher;
