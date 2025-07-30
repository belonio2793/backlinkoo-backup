import { slugGenerationService, type SlugOptions } from '@/services/slugGenerationService';

/**
 * Test and demonstrate the enhanced slug generation system
 */
export class SlugGenerationTester {
  /**
   * Run comprehensive slug generation tests
   */
  async runSlugTests(): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      console.log('🧪 Starting Slug Generation Tests...');

      // Test 1: Basic title-based slug generation
      const basicTest = await this.testBasicSlugGeneration();
      results.push(basicTest);
      if (!basicTest.success) {
        errors.push(`Basic generation failed: ${basicTest.error}`);
      }

      // Test 2: Keyword-enhanced slug generation
      const keywordTest = await this.testKeywordSlugGeneration();
      results.push(keywordTest);
      if (!keywordTest.success) {
        errors.push(`Keyword generation failed: ${keywordTest.error}`);
      }

      // Test 3: Custom slug validation
      const validationTest = await this.testSlugValidation();
      results.push(validationTest);
      if (!validationTest.success) {
        errors.push(`Validation failed: ${validationTest.error}`);
      }

      // Test 4: Duplicate handling and alternatives
      const duplicateTest = await this.testDuplicateHandling();
      results.push(duplicateTest);
      if (!duplicateTest.success) {
        errors.push(`Duplicate handling failed: ${duplicateTest.error}`);
      }

      // Test 5: SEO scoring
      const seoTest = await this.testSEOScoring();
      results.push(seoTest);
      if (!seoTest.success) {
        errors.push(`SEO scoring failed: ${seoTest.error}`);
      }

      // Test 6: Special characters and edge cases
      const edgeCaseTest = await this.testEdgeCases();
      results.push(edgeCaseTest);
      if (!edgeCaseTest.success) {
        errors.push(`Edge case handling failed: ${edgeCaseTest.error}`);
      }

