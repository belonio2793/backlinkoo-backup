/**
 * Direct Blog Post Generation
 * Creates a blog post directly using the AI services
 */

import { huggingFaceService } from '@/services/api/huggingface';
import { cohereService } from '@/services/api/cohere';
import { blogPublishingService } from '@/services/blogPublishingService';
import { ContentFormatter } from '@/utils/contentFormatter';

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

  // Format and enhance content using ContentFormatter
  console.log('📝 Formatting content for optimal structure...');
  const formatted = ContentFormatter.formatContent(content, {
    keyword,
    anchorText,
    targetUrl,
    enforceStructure: true,
    maxH1Count: 1
  });

  // Use formatted content and metrics
  content = formatted.content;
  const title = formatted.title;
  const wordCount = formatted.wordCount;
  const seoScore = formatted.seoScore;
  const readingTime = Math.ceil(wordCount / 200);

  // Generate slug
  const slug = generateSlug(title, keyword);

  // Log formatting improvements
  if (formatted.fixes.length > 0) {
    console.log('✅ Applied formatting fixes:', formatted.fixes);
  }
  if (formatted.issues.length > 0) {
    console.log('⚠️ Content issues detected:', formatted.issues);
  }

  console.log(`��� Generated content: ${wordCount} words, ${readingTime} min read, SEO: ${seoScore}/100`);

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
  // Use ContentFormatter template for consistent structure
  return ContentFormatter.generateContentTemplate({
    keyword,
    anchorText,
    targetUrl,
    enforceStructure: true
  });
}

// Legacy fallback content (kept for reference)
function createLegacyFallbackContent(keyword: string, anchorText: string, targetUrl: string): string {
  return `
<h1>The Complete Guide to ${keyword}</h1>

<p><strong>${keyword}</strong> has become a cornerstone of modern business strategy in 2024. Whether you're a startup or an established enterprise, understanding and implementing effective ${keyword.toLowerCase()} practices is crucial for sustainable growth and competitive advantage.</p>

<p>This comprehensive guide will walk you through everything you need to know about ${keyword.toLowerCase()}, from basic concepts to advanced implementation strategies. You'll discover proven methods, common pitfalls to avoid, and actionable insights that can transform your approach.</p>

<h2>What is ${keyword}?</h2>

<p>${keyword} represents a systematic approach to optimizing business processes and achieving measurable results. <strong>The core principle</strong> revolves around leveraging data-driven insights and proven methodologies to create sustainable value.</p>

<p>Modern organizations are increasingly turning to <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> to enhance their operational efficiency and drive meaningful outcomes.</p>

<h3>Key Components</h3>

<p>Understanding the fundamental elements of ${keyword.toLowerCase()} is essential for successful implementation:</p>

<ul>
<li><strong>Strategic Planning:</strong> Developing clear objectives and measurable goals</li>
<li><strong>Process Optimization:</strong> Streamlining workflows and eliminating inefficiencies</li>
<li><strong>Technology Integration:</strong> Leveraging modern tools and platforms</li>
<li><strong>Performance Monitoring:</strong> Tracking progress and making data-driven adjustments</li>
<li><strong>Continuous Improvement:</strong> Iterating and refining approaches over time</li>
</ul>

<h2>Benefits and Advantages</h2>

<p>Organizations that successfully implement ${keyword.toLowerCase()} strategies typically experience significant improvements across multiple areas:</p>

<h3>Operational Excellence</h3>

<p><strong>Increased efficiency</strong> is often the most immediate benefit. Companies report productivity gains of 20-40% within the first year of implementation. This improvement stems from better resource allocation and streamlined processes.</p>

<p>Additionally, organizations benefit from reduced operational costs and improved quality control. The systematic approach inherent in ${keyword.toLowerCase()} helps identify and eliminate waste while ensuring consistent results.</p>

<h3>Competitive Advantages</h3>

<p>Businesses that master ${keyword.toLowerCase()} gain several competitive edges:</p>

<ol>
<li><strong>Faster time-to-market:</strong> Streamlined processes enable quicker product development</li>
<li><strong>Enhanced customer satisfaction:</strong> Improved quality and consistency</li>
<li><strong>Better decision-making:</strong> Data-driven insights inform strategic choices</li>
<li><strong>Scalability:</strong> Robust foundations support sustainable growth</li>
</ol>

<h2>Implementation Best Practices</h2>

<p>Successfully implementing ${keyword.toLowerCase()} requires careful planning and execution. <em>The most successful organizations</em> follow a structured approach that minimizes risk while maximizing potential returns.</p>

<h3>Getting Started</h3>

<p>Begin by conducting a comprehensive assessment of your current state. This evaluation should include:</p>

<ul>
<li>Existing processes and workflows</li>
<li>Available resources and capabilities</li>
<li>Key performance metrics and benchmarks</li>
<li>Stakeholder requirements and expectations</li>
</ul>

<p>Many organizations find it beneficial to work with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> during this initial phase to ensure they don't overlook critical considerations.</p>

<h3>Common Pitfalls to Avoid</h3>

<p><strong>Lack of leadership support</strong> is the primary reason why ${keyword.toLowerCase()} initiatives fail. Without strong executive sponsorship, projects often lose momentum and resources.</p>

<p>Other common mistakes include:</p>

<ul>
<li>Underestimating the time and effort required</li>
<li>Failing to involve key stakeholders in the planning process</li>
<li>Neglecting change management and training needs</li>
<li>Setting unrealistic expectations or timelines</li>
</ul>

<h2>Future Trends and Innovations</h2>

<p>The landscape of ${keyword.toLowerCase()} continues to evolve rapidly. <strong>Emerging technologies</strong> like artificial intelligence, machine learning, and automation are reshaping how organizations approach these challenges.</p>

<h3>Technology Integration</h3>

<p>Modern ${keyword.toLowerCase()} implementations increasingly rely on sophisticated technology platforms. These solutions provide real-time insights, predictive analytics, and automated optimization capabilities.</p>

<p>Organizations that effectively leverage <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> and similar advanced tools are positioning themselves for long-term success in an increasingly competitive marketplace.</p>

<h3>Industry Evolution</h3>

<p><em>The next decade</em> will likely see significant changes in how ${keyword.toLowerCase()} is approached. Key trends include:</p>

<ol>
<li>Increased automation and AI integration</li>
<li>Greater emphasis on sustainability and social responsibility</li>
<li>More sophisticated measurement and analytics capabilities</li>
<li>Enhanced collaboration and cross-functional integration</li>
</ol>

<h2>Measuring Success</h2>

<p>Establishing clear metrics and monitoring systems is crucial for ${keyword.toLowerCase()} success. <strong>Key performance indicators</strong> should align with your organization's strategic objectives and provide actionable insights.</p>

<p>Regular assessment and adjustment ensure that your approach remains effective and aligned with changing business needs. This iterative process is fundamental to achieving sustainable results.</p>

<h2>Conclusion</h2>

<p>${keyword} represents a powerful approach to achieving operational excellence and competitive advantage. <strong>Success requires commitment</strong>, proper planning, and continuous improvement.</p>

<p>Organizations that invest in comprehensive ${keyword.toLowerCase()} strategies position themselves for sustainable growth and long-term success. The benefits extend beyond immediate operational improvements to include enhanced innovation capabilities and market positioning.</p>

<p>Start your ${keyword.toLowerCase()} journey today by assessing your current state and developing a clear roadmap for improvement. With the right approach and commitment, you can achieve transformational results that drive lasting value for your organization.</p>
`;
}

