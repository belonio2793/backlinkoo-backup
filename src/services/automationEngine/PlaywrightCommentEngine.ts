import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { supabase } from '@/integrations/supabase/client';

export interface BlogAccount {
  id: string;
  user_id: string;
  platform: 'substack' | 'medium' | 'wordpress' | 'generic';
  email: string;
  cookies: string;
  session_data: any;
  is_verified: boolean;
  created_at: string;
  last_used: string;
}

export interface CommentPostingJob {
  id: string;
  campaign_id: string;
  blog_url: string;
  target_keyword: string;
  target_url: string;
  account_id?: string;
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'needs_verification';
  error_message?: string;
}

export class PlaywrightCommentEngine {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor() {}

  async initialize(headless: boolean = true) {
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
  }

  async initializeWithContext(context: BrowserContext) {
    this.context = context;
    // Don't set this.browser since it's managed by the pool
  }

  async cleanup() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  // Detect platform type from URL
  detectPlatform(url: string): 'substack' | 'medium' | 'wordpress' | 'generic' {
    if (url.includes('substack.com')) return 'substack';
    if (url.includes('medium.com')) return 'medium';
    if (url.includes('wordpress.com') || url.includes('wp-')) return 'wordpress';
    return 'generic';
  }

  // Extract blog post content for contextual comment generation
  async extractBlogContent(page: Page): Promise<{ title: string; content: string }> {
    try {
      // Try common selectors for blog post titles and content
      const titleSelectors = [
        'h1', '.post-title', '.entry-title', '[data-testid="post-title"]',
        '.article-title', '.story-title'
      ];
      
      const contentSelectors = [
        '.post-content', '.entry-content', '.article-content', 
        '.story-content', 'article', '.post-body'
      ];

      let title = '';
      for (const selector of titleSelectors) {
        const element = await page.$(selector);
        if (element) {
          title = await element.textContent() || '';
          if (title.trim()) break;
        }
      }

      let content = '';
      for (const selector of contentSelectors) {
        const element = await page.$(selector);
        if (element) {
          content = await element.textContent() || '';
          if (content.trim() && content.length > 100) break;
        }
      }

      return {
        title: title.trim(),
        content: content.trim().substring(0, 1000) // First 1000 chars for context
      };
    } catch (error) {
      console.error('Error extracting blog content:', error);
      return { title: '', content: '' };
    }
  }

