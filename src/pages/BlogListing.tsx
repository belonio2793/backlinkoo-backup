/**
 * Blog Listing Page - Modern Interface
 * Displays all published AI-generated blog posts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Clock, 
  Search, 
  TrendingUp, 
  Sparkles,
  ExternalLink,
  Calendar,
  User,
  Filter,
  Zap
} from 'lucide-react';
import { blogPublishingService, type BlogListItem } from '@/services/blogPublishingService';

export default function BlogListing() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<BlogListItem[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const publishedPosts = await blogPublishingService.getPublishedBlogPosts(50);
        setPosts(publishedPosts);
        setFilteredPosts(publishedPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-8">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">AI Generated Blog</h1>
              </div>
              <p className="text-lg text-gray-600">
                Discover high-quality content created by our AI content generator
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>{posts.length} Articles</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Updated Daily</span>
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link to="/ai-live">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Content
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No articles found' : 'No blog posts yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all articles.' 
                : 'Be the first to create AI-generated content for our blog!'
              }
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Link to="/ai-live">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Your First Post
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-1"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {post.status}
                    </Badge>
                    <div className="text-right text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Professional AI-generated content ready to read
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{post.word_count} words</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{Math.ceil(post.word_count / 200)} min</span>
                        </span>
                      </div>
                    </div>

                    {/* Expiration Warning */}
                    {post.status === 'published' && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span className="text-xs text-amber-800 font-medium">
                            {getTimeUntilExpiration(post.expires_at)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Claimed Status */}
                    {post.claimed_by && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-800 font-medium">
                            Claimed by user
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      asChild 
                      className="w-full group-hover:bg-blue-600 transition-colors"
                      variant="outline"
                    >
                      <Link to={`/blog/${post.slug}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read Article
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {filteredPosts.length > 0 && (
          <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Ready to Create Your Own?</h3>
              <p className="text-blue-100 mb-6">
                Join thousands of users creating high-quality blog content with AI. 
                Get your free article generated in under 2 minutes.
              </p>
              <Button 
                asChild 
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Link to="/ai-live">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Generating Content
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
