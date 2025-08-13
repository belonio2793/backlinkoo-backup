import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { Clock, Eye, Calendar, ExternalLink, User, Plus } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function TrialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [availablePosts, setAvailablePosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user's posts (both claimed and trial)
      const userPosts = await blogService.getUserBlogPosts(user.id);
      setMyPosts(userPosts);

      // Load available trial posts (unclaimed)
      const recentPosts = await blogService.getRecentBlogPosts(20);
      const unclaimedPosts = recentPosts.filter(post => 
        post.is_trial_post && !post.user_id
      );
      setAvailablePosts(unclaimedPosts);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const claimPost = async (postId: string) => {
    if (!user) return;

    setClaiming(postId);
    try {
      await blogService.updateBlogPost(postId, {
        user_id: user.id,
        is_trial_post: false,
        expires_at: null
      });

      toast({
        title: "Post Claimed!",
        description: "The blog post has been claimed and added to your collection.",
      });

      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim this post. You may have reached the limit of 3 claimed posts.",
        variant: "destructive"
      });
    } finally {
      setClaiming(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft < 1) return `${Math.floor(hoursLeft * 60)} minutes`;
    return `${Math.floor(hoursLeft)} hours`;
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  };

  const claimedPosts = myPosts.filter(post => !post.is_trial_post);
  const trialPosts = myPosts.filter(post => post.is_trial_post);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to view your trial dashboard.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trial Dashboard</h1>
            <p className="text-gray-600">
              Manage your blog posts and claim trial posts to keep them permanently
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{claimedPosts.length}</div>
                <p className="text-sm text-gray-600">Claimed Posts</p>
                <p className="text-xs text-gray-500">{3 - claimedPosts.length} remaining</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{trialPosts.length}</div>
                <p className="text-sm text-gray-600">Trial Posts</p>
                <p className="text-xs text-gray-500">Temporary posts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{availablePosts.length}</div>
                <p className="text-sm text-gray-600">Unclaimed</p>
                <p className="text-xs text-gray-500">Unclaimed trial posts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {myPosts.reduce((sum, post) => sum + (post.view_count || 0), 0)}
                </div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-xs text-gray-500">Across all posts</p>
              </CardContent>
            </Card>
          </div>

          {/* Create New Post */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Create New Blog Post</h3>
                  <p className="text-sm text-blue-700">
                    Generate AI-powered content with natural backlinks
                  </p>
                </div>
                <Button onClick={() => navigate('/blog/create')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading dashboard...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* My Claimed Posts */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  My Claimed Posts ({claimedPosts.length}/3)
                </h2>
                
                {claimedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No claimed posts yet</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Claim trial posts to keep them permanently in your collection
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {claimedPosts.map(post => (
                      <Card key={post.id} className="border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2">
                              {post.title}
                            </CardTitle>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Claimed
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.view_count}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/blog/${post.slug}`)}
                              className="flex-1"
                            >
                              View Post
                            </Button>
                            {post.target_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(post.target_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* My Trial Posts */}
              {trialPosts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    My Trial Posts ({trialPosts.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trialPosts.map(post => (
                      <Card key={post.id} className="border-yellow-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2">
                              {post.title}
                            </CardTitle>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                              Trial
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.created_at)}
                            </div>
                            {post.expires_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeUntilExpiry(post.expires_at)} left
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            className="w-full mb-2"
                          >
                            View Post
                          </Button>
                          {isExpiringSoon(post.expires_at) && (
                            <p className="text-xs text-red-600 text-center">
                              ⚠️ Expires soon!
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Posts to Claim */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Available Posts to Claim ({availablePosts.length})
                </h2>
                
                {availablePosts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No unclaimed posts</p>
                      <p className="text-sm text-gray-500">
                        Check back later or create new trial posts
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePosts.map(post => (
                      <Card key={post.id} className="border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2">
                              {post.title}
                            </CardTitle>
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              Available
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeUntilExpiry(post.expires_at)} left
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/blog/${post.slug}`)}
                              className="flex-1"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => claimPost(post.id)}
                              disabled={claiming === post.id || claimedPosts.length >= 3}
                              className="flex-1"
                            >
                              {claiming === post.id ? 'Claiming...' : 'Claim'}
                            </Button>
                          </div>
                          {claimedPosts.length >= 3 && (
                            <p className="text-xs text-red-600 text-center mt-2">
                              Claim limit reached (3/3)
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
