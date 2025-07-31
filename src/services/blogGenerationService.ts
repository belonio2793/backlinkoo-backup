import { supabase } from '@/integrations/supabase/client';
import { openAIService } from './api/openai';

interface BlogGenerationRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

interface BlogGenerationResponse {
  success: boolean;
  title?: string;
  content?: string;
  slug?: string;
  excerpt?: string;
  blogUrl?: string;
  error?: string;
  expiresAt?: string;
}

const PROMPT_TEMPLATES = [
  "Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
  "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
  "Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}} to {{url}}"
];

function getRandomPromptTemplate(): string {
  const randomIndex = Math.floor(Math.random() * PROMPT_TEMPLATES.length);
  return PROMPT_TEMPLATES[randomIndex];
}

function buildPrompt(keyword: string, anchorText: string, targetUrl: string): string {
  const template = getRandomPromptTemplate();
  return template
    .replace('{{keyword}}', keyword)
    .replace('{{anchor_text}}', anchorText)
    .replace('{{url}}', targetUrl);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

function extractTitle(content: string): string {
  // Try to extract title from the first heading or first line
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    if (firstLine.length > 0 && firstLine.length <= 100) {
      return firstLine;
    }
  }
  return 'AI Generated Blog Post';
}

function extractExcerpt(content: string): string {
  // Get first paragraph or first 150 characters
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs[0].replace(/^#+\s*/, '').trim();
    return firstParagraph.length > 150 
      ? firstParagraph.substring(0, 150) + '...'
      : firstParagraph;
  }
  return content.substring(0, 150) + '...';
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function insertHyperlink(content: string, anchorText: string, targetUrl: string): string {
  // Find a good place to insert the hyperlink naturally
  const sentences = content.split(/[.!?]+/);
  
  // Look for sentences that might naturally fit the anchor text
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 50 && sentence.length < 200) {
      // Insert the hyperlink at the end of this sentence
      const linkedText = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
      sentences[i] = sentence + `. For more information, check out ${linkedText}`;
      break;
    }
  }
  
  return sentences.join('. ').replace(/\.\s*\./g, '.');
}

async function saveBlogPost(blogData: any): Promise<string> {
  try {
    // Try to save to Supabase first
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: blogData.title,
        slug: blogData.slug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        meta_description: blogData.excerpt,
        keywords: [blogData.keyword],
        tags: blogData.keyword.split(' '),
        category: 'AI Generated',
        target_url: blogData.targetUrl,
        anchor_text: blogData.anchorText,
        status: 'published',
        is_trial_post: true,
        expires_at: blogData.expiresAt,
        view_count: 0,
        seo_score: 75,
        reading_time: blogData.readingTime,
        word_count: blogData.wordCount,
        author_name: 'Backlink ∞ AI',
        published_at: new Date().toISOString(),
        published_url: `/blog/${blogData.slug}`
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to save to database, using localStorage fallback:', error);
      throw error;
    }

    console.log('✅ Blog post saved to database');
    return `/blog/${blogData.slug}`;

  } catch (error) {
    // Fallback to localStorage
    console.log('📁 Using localStorage fallback for blog post storage');
    
    // Save individual blog post
    localStorage.setItem(`blog_post_${blogData.slug}`, JSON.stringify(blogData));
    
    // Update blog posts index
    const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const newPostMeta = {
      slug: blogData.slug,
      title: blogData.title,
      created_at: blogData.created_at
    };
    
    existingPosts.unshift(newPostMeta);
    localStorage.setItem('all_blog_posts', JSON.stringify(existingPosts));
    
    return `/blog/${blogData.slug}`;
  }
}

export async function generateBlogPost(request: BlogGenerationRequest): Promise<BlogGenerationResponse> {
  try {
    console.log('🚀 Starting blog generation process...');
    
    // Build the prompt using one of the 3 templates
    const prompt = buildPrompt(request.keyword, request.anchorText, request.targetUrl);
    console.log('📝 Using prompt:', prompt);

    // Generate content using OpenAI
    const response = await openAIService.generateContent(prompt, {
      maxTokens: 2500,
      temperature: 0.7,
      systemPrompt: `You are an expert content writer. Create engaging, informative, and SEO-optimized blog posts. 
      The content should be well-structured with headings, subheadings, and natural flow. 
      Write in a professional yet conversational tone. Include relevant examples and insights.
      Make sure the content is valuable and informative for readers.`
    });

    if (!response.success || !response.content) {
      throw new Error(response.error || 'Failed to generate content');
    }

    // Process the generated content
    let content = response.content;
    const title = extractTitle(content);
    const slug = generateSlug(title);
    const excerpt = extractExcerpt(content);
    const readingTime = calculateReadingTime(content);
    const wordCount = content.split(/\s+/).length;

    // Insert the hyperlink naturally into the content
    content = insertHyperlink(content, request.anchorText, request.targetUrl);

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const blogData = {
      id: crypto.randomUUID(),
      title,
      slug,
      content,
      excerpt,
      meta_description: excerpt,
      keyword: request.keyword,
      anchorText: request.anchorText,
      targetUrl: request.targetUrl,
      status: 'published',
      is_trial_post: true,
      expires_at: expiresAt,
      view_count: 0,
      seo_score: 75,
      reading_time: readingTime,
      word_count: wordCount,
      author_name: 'Backlink ∞ AI',
      author_avatar: null,
      keywords: [request.keyword],
      tags: request.keyword.split(' '),
      category: 'AI Generated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      published_url: `/blog/${slug}`,
      user_id: null // Unclaimed initially
    };

    // Save the blog post
    const blogUrl = await saveBlogPost(blogData);

    console.log('✅ Blog post generated successfully:', {
      title,
      slug,
      wordCount,
      readingTime,
      expiresAt
    });

    return {
      success: true,
      title,
      content,
      slug,
      excerpt,
      blogUrl,
      expiresAt
    };

  } catch (error) {
    console.error('❌ Blog generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
