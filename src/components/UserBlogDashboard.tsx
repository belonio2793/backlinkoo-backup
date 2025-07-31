import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BlogClaimService } from '@/services/blogClaimService';
import { BlogCleanupService } from '@/services/blogCleanupService';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ExternalLink, 
  TrendingUp, 
  Crown, 
  Trash2, 
  Plus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  BarChart3,
  Globe,
  FileText
} from 'lucide-react';

interface UserClaimStats {
  claimedCount: number;
  maxClaims: number;
  canClaim: boolean;
}

export function UserBlogDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [claimedPosts, setClaimedPosts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserClaimStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load claimed posts and user stats in parallel
      const [posts, stats] = await Promise.all([
        BlogClaimService.getUserClaimedPosts(user.id),
        BlogClaimService.getUserClaimStats(user.id)
      ]);

      setClaimedPosts(posts);
      setUserStats(stats);

    } catch (error) {
      console.error('Failed to load user blog data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load your blog posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Your blog post data has been updated.",
    });
  };

  const handleUnclaimPost = async (blogSlug: string) => {
    if (!user) return;

    try {
      const result = await BlogClaimService.unclaimBlogPost(blogSlug, user.id);
      
      if (result.success) {
        toast({
          title: "Post Unclaimed",
          description: result.message,
        });
        
        // Reload data
        await loadUserData();
        
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to unclaim post:', error);
      toast({
        title: "Error",
        description: "Failed to unclaim post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600 mb-4">Please sign in to view your claimed blog posts.</p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Blog Posts</h1>
          <p className="text-gray-600 mt-1">Manage your claimed blog posts and track performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => navigate('/blog/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Claimed Posts</p>
                <p className="text-2xl font-bold">
                  {userStats?.claimedCount || 0}/{userStats?.maxClaims || 3}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {claimedPosts.reduce((sum, post) => sum + (post.view_count || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. SEO Score</p>
                <p className="text-2xl font-bold">
                  {claimedPosts.length > 0 
                    ? Math.round(claimedPosts.reduce((sum, post) => sum + (post.seo_score || 0), 0) / claimedPosts.length)
                    : 0
                  }/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claim Status */}
      {userStats && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Claim Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You have {userStats.maxClaims - userStats.claimedCount} claims remaining
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {userStats.claimedCount} / {userStats.maxClaims}
                  </div>
                  <div className="text-xs text-gray-500">posts claimed</div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userStats.claimedCount / userStats.maxClaims) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Claimed Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimedPosts.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">No Claimed Posts Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  You haven't claimed any blog posts yet. Visit the blog page to find posts you can claim, 
                  or create a new one.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate('/blog')}
                  variant="outline"
                >
                  Browse Blog Posts
                </Button>
                <Button
                  onClick={() => navigate('/blog/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Post
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                            onClick={() => navigate(`/blog/${post.slug}`)}>
                          {post.title}
                        </h3>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <Crown className="mr-1 h-3 w-3" />
                          Claimed
                        </Badge>
                      </div>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.reading_time || 5}m read</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{post.seo_score || 75}/100 SEO</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={post.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Target
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnclaimPost(post.slug)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/blog/create')}
            >
              <Plus className="h-6 w-6" />
              <span>Create New Post</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/blog')}
            >
              <Globe className="h-6 w-6" />
              <span>Browse All Posts</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
