/**
 * Free Backlink Service
 * Manages free blog posts with 24-hour auto-delete functionality
 */

import { GeneratedContentResult } from './openAIContentGenerator';

interface StoredPost extends GeneratedContentResult {
  viewCount: number;
  lastViewed?: string;
}

export class FreeBacklinkService {
  private storageKey = 'free_backlinks';
  private cleanupInterval?: number;

  constructor() {
    // Start cleanup interval to check for expired posts every hour
    this.startCleanupInterval();
    // Clean up expired posts on initialization
    this.cleanupExpiredPosts();
  }

  /**
   * Store a generated backlink for 24-hour management
   */
  storeFreeBacklink(result: GeneratedContentResult): void {
    const storedPost: StoredPost = {
      ...result,
      viewCount: 0
    };

    this.savePost(storedPost);

    console.log('✅ Free backlink stored:', {
      id: result.id,
      expiresAt: result.expiresAt,
      wordCount: result.wordCount
    });
  }

  /**
   * Get a free backlink post by ID
   */
  getPost(id: string): StoredPost | null {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === id);
    
    if (!post) {
      return null;
    }

    // Check if post has expired
    if (this.isExpired(post)) {
      this.deletePost(id);
      return null;
    }

    // Update view count and last viewed
    post.viewCount += 1;
    post.lastViewed = new Date().toISOString();
    this.savePost(post);

    return post;
  }

  /**
   * Get all non-expired posts
   */
  getAllPosts(): StoredPost[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const posts: StoredPost[] = JSON.parse(stored);
      
      // Filter out expired posts
      const validPosts = posts.filter(post => !this.isExpired(post));
      
      // Update storage if any posts were expired
      if (validPosts.length !== posts.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(validPosts));
      }
      
      return validPosts;
    } catch (error) {
      console.error('Error getting posts from storage:', error);
      return [];
    }
  }

  /**
   * Get posts that are unclaimed (not saved by users)
   */
  getUnclaimedPosts(): StoredPost[] {
    return this.getAllPosts().filter(post => post.status === 'unclaimed');
  }

  /**
   * Save a post to storage
   */
  private savePost(post: StoredPost): void {
    try {
      const posts = this.getAllPosts();
      const existingIndex = posts.findIndex(p => p.id === post.id);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = post;
      } else {
        posts.push(post);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving post to storage:', error);
    }
  }

  /**
   * Delete a post by ID
   */
  deletePost(id: string): boolean {
    try {
      const posts = this.getAllPosts();
      const filteredPosts = posts.filter(p => p.id !== id);
      
      if (filteredPosts.length !== posts.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(filteredPosts));
        console.log('🗑️ Post deleted:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  /**
   * Regenerate a post with the same parameters
   */
  regeneratePost(id: string): StoredPost | null {
    const existingPost = this.getPost(id);
    if (!existingPost) return null;

    // Delete the existing post
    this.deletePost(id);

    // Note: This method now only handles the deletion.
    // The regeneration should be done through the FreeBacklinkGenerator component
    // which will call openAIContentGenerator.generateContent() and then storeFreeBacklink()

    return null;
  }

  /**
   * Claim a post (mark as saved by user)
   */
  claimPost(id: string): boolean {
    try {
      const posts = this.getAllPosts();
      const post = posts.find(p => p.id === id);
      
      if (post && !this.isExpired(post)) {
        post.status = 'claimed';
        post.claimed = true;
        this.savePost(post);
        console.log('✅ Post claimed:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error claiming post:', error);
      return false;
    }
  }

  /**
   * Check if a post has expired (24 hours)
   */
  private isExpired(post: StoredPost): boolean {
    const now = new Date();
    const expiryDate = new Date(post.expiresAt);
    return now > expiryDate;
  }

  /**
   * Get time remaining until expiry
   */
  getTimeRemaining(post: StoredPost): {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } {
    const now = new Date().getTime();
    const expiry = new Date(post.expiresAt).getTime();
    const difference = expiry - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
  }

  /**
   * Clean up expired posts
   */
  private cleanupExpiredPosts(): void {
    try {
      const posts = this.getAllPosts();
      const validPosts = posts.filter(post => !this.isExpired(post));
      const expiredCount = posts.length - validPosts.length;
      
      if (expiredCount > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(validPosts));
        console.log(`🧹 Cleaned up ${expiredCount} expired posts`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every hour
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredPosts();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const posts = this.getAllPosts();
    const unclaimed = posts.filter(p => p.status === 'unclaimed');
    const claimed = posts.filter(p => p.status === 'claimed');
    const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);
    
    return {
      total: posts.length,
      unclaimed: unclaimed.length,
      claimed: claimed.length,
      totalViews,
      averageWordCount: posts.length ? Math.round(posts.reduce((sum, p) => sum + p.wordCount, 0) / posts.length) : 0
    };
  }

  /**
   * Check if service is ready (OpenAI configured)
   */
  isReady(): boolean {
    return simpleAIContentEngine.isConfigured();
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    return await simpleAIContentEngine.testConnection();
  }
}

export const freeBacklinkService = new FreeBacklinkService();
