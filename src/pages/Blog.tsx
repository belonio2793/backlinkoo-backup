import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogService, type BlogPost } from '@/services/blogService';
import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/Footer';
import { PurgeStorageButton } from '@/components/PurgeStorageButton';
import { PricingModal } from '@/components/PricingModal';
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
  ArrowRight,
  Zap,
  BookOpen,
  Filter,
  Grid3X3,
  LayoutList,
  Star,
  CheckCircle2,
  Globe,
  Infinity
} from 'lucide-react';

export function Blog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        // Try to load from database first
        let posts: BlogPost[] = [];
        try {
          posts = await blogService.getRecentBlogPosts(50);
        } catch (dbError) {
          console.warn('Database unavailable, using localStorage:', dbError);
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

        console.log('Blog posts loaded:', {
          databasePosts: posts.length,
          localBlogPosts: localBlogPosts.length,
          totalPosts: allPosts.length,
        });
      } catch (error) {
        console.error('Failed to load blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, [sortBy]);

  const sortPosts = (posts: BlogPost[], criteria: string) => {
    switch (criteria) {
      case 'popular':
        return [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      case 'trending':
        return [...posts].sort((a, b) => (b.seo_score || 0) - (a.seo_score || 0));
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

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.meta_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-medium text-gray-900">Loading Expert Content</p>
            <p className="text-gray-600">Fetching the latest high-quality blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
              <PurgeStorageButton
                variant="ghost"
                size="sm"
                showIcon={true}
                className="text-muted-foreground hover:text-foreground"
              />
              {user ? (
                <>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-transparent hover:bg-blue-50/50 border border-blue-200/60 text-blue-700 hover:text-blue-800 hover:border-blue-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-transparent hover:bg-red-50/50 border border-red-200/60 text-red-600 hover:text-red-700 hover:border-red-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/auth")} className="font-medium">
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
                Backlink ∞
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {" "}Blog
                </span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Discover high-quality, expert content designed to boost SEO rankings with contextual backlinks
              </p>
            </div>


          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search expert posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
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
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {filteredPosts.length} posts</span>
              {searchTerm && (
                <Badge variant="outline" className="px-2 py-1">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="outline" className="px-2 py-1">
                  Category: {selectedCategory}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </Button>
            </div>
          )}
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
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Your First Post
                </Button>
              </div>
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
                  <BlogPostCard post={post} navigate={navigate} formatDate={formatDate} />
                ) : (
                  <BlogPostListItem post={post} navigate={navigate} formatDate={formatDate} />
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
              onClick={() => setPricingModalOpen(true)}
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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onAuthSuccess={(user) => {
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in. Continue with your purchase.",
          });
        }}
      />
    </div>
  );
}

// Blog Post Card Component
function BlogPostCard({ post, navigate, formatDate }: any) {
  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white transform hover:-translate-y-2"
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-start justify-between">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md">
            {post.category || 'Expert Content'}
          </Badge>
          <div className="flex items-center gap-2">
            {post.is_trial_post ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="mr-1 h-3 w-3" />
                Trial
              </Badge>
            ) : (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Live
              </Badge>
            )}
            {(post.seo_score || 0) > 80 && (
              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {post.title}
        </CardTitle>
        
        {post.meta_description && (
          <p className="text-gray-600 line-clamp-3 leading-relaxed">
            {post.meta_description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Keywords */}
        <div className="flex flex-wrap gap-2">
          {(post.tags || post.keywords || []).slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors">
              <Tag className="mr-1 h-2 w-2" />
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>{post.reading_time || 5}m read</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-500" />
            <span>{post.view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span>{post.seo_score || 75}/100 SEO</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{post.author_name || 'Expert Writer'}</span>
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
function BlogPostListItem({ post, navigate, formatDate }: any) {
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
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="mr-1 h-3 w-3" />
                  Trial
                </Badge>
              ) : (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Live
                </Badge>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {post.title}
            </h3>
            
            {post.meta_description && (
              <p className="text-gray-600 leading-relaxed line-clamp-2">
                {post.meta_description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{post.author_name || 'Expert Writer'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.reading_time || 5}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{post.seo_score || 75}/100</span>
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
