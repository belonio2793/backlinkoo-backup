#!/usr/bin/env node

/**
 * Force Beautiful Content Structure Script
 * 
 * This script forces all blog posts to use the beautiful content structure
 * as defined in the premium design system. It applies standardized formatting,
 * premium styling, and ensures consistent presentation across all blog posts.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin operations, fallback to anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

/**
 * Apply beautiful content structure formatting
 */
function applyBeautifulContentStructure(content, title = '') {
  if (!content) return '';

  console.log(`🎨 Applying beautiful content structure...`);
  
  let formattedContent = content;

  // Step 1: Clean up malformed content and artifacts
  formattedContent = formattedContent
    // Remove problematic section headers and artifacts
    .replace(/^(Introduction|Section \d+|Conclusion|Call-to-Action):\s*/gim, '')
    .replace(/^(Hook Introduction|Summary|Overview):\s*/gim, '')
    .replace(/\bH[1-6]:\s*/gi, '')
    .replace(/Title:\s*/gi, '')
    .replace(/Hook Introduction:\s*/gi, '')
    .replace(/^#+\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/["=]{2,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Step 2: Apply premium HTML structure
  formattedContent = formattedContent
    // Enhanced headings with beautiful classes
    .replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, text) => {
      const cleanText = text.trim();
      return `<h1 class="beautiful-blog-title text-4xl md:text-5xl font-black mb-8 leading-tight"${attrs}>${cleanText}</h1>`;
    })
    .replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, text) => {
      const cleanText = text.trim();
      return `<h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12"${attrs}>${cleanText}</h2>`;
    })
    .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (match, attrs, text) => {
      const cleanText = text.trim();
      return `<h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8"${attrs}>${cleanText}</h3>`;
    });

  // Step 3: Enhanced paragraphs with beautiful typography
  formattedContent = formattedContent
    .replace(/<p([^>]*)>(.*?)<\/p>/gi, (match, attrs, text) => {
      const cleanText = text.trim();
      if (cleanText.length === 0) return '';
      return `<p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6"${attrs}>${cleanText}</p>`;
    });

  // Step 4: Beautiful lists with premium styling
  formattedContent = formattedContent
    .replace(/<ul([^>]*)>/gi, '<ul class="beautiful-prose space-y-4 my-8"$1>')
    .replace(/<ol([^>]*)>/gi, '<ol class="beautiful-prose space-y-4 my-8 counter-reset list-counter"$1>')
    .replace(/<li([^>]*)>(.*?)<\/li>/gi, (match, attrs, text) => {
      const cleanText = text.trim();
      return `<li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700"${attrs}>${cleanText}</li>`;
    });

  // Step 5: Enhanced links with beautiful styling
  formattedContent = formattedContent.replace(
    /<a([^>]*?)href="([^"]*)"([^>]*?)>(.*?)<\/a>/gi,
    (match, preAttrs, href, postAttrs, text) => {
      // Add beautiful link classes and proper attributes
      const isExternal = href.startsWith('http');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a class="beautiful-prose text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-300 underline decoration-2 underline-offset-2 hover:decoration-purple-600"${preAttrs}href="${href}"${postAttrs}${targetAttr}>${text}</a>`;
    }
  );

  // Step 6: Beautiful blockquotes
  formattedContent = formattedContent.replace(
    /<blockquote([^>]*)>(.*?)<\/blockquote>/gis,
    (match, attrs, text) => {
      const cleanText = text.trim();
      return `<blockquote class="beautiful-prose border-l-4 border-blue-500 pl-6 py-4 my-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-r-lg italic text-xl text-gray-700"${attrs}>${cleanText}</blockquote>`;
    }
  );

  // Step 7: Enhanced images with beautiful wrapper
  formattedContent = formattedContent.replace(
    /<img([^>]*?)src="([^"]*)"([^>]*?)>/gi,
    (match, preAttrs, src, postAttrs) => {
      const altMatch = match.match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      
      return `<div class="beautiful-prose my-8">
        <img class="rounded-lg shadow-lg w-full h-auto"${preAttrs}src="${src}"${postAttrs} loading="lazy">
        ${alt ? `<div class="text-center text-sm text-gray-500 mt-2 italic">${alt}</div>` : ''}
      </div>`;
    }
  );

  // Step 8: Enhanced code blocks
  formattedContent = formattedContent.replace(
    /<code([^>]*)>(.*?)<\/code>/gi,
    (match, attrs, text) => {
      return `<code class="beautiful-prose bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 px-3 py-1 rounded-lg font-mono text-sm"${attrs}>${text}</code>`;
    }
  );

  // Step 9: Apply drop cap to first paragraph
  formattedContent = formattedContent.replace(
    /<p class="beautiful-prose([^"]*)"([^>]*)>(.*?)<\/p>/,
    '<p class="beautiful-prose$1 beautiful-first-paragraph"$2>$3</p>'
  );

  // Step 10: Ensure proper spacing and structure
  formattedContent = formattedContent
    .replace(/>\s+</g, '><')
    .replace(/(<\/h[1-6]>)\s*(<p)/gi, '$1\n\n$2')
    .replace(/(<\/p>)\s*(<h[1-6])/gi, '$1\n\n$2')
    .replace(/(<\/ul>|<\/ol>)\s*(<p)/gi, '$1\n\n$2')
    .replace(/(<\/p>)\s*(<ul>|<ol>)/gi, '$1\n\n$2')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .trim();

  // Step 11: Wrap in beautiful blog wrapper
  formattedContent = `<div class="beautiful-blog-wrapper beautiful-prose max-w-none">
    ${formattedContent}
  </div>`;

  return formattedContent;
}

/**
 * Calculate content quality score
 */
function calculateContentQuality(content) {
  let score = 0;

  // HTML structure (30 points)
  if (content.includes('<h1>') || content.includes('<h2>')) {
    score += 15;
  }
  if (content.includes('<p>')) {
    score += 10;
  }
  if (content.includes('class="beautiful-')) {
    score += 15; // Beautiful classes applied
  }

  // Content organization (25 points)
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  if (wordCount > 300) {
    score += 15;
  }
  if (content.includes('<ul>') || content.includes('<ol>')) {
    score += 10;
  }

  // Links and media (25 points)
  const links = content.match(/<a[^>]*>/g) || [];
  if (links.length > 0) {
    score += 10;
    if (links.some(link => link.includes('target="_blank"'))) {
      score += 5;
    }
  }
  if (content.includes('<img')) {
    score += 10;
  }

  // Typography and styling (20 points)
  if (content.includes('beautiful-prose')) {
    score += 15;
  }
  if (!content.includes('<script>') && !content.includes('javascript:')) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Process a single blog post
 */
async function processBlogPost(post) {
  try {
    console.log(`\n📝 Processing: "${post.title || 'Untitled'}" (ID: ${post.id})`);
    
    const originalContent = post.content || '';
    const originalQuality = calculateContentQuality(originalContent);
    
    console.log(`   📊 Original quality score: ${originalQuality}/100`);
    
    // Apply beautiful content structure
    const beautifulContent = applyBeautifulContentStructure(originalContent, post.title);
    const newQuality = calculateContentQuality(beautifulContent);
    
    console.log(`   ✨ New quality score: ${newQuality}/100`);
    
    // Update the blog post with beautiful content
    const { error } = await supabase
      .from('blog_posts')
      .update({
        content: beautifulContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id);

    if (error) {
      console.error(`   ❌ Failed to update post: ${error.message}`);
      return { success: false, error: error.message, originalQuality, newQuality };
    }

    console.log(`   ✅ Successfully updated with beautiful content structure`);
    return { success: true, originalQuality, newQuality };
    
  } catch (error) {
    console.error(`   💥 Error processing post: ${error.message}`);
    return { success: false, error: error.message, originalQuality: 0, newQuality: 0 };
  }
}

/**
 * Main execution function
 */
async function forceBeautifulContentStructure() {
  try {
    console.log('🎨 Starting Beautiful Content Structure Enforcement...\n');

    // Get all blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('📭 No blog posts found to process.');
      return;
    }

    console.log(`📚 Found ${posts.length} blog posts to process\n`);

    let successful = 0;
    let failed = 0;
    let totalQualityBefore = 0;
    let totalQualityAfter = 0;

    // Process posts in batches to avoid overwhelming the database
    const batchSize = 5;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(posts.length/batchSize)}`);
      
      const batchPromises = batch.map(processBlogPost);
      const results = await Promise.all(batchPromises);
      
      results.forEach(result => {
        if (result.success) {
          successful++;
          totalQualityBefore += result.originalQuality;
          totalQualityAfter += result.newQuality;
        } else {
          failed++;
        }
      });

      // Small delay between batches
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const averageQualityBefore = totalQualityBefore / successful;
    const averageQualityAfter = totalQualityAfter / successful;

    console.log('\n🎉 Beautiful Content Structure Enforcement Complete!');
    console.log(`   📊 Total posts processed: ${posts.length}`);
    console.log(`   ✅ Successfully updated: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Average quality improvement: ${averageQualityBefore.toFixed(1)} → ${averageQualityAfter.toFixed(1)}`);
    console.log(`   🎨 All posts now use beautiful content structure!\n`);

    if (failed > 0) {
      console.log(`⚠️  Note: ${failed} posts failed to update. Check the logs above for details.`);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  forceBeautifulContentStructure()
    .then(() => {
      console.log('🎨 Beautiful content structure enforcement completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { forceBeautifulContentStructure, applyBeautifulContentStructure };
