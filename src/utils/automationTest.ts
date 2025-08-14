import { getContentService } from '@/services/automationContentService';
import { getTelegraphService } from '@/services/telegraphService';
import { getOrchestrator } from '@/services/automationOrchestrator';

/**
 * Test the automation workflow components
 */
export class AutomationTest {
  
  /**
   * Test OpenAI content generation
   */
  static async testContentGeneration(): Promise<boolean> {
    try {
      const contentService = getContentService();
      
      // Test API connection first
      const isConnected = await contentService.validateConnection();
      if (!isConnected) {
        console.error('OpenAI API connection failed');
        return false;
      }

      console.log('✅ OpenAI API connection validated');
      return true;
    } catch (error) {
      console.error('Content generation test failed:', error);
      return false;
    }
  }

  /**
   * Test Telegraph API
   */
  static async testTelegraphApi(): Promise<boolean> {
    try {
      const telegraphService = getTelegraphService();
      
      // Test connection
      const isConnected = await telegraphService.testConnection();
      if (!isConnected) {
        console.error('Telegraph API connection failed');
        return false;
      }

      console.log('✅ Telegraph API connection validated');
      return true;
    } catch (error) {
      console.error('Telegraph API test failed:', error);
      return false;
    }
  }

  /**
   * Test database connection and schema
   */
  static async testDatabaseConnection(): Promise<boolean> {
    try {
      const orchestrator = getOrchestrator();
      
      // Try to fetch user campaigns (will test auth and DB connection)
      await orchestrator.getUserCampaigns();
      
      console.log('✅ Database connection validated');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Run all validation tests
   */
  static async runAllTests(): Promise<{
    contentGeneration: boolean;
    telegraphApi: boolean;
    databaseConnection: boolean;
    allPassed: boolean;
  }> {
    console.log('🧪 Running automation system validation tests...');
    
    const results = {
      contentGeneration: false,
      telegraphApi: false,
      databaseConnection: false,
      allPassed: false
    };

    // Test content generation
    results.contentGeneration = await this.testContentGeneration();
    
    // Test Telegraph API
    results.telegraphApi = await this.testTelegraphApi();
    
    // Test database connection
    results.databaseConnection = await this.testDatabaseConnection();
    
    // Check if all tests passed
    results.allPassed = results.contentGeneration && results.telegraphApi && results.databaseConnection;
    
    if (results.allPassed) {
      console.log('🎉 All automation system tests passed!');
    } else {
      console.log('❌ Some automation system tests failed. Check the logs above for details.');
    }
    
    return results;
  }

  /**
   * Test the content generation prompts
   */
  static testPrompts(keyword: string, anchorText: string, targetUrl: string): string[] {
    const prompts = [
      `Generate a 1000 word article on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}. Write in a professional, informative style with proper SEO optimization. Include an introduction, main body with multiple sections, and a conclusion. Make sure the anchor text "${anchorText}" appears naturally in the content and would logically link to the provided URL.`,
      
      `Write a 1000 word blog post about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}. Use a conversational, engaging tone suitable for blog readers. Include practical tips, insights, and actionable advice. Naturally incorporate the anchor text "${anchorText}" in a way that makes sense for linking to the target URL.`,
      
      `Produce a 1000-word reader friendly post on ${keyword} that links ${anchorText} to ${targetUrl}. Write in an accessible, easy-to-understand style with clear explanations. Break down complex concepts and include examples where helpful. Ensure the anchor text "${anchorText}" fits naturally within the content flow and provides value when linked to the target URL.`
    ];
    
    console.log('📝 Generated prompts for testing:', prompts);
    return prompts;
  }
}

// Export for use in components
export default AutomationTest;
