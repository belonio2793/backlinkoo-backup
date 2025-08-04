/**
 * Utility to recalculate SEO scores for existing blog posts
 */

import { supabase } from '@/integrations/supabase/client';
import { SEOAnalyzer } from '@/services/seoAnalyzer';

export interface SEORecalculationResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
  details: Array<{
    id: string;
    title: string;
    oldScore: number;
    newScore: number;
  }>;
}

export class SEOScoreRecalculator {
  /**
   * Recalculate SEO scores for all blog posts
   */
  static async recalculateAllScores(): Promise<SEORecalculationResult> {
    const result: SEORecalculationResult = {
      success: false,
      updatedCount: 0,
      errors: [],
      details: []
    };

    try {
      // Fetch all blog posts
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, meta_description, keywords, seo_score')
        .eq('status', 'published');

      if (error) {
        result.errors.push(`Failed to fetch posts: ${error.message}`);
        return result;
      }

      if (!posts || posts.length === 0) {
        result.success = true;
        return result;
      }

      // Process each post
      for (const post of posts) {
        try {
          const analysis = SEOAnalyzer.analyzeBlogPost(
            post.title,
            post.content || '',
            post.meta_description || undefined,
            post.keywords?.[0]
          );

          const newScore = analysis.overallScore;
          const oldScore = post.seo_score || 0;

          // Update the score in database
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ seo_score: newScore })
            .eq('id', post.id);

          if (updateError) {
            result.errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
            continue;
          }

          result.details.push({
            id: post.id,
            title: post.title,
            oldScore,
            newScore
          });

          result.updatedCount++;
        } catch (error: any) {
          result.errors.push(`Error processing post ${post.id}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error: any) {
      result.errors.push(`General error: ${error.message}`);
      return result;
    }
  }

  /**
   * Recalculate SEO score for a single post
   */
  static async recalculatePostScore(postId: string): Promise<{
    success: boolean;
    oldScore?: number;
    newScore?: number;
    error?: string;
  }> {
    try {
      // Fetch the post
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, meta_description, keywords, seo_score')
        .eq('id', postId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!post) {
        return { success: false, error: 'Post not found' };
      }

      const analysis = SEOAnalyzer.analyzeBlogPost(
        post.title,
        post.content || '',
        post.meta_description || undefined,
        post.keywords?.[0]
      );

      const newScore = analysis.overallScore;
      const oldScore = post.seo_score || 0;

      // Update the score
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ seo_score: newScore })
        .eq('id', postId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        oldScore,
        newScore
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SEO improvement suggestions for a post
   */
  static async getImprovementSuggestions(postId: string): Promise<{
    success: boolean;
    analysis?: any;
    error?: string;
  }> {
    try {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('title, content, meta_description, keywords')
        .eq('id', postId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!post) {
        return { success: false, error: 'Post not found' };
      }

      const analysis = SEOAnalyzer.analyzeBlogPost(
        post.title,
        post.content || '',
        post.meta_description || undefined,
        post.keywords?.[0]
      );

      return {
        success: true,
        analysis
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
