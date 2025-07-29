/**
 * Direct Blog Post Generation
 * Creates a blog post directly using the AI services
 */

import { huggingFaceService } from '@/services/api/huggingface';
import { cohereService } from '@/services/api/cohere';
import { blogPublishingService } from '@/services/blogPublishingService';

export async function createBlogPost() {
  const keyword = 'Digital Marketing Automation in 2024';
  const anchorText = 'marketing automation tools';
  const targetUrl = 'https://example.com/automation-tools';

  console.log('🚀 Starting direct blog post creation...');
  console.log(`📝 Topic: ${keyword}`);

  // Build the prompt
  const prompt = `Write a 1000 word blog post about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}

Please follow these SEO best practices:
1. Use H1, H2, H3 headings appropriately
2. Include the keyword "${keyword}" naturally throughout the content
3. Write in a conversational, engaging tone
4. Include relevant subheadings
5. Add a compelling introduction and conclusion
6. Ensure the anchor text "${anchorText}" is naturally integrated with the link to ${targetUrl}
7. Make the content readable and valuable to users
8. Use proper paragraph breaks and formatting
9. Include relevant keywords and semantic variations
10. Write exactly 1000 words

Format the response as clean HTML with proper semantic structure.`;

  let content = '';
  let provider = '';

  try {
    // Try Hugging Face first
    console.log('🤖 Attempting generation with Hugging Face...');
    const hfResult = await huggingFaceService.generateText(prompt, {
      model: 'gpt2-medium',
      maxLength: 2000,
      temperature: 0.7
    });

    if (hfResult.success && hfResult.content) {
      content = hfResult.content;
      provider = 'huggingface';
      console.log('✅ Hugging Face generation successful!');
    } else {
      throw new Error(hfResult.error || 'Hugging Face generation failed');
    }
  } catch (error) {
    console.log('⚠️ Hugging Face failed, trying Cohere...');
    
    try {
      const cohereResult = await cohereService.generateText(prompt, {
        model: 'command',
        maxTokens: 2000,
        temperature: 0.7
      });

      if (cohereResult.success && cohereResult.content) {
        content = cohereResult.content;
        provider = 'cohere';
        console.log('✅ Cohere generation successful!');
      } else {
        throw new Error(cohereResult.error || 'Cohere generation failed');
      }
    } catch (cohereError) {
      console.log('❌ Both providers failed, creating fallback content...');
      
      // Fallback content
      content = createFallbackContent(keyword, anchorText, targetUrl);
      provider = 'fallback';
    }
  }

  // Enhance content for SEO
  content = enhanceContentForSEO(content, keyword, anchorText, targetUrl);

  // Extract title
  const title = extractTitle(content, keyword);

  // Generate slug
  const slug = generateSlug(title, keyword);

  // Calculate metrics
  const wordCount = countWords(content);
  const readingTime = Math.ceil(wordCount / 200);
  const seoScore = calculateBasicSEOScore(content, keyword);

  console.log(`📊 Generated content: ${wordCount} words, ${readingTime} min read, SEO: ${seoScore}/100`);

  // Set expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Save to blog
  try {
    const blogPost = await blogPublishingService.publishBlogPost({
      title,
      slug,
      content,
      keyword,
      anchor_text: anchorText,
      target_url: targetUrl,
      word_count: wordCount,
      provider: provider as any,
      generation_time: 2500,
      seo_score: seoScore,
      reading_time: readingTime,
      keyword_density: calculateKeywordDensity(content, keyword),
      expires_at: expiresAt.toISOString(),
      generated_by_account: 'admin-generated'
    });

    const fullUrl = `${window.location.origin}/blog/${blogPost.slug}`;

    console.log('🎉 Blog post created successfully!');
    console.log(`📍 URL: ${fullUrl}`);
    console.log(`🆔 Slug: ${blogPost.slug}`);
    console.log(`⏰ Expires: ${new Date(blogPost.expires_at).toLocaleString()}`);

    return {
      success: true,
      blogPost,
      url: `/blog/${blogPost.slug}`,
      fullUrl,
      title,
      slug,
      wordCount,
      provider
    };

  } catch (error) {
    console.error('❌ Failed to save blog post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save blog post'
    };
  }
}

