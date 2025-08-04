/**
 * SEO Sync Service
 * Provides real-time SEO score calculation and synchronization
 */

import { SEOAnalyzer, SEOAnalysisResult } from './seoAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlogPostData {
  id?: string;
  title: string;
  content: string;
  meta_description?: string;
  target_keyword?: string;
  slug?: string;
}

export interface SEOSyncResult {
  success: boolean;
  seoScore: number;
  analysis: SEOAnalysisResult;
  message?: string;
  error?: string;
}

export class SEOSyncService {
  private static analysisCache = new Map<string, { analysis: SEOAnalysisResult; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 seconds
  private static syncInProgress = new Set<string>();

  /**
   * Calculate and sync SEO score for a blog post
   */
  static async calculateAndSyncSEO(postData: BlogPostData): Promise<SEOSyncResult> {
    const cacheKey = this.generateCacheKey(postData);
    
    try {
      // Check cache first
      const cached = this.getCachedAnalysis(cacheKey);
      if (cached) {
        return {
          success: true,
          seoScore: cached.overallScore,
          analysis: cached
        };
      }

      // Prevent duplicate analysis for the same content
      if (this.syncInProgress.has(cacheKey)) {
        await this.waitForSync(cacheKey);
        const cachedAfterWait = this.getCachedAnalysis(cacheKey);
        if (cachedAfterWait) {
          return {
            success: true,
            seoScore: cachedAfterWait.overallScore,
            analysis: cachedAfterWait
          };
        }
      }

      this.syncInProgress.add(cacheKey);

      // Perform SEO analysis
      const analysis = SEOAnalyzer.analyzeBlogPost(
        postData.title,
        postData.content,
        postData.meta_description,
        postData.target_keyword
      );

      // Cache the result
      this.cacheAnalysis(cacheKey, analysis);

      // Update database if post ID exists
      if (postData.id) {
        await this.updateDatabaseSEOScore(postData.id, analysis.overallScore);
      }

      this.syncInProgress.delete(cacheKey);

      return {
        success: true,
        seoScore: analysis.overallScore,
        analysis,
        message: `SEO score calculated: ${analysis.overallScore}/100`
      };

    } catch (error) {
      this.syncInProgress.delete(cacheKey);
      console.error('SEO sync failed:', error);
      
      return {
        success: false,
        seoScore: 0,
        analysis: this.getDefaultAnalysis(),
        error: 'Failed to calculate SEO score'
      };
    }
  }

  /**
   * Real-time SEO analysis for content being edited
   */
  static analyzeContentRealTime(
    title: string,
    content: string,
    metaDescription?: string,
    targetKeyword?: string
  ): SEOAnalysisResult {
    const cacheKey = this.generateCacheKey({ title, content, meta_description: metaDescription, target_keyword: targetKeyword });
    
    // Check cache for quick response
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform analysis
    const analysis = SEOAnalyzer.analyzeBlogPost(title, content, metaDescription, targetKeyword);
    
    // Cache for short duration (real-time editing)
    this.cacheAnalysis(cacheKey, analysis, 10000); // 10 seconds for real-time
    
    return analysis;
  }

  /**
   * Batch sync SEO scores for multiple posts
   */
  static async batchSyncSEOScores(posts: BlogPostData[]): Promise<SEOSyncResult[]> {
    const results: SEOSyncResult[] = [];
    const batchSize = 5; // Process in batches to avoid overwhelming

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchPromises = batch.map(post => this.calculateAndSyncSEO(post));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            seoScore: 0,
            analysis: this.getDefaultAnalysis(),
            error: `Failed to process post: ${batch[index].title}`
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Subscribe to real-time content changes and auto-sync SEO
   */
  static createRealTimeSync(
    postData: BlogPostData,
    onUpdate: (result: SEOSyncResult) => void,
    debounceMs: number = 1000
  ): () => void {
    let timeoutId: NodeJS.Timeout;
    let lastContent = { ...postData };

    const performSync = async () => {
      // Only sync if content actually changed
      if (this.hasContentChanged(lastContent, postData)) {
        lastContent = { ...postData };
        const result = await this.calculateAndSyncSEO(postData);
        onUpdate(result);
      }
    };

    const scheduleSync = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performSync, debounceMs);
    };

    // Initial sync
    scheduleSync();

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }

