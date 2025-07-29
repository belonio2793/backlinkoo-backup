import { supabase } from '@/integrations/supabase/client';
import { AuthService } from './authService';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  target_url: string;
  keywords: string[];
  created_at: string;
  expires_at: string;
  is_trial_post: boolean;
}

interface ConversionResult {
  success: boolean;
  error?: string;
  user?: any;
  convertedPosts?: number;
}

export class TrialConversionService {
  /**
   * Get all trial posts from localStorage
   */
  static getTrialPosts(): TrialPost[] {
    try {
      const storedPosts = localStorage.getItem('all_blog_posts');
      if (!storedPosts) return [];

      const posts: TrialPost[] = JSON.parse(storedPosts);
      return posts.filter(post => post.is_trial_post && new Date() < new Date(post.expires_at));
    } catch (error) {
      console.error('Error getting trial posts:', error);
      return [];
    }
  }

  /**
   * Convert trial posts to permanent posts in database
   */
  static async convertTrialPostsToPermanent(userId: string): Promise<{ success: boolean; convertedCount: number; errors: string[] }> {
    const trialPosts = this.getTrialPosts();
    let convertedCount = 0;
    const errors: string[] = [];

    if (trialPosts.length === 0) {
      return { success: true, convertedCount: 0, errors: [] };
    }

    for (const post of trialPosts) {
      try {
        // Insert the post into the database as a permanent post
        const { error } = await supabase.from('blog_posts').insert({
          user_id: userId,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          target_url: post.target_url,
          keywords: post.keywords,
          is_published: true,
          is_trial_post: false, // Convert to permanent
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (error) {
          const errorMessage = error?.message || String(error) || 'Unknown database error';
          console.error('Error converting trial post:', {
            message: errorMessage,
            name: error?.name,
            code: error?.code,
            details: error?.details
          });
          errors.push(`Failed to convert "${post.title}": ${errorMessage}`);
        } else {
          convertedCount++;
        }
      } catch (error: any) {
        const errorMessage = error?.message || String(error) || 'Unknown error';
        console.error('Exception converting trial post:', {
          message: errorMessage,
          name: error?.name,
          stack: error?.stack
        });
        errors.push(`Failed to convert "${post.title}": ${errorMessage}`);
      }
    }

    return { success: convertedCount > 0, convertedCount, errors };
  }

  /**
   * One-click trial to account conversion
   */
  static async convertTrialToAccount(email: string, password: string, firstName: string): Promise<ConversionResult> {
    try {
      // Get trial posts before signup (they might be cleared after auth)
      const trialPosts = this.getTrialPosts();

      // Create new account
      const signupResult = await AuthService.signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim()
      });

      if (!signupResult.success || !signupResult.user) {
        return {
          success: false,
          error: signupResult.error || 'Failed to create account'
        };
      }

      // Convert trial posts to permanent if user is immediately verified
      let convertedPosts = 0;
      if (signupResult.user.email_confirmed_at) {
        const conversionResult = await this.convertTrialPostsToPermanent(signupResult.user.id);
        convertedPosts = conversionResult.convertedCount;
        
        if (conversionResult.errors.length > 0) {
          console.warn('Some posts failed to convert:', conversionResult.errors);
        }
      }

      // Clear trial posts from localStorage since they're now in database
      if (convertedPosts > 0) {
        localStorage.removeItem('all_blog_posts');
        localStorage.removeItem('trial_blog_posts');
      }

      return {
        success: true,
        user: signupResult.user,
        convertedPosts
      };

    } catch (error: any) {
      console.error('Trial conversion error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during conversion'
      };
    }
  }

  /**
   * Check if user has trial posts that can be converted
   */
  static hasConvertibleTrialPosts(): boolean {
    const trialPosts = this.getTrialPosts();
    return trialPosts.length > 0;
  }

  /**
   * Get trial post stats for display
   */
  static getTrialStats(): { totalPosts: number; expiringPosts: number; urgentPosts: number } {
    const trialPosts = this.getTrialPosts();
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return {
      totalPosts: trialPosts.length,
      expiringPosts: trialPosts.filter(post => new Date(post.expires_at) < twoHoursFromNow).length,
      urgentPosts: trialPosts.filter(post => new Date(post.expires_at) < oneHourFromNow).length
    };
  }

  /**
   * Get next expiring trial post
   */
  static getNextExpiringPost(): TrialPost | null {
    const trialPosts = this.getTrialPosts();
    if (trialPosts.length === 0) return null;

    return trialPosts.reduce((earliest, post) => {
      return new Date(post.expires_at) < new Date(earliest.expires_at) ? post : earliest;
    });
  }

  /**
   * Mark trial posts for conversion tracking
   */
  static markTrialPostsForConversion(): void {
    try {
      const trialPosts = this.getTrialPosts();
      if (trialPosts.length > 0) {
        localStorage.setItem('pending_trial_conversion', JSON.stringify({
          posts: trialPosts,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error marking trial posts for conversion:', error);
    }
  }

  /**
   * Complete trial conversion after email verification
   */
  static async completePendingConversion(userId: string): Promise<{ success: boolean; convertedCount: number }> {
    try {
      const pendingData = localStorage.getItem('pending_trial_conversion');
      if (!pendingData) {
        return { success: false, convertedCount: 0 };
      }

      const { posts } = JSON.parse(pendingData);
      
      // Convert the posts to permanent
      const conversionResult = await this.convertTrialPostsToPermanent(userId);
      
      // Clean up tracking data
      localStorage.removeItem('pending_trial_conversion');
      localStorage.removeItem('all_blog_posts');
      localStorage.removeItem('trial_blog_posts');

      return {
        success: conversionResult.success,
        convertedCount: conversionResult.convertedCount
      };

    } catch (error) {
      console.error('Error completing pending conversion:', error);
      return { success: false, convertedCount: 0 };
    }
  }
}