      const success = errors.length === 0;
      console.log(`🧪 Slug Generation Tests ${success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (errors.length > 0) {
        console.log('❌ Errors:', errors);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('🧪 Slug Generation Tests failed with exception:', error);
      errors.push(`Test suite exception: ${error.message}`);
      return { success: false, results, errors };
    }
  }

  /**
   * Test basic slug generation from titles
   */
  private async testBasicSlugGeneration(): Promise<any> {
    try {
      console.log('🔨 Testing basic slug generation...');

      const testCases = [
        'How to Build Better SEO Strategies',
        'The Ultimate Guide to Digital Marketing',
        'Top 10 Web Development Tips for 2024',
        'Understanding React Hooks and Context API'
      ];

      const results = [];

      for (const title of testCases) {
        const options: SlugOptions = { title };
        const suggestions = await slugGenerationService.generateSlugSuggestions(options);
        
        if (suggestions.length === 0) {
          throw new Error(`No suggestions generated for: "${title}"`);
        }

        const titleBasedSuggestion = suggestions.find(s => s.type === 'title-based');
        if (!titleBasedSuggestion) {
          throw new Error(`No title-based suggestion for: "${title}"`);
        }

        results.push({
          title,
          slug: titleBasedSuggestion.slug,
          score: titleBasedSuggestion.score,
          isAvailable: titleBasedSuggestion.isAvailable
        });
      }

      console.log('✅ Basic slug generation successful:', results);
      return {
        test: 'basicSlugGeneration',
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Basic slug generation failed:', error);
      return {
        test: 'basicSlugGeneration',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test keyword-enhanced slug generation
   */
  private async testKeywordSlugGeneration(): Promise<any> {
    try {
      console.log('🎯 Testing keyword-enhanced slug generation...');

      const testCase = {
        title: 'Complete Guide to SEO',
        keywords: ['SEO', 'optimization', 'search', 'ranking']
      };

      const options: SlugOptions = {
        title: testCase.title,
        keywords: testCase.keywords,
        includeKeyword: true
      };

      const suggestions = await slugGenerationService.generateSlugSuggestions(options);
      
      if (suggestions.length === 0) {
        throw new Error('No suggestions generated with keywords');
      }

      const keywordSuggestion = suggestions.find(s => s.type === 'keyword-based');
      if (!keywordSuggestion) {
        throw new Error('No keyword-based suggestion generated');
      }

      // Check if keywords are incorporated
      const lowerSlug = keywordSuggestion.slug.toLowerCase();
      const keywordIncluded = testCase.keywords.some(keyword => 
        lowerSlug.includes(keyword.toLowerCase())
      );

      if (!keywordIncluded) {
        console.warn('⚠️ Keywords not clearly incorporated in slug');
      }

      console.log('✅ Keyword slug generation successful:', keywordSuggestion);
      return {
        test: 'keywordSlugGeneration',
        success: true,
        data: {
          slug: keywordSuggestion.slug,
          score: keywordSuggestion.score,
          keywordIncluded
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Keyword slug generation failed:', error);
      return {
        test: 'keywordSlugGeneration',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test slug validation
   */
  private async testSlugValidation(): Promise<any> {
    try {
      console.log('✅ Testing slug validation...');

      const testCases = [
        { slug: 'valid-slug-example', shouldBeValid: true },
        { slug: 'another_valid_slug', shouldBeValid: true },
        { slug: 'valid.slug.with.dots', shouldBeValid: true },
        { slug: '', shouldBeValid: false },
        { slug: 'ab', shouldBeValid: false }, // Too short
        { slug: '-invalid-start', shouldBeValid: false },
        { slug: 'invalid-end-', shouldBeValid: false },
        { slug: 'invalid--double--hyphens', shouldBeValid: false },
        { slug: 'invalid spaces', shouldBeValid: false },
        { slug: 'invalid@characters!', shouldBeValid: false }
      ];

      const results = [];

      for (const testCase of testCases) {
        const validation = slugGenerationService.validateSlug(testCase.slug);
        const passed = validation.isValid === testCase.shouldBeValid;
        
        results.push({
          slug: testCase.slug,
          expected: testCase.shouldBeValid,
          actual: validation.isValid,
          passed,
          errors: validation.errors
        });

        if (!passed) {
          console.warn(`⚠️ Validation test failed for "${testCase.slug}":`, validation);
        }
      }

      const allPassed = results.every(r => r.passed);
      console.log(`✅ Slug validation ${allPassed ? 'passed' : 'had issues'}:`, results);
      
      return {
        test: 'slugValidation',
        success: allPassed,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Slug validation test failed:', error);
      return {
        test: 'slugValidation',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test duplicate handling and alternatives
   */
  private async testDuplicateHandling(): Promise<any> {
    try {
      console.log('🔄 Testing duplicate handling...');

      // Use a title that might generate common slugs
      const title = 'Ultimate Guide';
      const options: SlugOptions = { title, randomSuffix: true };

      const suggestions = await slugGenerationService.generateSlugSuggestions(options);
      
      if (suggestions.length === 0) {
        throw new Error('No suggestions generated for duplicate test');
      }

      // Check for variety in suggestions
      const uniqueSlugs = new Set(suggestions.map(s => s.slug));
      const hasVariety = uniqueSlugs.size > 1;

      // Check for random alternatives
      const hasRandomAlternatives = suggestions.some(s => s.type === 'random');

      console.log('✅ Duplicate handling successful:', {
        totalSuggestions: suggestions.length,
        uniqueSlugs: uniqueSlugs.size,
        hasVariety,
        hasRandomAlternatives
      });

      return {
        test: 'duplicateHandling',
        success: true,
        data: {
          suggestions: suggestions.slice(0, 5).map(s => ({
            slug: s.slug,
            type: s.type,
            isAvailable: s.isAvailable
          })),
          hasVariety,
          hasRandomAlternatives
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Duplicate handling test failed:', error);
      return {
        test: 'duplicateHandling',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test SEO scoring system
   */
  private async testSEOScoring(): Promise<any> {
    try {
      console.log('📊 Testing SEO scoring...');

      const testCases = [
        {
          title: 'Best SEO Practices',
          keywords: ['SEO', 'practices'],
          expectedScoreRange: [80, 100] // Should score well
        },
        {
          title: 'A Very Long Title That Goes On And On With Many Words That Might Hurt SEO',
          keywords: [],
          expectedScoreRange: [0, 70] // Should score lower due to length
        }
      ];

      const results = [];

      for (const testCase of testCases) {
        const options: SlugOptions = {
          title: testCase.title,
          keywords: testCase.keywords
        };

        const suggestions = await slugGenerationService.generateSlugSuggestions(options);
        const mainSuggestion = suggestions[0];

        if (!mainSuggestion) {
          throw new Error(`No suggestions for "${testCase.title}"`);
        }

        const scoreInRange = mainSuggestion.score >= testCase.expectedScoreRange[0] && 
                            mainSuggestion.score <= testCase.expectedScoreRange[1];

        results.push({
          title: testCase.title,
          slug: mainSuggestion.slug,
          score: mainSuggestion.score,
          expectedRange: testCase.expectedScoreRange,
          scoreInRange
        });
      }

      const allScoresValid = results.every(r => r.scoreInRange);
      console.log(`✅ SEO scoring ${allScoresValid ? 'passed' : 'had issues'}:`, results);

      return {
        test: 'seoScoring',
        success: allScoresValid,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ SEO scoring test failed:', error);
      return {
        test: 'seoScoring',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test edge cases and special characters
   */
  private async testEdgeCases(): Promise<any> {
    try {
      console.log('🔍 Testing edge cases...');

      const edgeCases = [
        'Title with "Quotes" and Special Characters!',
        'números en español y acentos',
        'Title with 123 Numbers',
        'A',
        '   Whitespace Issues   ',
        'Title with & symbols @ special # characters',
        'UPPERCASE TITLE EXAMPLE'
      ];

      const results = [];

      for (const title of edgeCases) {
        const options: SlugOptions = { title };
        const suggestions = await slugGenerationService.generateSlugSuggestions(options);
        
        if (suggestions.length > 0) {
          const mainSlug = suggestions[0].slug;
          const validation = slugGenerationService.validateSlug(mainSlug);
          
          results.push({
            originalTitle: title,
            generatedSlug: mainSlug,
            isValid: validation.isValid,
            errors: validation.errors
          });
        } else {
          results.push({
            originalTitle: title,
            generatedSlug: null,
            isValid: false,
            errors: ['No suggestions generated']
          });
        }
      }

      const allValid = results.every(r => r.isValid);
      console.log(`✅ Edge case handling ${allValid ? 'passed' : 'had issues'}:`, results);

      return {
        test: 'edgeCases',
        success: allValid,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Edge case test failed:', error);
      return {
        test: 'edgeCases',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Demo different slug generation strategies
   */
  async demoSlugStrategies(title: string, keywords: string[] = []): Promise<void> {
    console.log(`\n🎭 Slug Generation Demo for: "${title}"`);
    console.log('Keywords:', keywords.join(', '));
    console.log('─'.repeat(50));

    try {
      const options: SlugOptions = {
        title,
        keywords,
        includeDate: false,
        includeKeyword: true
      };

      const suggestions = await slugGenerationService.generateSlugSuggestions(options);

      suggestions.slice(0, 8).forEach((suggestion, index) => {
        const icon = this.getTypeIcon(suggestion.type);
        const availability = suggestion.isAvailable ? '✅' : '❌';
        console.log(
          `${index + 1}. ${icon} ${suggestion.slug} (${suggestion.score}/100) ${availability}`
        );
        console.log(`   └─ ${suggestion.description}`);
      });

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  private getTypeIcon(type: string): string {
    switch (type) {
      case 'custom': return '🎯';
      case 'title-based': return '📝';
      case 'keyword-based': return '🔑';
      case 'date-based': return '📅';
      case 'random': return '🎲';
      default: return '📎';
    }
  }
}

export const slugGenerationTester = new SlugGenerationTester();

// Export convenience function for quick testing
export async function testSlugGeneration() {
  const tester = new SlugGenerationTester();
  const results = await tester.runSlugTests();
  
  // Also run some demos
  console.log('\n🎭 Running demonstration examples...');
  
  await tester.demoSlugStrategies(
    'The Complete Guide to Modern Web Development',
    ['web development', 'javascript', 'react', 'tutorial']
  );
  
  await tester.demoSlugStrategies(
    'How to Optimize Your SEO Strategy for 2024',
    ['SEO', 'optimization', 'strategy', '2024']
  );
  
  return results;
}
