/**
 * Admin AI Posts Manager
 * View, edit, and manage AI-generated blog posts
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain,
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  keyword: string;
  anchor_text: string;
  target_url: string;
  ai_provider: string;
  prompt_index: number;
  word_count: number;
  status: string;
  auto_delete_at: string | null;
  is_claimed: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
}

export function AIPostsManager() {
  const [posts, setPosts] = useState<AIPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState<AIPost | null>(null);
  const [editingPost, setEditingPost] = useState<AIPost | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    claimed: 0,
    unclaimed: 0,
    expired: 0
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
      // Calculate stats
      const now = new Date();
      const stats = {
        total: data?.length || 0,
        claimed: data?.filter(p => p.is_claimed).length || 0,
        unclaimed: data?.filter(p => !p.is_claimed).length || 0,
        expired: data?.filter(p => 
          p.auto_delete_at && new Date(p.auto_delete_at) < now && !p.is_claimed
        ).length || 0
      };
      setStats(stats);

    } catch (error) {
      console.error('Error fetching AI posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('ai_generated_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const updatePost = async (post: AIPost) => {
    try {
      const { error } = await supabase
        .from('ai_generated_posts')
        .update({
          title: post.title,
          content: post.content,
          status: post.status
        })
        .eq('id', post.id);

      if (error) throw error;

      setEditingPost(null);
      await fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const runCleanup = async () => {
    try {
      const response = await fetch('/.netlify/functions/cleanup-expired-posts', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Cleanup completed: ${result.deletedCount} posts deleted`);
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'claimed' && post.is_claimed) ||
      (statusFilter === 'unclaimed' && !post.is_claimed) ||
      (statusFilter === 'expired' && post.auto_delete_at && 
       new Date(post.auto_delete_at) < new Date() && !post.is_claimed);

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const getStatusBadge = (post: AIPost) => {
    if (post.is_claimed) {
      return <Badge className="bg-green-100 text-green-800">Claimed</Badge>;
    }
    
    if (post.auto_delete_at && new Date(post.auto_delete_at) < new Date()) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-800">Unclaimed</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (autoDeleteAt: string | null) => {
    if (!autoDeleteAt) return 'N/A';
    
    const now = new Date();
    const deleteTime = new Date(autoDeleteAt);
    const diff = deleteTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">AI Posts Manager</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={runCleanup} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Cleanup
          </Button>
          <Button onClick={fetchPosts} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Claimed</p>
                <p className="text-2xl font-bold text-green-600">{stats.claimed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unclaimed</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unclaimed}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts by title, keyword, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Posts</option>
            <option value="claimed">Claimed</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Generated Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No posts found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium truncate max-w-xs" title={post.title}>
                            {post.title}
                          </p>
                          <p className="text-sm text-gray-500">/{post.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.ai_provider}</Badge>
                      </TableCell>
                      <TableCell>{post.word_count}</TableCell>
                      <TableCell>
                        <span className={
                          post.auto_delete_at && new Date(post.auto_delete_at) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }>
                          {getTimeRemaining(post.auto_delete_at)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(post.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                    <div>
                                      <strong>Keyword:</strong> {selectedPost?.keyword}
                                    </div>
                                    <div>
                                      <strong>Provider:</strong> {selectedPost?.ai_provider}
                                    </div>
                                    <div>
                                      <strong>Word Count:</strong> {selectedPost?.word_count}
                                    </div>
                                    <div>
                                      <strong>Status:</strong> {selectedPost && getStatusBadge(selectedPost)}
                                    </div>
                                  </div>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <div className="border rounded p-4 max-h-96 overflow-y-auto">
                                  <div 
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: selectedPost?.content || '' }}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={`/blog/${post.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePost(post.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      {editingPost && (
        <Dialog open={true} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({
                    ...editingPost,
                    title: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({
                    ...editingPost,
                    content: e.target.value
                  })}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editingPost.status}
                  onChange={(e) => setEditingPost({
                    ...editingPost,
                    status: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingPost(null)}>
                  Cancel
                </Button>
                <Button onClick={() => updatePost(editingPost)}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
