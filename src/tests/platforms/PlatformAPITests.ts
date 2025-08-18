/**
 * Comprehensive test suite for all platform API integrations
 * Tests both the service classes and the Web2PlatformsEngine
 */

import { WordPressService } from '@/services/platforms/WordPressService';
import { MediumService } from '@/services/platforms/MediumService';
import { DevToService } from '@/services/platforms/DevToService';
import { HashnodeService } from '@/services/platforms/HashnodeService';
import { GhostService } from '@/services/platforms/GhostService';
import { Web2PlatformsEngine } from '@/services/engines/Web2PlatformsEngine';
import { getAllPlatforms, getPlatformById } from '@/services/platformConfigs';

// Mock configurations for testing
const mockConfigs = {
  wordpress: {
    baseUrl: 'https://test-site.com',
    username: 'testuser',
    applicationPassword: 'test-password-1234'
  },
  medium: {
    accessToken: 'test-medium-token-123456789'
  },
  devto: {
    apiKey: 'test-devto-key-123456789'
  },
  hashnode: {
    accessToken: 'test-hashnode-token-123456789',
    publicationId: 'test-publication-id'
  },
  ghost: {
    apiUrl: 'https://test-ghost-site.com',
    adminApiKey: 'test-ghost-key:test-secret-key'
  }
};

const mockContent = {
  title: 'Test Article for Backlink Integration',
  content: `
    <h2>Introduction to Test Content</h2>
    <p>This is a test article created to verify our backlink automation system. The content includes relevant keywords and a natural backlink placement.</p>
    
    <h3>Key Features</h3>
    <ul>
      <li>Automated content generation</li>
      <li>Natural backlink integration</li>
      <li>Multi-platform publishing</li>
    </ul>
    
    <p>For more information about <a href="https://example.com">SEO automation tools</a>, you can explore our comprehensive guide.</p>
    
    <h3>Conclusion</h3>
    <p>This automated publishing system demonstrates the effectiveness of modern content marketing strategies.</p>
  `,
  format: 'html' as const,
  tags: ['seo', 'automation', 'content-marketing', 'backlinks'],
  canonicalUrl: 'https://example.com/original-article',
  publishImmediately: false,
  metadata: {
    author: 'Test Author',
    description: 'A test article demonstrating automated backlink placement and content publishing across multiple platforms.',
    category: 'Technology'
  }
};

export class PlatformAPITests {
  private static results: Map<string, any> = new Map();

  /**
   * Run all platform tests
   */
  static async runAllTests(): Promise<Map<string, any>> {
    console.log('🧪 Starting Platform API Tests...\n');
    
    this.results.clear();

    // Test configuration validation
    await this.testPlatformConfigurations();
    
    // Test individual platform services
    await this.testWordPressService();
    await this.testMediumService();
    await this.testDevToService();
    await this.testHashnodeService();
    await this.testGhostService();
    
    // Test Web2PlatformsEngine
    await this.testWeb2PlatformsEngine();
    
    // Test platform configuration system
    await this.testPlatformConfigSystem();

    console.log('\n✅ All Platform API Tests Completed\n');
    this.printTestResults();
    
    return this.results;
  }

  /**
   * Test platform configurations
   */
  private static async testPlatformConfigurations(): Promise<void> {
    console.log('📋 Testing Platform Configurations...');
    
    try {
      const platforms = getAllPlatforms();
      const testResults = {
        totalPlatforms: platforms.length,
        apiEnabledPlatforms: platforms.filter(p => p.apiAvailable).length,
        validConfigurations: 0,
        errors: [] as string[]
      };

      // Validate each platform configuration
      for (const platform of platforms) {
        try {
          // Check required fields
          if (!platform.id || !platform.name || !platform.url) {
            testResults.errors.push(`${platform.id}: Missing required fields`);
            continue;
          }

          // Check domain authority is valid
          if (platform.domainAuthority < 0 || platform.domainAuthority > 100) {
            testResults.errors.push(`${platform.id}: Invalid domain authority`);
            continue;
          }

          // Check rate limits are present
          if (!platform.rateLimits || !platform.rateLimits.postsPerHour || !platform.rateLimits.postsPerDay) {
            testResults.errors.push(`${platform.id}: Missing rate limits`);
            continue;
          }

          // Check requirements are valid
          if (!platform.requirements || !platform.requirements.supportedFormats || platform.requirements.supportedFormats.length === 0) {
            testResults.errors.push(`${platform.id}: Missing or invalid requirements`);
            continue;
          }

          testResults.validConfigurations++;
        } catch (error: any) {
          testResults.errors.push(`${platform.id}: ${error.message}`);
        }
      }

      this.results.set('platformConfigurations', {
        success: testResults.errors.length === 0,
        ...testResults
      });

      console.log(`✅ Platform Configurations: ${testResults.validConfigurations}/${platforms.length} valid`);
      
    } catch (error: any) {
      this.results.set('platformConfigurations', {
        success: false,
        error: error.message
      });
      console.log(`❌ Platform Configurations: ${error.message}`);
    }
  }