function enhanceContentForSEO(content: string, keyword: string, anchorText: string, targetUrl: string): string {
  // Add basic HTML structure if not present
  if (!content.includes('<h1>') && !content.includes('<h2>')) {
    const title = `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
    content = `<h1>${title}</h1>\n\n${content}`;
  }

  // Ensure anchor text is linked multiple times for better SEO
  if (!content.includes(anchorText) || !content.includes(targetUrl)) {
    // Add anchor text in introduction
    const introLink = `\n\n<p>This comprehensive guide covers everything you need to know about ${keyword.toLowerCase()}, including insights from <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>.</p>`;

    // Add anchor text in conclusion
    const conclusionLink = `\n\n<p>For more detailed information and advanced strategies, visit our dedicated resource on <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> to enhance your understanding.</p>`;

    content = introLink + content + conclusionLink;
  }

  // Add backlink information section at the end
  const backlinkInfo = `
  <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(to right, #eff6ff, #f3e8ff); border: 1px solid #3b82f6; border-radius: 0.5rem;">
    <h3 style="color: #1e40af; margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">🔗 Backlink Information</h3>
    <p style="margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;"><strong>Anchor Text:</strong> <code style="background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: #1e40af;">${anchorText}</code></p>
    <p style="margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;"><strong>Target URL:</strong> <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="color: #1e40af; text-decoration: underline;">${targetUrl}</a></p>
    <p style="font-size: 0.75rem; color: #059669; margin-top: 0.75rem;">✅ This content naturally integrates the anchor text "${anchorText}" with high-quality, contextual backlinks.</p>
  </div>`;

  content += backlinkInfo;

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

  // 1. Single H1 tag (15 points)
  const h1Count = (content.match(/<h1/g) || []).length;
  if (h1Count === 1) score += 15;
  else if (h1Count > 1) score -= 10;

  // 2. Proper heading hierarchy (15 points)
  const h2Count = (content.match(/<h2/g) || []).length;
  const h3Count = (content.match(/<h3/g) || []).length;
  if (h2Count >= 2 && h3Count >= 1) score += 15;
  else if (h2Count >= 1) score += 10;

  // 3. Keyword optimization (20 points)
  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  if (keywordCount >= 3 && keywordCount <= 8) score += 20;
  else if (keywordCount >= 2) score += 15;

  // 4. Content length (15 points)
  const wordCount = countWords(content);
  if (wordCount >= 1000) score += 15;
  else if (wordCount >= 800) score += 10;

  // 5. HTML structure (10 points)
  if (content.includes('<p>') && content.includes('</p>')) score += 5;
  if (content.includes('<strong>')) score += 3;
  if (content.includes('<ul>') || content.includes('<ol>')) score += 2;

  // 6. Link optimization (10 points)
  const linkCount = (content.match(/<a href=/g) || []).length;
  if (linkCount >= 2) score += 10;
  else if (linkCount >= 1) score += 5;

  // 7. Text emphasis (5 points)
  const strongCount = (content.match(/<strong>/g) || []).length;
  if (strongCount >= 3) score += 5;

  // 8. Link attributes (5 points)
  if (content.includes('target="_blank"') && content.includes('rel="noopener')) score += 5;

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
