/**
 * Generate a sample blog post for demonstration
 */

import { BuilderAIGenerator } from '@/services/builderAIGenerator';
import { blogPublishingService } from '@/services/blogPublishingService';

export async function generateSampleBlogPost() {
  try {
    console.log('🚀 Starting blog post generation...');

    // Create generator with status logging
    const generator = new BuilderAIGenerator((status) => {
      console.log(`[${status.stage}] ${status.message} (${status.progress}%)`);
      if (status.provider) {
        console.log(`Using provider: ${status.provider.toUpperCase()}`);
      }
    });

    // Generate content with sample data
    const request = {
      keyword: 'Digital Marketing Automation in 2024',
      anchorText: 'marketing automation tools',
      targetUrl: 'https://example.com/automation-tools',
      userId: 'demo-user'
    };

    console.log('📝 Generating content with:', request);

    const result = await generator.generateContent(request);

    console.log('✅ Content generated successfully!');
    console.log(`📊 Stats: ${result.wordCount} words, SEO Score: ${result.metadata.seoScore}/100`);

    // Publish the blog post
    const publishedPost = await blogPublishingService.publishBlogPost({
      title: result.title,
      slug: result.slug,
      content: result.content,
      keyword: request.keyword,
      anchor_text: request.anchorText,
      target_url: request.targetUrl,
      word_count: result.wordCount,
      provider: result.provider,
      generation_time: result.generationTime,
      seo_score: result.metadata.seoScore,
      reading_time: result.metadata.readingTime,
      keyword_density: result.metadata.keywordDensity,
      expires_at: result.expiresAt.toISOString(),
      generated_by_account: 'demo-user'
    });

    console.log('🌐 Blog post published successfully!');
    console.log(`📍 URL: ${window.location.origin}/blog/${publishedPost.slug}`);
    console.log(`⏰ Expires: ${new Date(publishedPost.expires_at).toLocaleString()}`);

    return {
      success: true,
      post: publishedPost,
      url: `/blog/${publishedPost.slug}`,
      fullUrl: `${window.location.origin}/blog/${publishedPost.slug}`,
      result
    };

  } catch (error) {
    console.error('❌ Error generating blog post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Auto-generate when this module is imported in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Development mode - blog post generation available');
  console.log('💡 Run generateSampleBlogPost() in console to create a demo post');
  
  // Make function globally available for testing
  (window as any).generateSampleBlogPost = generateSampleBlogPost;
}
