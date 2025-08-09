import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  User,
  Star,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sparkles,
  BookOpen,
  Globe,
  Tag,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { blogService, type BlogPost } from '@/services/blogService';

interface TrialBlogShowcaseProps {
  limit?: number;
}

export const TrialBlogShowcase = ({ limit = 6 }: TrialBlogShowcaseProps) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadBlogPosts();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadBlogPosts(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadBlogPosts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Load from database first
      let posts: BlogPost[] = [];
      try {
        posts = await blogService.getRecentBlogPosts(limit * 2); // Get more to filter
      } catch (dbError) {
        console.warn('Database unavailable, using localStorage:', dbError);
      }

      // Also load from localStorage (trial posts)
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
                localStorage.removeItem(`blog_post_${blogMeta.slug}`);
                continue;
              }
            }

            localBlogPosts.push(blogPost);
          }
        }
      } catch (storageError) {
        console.warn('Failed to load from localStorage:', storageError);
      }

      // Combine and deduplicate posts
      const allPosts = [...posts];
      localBlogPosts.forEach(localPost => {
        if (!allPosts.find(dbPost => dbPost.slug === localPost.slug)) {
          allPosts.push(localPost);
        }
      });

      // Sort by created date and limit
      const sortedPosts = allPosts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      setBlogPosts(sortedPosts);
      setLastRefresh(new Date());

      if (!silent && sortedPosts.length > 0) {
        toast({
          title: "Blog Posts Loaded",
          description: `Found ${sortedPosts.length} blog posts`,
        });
      }

    } catch (error) {
      console.error('Error loading blog posts:', error);
      if (!silent) {
        toast({
          title: "Loading Error",
          description: "Failed to load blog posts",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (wordCount: number): number => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">No Blog Posts Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start creating amazing content with our AI-powered blog generator
        </p>
        <Button
          onClick={() => navigate('/?focus=generator')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Create Your First Post
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Latest Blog Posts</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
          </span>
          <Button
            onClick={() => loadBlogPosts()}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{blogPosts.length}</div>
          <div className="text-sm text-blue-600">Posts Available</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">
            {Math.round(blogPosts.reduce((sum, post) => sum + (post.seo_score || 75), 0) / blogPosts.length) || 0}
          </div>
          <div className="text-sm text-emerald-600">Avg SEO Score</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {Math.round(blogPosts.reduce((sum, post) => sum + (post.word_count || 1500), 0) / blogPosts.length / 100) / 10}k
          </div>
          <div className="text-sm text-purple-600">Avg Words</div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post, index) => {
          const readingTime = getReadingTime(post.word_count || 1500);
          
          return (
            <Card 
              key={post.id || post.slug || index}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:from-white hover:to-blue-50/30 overflow-hidden"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-sm"
                  >
                    {post.category || 'Expert Content'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {post.claimed_by_user_id ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Claimed
                      </Badge>
                    ) : post.is_trial_post ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        Unclaimed
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Live
                      </Badge>
                    )}
                    {(post.seo_score || 0) > 85 && (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Top
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {post.title}
                </CardTitle>
                
                {post.meta_description && (
                  <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">
                    {post.meta_description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Keywords Tags */}
                {(post.keywords || post.tags) && (
                  <div className="flex flex-wrap gap-1">
                    {((post.keywords || post.tags) as string[])?.slice(0, 3).map((tag: string, tagIndex: number) => (
                      <Badge 
                        key={tagIndex} 
                        variant="outline" 
                        className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <Tag className="mr-1 h-2 w-2" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-700">{post.seo_score || 75}</div>
                    <div className="text-blue-600">SEO</div>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <div className="font-semibold text-emerald-700">{readingTime}m</div>
                    <div className="text-emerald-600">Read</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-700">{Math.floor((post.word_count || 1500) / 100) / 10}k</div>
                    <div className="text-purple-600">Words</div>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>{post.author_name === 'AI Writer' ? 'Backlink ∞' : (post.author_name || 'Backlink ∞')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                </div>

                {/* View Stats */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.view_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{post.seo_score || 75}/100</span>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* External Link Button */}
                {post.target_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(post.target_url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Visit Target Site
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View All CTA */}
      <div className="text-center pt-6 border-t border-gray-100">
        <Button
          onClick={() => navigate('/blog')}
          variant="outline"
          className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100"
        >
          <Globe className="h-4 w-4 mr-2" />
          View All Blog Posts
        </Button>
      </div>
    </div>
  );
};
