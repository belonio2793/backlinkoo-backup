/**
 * Premium SEO Score Utility
 * Handles logic for determining if a blog post should have a 100/100 SEO score based on premium user status
 */

import { PremiumService } from '@/services/premiumService';

export interface BlogPost {
  id: string;
  user_id: string | null;
  seo_score: number;
  title: string;
  content: string;
  meta_description?: string | null;
  keywords?: string[];
}

/**
 * Calculate the effective SEO score for a blog post
 * Returns 100 if the post was created by a premium user, otherwise returns the actual score
 */
export async function calculateEffectiveSEOScore(blogPost: BlogPost): Promise<number> {
  try {
    // If no user_id, return the original score
    if (!blogPost.user_id) {
      return blogPost.seo_score || 0;
    }

    // Check if the user who created this post is premium
    const isPremium = await PremiumService.checkPremiumStatus(blogPost.user_id);
    
    if (isPremium) {
      console.log(`✨ Premium user content detected for post ${blogPost.id}, setting SEO score to 100`);
      return 100;
    }

    // Return original score for non-premium users
    return blogPost.seo_score || 0;
  } catch (error) {
    console.error('Error checking premium status for SEO score:', error);
    // Fall back to original score if there's an error
    return blogPost.seo_score || 0;
  }
}

/**
 * Synchronous version that uses cached premium status
 * Use this when premium status is already known
 */
export function calculateEffectiveSEOScoreSync(
  originalScore: number, 
  isPremiumUser: boolean
): number {
  if (isPremiumUser) {
    return 100;
  }
  return originalScore || 0;
}

/**
 * Check if a score should be displayed as premium (100/100)
 */
export function isPremiumSEOScore(score: number): boolean {
  return score === 100;
}

/**
 * Get premium badge text for SEO scores
 */
export function getPremiumSEOBadgeText(score: number): string {
  if (score === 100) {
    return "Premium SEO: 100/100";
  }
  return `SEO Score: ${score}/100`;
}
