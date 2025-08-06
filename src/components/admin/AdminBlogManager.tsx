import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { publishedBlogService, type PublishedBlogPost } from '@/services/publishedBlogService';
import { contentFilterService } from '@/services/contentFilterService';
import { contentModerationService } from '@/services/contentModerationService';
import { adminAuditLogger } from '@/services/adminAuditLogger';
import { adminBlogOverrideService } from '@/services/adminBlogOverrideService';
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
  RefreshCw,
  Shield,
  AlertTriangle,
  Zap
} from 'lucide-react';

export function AdminBlogManager() {
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<PublishedBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [trialFilter, setTrialFilter] = useState<string>('');
  const [contentFilterStats, setContentFilterStats] = useState<any>(null);
  const [moderationStats, setModerationStats] = useState<any>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState<PublishedBlogPost | null>(null);

  useEffect(() => {
    loadBlogPosts();
    loadContentFilterStats();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      console.log('📖 AdminBlogManager: Loading blog posts...');
      // For admin, we want to see all posts including trials
      const posts = await publishedBlogService.getRecentBlogPosts(100);

      console.log('📖 AdminBlogManager: Loaded posts:', posts);
      // Ensure posts is always an array to prevent undefined errors
      setBlogPosts(Array.isArray(posts) ? posts : []);

      // Log the admin action of viewing blog posts
      await adminAuditLogger.logSystemAction(
        'METRICS_VIEWED',
        {
          section: 'blog_management',
          action: 'view_blog_posts',
          posts_count: Array.isArray(posts) ? posts.length : 0,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      await adminAuditLogger.logSystemAction(
        'METRICS_VIEWED',
        {
          section: 'blog_management',
          action: 'view_blog_posts_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Failed to load blog posts'
      );
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContentFilterStats = async () => {
    try {
      const [filterStats, modStats] = await Promise.all([
        contentFilterService.getFilterStats(7),
        contentModerationService.getModerationStats(7)
      ]);
      setContentFilterStats(filterStats);
      setModerationStats(modStats);
    } catch (error) {
      console.warn('Failed to load content filter stats:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
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

  const filteredPosts = (Array.isArray(blogPosts) ? blogPosts : []).filter(post => {
    const matchesSearch = searchTerm === '' ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.target_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(post.keywords) && post.keywords.some(keyword => keyword?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = statusFilter === '' || post.status === statusFilter;
    
    const matchesTrial = trialFilter === '' || 
      (trialFilter === 'trial' && post.is_trial_post) ||
      (trialFilter === 'permanent' && !post.is_trial_post) ||
      (trialFilter === 'expired' && isExpired(post));
    
    return matchesSearch && matchesStatus && matchesTrial;
  });

  const cleanupExpiredPosts = async () => {
    try {
      const expiredPostsCount = blogPosts.filter(p => isExpired(p)).length;

      await publishedBlogService.cleanupExpiredTrialPosts();
      await loadBlogPosts();

      // Log the cleanup action
      await adminAuditLogger.logBlogAction(
        'BLOG_BULK_DELETE',
        'bulk_cleanup',
        undefined,
        {
          action: 'cleanup_expired_posts',
          expired_posts_count: expiredPostsCount,
          timestamp: new Date().toISOString()
        }
      );

      toast({
        title: 'Success',
        description: 'Expired trial posts cleaned up successfully'
      });
    } catch (error) {
      // Log the failed cleanup
      await adminAuditLogger.logBlogAction(
        'BLOG_BULK_DELETE',
        'bulk_cleanup',
        undefined,
        {
          action: 'cleanup_expired_posts_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Failed to cleanup expired posts'
      );

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

  const exportPostsData = async () => {
    try {
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

      // Log the data export action
      await adminAuditLogger.logSystemAction(
        'DATA_EXPORT',
        {
          export_type: 'blog_posts_csv',
          record_count: filteredPosts.length,
          filters: {
            search_term: searchTerm,
            status_filter: statusFilter,
            trial_filter: trialFilter
          },
          timestamp: new Date().toISOString()
        }
      );

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredPosts.length} blog posts to CSV`
      });
    } catch (error) {
      await adminAuditLogger.logSystemAction(
        'DATA_EXPORT',
        {
          export_type: 'blog_posts_csv_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Failed to export blog posts'
      );

      toast({
        title: 'Export Failed',
        description: 'Failed to export blog posts',
        variant: 'destructive'
      });
    }
  };

  const handleForceDeletePost = async (post: PublishedBlogPost) => {
    setConfirmDeletePost(post);
  };

  const confirmForceDelete = async () => {
    if (!confirmDeletePost) return;

    setDeletingPostId(confirmDeletePost.id);

    try {
      const result = await adminBlogOverrideService.forceDeleteBlogPost(
        confirmDeletePost.id,
        `Admin override delete: ${confirmDeletePost.title}`
      );

      if (result.success) {
        toast({
          title: 'Post Deleted',
          description: `Successfully deleted "${confirmDeletePost.title}"`,
          variant: 'default'
        });

        // Refresh the posts list
        await loadBlogPosts();
      } else {
        toast({
          title: 'Delete Failed',
          description: result.error || 'Failed to delete post',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Delete Error',
        description: 'An unexpected error occurred while deleting the post',
        variant: 'destructive'
      });
    } finally {
      setDeletingPostId(null);
      setConfirmDeletePost(null);
    }
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

        {/* Content Protection Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {contentFilterStats && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Content Filter</span>
                  </div>
                  {contentFilterService.getConfiguration().enabled ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-red-600">{contentFilterStats.blocked}</div>
                    <div className="text-xs text-gray-600">Blocked</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-orange-600">{contentFilterStats.blockRate}%</div>
                    <div className="text-xs text-gray-600">Block Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{contentFilterStats.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {moderationStats && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Content Moderation</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {moderationStats.pending} Pending
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">{moderationStats.approved}</div>
                    <div className="text-xs text-gray-600">Approved</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{moderationStats.rejected}</div>
                    <div className="text-xs text-gray-600">Rejected</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">{moderationStats.approvalRate}%</div>
                    <div className="text-xs text-gray-600">Approval Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
              {(Array.isArray(filteredPosts) ? filteredPosts : []).map((post) => (
                <div
                  key={post.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    isExpired(post)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate flex-1 min-w-0">{post.title || 'Untitled Post'}</h3>
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
                        <strong>Target:</strong> {post.target_url || 'No target URL'}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Keywords:</strong> {(post.keywords && Array.isArray(post.keywords))
                          ? post.keywords.slice(0, 3).join(', ')
                          : 'No keywords'
                        }
                        {(post.keywords && Array.isArray(post.keywords) && post.keywords.length > 3) && ` +${post.keywords.length - 3} more`}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>SEO: {post.seo_score || 0}/100</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.reading_time || 0}m read</span>
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
                    
                    <div className="flex flex-col gap-2 ml-4 min-w-[200px]">
                      {/* Published URL */}
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          Published URL:
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 p-2 rounded border">
                          <code className="text-xs text-blue-600 truncate max-w-[150px]">
                            {post.published_url || `${window.location.origin}/blog/${post.slug}`}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              const url = post.published_url || `${window.location.origin}/blog/${post.slug}`;
                              navigator.clipboard.writeText(url);
                              toast({ title: "URL copied to clipboard" });
                            }}
                          >
                            📋
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            asChild
                          >
                            <a
                              href={post.published_url || `/blog/${post.slug}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1"
                          onClick={() => {
                            // Edit functionality (placeholder)
                            toast({
                              title: "Edit Feature",
                              description: "Edit functionality coming soon"
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1"
                          onClick={() => {
                            // Settings functionality (placeholder)
                            toast({
                              title: "Settings",
                              description: "Settings panel coming soon"
                            });
                          }}
                        >
                          Settings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1"
                          asChild
                        >
                          <a href={post.target_url} target="_blank" rel="noopener noreferrer">
                            Target
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 border-red-600"
                          onClick={() => handleForceDeletePost(post)}
                          disabled={deletingPostId === post.id}
                        >
                          {deletingPostId === post.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          Force Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Force Delete */}
      {confirmDeletePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Force Delete Blog Post</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                You are about to <strong>permanently delete</strong> the following blog post:
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium text-gray-900">{confirmDeletePost.title}</p>
                <p className="text-sm text-gray-600">ID: {confirmDeletePost.id}</p>
                <p className="text-sm text-gray-600">URL: {confirmDeletePost.published_url}</p>
              </div>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  ADMIN OVERRIDE - ALL CONDITIONS BYPASSED
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This will bypass all permission checks, claim statuses, and deletion restrictions.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDeletePost(null)}
                disabled={deletingPostId === confirmDeletePost.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmForceDelete}
                disabled={deletingPostId === confirmDeletePost.id}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingPostId === confirmDeletePost.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Force Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
