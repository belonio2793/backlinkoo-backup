/**
 * AI Post Manager - Admin Dashboard Component
 * Manage all AI-generated blog posts with full CRUD capabilities
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { blogPublishingService, type BlogPost } from '@/services/blogPublishingService';
import { toast } from 'sonner';

interface PostStats {
  total: number;
  published: number;
  claimed: number;
  expired: number;
  deleted: number;
}

export function AIPostManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [stats, setStats] = useState<PostStats | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const [allPosts, postStats] = await Promise.all([
        blogPublishingService.getPostsForAdmin(100),
        blogPublishingService.getPostStatistics()
      ]);
      setPosts(allPosts);
      setStats(postStats);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(postId);
      await blogPublishingService.adminDeletePost(postId);
      toast.success('Post deleted successfully');
      await loadPosts(); // Reload the list
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case 'published': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'claimed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span>AI Generated Posts</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Manage all AI-generated blog content and user claims
          </p>
        </div>
        <Button onClick={loadPosts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                  <p className="text-xs text-gray-600">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.claimed}</p>
                  <p className="text-xs text-gray-600">Claimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
                  <p className="text-xs text-gray-600">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
                  <p className="text-xs text-gray-600">Deleted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts by title, keyword, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Posts ({filteredPosts.length})</span>
            <Badge variant="outline" className="flex items-center space-x-1">
              <BarChart3 className="h-3 w-3" />
              <span>Admin View</span>
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage all AI-generated blog posts with full administrative control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No posts match your search' : 'No posts found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>SEO Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium text-gray-900 truncate">{post.title}</p>
                          <p className="text-xs text-gray-500 truncate">/{post.slug}</p>
                          <p className="text-xs text-blue-600 truncate">{post.keyword}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        {post.claimed_by && (
                          <p className="text-xs text-green-600 mt-1">Claimed</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {post.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(post.created_at || '')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.status === 'published' && (
                          <span className={new Date(post.expires_at) <= new Date() ? 'text-red-600' : 'text-orange-600'}>
                            {getTimeRemaining(post.expires_at)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.word_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-blue-600" />
                          <span className="text-sm">{post.seo_score}/100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPost(post)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{selectedPost?.title}</DialogTitle>
                                <DialogDescription>
                                  Preview and details for this AI-generated post
                                </DialogDescription>
                              </DialogHeader>
                              {selectedPost && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Keyword:</strong> {selectedPost.keyword}
                                    </div>
                                    <div>
                                      <strong>Anchor Text:</strong> {selectedPost.anchor_text}
                                    </div>
                                    <div>
                                      <strong>Target URL:</strong> 
                                      <a href={selectedPost.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                        {selectedPost.target_url}
                                      </a>
                                    </div>
                                    <div>
                                      <strong>Provider:</strong> {selectedPost.provider.toUpperCase()}
                                    </div>
                                  </div>
                                  <div 
                                    className="prose max-w-none text-sm max-h-96 overflow-y-auto border rounded p-4"
                                    dangerouslySetInnerHTML={{ __html: selectedPost.content.substring(0, 2000) + '...' }}
                                  />
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id!)}
                            disabled={deleting === post.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === post.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-cleanup Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Auto-cleanup:</strong> Unclaimed posts are automatically deleted 24 hours after creation. 
          Claimed posts are permanently saved and will not be auto-deleted.
        </AlertDescription>
      </Alert>
    </div>
  );
}
