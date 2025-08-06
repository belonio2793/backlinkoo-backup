import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Eye,
  BarChart3,
  Clock,
  Globe,
  TrendingUp,
  Star,
  LinkIcon,
  FileText,
  Calendar,
  Target,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExcerptCleaner } from '@/utils/excerptCleaner';
import { liveBlogPublisher, type LiveBlogPost } from '@/services/liveBlogPublisher';
import { supabase } from '@/integrations/supabase/client';
import { UserClaimedPosts } from '@/components/UserClaimedPosts';
import { format, formatDistanceToNow } from 'date-fns';

interface UserBlogDashboardProps {
  userId: string;
}

export function UserBlogDashboard({ userId }: UserBlogDashboardProps) {
  const [blogPosts, setBlogPosts] = useState<LiveBlogPost[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalBacklinks: 0,
    avgSeoScore: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      // Load user's blog posts
      const posts = await liveBlogPublisher.getUserBlogPosts(userId);
      setBlogPosts(posts);

      // Load user's campaigns
      const { data: campaignData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(campaignData || []);

      // Calculate stats
      calculateStats(posts, campaignData || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your dashboard data',
        variant: 'destructive'
      });
    } finally {
      // No loading state
    }
  };

  const calculateStats = (posts: LiveBlogPost[], campaigns: any[]) => {
    const totalBacklinks = posts.reduce((sum, post) => 
      sum + (post.contextualLinks?.length || 1), 0
    );
    
    const avgSeoScore = posts.length > 0 
      ? Math.round(posts.reduce((sum, post) => sum + (post.seoScore || 0), 0) / posts.length)
      : 0;

    setStats({
      totalPosts: posts.length,
      totalViews: posts.reduce((sum, post) => sum + (post.viewCount || 0), 0),
      totalBacklinks,
      avgSeoScore
    });
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Your Backlink Dashboard</h2>
        <p className="text-muted-foreground">Manage your blog posts and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Live Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Backlinks</p>
                <p className="text-2xl font-bold">{stats.totalBacklinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg SEO Score</p>
                <p className="text-2xl font-bold">{stats.avgSeoScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="blog-posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blog-posts">Live Blog Posts</TabsTrigger>
          <TabsTrigger value="claimed-posts">Claimed Posts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="blog-posts" className="space-y-4">
          {blogPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first free backlink to get started
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Create Your First Backlink
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{post.title}</h3>
                          <Badge
                            variant={post.isTrialPost ? 'outline' : 'default'}
                            className={post.isTrialPost ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          >
                            {post.isTrialPost ? (
                              <>
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Claimed
                              </>
                            ) : (
                              'Permanent'
                            )}
                          </Badge>
                          {post.status === 'published' && (
                            <Badge variant="outline" className="text-green-600">
                              <Globe className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.metaDescription}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-medium truncate">{new URL(post.targetUrl).hostname}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3 text-green-500" />
                            <span className="text-muted-foreground">Links:</span>
                            <span className="font-medium">{post.contextualLinks?.length || 1}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-purple-500" />
                            <span className="text-muted-foreground">Views:</span>
                            <span className="font-medium">{post.viewCount || 0}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-orange-500" />
                            <span className="text-muted-foreground">SEO:</span>
                            <span className="font-medium">{post.seoScore}/100</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(post.publishedUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Live
                        </Button>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">Keywords:</span>
                      <div className="flex gap-1 flex-wrap">
                        {post.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Contextual Links */}
                    {post.contextualLinks && post.contextualLinks.length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Contextual Backlinks ({post.contextualLinks.length})
                        </h4>
                        <div className="space-y-2">
                          {post.contextualLinks.slice(0, 2).map((link: any, index: number) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-600">"{link.anchorText}"</span>
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  {Math.round(link.relevanceScore * 100)}% relevance
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {link.context}
                              </p>
                            </div>
                          ))}
                          {post.contextualLinks.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{post.contextualLinks.length - 2} more contextual links
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </span>
                        {post.isTrialPost && post.expiresAt && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            Expires {formatDistanceToNow(new Date(post.expiresAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <Badge variant="outline" className="text-green-600">
                            <Zap className="h-3 w-3 mr-1" />
                            Indexed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claimed-posts" className="space-y-4">
          <UserClaimedPosts />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground">
                  Your completed backlink campaigns will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.target_url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {campaign.links_delivered}/{campaign.links_requested} links
                        </Badge>
                        <Badge variant="default">
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
