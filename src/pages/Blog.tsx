import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { publishedBlogService, type PublishedBlogPost } from '@/services/publishedBlogService';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ArrowLeft, 
  Search,
  Tag,
  User,
  TrendingUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export function Blog() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<PublishedBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        // Try to load from database first
        let posts: PublishedBlogPost[] = [];
        try {
          posts = await publishedBlogService.getRecentBlogPosts(50);
        } catch (dbError) {
          console.warn('Database unavailable, using localStorage:', dbError);
        }

        // Also load from localStorage (traditional blog posts)
        const localBlogPosts: PublishedBlogPost[] = [];
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

        // Also load from free backlink service
        try {
          const freeBacklinkPosts = freeBacklinkService.getAllPosts();
          freeBacklinkPosts.forEach(freePost => {
            // Convert free backlink post to PublishedBlogPost format
            const convertedPost: PublishedBlogPost = {
              id: freePost.id,
              title: freePost.title,
              slug: freePost.slug,
              content: freePost.content,
              excerpt: freePost.metaDescription,
              meta_description: freePost.metaDescription,
              keywords: freePost.keywords,
              tags: freePost.keywords, // Use keywords as tags
              category: 'Free Backlink',
              author_name: 'AI Generator',
              target_url: freePost.targetUrl,
              anchor_text: freePost.anchorText,
              seo_score: freePost.seoScore,
              reading_time: freePost.readingTime,
              word_count: freePost.wordCount,
              view_count: (freePost as any).viewCount || 0,
              published_at: freePost.createdAt,
              created_at: freePost.createdAt,
              updated_at: freePost.createdAt,
              published_url: `${window.location.origin}/blog/${freePost.slug}`,
              is_trial_post: true,
              expires_at: freePost.expiresAt,
              status: freePost.status as 'published'
            };

            // Only add if not already in localBlogPosts
            if (!localBlogPosts.find(post => post.id === convertedPost.id)) {
              localBlogPosts.push(convertedPost);
            }
          });
        } catch (freeBacklinkError) {
          console.warn('Failed to load free backlink posts:', freeBacklinkError);
        }

        // Combine database and localStorage posts, removing duplicates
        const allPosts = [...posts];
        localBlogPosts.forEach(localPost => {
          if (!allPosts.find(dbPost => dbPost.slug === localPost.slug)) {
            allPosts.push(localPost);
          }
        });

        // Sort by created date, newest first
        allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setBlogPosts(allPosts);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Backlinkoo Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              High-quality SEO content created by our AI-powered backlink generation system
            </p>

            {/* Create New Post CTA */}
            <div className="mb-6">
              <Button
                onClick={() => navigate('/blog/create')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Create Your Backlink Post
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory ? 'No matching posts found' : 'No blog posts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria'
                : 'Blog posts will appear here as they are generated'
              }
            </p>
            <Button onClick={() => navigate('/')}>
              Create Your First Backlink
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    {post.is_trial_post && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Trial
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2 leading-tight">
                    {post.title}
                  </CardTitle>
                  
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {post.excerpt}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="mr-1 h-2 w-2" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{post.author_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.reading_time}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{post.seo_score}/100</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <a 
                        href={post.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Want to Create Your Own Backlinks?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Generate high-quality blog posts with natural backlinks to boost your SEO rankings
          </p>
          <Button 
            onClick={() => navigate('/')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Start Creating Backlinks
          </Button>
        </div>
      </div>
    </div>
  );
}
