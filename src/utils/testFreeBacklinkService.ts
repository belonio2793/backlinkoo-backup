/**
 * Test Free Backlink Service Integration
 * Verify that the AI-powered free backlink service works end-to-end
 */

import { BuilderAIGenerator } from '@/services/builderAIGenerator';
import { blogPublishingService } from '@/services/blogPublishingService';
import { globalBlogGenerator } from '@/services/globalBlogGenerator';
import { contentModerationService } from '@/services/contentModerationService';

export async function testFreeBacklinkService() {
  console.log('🧪 Testing Free Backlink Service Integration...');

  const testData = {
    targetUrl: 'https://example.com/test-page',
    primaryKeyword: 'AI Content Generation',
    anchorText: 'content generation tools'
  };

  try {
    // Step 1: Test content moderation
    console.log('1️⃣ Testing content moderation...');
    const moderationResult = await contentModerationService.moderateContent(
      `${testData.targetUrl} ${testData.primaryKeyword} ${testData.anchorText}`,
      testData.targetUrl,
      testData.primaryKeyword,
      testData.anchorText,
      undefined,
      'blog_request'
    );

    if (!moderationResult.allowed) {
      throw new Error('Content moderation failed');
    }
    console.log('✅ Content moderation passed');

    // Step 2: Test AI generation
    console.log('2️⃣ Testing AI content generation...');
    let generationResult;
    let aiSuccess = false;

    try {
      const aiGenerator = new BuilderAIGenerator((status) => {
        console.log(`[${status.stage}] ${status.message} (${status.progress}%)`);
      });

      generationResult = await aiGenerator.generateContent({
        keyword: testData.primaryKeyword,
        anchorText: testData.anchorText,
        targetUrl: testData.targetUrl,
        userId: 'test-user'
      });

      aiSuccess = true;
      console.log('✅ AI generation successful');
      console.log(`📊 Generated ${generationResult.wordCount} words with SEO score ${generationResult.metadata.seoScore}/100`);

    } catch (aiError) {
      console.log('⚠️ AI generation failed, testing fallback...');
      
      // Step 3: Test fallback system
      const fallbackRequest = {
        targetUrl: testData.targetUrl,
        primaryKeyword: testData.primaryKeyword,
        anchorText: testData.anchorText,
        sessionId: crypto.randomUUID()
      };

      const fallbackResult = await globalBlogGenerator.generateGlobalBlogPost(fallbackRequest);
      
      if (!fallbackResult.success) {
        throw new Error('Both AI and fallback generation failed');
      }

      generationResult = {
        title: fallbackResult.data!.blogPost.title,
        slug: fallbackResult.data!.blogPost.slug,
        content: fallbackResult.data!.blogPost.content,
        wordCount: fallbackResult.data!.blogPost.word_count,
        provider: 'fallback' as any,
        generationTime: 5000,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: {
          seoScore: fallbackResult.data!.blogPost.seo_score,
          readingTime: fallbackResult.data!.blogPost.reading_time,
          keywordDensity: 2.5
        }
      };

      console.log('✅ Fallback generation successful');
    }

    // Step 4: Test blog publishing
    console.log('3️⃣ Testing blog publishing...');
    const publishedPost = await blogPublishingService.publishBlogPost({
      title: generationResult.title,
      slug: generationResult.slug + '-test',
      content: generationResult.content,
      keyword: testData.primaryKeyword,
      anchor_text: testData.anchorText,
      target_url: testData.targetUrl,
      word_count: generationResult.wordCount,
      provider: generationResult.provider,
      generation_time: generationResult.generationTime,
      seo_score: generationResult.metadata.seoScore,
      reading_time: generationResult.metadata.readingTime,
      keyword_density: generationResult.metadata.keywordDensity,
      expires_at: generationResult.expiresAt.toISOString(),
      generated_by_account: 'test-free-backlink'
    });

    console.log('✅ Blog post published successfully');
    console.log(`📍 URL: ${window.location.origin}/blog/${publishedPost.slug}`);

    // Step 5: Test blog retrieval
    console.log('4️⃣ Testing blog retrieval...');
    const retrievedPost = await blogPublishingService.getBlogPostBySlug(publishedPost.slug);
    
    if (!retrievedPost) {
      throw new Error('Published post could not be retrieved');
    }
    console.log('✅ Blog post retrieval successful');

    // Step 6: Test blog listing
    console.log('5️⃣ Testing blog listing...');
    const blogList = await blogPublishingService.getPublishedBlogPosts(10, 0);
    
    const foundInList = blogList.find(post => post.slug === publishedPost.slug);
    if (!foundInList) {
      console.log('⚠️ Post not found in listing (might be expected if using localStorage)');
    } else {
      console.log('✅ Blog post appears in listing');
    }

    return {
      success: true,
      message: 'Free backlink service integration test completed successfully',
      details: {
        contentModeration: 'passed',
        aiGeneration: aiSuccess ? 'ai-success' : 'fallback-success',
        blogPublishing: 'success',
        blogRetrieval: 'success',
        blogListing: foundInList ? 'success' : 'not-found',
        publishedUrl: `/blog/${publishedPost.slug}`,
        wordCount: generationResult.wordCount,
        seoScore: generationResult.metadata.seoScore
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Free backlink service integration test failed'
    };
  }
}

// Make function globally available for testing
if (typeof window !== 'undefined') {
  (window as any).testFreeBacklinkService = testFreeBacklinkService;
  console.log('🧪 Free backlink service test available! Run testFreeBacklinkService() in console');
}