  // Generate contextual comment based on blog content
  async generateContextualComment(
    blogContent: { title: string; content: string },
    keyword: string,
    targetUrl: string
  ): Promise<string> {
    try {
      const response = await fetch('/.netlify/functions/generate-contextual-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogTitle: blogContent.title,
          blogContent: blogContent.content,
          keyword,
          targetUrl
        })
      });

      if (!response.ok) throw new Error('Failed to generate contextual comment');
      
      const data = await response.json();
      return data.comment;
    } catch (error) {
      console.error('Error generating contextual comment:', error);
      // Fallback to simple comment
      return `Great insights about ${keyword}! This reminds me of some excellent resources I've found at ${targetUrl}.`;
    }
  }

  // Handle Substack login and verification
  async handleSubstackLogin(page: Page, email: string): Promise<boolean> {
    try {
      console.log('Starting Substack login process...');
      
      // Look for sign in button
      const signInSelectors = [
        'text=Sign in', 'text=Log in', 'button:has-text("Sign in")',
        '[data-testid="login-button"]', '.login-button'
      ];

      let signInButton = null;
      for (const selector of signInSelectors) {
        signInButton = await page.$(selector);
        if (signInButton) break;
      }

      if (!signInButton) {
        console.log('No sign in button found');
        return false;
      }

      await signInButton.click();
      await page.waitForTimeout(2000);

      // Fill email
      const emailInput = await page.$('input[type="email"]');
      if (!emailInput) {
        console.error('Email input not found');
        return false;
      }

      await emailInput.fill(email);
      await page.waitForTimeout(1000);

      // Submit form
      const submitButton = await page.$('button[type="submit"], button:has-text("Continue")');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      // Check if verification is needed
      const needsVerification = await page.$('text=check your email') !== null ||
                               await page.$('text=magic link') !== null;

      if (needsVerification) {
        console.log('Email verification required');
        return false; // Indicates manual verification needed
      }

      return true;
    } catch (error) {
      console.error('Error during Substack login:', error);
      return false;
    }
  }

  // Post comment with context awareness
  async postComment(job: CommentPostingJob): Promise<{ success: boolean; message: string }> {
    if (!this.context) {
      await this.initialize();
    }

    const page = await this.context!.newPage();

    try {
      console.log(`Processing comment job for: ${job.blog_url}`);
      
      // Navigate to blog post
      await page.goto(job.blog_url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // Extract blog content for context
      const blogContent = await this.extractBlogContent(page);
      console.log('Extracted blog content:', { title: blogContent.title });

      // Check if login is required
      const platform = this.detectPlatform(job.blog_url);
      let loginRequired = false;

      if (platform === 'substack') {
        loginRequired = true;
        // Load saved account if available
        if (job.account_id) {
          const account = await this.loadAccount(job.account_id);
          if (account && account.cookies) {
            await this.loadCookies(page, account.cookies);
            await page.reload({ waitUntil: 'networkidle' });
          }
        }

        // Check if still need to login
        const needsLogin = await page.$('text=Sign in') !== null;
        if (needsLogin) {
          console.log('Login required for Substack');
          return { success: false, message: 'Login required - manual verification needed' };
        }
      }

      // Generate contextual comment
      const comment = await this.generateContextualComment(
        blogContent,
        job.target_keyword,
        job.target_url
      );

      console.log('Generated contextual comment:', comment);

      // Find comment form
      const commentSelectors = [
        'textarea[placeholder*="comment"]',
        'textarea[placeholder*="reply"]',
        '.comment-textarea',
        '[data-testid="comment-input"]',
        'textarea'
      ];

      let commentTextarea = null;
      for (const selector of commentSelectors) {
        commentTextarea = await page.$(selector);
        if (commentTextarea) break;
      }

      if (!commentTextarea) {
        return { success: false, message: 'Comment form not found' };
      }

      // Fill comment
      await commentTextarea.fill(comment);
      await page.waitForTimeout(2000);

      // Find and click submit button
      const submitSelectors = [
        'button:has-text("Post")', 'button:has-text("Submit")',
        'button:has-text("Reply")', '[data-testid="submit-comment"]',
        '.submit-comment', 'input[type="submit"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        submitButton = await page.$(selector);
        if (submitButton) break;
      }

      if (!submitButton) {
        return { success: false, message: 'Submit button not found' };
      }

      await submitButton.click();
      await page.waitForTimeout(5000);

      // Check for success indicators
      const successIndicators = [
        'text=comment posted', 'text=thank you', 'text=submitted',
        '.success-message', '.comment-success'
      ];

      let success = false;
      for (const indicator of successIndicators) {
        const element = await page.$(indicator);
        if (element) {
          success = true;
          break;
        }
      }

      // Save cookies if login was successful
      if (success && loginRequired && job.account_id) {
        const cookies = await page.context().cookies();
        await this.saveCookies(job.account_id, JSON.stringify(cookies));
      }

      return {
        success,
        message: success ? 'Comment posted successfully' : 'Comment posting uncertain - manual verification needed'
      };

    } catch (error) {
      console.error('Error posting comment:', error);
      return { success: false, message: `Error: ${error.message}` };
    } finally {
      await page.close();
    }
  }

  // Account management methods
  async loadAccount(accountId: string): Promise<BlogAccount | null> {
    try {
      const { data, error } = await supabase
        .from('blog_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading account:', error);
      return null;
    }
  }

  async loadCookies(page: Page, cookiesJson: string) {
    try {
      const cookies = JSON.parse(cookiesJson);
      await page.context().addCookies(cookies);
    } catch (error) {
      console.error('Error loading cookies:', error);
    }
  }

  async saveCookies(accountId: string, cookiesJson: string) {
    try {
      await supabase
        .from('blog_accounts')
        .update({ 
          cookies: cookiesJson,
          last_used: new Date().toISOString()
        })
        .eq('id', accountId);
    } catch (error) {
      console.error('Error saving cookies:', error);
    }
  }

  // Batch processing
  async processCommentJobs(jobs: CommentPostingJob[]): Promise<void> {
    console.log(`Processing ${jobs.length} comment jobs...`);
    
    for (const job of jobs) {
      try {
        await supabase
          .from('blog_comments')
          .update({ status: 'processing' })
          .eq('id', job.id);

        const result = await this.postComment(job);
        
        await supabase
          .from('blog_comments')
          .update({ 
            status: result.success ? 'posted' : 'failed',
            error_message: result.success ? null : result.message,
            posted_at: result.success ? new Date().toISOString() : null
          })
          .eq('id', job.id);

        console.log(`Job ${job.id}: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
        
        // Delay between posts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
        
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        await supabase
          .from('blog_comments')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', job.id);
      }
    }

    await this.cleanup();
  }
}

export default PlaywrightCommentEngine;
