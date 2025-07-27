import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { publishedBlogService, type PublishedBlogPost } from '@/services/publishedBlogService';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ExternalLink,
  Search,
  Trash2,
  Archive,
  RotateCcw,
  User,
  TrendingUp,
  Sparkles,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

export function AdminBlogManager() {
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<PublishedBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [trialFilter, setTrialFilter] = useState<string>('');

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      // For admin, we want to see all posts including trials
      const posts = await publishedBlogService.getRecentBlogPosts(100);
      setBlogPosts(posts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPostTypeInfo = (post: PublishedBlogPost) => {
    const info = [];

    if (post.is_trial_post) {
      info.push({
        label: 'Trial Post',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: 'Sparkles'
      });
    } else {
      info.push({
        label: 'Permanent',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: 'Shield'
      });
    }

    if (post.user_id) {
      info.push({
        label: 'User Post',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: 'User'
      });
    } else {
      info.push({
        label: 'Demo Post',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: 'Eye'
      });
    }

    return info;
  };

  const isExpired = (post: PublishedBlogPost) => {
    if (!post.is_trial_post || !post.expires_at) return false;
    return new Date() > new Date(post.expires_at);
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || post.status === statusFilter;
    
    const matchesTrial = trialFilter === '' || 
      (trialFilter === 'trial' && post.is_trial_post) ||
      (trialFilter === 'permanent' && !post.is_trial_post) ||
      (trialFilter === 'expired' && isExpired(post));
    
    return matchesSearch && matchesStatus && matchesTrial;
  });

  const cleanupExpiredPosts = async () => {
    try {
      await publishedBlogService.cleanupExpiredTrialPosts();
      await loadBlogPosts();
      toast({
        title: 'Success',
        description: 'Expired trial posts cleaned up successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cleanup expired posts',
        variant: 'destructive'
      });
    }
  };

  const verifySyncStatus = async () => {
    try {
      const publicPosts = await publishedBlogService.getRecentBlogPosts(50);
      const adminPosts = blogPosts;

      const syncIssues = [];

      // Check for posts in admin but not public
      adminPosts.forEach(adminPost => {
        const foundInPublic = publicPosts.find(p => p.slug === adminPost.slug);
        if (!foundInPublic) {
          syncIssues.push(`Admin post "${adminPost.title}" not found in public view`);
        }
      });

      // Check for posts in public but not admin
      publicPosts.forEach(publicPost => {
        const foundInAdmin = adminPosts.find(p => p.slug === publicPost.slug);
        if (!foundInAdmin) {
          syncIssues.push(`Public post "${publicPost.title}" not found in admin view`);
        }
      });

      if (syncIssues.length === 0) {
        toast({
          title: 'Sync Verified ✅',
          description: `All ${adminPosts.length} posts are properly synced between admin and public views`
        });
      } else {
        toast({
          title: 'Sync Issues Found',
          description: `${syncIssues.length} sync issues detected. Check console for details.`,
          variant: 'destructive'
        });
        console.warn('Sync Issues:', syncIssues);
      }
    } catch (error) {
      toast({
        title: 'Sync Check Failed',
        description: 'Unable to verify sync status',
        variant: 'destructive'
      });
    }
  };

  const exportPostsData = () => {
    const csvData = filteredPosts.map(post => ({
      title: post.title,
      slug: post.slug,
      target_url: post.target_url,
      keywords: post.keywords.join('; '),
      status: post.status,
      is_trial: post.is_trial_post ? 'Yes' : 'No',
      expires_at: post.expires_at || 'Never',
      view_count: post.view_count,
      seo_score: post.seo_score,
      word_count: post.word_count,
      created_at: post.created_at,
      user_type: post.user_id ? 'Registered' : 'Guest'
    }));

    const csv = [
      Object.keys(csvData[0] || {}),
      ...csvData.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-posts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: blogPosts.length,
    published: blogPosts.filter(p => p.status === 'published').length,
    trial: blogPosts.filter(p => p.is_trial_post).length,
    expired: blogPosts.filter(p => isExpired(p)).length,
    totalViews: blogPosts.reduce((sum, p) => sum + p.view_count, 0),
    avgSeoScore: Math.round(blogPosts.reduce((sum, p) => sum + p.seo_score, 0) / (blogPosts.length || 1))
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Blog Posts Management</h2>
            <p className="text-gray-600">Manage all generated blog posts and backlinks</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={verifySyncStatus} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify Sync
            </Button>
            <Button onClick={cleanupExpiredPosts} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup Expired
            </Button>
            <Button onClick={exportPostsData} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={loadBlogPosts} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.trial}</div>
              <div className="text-sm text-gray-600">Trial Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">Expired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.avgSeoScore}</div>
              <div className="text-sm text-gray-600">Avg SEO Score</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title, URL, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={trialFilter}
              onChange={(e) => setTrialFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="trial">Trial Posts</option>
              <option value="permanent">Permanent Posts</option>
              <option value="expired">Expired Posts</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No blog posts found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id} 
                  className={`border rounded-lg p-4 ${isExpired(post) ? 'bg-red-50 border-red-200' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate flex-1 min-w-0">{post.title}</h3>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status.toUpperCase()}
                        </Badge>
                        {getPostTypeInfo(post).map((info, index) => (
                          <Badge key={index} variant="outline" className={info.color}>
                            {info.icon === 'Sparkles' && <Sparkles className="mr-1 h-3 w-3" />}
                            {info.icon === 'User' && <User className="mr-1 h-3 w-3" />}
                            {info.icon === 'Eye' && <Eye className="mr-1 h-3 w-3" />}
                            {info.label}
                          </Badge>
                        ))}
                        {isExpired(post) && (
                          <Badge variant="destructive" className="animate-pulse">
                            EXPIRED
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Target:</strong> {post.target_url}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Keywords:</strong> {post.keywords.slice(0, 3).join(', ')}
                        {post.keywords.length > 3 && ` +${post.keywords.length - 3} more`}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.view_count} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>SEO: {post.seo_score}/100</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.reading_time}m read</span>
                        </div>
                        {post.user_id && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{post.user_id.substring(0, 8)}...</span>
                          </div>
                        )}
                        {post.expires_at && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            <span>Expires: {formatDate(post.expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={post.target_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
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
