/**
 * Unified Blog Workflow Manager
 * Consolidates blog generation, auth, and post management into a single efficient flow
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthService } from './authService';
import { openAIContentGenerator } from './openAIContentGenerator';
import type { User } from '@supabase/supabase-js';

export interface BlogGenerationRequest {
  targetUrl: string;
  keywords: string;
  contentType?: 'blog' | 'article' | 'review';
  tone?: 'professional' | 'casual' | 'technical';
  wordCount?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  targetUrl: string;
  keywords: string;
  status: 'draft' | 'saved' | 'published';
  userId?: string;
  createdAt: string;
  expiresAt?: string; // For drafts only
  wordCount: number;
  isGuest: boolean;
}

export interface WorkflowResult {
  success: boolean;
  post?: BlogPost;
  error?: string;
  requiresAuth?: boolean;
  authUrl?: string;
}

export class BlogWorkflowManager {
  private static readonly DRAFT_EXPIRY_HOURS = 24;

  /**
   * Main workflow entry point - handles the entire blog generation flow
   */
  static async generateBlog(
    request: BlogGenerationRequest,
    options: {
      requireAuth?: boolean;
      saveImmediately?: boolean;
    } = {}
  ): Promise<WorkflowResult> {
    try {
      console.log('🚀 BlogWorkflow: Starting generation flow', request);

      // Step 1: Check authentication status
      const { session, user } = await AuthService.getCurrentSession();
      const isAuthenticated = !!user && await AuthService.isEmailVerified();

      // Step 2: Handle auth requirements
      if (options.requireAuth && !isAuthenticated) {
        return {
          success: false,
          requiresAuth: true,
          error: 'Authentication required to save posts permanently'
        };
      }

      // Step 3: Generate content using unified AI service
      const contentResult = await openAIContentGenerator.generateContent({
        targetUrl: request.targetUrl,
        keywords: request.keywords,
        contentType: request.contentType || 'blog',
        tone: request.tone || 'professional',
        wordCount: request.wordCount || 800
      });

      if (!contentResult.success || !contentResult.content) {
        return {
          success: false,
          error: contentResult.error || 'Failed to generate content'
        };
      }

      // Step 4: Create blog post object
      const now = new Date();
      const post: BlogPost = {
        id: '', // Will be set by database after insertion
        title: contentResult.title || this.extractTitle(contentResult.content),
        content: contentResult.content,
        targetUrl: request.targetUrl,
        keywords: request.keywords,
        status: options.saveImmediately && isAuthenticated ? 'saved' : 'draft',
        userId: user?.id,
        createdAt: now.toISOString(),
        expiresAt: (!options.saveImmediately || !isAuthenticated) 
          ? new Date(now.getTime() + (this.DRAFT_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
          : undefined,
        wordCount: this.countWords(contentResult.content),
        isGuest: !isAuthenticated
      };

      // Step 5: Store the post
      const storeResult = await this.storePost(post);
      if (!storeResult.success) {
        return {
          success: false,
          error: storeResult.error
        };
      }

      console.log('✅ BlogWorkflow: Post generated and stored', {
        id: post.id,
        status: post.status,
        userId: post.userId,
        expiresAt: post.expiresAt
      });

      return {
        success: true,
        post
      };

    } catch (error: any) {
      console.error('❌ BlogWorkflow: Generation failed', error);
      return {
        success: false,
        error: error.message || 'Failed to generate blog post'
      };
    }
  }

  /**
   * Save a draft post permanently (requires auth)
   */
  static async savePost(postId: string): Promise<WorkflowResult> {
    try {
      const { user } = await AuthService.getCurrentSession();
      const isAuthenticated = !!user && await AuthService.isEmailVerified();

      if (!isAuthenticated) {
        return {
          success: false,
          requiresAuth: true,
          error: 'Authentication required to save posts'
        };
      }

      // Get the current post
      const post = await this.getPost(postId);
      if (!post) {
        return {
          success: false,
          error: 'Post not found or has expired'
        };
      }

      // Check user's saved post limit (5 posts max)
      const userPostCount = await this.getUserPostCount(user.id);
      if (userPostCount >= 5) {
        return {
          success: false,
          error: 'Maximum of 5 saved posts reached. Please delete some posts first.'
        };
      }

      // Update post to saved status
      const updatedPost: BlogPost = {
        ...post,
        status: 'saved',
        userId: user.id,
        expiresAt: undefined, // Remove expiry
        isGuest: false
      };

      const storeResult = await this.storePost(updatedPost);
      
      return {
        success: storeResult.success,
        post: updatedPost,
        error: storeResult.error
      };

    } catch (error: any) {
      console.error('❌ BlogWorkflow: Save failed', error);
      return {
        success: false,
        error: error.message || 'Failed to save post'
      };
    }
  }

  /**
   * Get a post by ID
   */
  static async getPost(postId: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error || !data) {
        console.warn('BlogWorkflow: Post not found', postId);
        return null;
      }

      // Check if draft post has expired
      if (data.status === 'draft' && data.expires_at) {
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        if (now > expiresAt) {
          await this.deletePost(postId);
          return null;
        }
      }

      return this.mapDatabaseToPost(data);
    } catch (error) {
      console.error('BlogWorkflow: Error getting post', error);
      return null;
    }
  }

  /**
   * Get user's posts
   */
  static async getUserPosts(userId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('BlogWorkflow: Error getting user posts', error);
        return [];
      }

      return data?.map(this.mapDatabaseToPost) || [];
    } catch (error) {
      console.error('BlogWorkflow: Error getting user posts', error);
      return [];
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup expired drafts (called by scheduled function)
   */
  static async cleanupExpiredDrafts(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('status', 'draft')
        .lt('expires_at', now)
        .select('id');

      if (error) {
        return { success: false, deletedCount: 0, error: error.message };
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 BlogWorkflow: Cleaned up ${deletedCount} expired drafts`);

      return { success: true, deletedCount };
    } catch (error: any) {
      return { success: false, deletedCount: 0, error: error.message };
    }
  }

  // Private helper methods

  private static async storePost(post: BlogPost): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          content: post.content,
          target_url: post.targetUrl,
          keywords: post.keywords,
          status: post.status,
          user_id: post.userId,
          created_at: post.createdAt,
          expires_at: post.expiresAt,
          word_count: post.wordCount,
          is_guest: post.isGuest
        })
        .select()
        .single();

      // Update the post object with the database-generated ID
      if (data) {
        post.id = data.id;
      }

      if (error) {
        console.error('BlogWorkflow: Storage error', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('BlogWorkflow: Storage exception', error);
      return { success: false, error: error.message };
    }
  }

  private static async getUserPostCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'saved');

      if (error) {
        console.error('BlogWorkflow: Error counting user posts', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('BlogWorkflow: Error counting user posts', error);
      return 0;
    }
  }

  private static mapDatabaseToPost(data: any): BlogPost {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      targetUrl: data.target_url,
      keywords: data.keywords,
      status: data.status,
      userId: data.user_id,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      wordCount: data.word_count,
      isGuest: data.is_guest
    };
  }



  private static extractTitle(content: string): string {
    const lines = content.split('\n');
    const firstHeading = lines.find(line => line.startsWith('#'));
    if (firstHeading) {
      let title = firstHeading.replace(/^#+\s*/, '').trim();
      // Clean Title: prefixes and markdown artifacts
      title = title
        .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1') // Remove **Title:** wrapper and extract content
        .replace(/^\*\*H1\*\*:\s*/i, '')
        .replace(/^\*\*Title\*\*:\s*/i, '') // Remove **Title**: prefix
        .replace(/^Title:\s*/gi, '') // Remove Title: prefix (global + case insensitive)
        .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
        .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
        .replace(/\*\*/g, '') // Remove any remaining ** symbols
        .replace(/\*/g, '') // Remove any remaining * symbols
        .trim();
      return title;
    }

    // Fallback: use first 60 characters
    return content.substring(0, 60).trim() + '...';
  }

  private static countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }
}
