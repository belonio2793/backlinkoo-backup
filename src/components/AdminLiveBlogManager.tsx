import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit3,
  Trash2,
  Eye,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Clock,
  Users,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { liveBlogPublisher, type LiveBlogPost } from '@/services/liveBlogPublisher';
import { format, formatDistanceToNow } from 'date-fns';
import { ExcerptCleaner } from '@/utils/excerptCleaner';

export function AdminLiveBlogManager() {
  const [blogPosts, setBlogPosts] = useState<LiveBlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<LiveBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<LiveBlogPost | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    trialPosts: 0,
    totalViews: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBlogPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [blogPosts, searchQuery, statusFilter]);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      const posts = await liveBlogPublisher.getAllBlogPosts(100);
      setBlogPosts(posts);
      calculateStats(posts);
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

  const calculateStats = (posts: LiveBlogPost[]) => {
    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      trialPosts: posts.filter(p => p.isTrialPost).length,
      totalViews: posts.reduce((sum, p) => sum + (p.viewCount || 0), 0)
    };
    setStats(stats);
  };

  const filterPosts = () => {
    let filtered = [...blogPosts];

    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'trial') {
        filtered = filtered.filter(post => post.isTrialPost);
      } else if (statusFilter === 'permanent') {
        filtered = filtered.filter(post => !post.isTrialPost);
      } else {
        filtered = filtered.filter(post => post.status === statusFilter);
      }
    }

    setFilteredPosts(filtered);
  };

  const handleEditPost = (post: LiveBlogPost) => {
    setEditingPost({ ...post });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const success = await liveBlogPublisher.updateBlogPost(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        metaDescription: editingPost.metaDescription,
        keywords: editingPost.keywords
      });

      if (success) {
        toast({
          title: 'Post Updated',
          description: 'Blog post has been updated successfully',
        });
        setShowEditDialog(false);
        loadBlogPosts();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update blog post',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await liveBlogPublisher.deleteBlogPost(postId);
      
      if (success) {
        toast({
          title: 'Post Deleted',
          description: 'Blog post has been deleted successfully',
        });
        loadBlogPosts();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete blog post',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (post: LiveBlogPost) => {
    if (post.status === 'scheduled_deletion') return 'destructive';
    if (post.isTrialPost) return 'secondary';
    return 'default';
  };

  const getStatusLabel = (post: LiveBlogPost) => {
    if (post.status === 'scheduled_deletion') return 'Deleted';
    if (post.isTrialPost) return 'Trial';
    return 'Permanent';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Blog Management</h2>
          <p className="text-muted-foreground">Manage all published blog posts and backlinks</p>
        </div>
        <Button onClick={loadBlogPosts} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Trial Posts</p>
                <p className="text-2xl font-bold">{stats.trialPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Posts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, keywords, or target URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Posts</option>
                <option value="published">Published</option>
                <option value="trial">Trial Posts</option>
                <option value="permanent">Permanent Posts</option>
                <option value="scheduled_deletion">Deleted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blog posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No blog posts have been created yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">{post.title}</h3>
                      <Badge variant={getStatusColor(post)}>
                        {getStatusLabel(post)}
                      </Badge>
                      {post.isTrialPost && post.expiresAt && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires {formatDistanceToNow(new Date(post.expiresAt), { addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Target: {post.targetUrl}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Views: {post.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          SEO: {post.seoScore}/100
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span>Keywords:</span>
                        <div className="flex gap-1">
                          {post.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {post.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.keywords.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span>Created: {format(new Date(post.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        {post.userId && <span className="ml-4">User ID: {post.userId.substring(0, 8)}...</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(post.publishedUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Contextual Links Preview */}
                {post.contextualLinks && post.contextualLinks.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Contextual Links ({post.contextualLinks.length})</h4>
                    <div className="space-y-1">
                      {post.contextualLinks.slice(0, 2).map((link: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium">{link.anchorText}</span> → {link.targetUrl}
                        </div>
                      ))}
                      {post.contextualLinks.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{post.contextualLinks.length - 2} more links
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-meta">Meta Description</Label>
                <Textarea
                  id="edit-meta"
                  value={editingPost.metaDescription || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, metaDescription: e.target.value } : null)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-keywords">Keywords (comma separated)</Label>
                <Input
                  id="edit-keywords"
                  value={editingPost.keywords.join(', ')}
                  onChange={(e) => setEditingPost(prev => prev ? { 
                    ...prev, 
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  } : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content (HTML)</Label>
                <Textarea
                  id="edit-content"
                  value={editingPost.content}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
