import { useState, useEffect, useCallback } from 'react';
import { DomainRoutingService, DomainContext, DomainBlogSettings } from '@/services/domainRoutingService';
import { DomainBlogService, DomainBlogPost } from '@/services/domainBlogService';

export interface UseDomainRoutingReturn {
  domain: DomainContext | null;
  blogSettings: DomainBlogSettings | null;
  isLoading: boolean;
  isMultiDomainEnabled: boolean;
  error: string | null;
  refreshDomain: () => Promise<void>;
  generateBlogUrl: (slug: string) => string;
  generateBlogListingUrl: () => string;
}

/**
 * React hook for accessing domain routing context and blog settings
 */
export const useDomainRouting = (): UseDomainRoutingReturn => {
  const [domain, setDomain] = useState<DomainContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDomain = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to get domain for current hostname
      let domainContext = await DomainRoutingService.getDomainByHostname();
      
      // If no domain found (e.g., localhost development), try fallback
      if (!domainContext) {
        domainContext = await DomainRoutingService.getFallbackDomain();
      }

      setDomain(domainContext);
      
      if (domainContext) {
        DomainRoutingService.setCurrentDomain(domainContext);
        console.log('🎯 Domain routing context loaded:', domainContext);
      } else {
        console.log('⚠️ No domain configuration available');
      }
    } catch (err: any) {
      console.error('❌ Error loading domain context:', err);
      setError(err.message || 'Failed to load domain context');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomain();
  }, [loadDomain]);

  const refreshDomain = useCallback(async () => {
    DomainRoutingService.clearCache();
    await loadDomain();
  }, [loadDomain]);

  const generateBlogUrl = useCallback((slug: string): string => {
    if (!domain) return `/blog/${slug}`;
    return DomainRoutingService.generateBlogUrl(domain, slug);
  }, [domain]);

  const generateBlogListingUrl = useCallback((): string => {
    if (!domain) return '/blog';
    return DomainRoutingService.generateBlogListingUrl(domain);
  }, [domain]);

  return {
    domain,
    blogSettings: domain?.blog_settings || null,
    isLoading,
    isMultiDomainEnabled: !!domain?.blog_enabled,
    error,
    refreshDomain,
    generateBlogUrl,
    generateBlogListingUrl
  };
};

/**
 * Hook specifically for blog post operations within a domain context
 */
export const useDomainBlog = () => {
  const { domain, isLoading: isDomainLoading } = useDomainRouting();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBlogPosts = useCallback(async (options: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    status?: string;
  } = {}) => {
    if (!domain) {
      throw new Error('No domain context available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await DomainRoutingService.getDomainBlogPosts(domain.id, {
        status: 'published',
        ...options
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.posts;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const getBlogPostBySlug = useCallback(async (slug: string) => {
    if (!domain) {
      throw new Error('No domain context available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await DomainRoutingService.getDomainBlogPostBySlug(domain.id, slug);

      if (result.error) {
        throw new Error(result.error);
      }

      return result.post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const createBlogPost = useCallback(async (
    postData: {
      title: string;
      content: string;
      slug?: string;
      target_url?: string;
      anchor_text?: string;
      keywords?: string[];
      category_id?: string;
      meta_description?: string;
      author_name?: string;
      is_trial_post?: boolean;
    },
    userId?: string
  ) => {
    if (!domain) {
      throw new Error('No domain context available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await DomainRoutingService.createDomainBlogPost(
        domain.id,
        postData,
        userId
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const getBlogCategories = useCallback(async () => {
    if (!domain) {
      throw new Error('No domain context available');
    }

    try {
      return await DomainRoutingService.getDomainBlogCategories(domain.id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [domain]);

  return {
    domain,
    isLoading: isDomainLoading || isLoading,
    error,
    getBlogPosts,
    getBlogPostBySlug,
    createBlogPost,
    getBlogCategories
  };
};

export default useDomainRouting;
