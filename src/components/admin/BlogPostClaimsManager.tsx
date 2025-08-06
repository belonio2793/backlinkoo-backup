import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Clock, 
  Eye, 
  User, 
  ExternalLink,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { publishedBlogService } from '@/services/publishedBlogService';
import { ExcerptCleaner } from '@/utils/excerptCleaner';


interface BlogPostStatus {
  id: string;
  slug: string;
  title: string;
  url: string;
  status: 'claimed' | 'unclaimed';
  claimedBy?: {
    userId: string;
    email: string;
    claimedAt: string;
  };
  createdAt: string;
  expiresAt?: string;
  viewCount: number;
}

export function BlogPostClaimsManager() {
  const [posts, setPosts] = useState<BlogPostStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      const blogPosts: BlogPostStatus[] = [];

      // Load from database
      try {
        const dbPosts = await publishedBlogService.getRecentBlogPosts(100);
        dbPosts.forEach(post => {
          blogPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            url: `${window.location.origin}/blog/${post.slug}`,
            status: post.is_trial_post ? 'unclaimed' : 'claimed',
            claimedBy: post.is_trial_post ? undefined : {
              userId: (post as any).user_id || 'unknown',
              email: (post as any).user_email || 'No email',
              claimedAt: post.created_at
            },
            createdAt: post.created_at,
            expiresAt: post.expires_at,
            viewCount: post.view_count || 0
          });
        });
      } catch (dbError) {
        console.warn('Database unavailable, showing empty state');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Load from free backlink service


      // Sort by creation date, newest first
      blogPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setPosts(blogPosts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.claimedBy?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const claimedCount = posts.filter(p => p.status === 'claimed').length;
  const unclaimedCount = posts.filter(p => p.status === 'unclaimed').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Claimed Posts</span>
            </div>
            <div className="text-2xl font-bold mt-1">{claimedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Unclaimed Posts</span>
            </div>
            <div className="text-2xl font-bold mt-1">{unclaimedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Views</span>
            </div>
            <div className="text-2xl font-bold mt-1">{posts.reduce((sum, p) => sum + p.viewCount, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts by title, slug, or user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Posts</option>
                <option value="claimed">Claimed Only</option>
                <option value="unclaimed">Unclaimed Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Post Claims ({filteredPosts.length} posts)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No blog posts found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                      <p className="text-sm text-gray-500">/{post.slug}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {post.status === 'claimed' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Claimed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <Clock className="mr-1 h-3 w-3" />
                          Unclaimed
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={post.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{formatDate(post.createdAt)}</div>
                    </div>
                    
                    {post.status === 'claimed' && post.claimedBy && (
                      <div>
                        <span className="text-gray-500">Claimed by:</span>
                        <div className="font-medium">{post.claimedBy.email}</div>
                      </div>
                    )}
                    
                    {post.expiresAt && post.status === 'unclaimed' && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <div className="font-medium text-amber-600">{getTimeRemaining(post.expiresAt)}</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Views:</span>
                      <div className="font-medium">{post.viewCount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