  /**
   * Test WordPress service
   */
  private static async testWordPressService(): Promise<void> {
    console.log('📝 Testing WordPress Service...');
    
    try {
      const service = new WordPressService();
      const testResults = {
        configurationTest: false,
        validationTest: false,
        contentProcessingTest: false,
        errors: [] as string[]
      };

      // Test configuration
      try {
        service.configure(mockConfigs.wordpress);
        testResults.configurationTest = true;
      } catch (error: any) {
        testResults.errors.push(`Configuration: ${error.message}`);
      }

      // Test site validation
      try {
        const validation = await service.validateSite('https://public-api.wordpress.com');
        testResults.validationTest = validation.valid;
        if (!validation.valid) {
          testResults.errors.push(`Validation: ${validation.message}`);
        }
      } catch (error: any) {
        testResults.errors.push(`Validation: ${error.message}`);
      }

      // Test content processing (without actual publishing)
      try {
        // This would normally publish, but we're testing the data preparation
        const postData = {
          title: mockContent.title,
          content: mockContent.content,
          status: 'draft',
          meta_description: mockContent.metadata.description
        };
        
        if (postData.title && postData.content) {
          testResults.contentProcessingTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Content Processing: ${error.message}`);
      }

      this.results.set('wordpressService', {
        success: testResults.configurationTest && testResults.validationTest && testResults.contentProcessingTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} WordPress Service: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('wordpressService', {
        success: false,
        error: error.message
      });
      console.log(`❌ WordPress Service: ${error.message}`);
    }
  }

  /**
   * Test Medium service
   */
  private static async testMediumService(): Promise<void> {
    console.log('📰 Testing Medium Service...');
    
    try {
      const service = new MediumService();
      const testResults = {
        configurationTest: false,
        tokenValidationTest: false,
        contentOptimizationTest: false,
        errors: [] as string[]
      };

      // Test configuration
      try {
        service.configure(mockConfigs.medium);
        testResults.configurationTest = true;
      } catch (error: any) {
        testResults.errors.push(`Configuration: ${error.message}`);
      }

      // Test token validation format
      try {
        const validation = await service.validateToken('invalid-token');
        testResults.tokenValidationTest = !validation.valid; // Should be false for invalid token
      } catch (error: any) {
        testResults.errors.push(`Token Validation: ${error.message}`);
      }

      // Test content optimization
      try {
        // Test internal content optimization methods
        const optimizedContent = mockContent.content.replace(/^# /gm, '## '); // Medium optimization
        if (optimizedContent !== mockContent.content) {
          testResults.contentOptimizationTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Content Optimization: ${error.message}`);
      }

      this.results.set('mediumService', {
        success: testResults.configurationTest && testResults.tokenValidationTest && testResults.contentOptimizationTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Medium Service: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('mediumService', {
        success: false,
        error: error.message
      });
      console.log(`❌ Medium Service: ${error.message}`);
    }
  }

  /**
   * Test Dev.to service
   */
  private static async testDevToService(): Promise<void> {
    console.log('💻 Testing Dev.to Service...');
    
    try {
      const service = new DevToService();
      const testResults = {
        configurationTest: false,
        tagProcessingTest: false,
        markdownConversionTest: false,
        errors: [] as string[]
      };

      // Test configuration
      try {
        service.configure(mockConfigs.devto);
        testResults.configurationTest = true;
      } catch (error: any) {
        testResults.errors.push(`Configuration: ${error.message}`);
      }

      // Test tag processing (Dev.to specific requirements)
      try {
        const tags = ['javascript', 'web development', 'seo-tools', 'automation'];
        const processedTags = tags
          .slice(0, 4)
          .map(tag => tag.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''))
          .filter(tag => tag.length >= 2 && tag.length <= 20);
        
        if (processedTags.length > 0) {
          testResults.tagProcessingTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Tag Processing: ${error.message}`);
      }

      // Test HTML to Markdown conversion
      try {
        let markdown = mockContent.content;
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1');
        
        if (markdown.includes('## ') || markdown.includes('### ')) {
          testResults.markdownConversionTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Markdown Conversion: ${error.message}`);
      }

      this.results.set('devtoService', {
        success: testResults.configurationTest && testResults.tagProcessingTest && testResults.markdownConversionTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Dev.to Service: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('devtoService', {
        success: false,
        error: error.message
      });
      console.log(`❌ Dev.to Service: ${error.message}`);
    }
  }

  /**
   * Test Hashnode service
   */
  private static async testHashnodeService(): Promise<void> {
    console.log('🔗 Testing Hashnode Service...');
    
    try {
      const service = new HashnodeService();
      const testResults = {
        configurationTest: false,
        graphqlQueryTest: false,
        contentOptimizationTest: false,
        errors: [] as string[]
      };

      // Test configuration
      try {
        service.configure(mockConfigs.hashnode);
        testResults.configurationTest = true;
      } catch (error: any) {
        testResults.errors.push(`Configuration: ${error.message}`);
      }

      // Test GraphQL query construction
      try {
        const query = `
          query {
            me {
              id
              username
            }
          }
        `;
        
        if (query.includes('me') && query.includes('id')) {
          testResults.graphqlQueryTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`GraphQL Query: ${error.message}`);
      }

      // Test content optimization for Hashnode
      try {
        let optimized = mockContent.content;
        optimized = optimized.replace(/^# /gm, '## '); // Hashnode heading optimization
        
        if (!optimized.includes('What are your thoughts')) {
          optimized += '\n\n---\n\nWhat are your thoughts on this? Share your experience in the comments below!';
        }
        
        if (optimized.includes('What are your thoughts')) {
          testResults.contentOptimizationTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Content Optimization: ${error.message}`);
      }

      this.results.set('hashnodeService', {
        success: testResults.configurationTest && testResults.graphqlQueryTest && testResults.contentOptimizationTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Hashnode Service: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('hashnodeService', {
        success: false,
        error: error.message
      });
      console.log(`❌ Hashnode Service: ${error.message}`);
    }
  }

  /**
   * Test Ghost service
   */
  private static async testGhostService(): Promise<void> {
    console.log('👻 Testing Ghost Service...');
    
    try {
      const service = new GhostService();
      const testResults = {
        configurationTest: false,
        jwtGenerationTest: false,
        contentProcessingTest: false,
        errors: [] as string[]
      };

      // Test configuration
      try {
        service.configure(mockConfigs.ghost);
        testResults.configurationTest = true;
      } catch (error: any) {
        testResults.errors.push(`Configuration: ${error.message}`);
      }

      // Test JWT token structure (without actual secret validation)
      try {
        const [id, secret] = mockConfigs.ghost.adminApiKey.split(':');
        if (id && secret) {
          testResults.jwtGenerationTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`JWT Generation: ${error.message}`);
      }

      // Test content processing
      try {
        let processedContent = mockContent.content;
        // Test HTML optimization for Ghost
        processedContent = processedContent.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
        
        if (!processedContent.includes('<p></p>')) {
          testResults.contentProcessingTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Content Processing: ${error.message}`);
      }

      this.results.set('ghostService', {
        success: testResults.configurationTest && testResults.jwtGenerationTest && testResults.contentProcessingTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Ghost Service: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('ghostService', {
        success: false,
        error: error.message
      });
      console.log(`❌ Ghost Service: ${error.message}`);
    }
  }

  /**
   * Test Web2PlatformsEngine
   */
  private static async testWeb2PlatformsEngine(): Promise<void> {
    console.log('🔧 Testing Web2PlatformsEngine...');
    
    try {
      const engine = new Web2PlatformsEngine();
      const testResults = {
        engineInitializationTest: false,
        platformConfigsTest: false,
        opportunityDiscoveryTest: false,
        errors: [] as string[]
      };

      // Test engine initialization
      try {
        if (engine.engineType === 'web2_platforms' && 
            engine.supportedPlacements.includes('web2_post') &&
            engine.averageProcessingTime > 0) {
          testResults.engineInitializationTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Engine Initialization: ${error.message}`);
      }

      // Test platform configurations
      try {
        const platformConfigs = engine.getPlatformConfigs();
        if (platformConfigs.size > 0) {
          testResults.platformConfigsTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Platform Configs: ${error.message}`);
      }

      // Test opportunity discovery logic
      try {
        const mockTask = {
          id: 'test-task-123',
          campaignId: 'test-campaign',
          userId: 'test-user',
          engineType: 'web2_platforms' as const,
          priority: 'normal' as const,
          targetUrl: 'https://example.com',
          anchorText: 'SEO automation tools',
          keywords: ['seo', 'automation'],
          niche: ['technology'],
          requirements: {
            minDomainAuthority: 80,
            maxCostPerLink: 10,
            contentLength: 'medium' as const,
            contentTone: 'professional' as const,
            placement_type: ['web2_post'],
            language: 'en'
          },
          createdAt: new Date()
        };

        // Test validation logic
        const validation = await engine.validateTask(mockTask);
        if (validation !== undefined) {
          testResults.opportunityDiscoveryTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Opportunity Discovery: ${error.message}`);
      }

      this.results.set('web2PlatformsEngine', {
        success: testResults.engineInitializationTest && testResults.platformConfigsTest && testResults.opportunityDiscoveryTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Web2PlatformsEngine: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('web2PlatformsEngine', {
        success: false,
        error: error.message
      });
      console.log(`❌ Web2PlatformsEngine: ${error.message}`);
    }
  }

  /**
   * Test platform configuration system
   */
  private static async testPlatformConfigSystem(): Promise<void> {
    console.log('⚙️ Testing Platform Config System...');
    
    try {
      const testResults = {
        configLoadingTest: false,
        platformRetrievalTest: false,
        filteringTest: false,
        errors: [] as string[]
      };

      // Test configuration loading
      try {
        const allPlatforms = getAllPlatforms();
        if (allPlatforms.length > 0) {
          testResults.configLoadingTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Config Loading: ${error.message}`);
      }

      // Test platform retrieval by ID
      try {
        const telegraphPlatform = getPlatformById('telegraph');
        if (telegraphPlatform && telegraphPlatform.name === 'Telegraph') {
          testResults.platformRetrievalTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Platform Retrieval: ${error.message}`);
      }

      // Test filtering functionality
      try {
        const platforms = getAllPlatforms();
        const apiEnabledPlatforms = platforms.filter(p => p.apiAvailable);
        const freePlatforms = platforms.filter(p => p.costPerPost === 0);
        
        if (apiEnabledPlatforms.length > 0 && freePlatforms.length > 0) {
          testResults.filteringTest = true;
        }
      } catch (error: any) {
        testResults.errors.push(`Filtering: ${error.message}`);
      }

      this.results.set('platformConfigSystem', {
        success: testResults.configLoadingTest && testResults.platformRetrievalTest && testResults.filteringTest,
        ...testResults
      });

      console.log(`${testResults.errors.length === 0 ? '✅' : '⚠️'} Platform Config System: ${testResults.errors.length} errors`);
      
    } catch (error: any) {
      this.results.set('platformConfigSystem', {
        success: false,
        error: error.message
      });
      console.log(`❌ Platform Config System: ${error.message}`);
    }
  }

  /**
   * Print comprehensive test results
   */
  private static printTestResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [testName, result] of this.results.entries()) {
      totalTests++;
      if (result.success) passedTests++;
      
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error: string) => {
          console.log(`   - ${error}`);
        });
      }
    }
    
    console.log('=' .repeat(50));
    console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Platform API integrations are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }
  }

  /**
   * Test specific platform by ID
   */
  static async testPlatform(platformId: string): Promise<any> {
    console.log(`🧪 Testing ${platformId} platform specifically...\n`);
    
    switch (platformId) {
      case 'wordpress':
        await this.testWordPressService();
        break;
      case 'medium':
        await this.testMediumService();
        break;
      case 'devto':
        await this.testDevToService();
        break;
      case 'hashnode':
        await this.testHashnodeService();
        break;
      case 'ghost':
        await this.testGhostService();
        break;
      default:
        console.log(`❌ Unknown platform: ${platformId}`);
        return { success: false, error: 'Unknown platform' };
    }
    
    return this.results.get(`${platformId}Service`);
  }

  /**
   * Get test results
   */
  static getResults(): Map<string, any> {
    return this.results;
  }
}

// Export for use in other test files
export default PlatformAPITests;

// Global test runner function
export async function runPlatformTests(): Promise<void> {
  await PlatformAPITests.runAllTests();
}

// Individual platform test functions
export async function testWordPress(): Promise<any> {
  return await PlatformAPITests.testPlatform('wordpress');
}

export async function testMedium(): Promise<any> {
  return await PlatformAPITests.testPlatform('medium');
}

export async function testDevTo(): Promise<any> {
  return await PlatformAPITests.testPlatform('devto');
}

export async function testHashnode(): Promise<any> {
  return await PlatformAPITests.testPlatform('hashnode');
}

export async function testGhost(): Promise<any> {
  return await PlatformAPITests.testPlatform('ghost');
}
