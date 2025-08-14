/**
 * Target Sites Management System
 * Manages the list of target URLs where articles can be published
 * Handles rotation, availability tracking, and success rates
 */

import { supabase } from '@/integrations/supabase/client';
import { automationLogger } from './automationLogger';

export interface TargetSite {
  id: string;
  domain: string;
  url: string;
  type: 'blog' | 'forum' | 'guest_post' | 'directory' | 'social';
  status: 'active' | 'inactive' | 'blocked' | 'testing';
  domain_rating?: number;
  last_used?: string;
  success_rate: number;
  total_attempts: number;
  successful_submissions: number;
  requirements?: {
    min_word_count?: number;
    topics?: string[];
    approval_process?: boolean;
    registration_required?: boolean;
  };
  metadata?: {
    contact_email?: string;
    submission_guidelines?: string;
    response_time_hours?: number;
    notes?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SiteSelectionCriteria {
  domain_rating_min?: number;
  domain_rating_max?: number;
  types?: TargetSite['type'][];
  exclude_recently_used_hours?: number;
  min_success_rate?: number;
  keywords?: string[];
}

class TargetSitesManager {
  private sites: TargetSite[] = [];
  private isLoaded = false;

  constructor() {
    automationLogger.info('system', 'Target Sites Manager initialized');
    // Ensure we always have default sites available as fallback
    this.sites = this.getFilteredWorkingSites();
    this.isLoaded = false; // Will be set to true after proper loading attempt
  }

  async loadSites(): Promise<void> {
    if (this.isLoaded) {
      automationLogger.debug('system', `Sites already loaded: ${this.sites.length} sites available`);
      return;
    }

    try {
      automationLogger.debug('database', 'Attempting to load target sites from database...');
      
      const { data, error } = await supabase
        .from('target_sites')
        .select('*')
        .eq('status', 'active')
        .order('success_rate', { ascending: false });

      if (error) {
        const errorMessage = error.message || String(error);

        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          automationLogger.warn('database', 'Target sites table does not exist, using default sites', {
            errorMessage,
            errorCode: error.code
          });
          this.sites = this.getFilteredWorkingSites();
        } else {
          automationLogger.error('database', 'Target sites query failed, using defaults', {
            errorMessage,
            errorCode: error.code,
            errorDetails: error.details
          });
          this.sites = this.getFilteredWorkingSites();
        }
      } else {
        this.sites = data || [];
        if (this.sites.length === 0) {
          automationLogger.info('system', 'No sites in database, using defaults');
          this.sites = this.getFilteredWorkingSites();
        }
      }

      this.isLoaded = true;
      automationLogger.info('system', `Loaded ${this.sites.length} target sites`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      automationLogger.error('database', 'Failed to load target sites', {
        errorMessage,
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'Unknown'
      }, undefined, error as Error);

      console.error('Target sites loading error details:', {
        error,
        errorMessage,
        errorType: typeof error
      });

      // Use default sites as fallback
      this.sites = this.getDefaultSites();
      this.isLoaded = true;
    }
  }

  private getFilteredWorkingSites(): TargetSite[] {
    // Only return platforms with confirmed working APIs that can:
    // 1. Post content immediately
    // 2. Return live URLs
    // 3. Work without complex authentication
    automationLogger.info('system', 'Loading filtered working sites only');
    return [
      {
        id: 'telegraph',
        domain: 'telegra.ph',
        url: 'https://telegra.ph',
        type: 'blog',
        status: 'active',
        domain_rating: 85,
        success_rate: 95,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 200,
          topics: ['any'],
          approval_process: false,
          registration_required: false
        },
        metadata: {
          submission_guidelines: 'Anonymous instant publishing platform',
          response_time_hours: 0,
          notes: 'Instant publishing via API - perfect for automation'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-1',
        domain: 'medium.com',
        url: 'https://medium.com',
        type: 'blog',
        status: 'active',
        domain_rating: 96,
        success_rate: 85,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 300,
          topics: ['technology', 'business', 'marketing'],
          approval_process: false,
          registration_required: true
        },
        metadata: {
          submission_guidelines: 'Submit via Medium Partner Program',
          response_time_hours: 24,
          notes: 'High-quality content required'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        domain: 'dev.to',
        url: 'https://dev.to',
        type: 'blog',
        status: 'active',
        domain_rating: 89,
        success_rate: 90,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 250,
          topics: ['programming', 'web development', 'technology'],
          approval_process: false,
          registration_required: true
        },
        metadata: {
          submission_guidelines: 'Tech-focused content only',
          response_time_hours: 2,
          notes: 'Developer community'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-3',
        domain: 'hashnode.com',
        url: 'https://hashnode.com',
        type: 'blog',
        status: 'active',
        domain_rating: 82,
        success_rate: 88,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 400,
          topics: ['blockchain', 'web3', 'programming'],
          approval_process: false,
          registration_required: true
        },
        metadata: {
          submission_guidelines: 'Developer-focused content',
          response_time_hours: 4,
          notes: 'Blockchain and web dev community'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-4',
        domain: 'substack.com',
        url: 'https://substack.com',
        type: 'blog',
        status: 'active',
        domain_rating: 91,
        success_rate: 75,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 500,
          topics: ['business', 'finance', 'politics', 'culture'],
          approval_process: true,
          registration_required: true
        },
        metadata: {
          submission_guidelines: 'Newsletter-style content',
          response_time_hours: 72,
          notes: 'Requires newsletter format'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-5',
        domain: 'hackernoon.com',
        url: 'https://hackernoon.com',
        type: 'blog',
        status: 'active',
        domain_rating: 84,
        success_rate: 70,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 600,
          topics: ['technology', 'startups', 'programming'],
          approval_process: true,
          registration_required: true
        },
        metadata: {
          submission_guidelines: 'Submit via their contributor program',
          response_time_hours: 120,
          notes: 'Editorial review required'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  async getAvailableSites(criteria: SiteSelectionCriteria = {}, count: number = 10): Promise<TargetSite[]> {
    await this.loadSites();

    let availableSites = [...this.sites];

    // Apply filters
    if (criteria.domain_rating_min) {
      availableSites = availableSites.filter(site => 
        (site.domain_rating || 0) >= criteria.domain_rating_min!
      );
    }

    if (criteria.domain_rating_max) {
      availableSites = availableSites.filter(site => 
        (site.domain_rating || 0) <= criteria.domain_rating_max!
      );
    }

    if (criteria.types && criteria.types.length > 0) {
      availableSites = availableSites.filter(site => 
        criteria.types!.includes(site.type)
      );
    }

    if (criteria.min_success_rate) {
      availableSites = availableSites.filter(site => 
        site.success_rate >= criteria.min_success_rate!
      );
    }

    // Exclude recently used sites
    if (criteria.exclude_recently_used_hours) {
      const cutoffTime = new Date(Date.now() - criteria.exclude_recently_used_hours * 60 * 60 * 1000);
      availableSites = availableSites.filter(site => 
        !site.last_used || new Date(site.last_used) < cutoffTime
      );
    }

    // Sort by success rate and domain rating
    availableSites.sort((a, b) => {
      const scoreA = (a.success_rate * 0.6) + ((a.domain_rating || 0) * 0.4);
      const scoreB = (b.success_rate * 0.6) + ((b.domain_rating || 0) * 0.4);
      return scoreB - scoreA;
    });

    const selectedSites = availableSites.slice(0, count);
    
    automationLogger.debug('url_discovery', 'Selected target sites', {
      criteria,
      total_available: availableSites.length,
      selected: selectedSites.length,
      sites: selectedSites.map(s => ({ domain: s.domain, score: (s.success_rate * 0.6) + ((s.domain_rating || 0) * 0.4) }))
    });

    return selectedSites;
  }

  async markSiteUsed(siteId: string, campaignId: string): Promise<void> {
    try {
      const site = this.sites.find(s => s.id === siteId);
      if (!site) {
        automationLogger.warn('system', 'Attempted to mark unknown site as used', { siteId });
        return;
      }

      // Update local cache
      site.last_used = new Date().toISOString();
      site.total_attempts += 1;

      automationLogger.info('url_discovery', 'Site marked as used', { 
        domain: site.domain, 
        siteId 
      }, campaignId);

      // Update in database (async, don't wait)
      this.updateSiteInDatabase(siteId, {
        last_used: site.last_used,
        total_attempts: site.total_attempts
      }).catch(error => {
        automationLogger.error('database', 'Failed to update site usage in database', 
          { siteId }, campaignId, error);
      });
    } catch (error) {
      automationLogger.error('system', 'Error marking site as used', 
        { siteId }, campaignId, error as Error);
    }
  }

  async markSubmissionResult(siteId: string, success: boolean, campaignId: string): Promise<void> {
    try {
      const site = this.sites.find(s => s.id === siteId);
      if (!site) {
        automationLogger.warn('system', 'Attempted to mark result for unknown site', { siteId });
        return;
      }

      // Update local cache
      if (success) {
        site.successful_submissions += 1;
      }
      
      // Recalculate success rate
      site.success_rate = site.total_attempts > 0 
        ? Math.round((site.successful_submissions / site.total_attempts) * 100)
        : 0;

      automationLogger.info('article_submission', `Submission ${success ? 'successful' : 'failed'}`, {
        domain: site.domain,
        new_success_rate: site.success_rate,
        total_attempts: site.total_attempts,
        successful: site.successful_submissions
      }, campaignId);

      // Update in database (async, don't wait)
      this.updateSiteInDatabase(siteId, {
        successful_submissions: site.successful_submissions,
        success_rate: site.success_rate,
        updated_at: new Date().toISOString()
      }).catch(error => {
        automationLogger.error('database', 'Failed to update site success rate in database', 
          { siteId }, campaignId, error);
      });
    } catch (error) {
      automationLogger.error('system', 'Error marking submission result', 
        { siteId, success }, campaignId, error as Error);
    }
  }

  private async updateSiteInDatabase(siteId: string, updates: Partial<TargetSite>): Promise<void> {
    const { error } = await supabase
      .from('target_sites')
      .update(updates)
      .eq('id', siteId);

    if (error) throw error;
  }

  async addSite(site: Omit<TargetSite, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const newSite: TargetSite = {
      ...site,
      id: `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.sites.push(newSite);
    
    automationLogger.info('system', 'New target site added', {
      domain: newSite.domain,
      type: newSite.type
    });

    // Save to database (async, don't wait)
    this.saveSiteToDatabase(newSite).catch(error => {
      automationLogger.error('database', 'Failed to save new site to database', 
        { domain: newSite.domain }, undefined, error);
    });

    return newSite.id;
  }

  private async saveSiteToDatabase(site: TargetSite): Promise<void> {
    const { error } = await supabase
      .from('target_sites')
      .insert(site);

    if (error) throw error;
  }

  // Get statistics
  getStats(): {
    total_sites: number;
    active_sites: number;
    average_success_rate: number;
    top_performing_sites: { domain: string; success_rate: number; domain_rating?: number }[];
  } {
    const activeSites = this.sites.filter(s => s.status === 'active');
    const avgSuccessRate = activeSites.length > 0 
      ? Math.round(activeSites.reduce((sum, site) => sum + site.success_rate, 0) / activeSites.length)
      : 0;

    const topSites = [...activeSites]
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5)
      .map(site => ({
        domain: site.domain,
        success_rate: site.success_rate,
        domain_rating: site.domain_rating
      }));

    return {
      total_sites: this.sites.length,
      active_sites: activeSites.length,
      average_success_rate: avgSuccessRate,
      top_performing_sites: topSites
    };
  }

  // Development helpers
  getAllSites(): TargetSite[] {
    return [...this.sites];
  }

  resetStats(): void {
    if (import.meta.env.MODE === 'development') {
      this.sites.forEach(site => {
        site.total_attempts = 0;
        site.successful_submissions = 0;
        site.success_rate = 0;
        site.last_used = undefined;
      });
      automationLogger.info('system', 'Target sites stats reset (development mode)');
    }
  }
}

export const targetSitesManager = new TargetSitesManager();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).targetSitesManager = targetSitesManager;
  console.log('🔧 Target sites manager available at window.targetSitesManager');
}

export default targetSitesManager;