  /**
   * Get SEO improvement suggestions based on current score
   */
  static getSEOImprovementPlan(analysis: SEOAnalysisResult): {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    impact: string;
  }[] {
    const improvements = [];

    // High priority improvements
    if (analysis.titleScore < 70) {
      improvements.push({
        priority: 'high' as const,
        category: 'Title Optimization',
        action: 'Optimize title length (30-60 characters) and include target keyword',
        impact: 'High impact on click-through rates and rankings'
      });
    }

    if (analysis.metaScore < 50) {
      improvements.push({
        priority: 'high' as const,
        category: 'Meta Description',
        action: 'Add compelling meta description (150-160 characters) with target keyword',
        impact: 'Improves search snippet and click-through rates'
      });
    }

    // Medium priority improvements
    if (analysis.structureScore < 70) {
      improvements.push({
        priority: 'medium' as const,
        category: 'Content Structure',
        action: 'Add proper heading hierarchy (H1, H2, H3) and break into shorter paragraphs',
        impact: 'Better user experience and search engine understanding'
      });
    }

    if (analysis.contentScore < 70) {
      improvements.push({
        priority: 'medium' as const,
        category: 'Content Quality',
        action: 'Increase content length (300+ words) and improve keyword density (0.5-3%)',
        impact: 'More comprehensive content ranks better'
      });
    }

    // Low priority improvements
    if (analysis.readabilityScore < 60) {
      improvements.push({
        priority: 'low' as const,
        category: 'Readability',
        action: 'Use shorter sentences and simpler words for better readability',
        impact: 'Improves user engagement and time on page'
      });
    }

    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Private helper methods
   */
  private static generateCacheKey(postData: Partial<BlogPostData>): string {
    const content = `${postData.title}|${postData.content}|${postData.meta_description || ''}|${postData.target_keyword || ''}`;
    return btoa(content).slice(0, 32); // Simple hash-like key
  }

  private static getCachedAnalysis(key: string): SEOAnalysisResult | null {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.analysis;
    }
    this.analysisCache.delete(key);
    return null;
  }

  private static cacheAnalysis(key: string, analysis: SEOAnalysisResult, duration?: number): void {
    this.analysisCache.set(key, {
      analysis,
      timestamp: Date.now()
    });

    // Auto-cleanup after cache duration
    setTimeout(() => {
      this.analysisCache.delete(key);
    }, duration || this.CACHE_DURATION);
  }

  private static async updateDatabaseSEOScore(postId: string, seoScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ seo_score: seoScore })
        .eq('id', postId);

      if (error) {
        console.error('Failed to update SEO score in database:', error);
      }
    } catch (error) {
      console.error('Database update error:', error);
    }
  }

  private static async waitForSync(key: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.syncInProgress.has(key)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  private static hasContentChanged(prev: Partial<BlogPostData>, current: Partial<BlogPostData>): boolean {
    return (
      prev.title !== current.title ||
      prev.content !== current.content ||
      prev.meta_description !== current.meta_description ||
      prev.target_keyword !== current.target_keyword
    );
  }

  private static getDefaultAnalysis(): SEOAnalysisResult {
    return {
      overallScore: 0,
      titleScore: 0,
      contentScore: 0,
      keywordScore: 0,
      structureScore: 0,
      readabilityScore: 0,
      metaScore: 0,
      recommendations: ['Unable to analyze content'],
      details: {
        title: {
          length: 0,
          optimalLength: false,
          hasKeywords: false,
          isDescriptive: false
        },
        content: {
          wordCount: 0,
          optimalLength: false,
          hasHeadings: false,
          hasList: false,
          keywordDensity: 0,
          readingLevel: 'Unknown'
        },
        structure: {
          hasH1: false,
          hasH2: false,
          hasH3: false,
          paragraphCount: 0,
          averageParagraphLength: 0
        },
        meta: {
          hasMetaDescription: false,
          metaDescriptionLength: 0,
          hasTargetKeyword: false
        }
      }
    };
  }
}