function createFallbackContent(keyword: string, anchorText: string, targetUrl: string): string {
  return `
<h1>The Complete Guide to ${keyword}</h1>

<p>In today's rapidly evolving digital landscape, ${keyword.toLowerCase()} has become an essential component for businesses looking to streamline their operations and maximize efficiency. This comprehensive guide will explore the key aspects, benefits, and implementation strategies that every modern business should consider.</p>

<h2>Understanding ${keyword}</h2>

<p>The concept of ${keyword.toLowerCase()} encompasses a wide range of technologies and methodologies designed to optimize business processes. By leveraging advanced tools and techniques, organizations can achieve unprecedented levels of productivity and customer satisfaction.</p>

<h3>Key Benefits and Advantages</h3>

<p>Implementing effective strategies in this area provides numerous advantages:</p>

<ul>
<li>Increased operational efficiency and reduced manual workload</li>
<li>Enhanced customer experience through personalized interactions</li>
<li>Improved data analytics and decision-making capabilities</li>
<li>Cost reduction through process optimization</li>
<li>Scalable solutions that grow with your business</li>
</ul>

<h2>Implementation Strategies</h2>

<p>Successfully implementing these solutions requires careful planning and execution. Organizations should begin by assessing their current processes and identifying areas for improvement.</p>

<h3>Best Practices for Success</h3>

<p>To maximize the effectiveness of your implementation, consider incorporating <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> into your overall strategy. These tools provide the foundation for building robust, scalable solutions.</p>

<p>The integration process should be approached systematically, with clear objectives and measurable outcomes. Training and change management are crucial components that ensure successful adoption across the organization.</p>

<h2>Future Trends and Innovations</h2>

<p>The landscape of ${keyword.toLowerCase()} continues to evolve rapidly, with new technologies and methodologies emerging regularly. Artificial intelligence and machine learning are playing increasingly important roles, enabling more sophisticated automation and personalization capabilities.</p>

<h3>Preparing for the Future</h3>

<p>Organizations that want to stay competitive must remain agile and adaptable. This means continuously evaluating new technologies, updating processes, and investing in team development.</p>

<p>The integration of advanced analytics, predictive modeling, and real-time optimization will become standard practices. Companies that embrace these innovations early will gain significant competitive advantages.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword.toLowerCase()} is no longer optional for businesses that want to thrive in the digital age. By understanding the core principles, implementing best practices, and staying current with emerging trends, organizations can unlock new levels of efficiency and growth.</p>

<p>The investment in these capabilities pays dividends through improved customer satisfaction, reduced operational costs, and enhanced competitive positioning. Start your journey today and transform how your business operates in the modern marketplace.</p>
`;
}

function enhanceContentForSEO(content: string, keyword: string, anchorText: string, targetUrl: string): string {
  // Add basic HTML structure if not present
  if (!content.includes('<h1>') && !content.includes('<h2>')) {
    const title = `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
    content = `<h1>${title}</h1>\n\n${content}`;
  }

  // Ensure anchor text is linked if not already
  if (!content.includes(anchorText) || !content.includes(targetUrl)) {
    const linkParagraph = `\n\n<p>For more information about this topic, explore our comprehensive resource on <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>.</p>`;
    content += linkParagraph;
  }

  // Add proper paragraph tags if missing
  content = content.replace(/\n\n/g, '</p>\n<p>');
  if (!content.startsWith('<p>') && !content.startsWith('<h')) {
    content = '<p>' + content;
  }
  if (!content.endsWith('</p>') && !content.endsWith('>')) {
    content = content + '</p>';
  }

  return content;
}

function extractTitle(content: string, keyword: string): string {
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]*>/g, '');
  }
  return `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
}

function generateSlug(title: string, keyword: string): string {
  const baseSlug = (title || keyword)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 60);
  
  return `${baseSlug}-${Date.now()}`;
}

function countWords(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateBasicSEOScore(content: string, keyword: string): number {
  let score = 0;
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  if (content.includes('<h1')) score += 20;
  
  const headingCount = (content.match(/<h[1-6]/g) || []).length;
  if (headingCount >= 3) score += 15;

  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  if (keywordCount >= 3 && keywordCount <= 8) score += 25;

  const wordCount = countWords(content);
  if (wordCount >= 800) score += 20;

  if (content.includes('<p>') && content.includes('</p>')) score += 10;
  if (content.includes('<a href=')) score += 10;

  return Math.min(score, 100);
}

function calculateKeywordDensity(content: string, keyword: string): number {
  const text = content.replace(/<[^>]*>/g, '').toLowerCase();
  const words = text.split(/\s+/);
  const keywordOccurrences = words.filter(word => 
    word.includes(keyword.toLowerCase())
  ).length;
  
  return Math.round((keywordOccurrences / words.length) * 100 * 100) / 100;
}

// Make function globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).createBlogPost = createBlogPost;
  console.log('💡 Direct blog generation available! Run createBlogPost() in console');
}
