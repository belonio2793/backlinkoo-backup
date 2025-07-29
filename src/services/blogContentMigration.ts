/**
 * Blog Content Migration Service
 * Updates existing blog posts to follow consistent HTML formatting and SEO best practices
 */

import { blogPublishingService, type BlogPost } from './blogPublishingService';
import { ContentFormatter } from '@/utils/contentFormatter';

export interface MigrationResult {
  success: boolean;
  processed: number;
  updated: number;
  errors: string[];
  details: {
    postId: string;
    slug: string;
    title: string;
    issues: string[];
    fixes: string[];
    seoScoreBefore: number;
    seoScoreAfter: number;
  }[];
}

export class BlogContentMigrationService {
  
  /**
   * Migrate all existing blog posts to use consistent formatting
   */
  static async migrateAllBlogPosts(): Promise<MigrationResult> {
    console.log('🚀 Starting blog content migration...');
    
    const result: MigrationResult = {
      success: true,
      processed: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      // Get all published blog posts
      const allPosts = await blogPublishingService.getAllBlogPosts();
      console.log(`📚 Found ${allPosts.length} blog posts to process`);

      for (const post of allPosts) {
        result.processed++;
        
        try {
          console.log(`📝 Processing: ${post.title} (${post.slug})`);
          
          // Calculate original SEO score
          const originalSeoScore = this.calculateOriginalSEOScore(post.content, post.keyword || '');
          
          // Format the content using ContentFormatter
          const formatted = ContentFormatter.formatContent(post.content, {
            keyword: post.keyword || 'content',
            anchorText: post.anchor_text || 'learn more',
            targetUrl: post.target_url || '#',
            enforceStructure: true,
            maxH1Count: 1
          });

          // Check if content actually changed
          const contentChanged = formatted.content !== post.content;
          const seoScoreChanged = Math.abs(formatted.seoScore - originalSeoScore) > 5;

          if (contentChanged || seoScoreChanged || formatted.fixes.length > 0) {
            // Update the blog post
            await blogPublishingService.updateBlogPost(post.id!, {
              content: formatted.content,
              title: formatted.title,
              seo_score: formatted.seoScore,
              word_count: formatted.wordCount,
              reading_time: Math.ceil(formatted.wordCount / 200)
            });

            result.updated++;
            console.log(`✅ Updated: ${formatted.title}`);
            console.log(`   SEO Score: ${originalSeoScore} → ${formatted.seoScore}`);
            console.log(`   Fixes applied: ${formatted.fixes.length}`);
          } else {
            console.log(`⏭️ Skipped: ${post.title} (no changes needed)`);
          }

          // Track details
          result.details.push({
            postId: post.id!,
            slug: post.slug,
            title: formatted.title,
            issues: formatted.issues,
            fixes: formatted.fixes,
            seoScoreBefore: originalSeoScore,
            seoScoreAfter: formatted.seoScore
          });

        } catch (error) {
          const errorMsg = `Failed to process post ${post.slug}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
          result.success = false;
        }
      }

      console.log(`🎉 Migration completed: ${result.updated}/${result.processed} posts updated`);
      
      return result;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  /**
   * Migrate a specific blog post by slug
   */
  static async migrateSinglePost(slug: string): Promise<MigrationResult> {
    console.log(`🚀 Migrating single post: ${slug}`);
    
    const result: MigrationResult = {
      success: true,
      processed: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const post = await blogPublishingService.getBlogPostBySlug(slug);
      if (!post) {
        result.success = false;
        result.errors.push(`Post not found: ${slug}`);
        return result;
      }

      result.processed = 1;

      // Calculate original SEO score
      const originalSeoScore = this.calculateOriginalSEOScore(post.content, post.keyword || '');
      
      // Format the content
      const formatted = ContentFormatter.formatContent(post.content, {
        keyword: post.keyword || 'content',
        anchorText: post.anchor_text || 'learn more',
        targetUrl: post.target_url || '#',
        enforceStructure: true,
        maxH1Count: 1
      });

      // Update the post
      await blogPublishingService.updateBlogPost(post.id!, {
        content: formatted.content,
        title: formatted.title,
        seo_score: formatted.seoScore,
        word_count: formatted.wordCount,
        reading_time: Math.ceil(formatted.wordCount / 200)
      });

      result.updated = 1;
      result.details.push({
        postId: post.id!,
        slug: post.slug,
        title: formatted.title,
        issues: formatted.issues,
        fixes: formatted.fixes,
        seoScoreBefore: originalSeoScore,
        seoScoreAfter: formatted.seoScore
      });

      console.log(`✅ Successfully migrated: ${formatted.title}`);
      console.log(`   SEO Score: ${originalSeoScore} → ${formatted.seoScore}`);
      console.log(`   Fixes: ${formatted.fixes.join(', ')}`);

      return result;

    } catch (error) {
      console.error(`❌ Failed to migrate post ${slug}:`, error);
      result.success = false;
      result.errors.push(`Failed to migrate ${slug}: ${error}`);
      return result;
    }
  }

  /**
   * Preview migration changes without applying them
   */
  static async previewMigration(slug?: string): Promise<{
    posts: {
      slug: string;
      title: string;
      currentSeoScore: number;
      newSeoScore: number;
      issues: string[];
      fixes: string[];
      contentPreview: string;
    }[];
  }> {
    console.log('👀 Previewing migration changes...');
    
    try {
      let posts: BlogPost[];
      
      if (slug) {
        const post = await blogPublishingService.getBlogPostBySlug(slug);
        posts = post ? [post] : [];
      } else {
        posts = await blogPublishingService.getAllBlogPosts();
      }

      const previews = posts.map(post => {
        const originalSeoScore = this.calculateOriginalSEOScore(post.content, post.keyword || '');
        
        const formatted = ContentFormatter.formatContent(post.content, {
          keyword: post.keyword || 'content',
          anchorText: post.anchor_text || 'learn more',
          targetUrl: post.target_url || '#',
          enforceStructure: true,
          maxH1Count: 1
        });

        return {
          slug: post.slug,
          title: post.title,
          currentSeoScore: originalSeoScore,
          newSeoScore: formatted.seoScore,
          issues: formatted.issues,
          fixes: formatted.fixes,
          contentPreview: formatted.content.substring(0, 500) + '...'
        };
      });

      return { posts: previews };

    } catch (error) {
      console.error('❌ Preview failed:', error);
      return { posts: [] };
    }
  }

  /**
   * Check content formatting issues without fixing them
   */
  static async analyzeBlogContent(): Promise<{
    totalPosts: number;
    postsWithIssues: number;
    commonIssues: Record<string, number>;
    averageSeoScore: number;
    details: {
      slug: string;
      title: string;
      seoScore: number;
      issues: string[];
      wordCount: number;
    }[];
  }> {
    console.log('🔍 Analyzing blog content...');
    
    try {
      const posts = await blogPublishingService.getAllBlogPosts();
      const commonIssues: Record<string, number> = {};
      let totalSeoScore = 0;
      let postsWithIssues = 0;

      const details = posts.map(post => {
        const seoScore = this.calculateOriginalSEOScore(post.content, post.keyword || '');
        const formatted = ContentFormatter.formatContent(post.content, {
          keyword: post.keyword || 'content',
          anchorText: post.anchor_text || 'learn more',
          targetUrl: post.target_url || '#',
          enforceStructure: false // Just analyze, don't fix
        });

        totalSeoScore += seoScore;
        
        if (formatted.issues.length > 0) {
          postsWithIssues++;
          formatted.issues.forEach(issue => {
            commonIssues[issue] = (commonIssues[issue] || 0) + 1;
          });
        }

        return {
          slug: post.slug,
          title: post.title,
          seoScore,
          issues: formatted.issues,
          wordCount: ContentFormatter['countWords'](post.content)
        };
      });

      return {
        totalPosts: posts.length,
        postsWithIssues,
        commonIssues,
        averageSeoScore: Math.round(totalSeoScore / posts.length),
        details
      };

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return {
        totalPosts: 0,
        postsWithIssues: 0,
        commonIssues: {},
        averageSeoScore: 0,
        details: []
      };
    }
  }

  /**
   * Calculate original SEO score (simpler version for comparison)
   */
  private static calculateOriginalSEOScore(content: string, keyword: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Basic scoring for comparison
    const h1Count = (content.match(/<h1/g) || []).length;
    if (h1Count === 1) score += 15;
    else if (h1Count > 1) score -= 10;

    const h2Count = (content.match(/<h2/g) || []).length;
    if (h2Count >= 2) score += 15;

    const keywordCount = keyword ? (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length : 0;
    if (keywordCount >= 3) score += 20;

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    if (wordCount >= 1000) score += 15;

    if (content.includes('<strong>')) score += 5;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 5;
    
    const linkCount = (content.match(/<a href=/g) || []).length;
    if (linkCount >= 1) score += 10;

    return Math.min(score, 100);
  }
}

// Make functions globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).migrateBlogPosts = BlogContentMigrationService.migrateAllBlogPosts;
  (window as any).analyzeBlogContent = BlogContentMigrationService.analyzeBlogContent;
  (window as any).previewMigration = BlogContentMigrationService.previewMigration;
  console.log('💡 Blog migration tools available!');
  console.log('   - migrateBlogPosts() - Migrate all posts');
  console.log('   - analyzeBlogContent() - Analyze current content');
  console.log('   - previewMigration() - Preview changes');
}

export default BlogContentMigrationService;
