import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClaimableBlogService } from '@/services/claimableBlogService';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumSEOScore } from '@/hooks/usePremiumSEOScore';
import { BlogClaimService } from '@/services/blogClaimService';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost } from '@/types/blogTypes';
import { Footer } from '@/components/Footer';
import { FetchErrorBoundary } from '@/components/FetchErrorHandler';
import { SupabaseConnectionFixerComponent } from '@/components/SupabaseConnectionFixer';

import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { ClaimStatusIndicator } from '@/components/ClaimStatusIndicator';
import { ClaimSystemStatus } from '@/components/ClaimSystemStatus';
import { LoginModal } from '@/components/LoginModal';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Eye,
  Search,
  Tag,
  User,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Crown,
  ArrowRight,
  Zap,
  BookOpen,
  Filter,
  Grid3X3,
  LayoutList,
  Star,
  CheckCircle2,
  Globe,
  Infinity,
  Loader2,
  Plus,
  RefreshCw
} from 'lucide-react';

function Blog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDefaultTab, setPaymentDefaultTab] = useState<'credits' | 'premium'>('credits');
  const [refreshing, setRefreshing] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBlogPosts = async () => {
      console.log('🔄 Loading blog posts...');
      setLoading(true);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached, stopping loading state');
        setLoading(false);
      }, 10000); // 10 second timeout

      try {
        // Use UnifiedClaimService to get posts consistently
        let posts: any[] = [];
        try {
          posts = await UnifiedClaimService.getClaimablePosts(50);
          console.log('✅ Claimable posts loaded:', posts.length);
        } catch (dbError) {
          console.warn('❌ Database unavailable, trying fallback:', dbError);
          // Fallback to old service if needed
          try {
            posts = await ClaimableBlogService.getClaimablePosts(50);
            console.log('✅ Fallback posts loaded:', posts.length);
          } catch (fallbackError) {
            console.warn('❌ Fallback also failed, using localStorage:', fallbackError);
            // Continue with empty posts array - don't throw error
            posts = [];
          }
        }

        // Also load from localStorage (traditional blog posts)
        const localBlogPosts: BlogPost[] = [];
        try {
          const allBlogPostsStr = localStorage.getItem('all_blog_posts');
          if (!allBlogPostsStr) {
            console.log('No blog posts in localStorage');
          } else {
            const allBlogPosts = JSON.parse(allBlogPostsStr);

            if (Array.isArray(allBlogPosts)) {
              for (const blogMeta of allBlogPosts) {
                try {
                  const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
                  if (blogData) {
                    const blogPost = JSON.parse(blogData);

                    // Check if trial post is expired
                    if (blogPost.is_trial_post && blogPost.expires_at) {
                      const isExpired = new Date() > new Date(blogPost.expires_at);
                      if (isExpired) {
                        // Remove expired trial post
                        localStorage.removeItem(`blog_post_${blogMeta.slug}`);
                        continue;
                      }
                    }

                    localBlogPosts.push(blogPost);
                  }
                } catch (blogParseError) {
                  console.warn(`Failed to parse blog post ${blogMeta.slug}:`, blogParseError);
                  // Remove corrupted blog post
                  localStorage.removeItem(`blog_post_${blogMeta.slug}`);
                }
              }

              // Update the all_blog_posts list to remove expired/corrupted ones
              const validBlogMetas = allBlogPosts.filter((meta: any) => {
                return localBlogPosts.some(post => post.slug === meta.slug);
              });
              localStorage.setItem('all_blog_posts', JSON.stringify(validBlogMetas));
            }
          }
        } catch (storageError) {
          console.warn('Failed to load from localStorage, clearing corrupted data:', storageError);
          // Clear corrupted localStorage data
          try {
            localStorage.removeItem('all_blog_posts');
          } catch (clearError) {
            console.warn('Could not clear localStorage:', clearError);
          }
        }

        // Combine database and localStorage posts, removing duplicates
        const allPosts = [...posts];
        localBlogPosts.forEach(localPost => {
          if (!allPosts.find(dbPost => dbPost.slug === localPost.slug)) {
            allPosts.push(localPost);
          }
        });

        // Sort posts based on selected criteria
        const sortedPosts = sortPosts(allPosts, sortBy);
        setBlogPosts(sortedPosts);

        console.log('✅ Blog posts loaded:', {
          databasePosts: posts.length,
          localBlogPosts: localBlogPosts.length,
          totalPosts: allPosts.length,
        });
      } catch (error) {
        console.error('❌ Failed to load blog posts:', error);
        // Even if there's an error, still try to show any local posts that were loaded
        setBlogPosts([]);

        // Show user-friendly error message only in development
        if (import.meta.env.DEV) {
          toast({
            title: "Blog loading issue",
            description: "Some blog posts may not be visible. Please refresh the page.",
            variant: "destructive"
          });
        }
      } finally {
        clearTimeout(timeoutId);
        console.log('📊 Setting loading to false');
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, [sortBy]);

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortPosts = (posts: BlogPost[], criteria: string) => {
    switch (criteria) {
      case 'popular':
        return [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      case 'trending':
        // For trending, consider premium posts as having higher scores
        const getEffectiveScore = (post: any) => {
          // This is a simplified check - in a real app you might cache this
          return post.seo_score || 0;
        };
        return [...posts].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));
      default: // newest
        return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Utility function to clean HTML syntax and common prefixes from titles
  const cleanTitle = (title: string): string => {
    if (!title) return '';

    let cleaned = title;

    // Apply multiple passes to ensure thorough cleaning
    for (let i = 0; i < 3; i++) {
      cleaned = cleaned
        // Remove HTML tag prefixes like "H1:", "H2:", "Title:", etc. (case insensitive, multiple variations)
        .replace(/^(?:H[1-6]|Title|Heading|Header):\s*/gi, '')
        .replace(/^(?:h[1-6]|title|heading|header):\s*/g, '')
        // Remove leading "t " that might be leftover
        .replace(/^t\s+/gi, '')
        // Remove HTML tags completely
        .replace(/<[^>]*>/g, '')
        // Remove common markdown syntax
        .replace(/^#+\s*/, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/__(.*?)__/g, '$1') // Remove underline markdown
        // Remove common HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&hellip;/g, '...')
        // Remove common prefixes that might appear
        .replace(/^(?:Blog post|Article|Post):\s*/gi, '')
        // Clean up extra whitespace and special characters
        .replace(/\s+/g, ' ')
        .replace(/^[\W\s]+/, '') // Remove leading non-word characters and whitespace
        .replace(/[\s]+$/, '') // Remove trailing whitespace
        .trim();
    }

    return cleaned;
  };

  // Utility function to clean descriptions/content
  const cleanDescription = (description: string): string => {
    if (!description) return '';

    let cleaned = description;

    // Apply multiple passes for thorough cleaning
    for (let i = 0; i < 2; i++) {
      cleaned = cleaned
        // Remove HTML tags completely
        .replace(/<[^>]*>/g, '')
        // Remove common markdown syntax
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/__(.*?)__/g, '$1') // Remove underline markdown
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links, keep text
        .replace(/`([^`]*)`/g, '$1') // Remove code markdown
        // Remove common HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&hellip;/g, '...')
        // Clean up extra whitespace and line breaks
        .replace(/\s+/g, ' ')
        .replace(/^[\W\s]+/, '') // Remove leading non-word characters and whitespace
        .replace(/[\s]+$/, '') // Remove trailing whitespace
        .trim();
    }

    return cleaned;
  };

  // Function to generate clean excerpt from content
  const generateExcerpt = (post: any): string => {
    // Try to use meta_description first, but only if it's not the same as title
    if (post.meta_description) {
      const cleanMeta = cleanDescription(post.meta_description);
      const cleanedTitle = cleanTitle(post.title);

      // Only use meta if it's different from title and meaningful
      if (cleanMeta.length > 20 && cleanMeta.toLowerCase() !== cleanedTitle.toLowerCase()) {
        return cleanMeta.length > 150 ? cleanMeta.substring(0, 150) + '...' : cleanMeta;
      }
    }

    // Fallback to content if available
    if (post.content) {
      let excerpt = post.content;

      // Remove HTML tags and markdown
      excerpt = excerpt
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/#+\s*/g, '') // Remove markdown headers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links
        .replace(/`([^`]*)`/g, '$1') // Remove code markdown
        .replace(/\n+/g, ' ') // Replace line breaks with spaces
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();

      // Get the cleaned title to remove it from content
      const cleanedTitle = cleanTitle(post.title);

      // Remove the title if it appears at the beginning of content
      if (cleanedTitle && excerpt.toLowerCase().startsWith(cleanedTitle.toLowerCase())) {
        excerpt = excerpt.substring(cleanedTitle.length).trim();
      }

      // Remove common section headers and prefixes more aggressively
      excerpt = excerpt
        .replace(/^(?:H[1-6]|Title|Heading|Header):\s*/gi, '')
        .replace(/^(?:Introduction|Overview|Summary|Conclusion|Abstract|Preface):\s*/gi, '')
        .replace(/^(?:Blog post|Article|Post|Content|Text|Document):\s*/gi, '')
        .replace(/^(?:In this|This is|Here is|Welcome to|Let's|Today we|In today's)\s+.*?[.,]\s*/gi, '')
        .replace(/^[.:;,-]\s*/g, '') // Remove leading punctuation
        .trim();

      // Split into sentences and find the first meaningful one
      const sentences = excerpt.split(/[.!?]+/);
      let result = '';

      for (const sentence of sentences) {
        const cleanSentence = sentence.trim();

        // Skip sentences that are likely titles or headers
        if (
          cleanSentence.length > 15 &&
          !cleanSentence.toLowerCase().startsWith('h1') &&
          !cleanSentence.toLowerCase().startsWith('title') &&
          !cleanSentence.toLowerCase().startsWith('introduction') &&
          !cleanSentence.toLowerCase().startsWith('overview') &&
          !cleanSentence.toLowerCase().includes('definitive guide') &&
          !cleanSentence.toLowerCase().includes('ultimate guide') &&
          !/^(the|a|an)\s+(ultimate|definitive|complete|comprehensive|guide|tutorial)/i.test(cleanSentence)
        ) {
          result = cleanSentence;
          break;
        }
      }

      // If no good sentence found, take the cleaned excerpt but skip obvious title parts
      if (!result && excerpt.length > 0) {
        result = excerpt;

        // Remove common title patterns at the start
        result = result
          .replace(/^(the|a|an)\s+(ultimate|definitive|complete|comprehensive)\s+(guide|tutorial|handbook)\s+to\s+[^.!?]*[.!?]\s*/gi, '')
          .replace(/^[^.!?]*:\s*/, '') // Remove anything before a colon
          .trim();
      }

      // Ensure proper capitalization and ellipsis
      if (result) {
        // Capitalize first letter
        result = result.charAt(0).toUpperCase() + result.slice(1);

        // Ensure it ends with ellipsis
        if (result.length > 150) {
          result = result.substring(0, 150).trim();
          result = result.replace(/[.!?,:;-]*$/, '') + '...';
        } else if (!result.match(/[.!?]$/)) {
          result = result.trim().replace(/[,:;-]*$/, '') + '...';
        }

        return result;
      }

      return 'Expert content covering important topics in digital marketing and SEO.';
    }

    // Fallback if no content
    return 'Expert content covering important topics in digital marketing and SEO...';
  };

  const filteredPosts = blogPosts.filter(post => {
    const cleanedTitle = cleanTitle(post.title).toLowerCase();
    const cleanedDescription = cleanDescription(post.meta_description || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm === '' ||
      cleanedTitle.includes(searchLower) ||
      cleanedDescription.includes(searchLower) ||
      post.keywords.some(keyword => keyword.toLowerCase().includes(searchLower));

    const matchesCategory = selectedCategory === '' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

  const handleRefreshPosts = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manually refreshing blog posts...');

      // Clear existing posts first for visual feedback
      setBlogPosts([]);

      // Use UnifiedClaimService to get posts consistently
      let posts: any[] = [];
      try {
        posts = await UnifiedClaimService.getClaimablePosts(50);
        console.log('✅ Claimable posts loaded:', posts.length);
      } catch (dbError) {
        console.warn('❌ Database unavailable, trying fallback:', dbError);
        try {
          posts = await ClaimableBlogService.getClaimablePosts(50);
          console.log('🔄 Fallback posts loaded:', posts.length);
        } catch (fallbackError) {
          console.warn('❌ Fallback also failed, using localStorage:', fallbackError);
        }
      }

      // Also load from localStorage (traditional blog posts)
      const localBlogPosts: BlogPost[] = [];
      try {
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');

        for (const blogMeta of allBlogPosts) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);

            // Check if trial post is expired
            if (blogPost.is_trial_post && blogPost.expires_at) {
              const isExpired = new Date() > new Date(blogPost.expires_at);
              if (isExpired) {
                // Remove expired trial post
                localStorage.removeItem(`blog_post_${blogMeta.slug}`);
                continue;
              }
            }

            localBlogPosts.push(blogPost);
          }
        }

        // Update the all_blog_posts list to remove expired ones
        const validBlogMetas = allBlogPosts.filter((meta: any) => {
          return localBlogPosts.some(post => post.slug === meta.slug);
        });
        localStorage.setItem('all_blog_posts', JSON.stringify(validBlogMetas));

      } catch (storageError) {
        console.warn('Failed to load from localStorage:', storageError);
      }

      // Combine database and localStorage posts, removing duplicates
      const allPosts = [...posts];
      localBlogPosts.forEach(localPost => {
        if (!allPosts.find(dbPost => dbPost.slug === localPost.slug)) {
          allPosts.push(localPost);
        }
      });

      // Sort posts based on selected criteria
      const sortedPosts = sortPosts(allPosts, sortBy);
      setBlogPosts(sortedPosts);

      toast({
        title: "Posts refreshed!",
        description: `Loaded ${allPosts.length} blog posts.`,
      });

      console.log('✅ Blog posts refreshed:', {
        databasePosts: posts.length,
        localBlogPosts: localBlogPosts.length,
        totalPosts: allPosts.length,
      });
    } catch (error) {
      console.error('❌ Failed to refresh blog posts:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };


  return (
    <FetchErrorBoundary
      context="loading blog posts"
      onRetry={() => window.location.reload()}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-4">

              {user ? (
                <>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-transparent hover:bg-blue-50/50 border border-blue-200/60 text-blue-700 hover:text-blue-800 hover:border-blue-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        toast({
                          title: "Signed out successfully",
                          description: "You have been signed out of your account.",
                        });
                        navigate("/");
                      } catch (error) {
                        console.error('Sign out error:', error);
                        toast({
                          title: "Sign out failed",
                          description: "There was an error signing you out. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="bg-transparent hover:bg-red-50/50 border border-red-200/60 text-red-600 hover:text-red-700 hover:border-red-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setLoginModalOpen(true)} className="font-medium">
                    Sign In
                  </Button>
                  <Button onClick={() => setLoginModalOpen(true)} className="font-medium">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <Zap className="mr-2 h-4 w-4" />
                Expert Content Hub
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                Backlink ∞&nbsp;
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Discover high-quality, expert content designed to boost SEO rankings with contextual backlinks
              </p>
            </div>


          </div>
        </div>
      </div>

      {/* Supabase Connection Fixer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <SupabaseConnectionFixerComponent onConnectionRestored={handleRefreshPosts} />
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={searchInputRef}
                placeholder="Search expert posts... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                    setSelectedCategory('');
                    e.currentTarget.blur();
                  }
                }}
                className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="newest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Highest SEO</option>
              </select>

              {/* Refresh Button */}
              <Button
                onClick={handleRefreshPosts}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none px-3"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || selectedCategory) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Showing {filteredPosts.length} posts</span>
              {searchTerm && (
                <Badge variant="outline" className="px-2 py-1 bg-blue-50 border-blue-200 text-blue-700">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="outline" className="px-2 py-1 bg-green-50 border-green-200 text-green-700">
                  Category: {selectedCategory}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const hadFilters = searchTerm || selectedCategory;
                  setSearchTerm('');
                  setSelectedCategory('');
                  if (hadFilters) {
                    toast({
                      title: "Filters cleared",
                      description: "All search and filter criteria have been reset.",
                    });
                  }
                }}
                className="text-blue-600 hover:text-blue-800 ml-auto"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Claim Status Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <ClaimStatusIndicator
            onUpgrade={() => {
              setPaymentDefaultTab('credits');
              setPaymentModalOpen(true);
            }}
            onSignIn={() => setLoginModalOpen(true)}
          />
          {import.meta.env.DEV && <ClaimSystemStatus />}
        </div>
      </div>

      {/* Claim Feature Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">💾 Save Blog Posts to Dashboard</h2>
                <p className="text-blue-100 text-base md:text-lg mb-4">
                  Save your favorite blog posts to your personal dashboard! Access them anytime and prevent auto-deletion.
                </p>
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span>Personal dashboard access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span>Protection from deletion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span>Up to 3 free (unlimited with subscription)</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-center md:text-left">
                {user ? (
                  // Only show claimable count if there are claimable posts
                  filteredPosts.filter(p => p.is_trial_post && !p.user_id).length > 0 ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold">{filteredPosts.filter(p => p.is_trial_post && !p.user_id).length}</div>
                      <div className="text-blue-200 text-sm">Claimable Posts</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-lg text-blue-200">No claimable posts available</div>
                      <div className="text-blue-300 text-sm">Check back later for new content</div>
                    </div>
                  )
                ) : (
                  <Button
                    onClick={() => setLoginModalOpen(true)}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Sign In to Start Claiming
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 opacity-20">
            <Crown className="h-32 w-32 text-white" />
          </div>
        </div>
      </div>

      {/* Blog Posts Grid/List */}
      <div id="blog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {searchTerm || selectedCategory ? 'No matching posts found' : 'No blog posts yet'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search or filter criteria to find the content you\'re looking for.'
                  : 'Be the first to create expert content! Generate high-quality blog posts with contextual backlinks.'
                }
              </p>

            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
              : 'space-y-6'
          }>
            {filteredPosts.map((post) => (
              <div key={post.id}>
                {viewMode === 'grid' ? (
                  <BlogPostCard
                    post={post}
                    navigate={navigate}
                    formatDate={formatDate}
                    onLoginRequired={() => setLoginModalOpen(true)}
                    cleanTitle={cleanTitle}
                    cleanDescription={cleanDescription}
                    generateExcerpt={generateExcerpt}
                  />
                ) : (
                  <BlogPostListItem
                    post={post}
                    navigate={navigate}
                    formatDate={formatDate}
                    onLoginRequired={() => setLoginModalOpen(true)}
                    cleanTitle={cleanTitle}
                    cleanDescription={cleanDescription}
                    generateExcerpt={generateExcerpt}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Boost Your SEO?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of users creating high-quality backlinks with expert content generation
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setPaymentDefaultTab('credits');
                setPaymentModalOpen(true);
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg"
            >
              <Zap className="mr-2 h-5 w-5" />
              Buy Backlinks
            </Button>

          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
            <div className="text-center space-y-2">
              <Sparkles className="h-8 w-8 text-yellow-400 mx-auto" />
              <h3 className="font-semibold">Expert Quality</h3>
              <p className="text-sm text-gray-400">Advanced language models create high-quality content</p>
            </div>
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto" />
              <h3 className="font-semibold">SEO Optimized</h3>
              <p className="text-sm text-gray-400">Built-in SEO analysis and optimization</p>
            </div>
            <div className="text-center space-y-2">
              <Globe className="h-8 w-8 text-blue-400 mx-auto" />
              <h3 className="font-semibold">Instant Publishing</h3>
              <p className="text-sm text-gray-400">Publish and share your content immediately</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        defaultTab="login"
        pendingAction="premium blog features"
        onAuthSuccess={(user) => {
          setLoginModalOpen(false);
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
          });

          // Check for claim intent
          const claimIntent = localStorage.getItem('claim_intent');
          if (claimIntent) {
            try {
              const intent = JSON.parse(claimIntent);
              localStorage.removeItem('claim_intent');
              toast({
                title: "Continuing with your claim...",
                description: `Processing your request to claim "${intent.postTitle}"`,
              });
              setTimeout(() => {
                navigate(`/blog/${intent.postSlug}`);
              }, 1500);
            } catch (error) {
              console.warn('Failed to parse claim intent:', error);
            }
          }

          // Refresh the page to show updated user state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />

      {/* Pricing Modal */}
      <EnhancedUnifiedPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultTab={paymentDefaultTab}
        onSuccess={() => {
          setPaymentModalOpen(false);
          toast({
            title: "Payment Successful!",
            description: "Your purchase has been completed successfully.",
          });
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in. Continue with your purchase.",
          });
        }}
      />
      </div>
    </FetchErrorBoundary>
  );
}

// Blog Post Card Component
function BlogPostCard({ post, navigate, formatDate, onLoginRequired, cleanTitle, cleanDescription, generateExcerpt }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);

  // Use premium SEO score logic with hook for consistency
  const { effectiveScore, isPremiumScore } = usePremiumSEOScore(post);

  const handleClaimRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Store claim intent for after login
    const claimIntent = {
      postSlug: post.slug,
      postTitle: post.title,
      postId: post.id,
      timestamp: Date.now()
    };

    localStorage.setItem('claim_intent', JSON.stringify(claimIntent));

    toast({
      title: "Sign in required",
      description: "Please sign in to claim this blog post.",
    });

    // Open login modal instead of navigating
    onLoginRequired();
  };

  const handleClaimPost = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      handleClaimRedirect(e);
      return;
    }

    if (!post.is_trial_post || post.user_id) {
      return;
    }

    setClaiming(true);

    try {
      console.log('🎯 Claiming post from card:', post.slug);

      const result = await UnifiedClaimService.claimBlogPost(post.slug, user);

      if (result.success) {
        toast({
          title: "Post Saved Successfully! 🎉",
          description: result.message,
        });

        // Refresh the page to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } else {
        toast({
          title: result.needsUpgrade ? "Upgrade Required" : "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post.",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const canClaim = post.is_trial_post && !post.user_id && (!post.expires_at || new Date() <= new Date(post.expires_at));
  const isOwnedByUser = post.user_id === user?.id;
  return (
    <Card
      className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg bg-white/95 backdrop-blur-sm hover:bg-white transform hover:-translate-y-3 hover:rotate-1 rounded-2xl overflow-hidden"
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      {/* Card Gradient Header */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>

      <CardHeader className="pb-4 space-y-4 p-6">
        <div className="flex items-start justify-between">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-sm px-3 py-1.5 font-medium tracking-wide">
            {post.category || 'Expert Content'}
          </Badge>
          <div className="flex items-center gap-2">
            {post.is_trial_post ? (
              post.user_id ? (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Claimed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="mr-1 h-3 w-3" />
                  Unclaimed
                </Badge>
              )
            ) : (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Live
              </Badge>
            )}
            {effectiveScore > 80 && (
              <Badge className={`${isPremiumScore ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                {isPremiumScore ? <Crown className="mr-1 h-3 w-3" /> : <Star className="mr-1 h-3 w-3" />}
                {isPremiumScore ? 'Premium' : 'Featured'}
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-300 mb-3">
          {cleanTitle(post.title)}
        </CardTitle>

        <p className="text-gray-600 line-clamp-3 leading-relaxed text-sm font-light">
          {generateExcerpt(post)}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4 p-6">
        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(post.tags || post.keywords || []).slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200 px-2 py-1">
              <Tag className="mr-1 h-2 w-2" />
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Publish Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>

        {/* Claim Button - Enhanced for all users */}
        {post.is_trial_post && !post.user_id && (
          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <Button
                onClick={handleClaimPost}
                disabled={claiming}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 animate-pulse"
              >
                {claiming ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-3 w-3" />
                    Save to Dashboard
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClaimRedirect}
                size="sm"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse"
              >
                <Plus className="mr-2 h-3 w-3" />
                Sign In to Save Post
              </Button>
            )}
            {post.expires_at && (
              <p className="text-xs text-center text-amber-600 mt-1">
                ⏰ Expires: {formatDate(post.published_at || post.created_at)}
              </p>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isOwnedByUser && (
              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                <User className="h-3 w-3 mr-1" />
                Yours
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a 
                href={post.target_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Blog Post List Item Component
function BlogPostListItem({ post, navigate, formatDate, onLoginRequired, cleanTitle, cleanDescription, generateExcerpt }: any) {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                {post.category || 'Expert Content'}
              </Badge>
              {post.is_trial_post ? (
                post.user_id ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Claimed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="mr-1 h-3 w-3" />
                    Unclaimed
                  </Badge>
                )
              ) : (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Live
                </Badge>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {cleanTitle(post.title)}
            </h3>

            <p className="text-gray-600 leading-relaxed line-clamp-2">
              {generateExcerpt(post)}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Blog;
