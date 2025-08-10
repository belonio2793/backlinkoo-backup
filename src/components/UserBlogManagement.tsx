import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BlogClaimService } from '@/services/blogClaimService';
import {
  Plus,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  ExternalLink,
  Crown,
  Loader2,
  RefreshCw,
  Globe
} from 'lucide-react';

interface UserClaimStats {
  claimedCount: number;
  maxClaims: number;
  canClaim: boolean;
}

export function UserBlogManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claimedPosts, setClaimedPosts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserClaimStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserBlogPosts();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterPosts();
  }, [blogPosts, searchQuery, statusFilter]);

  const loadUserBlogPosts = async () => {
    if (!user) return;

    try {
      const posts = await blogService.getUserBlogPosts(user.id);
      setBlogPosts(posts);
    } catch (error) {
      console.error('Failed to load user blog posts:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      toast({
        title: "Error",
        description: "Failed to load your blog posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const userStats = await blogService.getBlogPostStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filterPosts = () => {
    let filtered = blogPosts;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(filtered);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      await blogService.deleteBlogPost(postId);
      setBlogPosts(prev => prev.filter(post => post.id !== postId));
      loadStats();
      toast({
        title: "Post Deleted",
        description: "Your blog post has been deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePostSaved = (savedPost: BlogPost) => {
    setBlogPosts(prev => {
      const existing = prev.find(p => p.id === savedPost.id);
      if (existing) {
        // Update existing post
        return prev.map(p => p.id === savedPost.id ? savedPost : p);
      } else {
        // Add new post
        return [savedPost, ...prev];
      }
    });
    setEditingPost(null);
    setShowCreateForm(false);
    loadStats();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Please log in to manage your blog posts.</p>
        </CardContent>
      </Card>
    );
  }

  if (editingPost) {
    return (
      <BlogEditor
        postId={editingPost}
        mode="edit"
        onSave={handlePostSaved}
        onCancel={() => setEditingPost(null)}
      />
    );
  }

  if (showCreateForm) {
    return (
      <BlogEditor
        mode="create"
        onSave={handlePostSaved}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Blog Posts</h2>
          <p className="text-muted-foreground">
            Manage your blog posts, track performance, and create new content
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.drafts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Trial Posts</p>
                <p className="text-2xl font-bold">{stats.trialPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by title, content, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No posts match your search criteria.' : 'You haven\'t created any blog posts yet.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer"
                          onClick={() => navigate(`/blog/${post.slug}`)}>
                        {post.title}
                      </h3>
                      <Badge variant={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                      {post.is_trial_post && (
                        <Badge variant="outline" className="text-xs">
                          Trial
                        </Badge>
                      )}
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time} min read
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.view_count} views
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        SEO Score: {post.seo_score}
                      </div>
                      {post.target_url && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <a 
                            href={post.target_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline max-w-[200px] truncate"
                          >
                            {new URL(post.target_url).hostname}
                          </a>
                        </div>
                      )}
                    </div>

                    {post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.keywords.slice(0, 5).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {post.keywords.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPost(post.id)}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
