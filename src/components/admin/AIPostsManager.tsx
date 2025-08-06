import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExcerptCleaner } from '@/utils/excerptCleaner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Download,
  Clock,
  Users,
  BarChart3,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface AIGeneratedPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  published_url: string;
  meta_description: string;
  keywords: string[];
  word_count: number;
  user_id?: string;
  session_id: string;
  created_at: string;
  expires_at: string;
  is_claimed: boolean;
  claimed_at?: string;
  updated_at: string;
}

interface AIPostsStats {
  total: number;
  claimed: number;
  unclaimed: number;
  expired: number;
  totalWords: number;
  averageWords: number;
}

export function AIPostsManager() {
  const [posts, setPosts] = useState<AIGeneratedPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<AIGeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimed' | 'unclaimed' | 'expired'>('all');
  const [stats, setStats] = useState<AIPostsStats | null>(null);
  const [selectedPost, setSelectedPost] = useState<AIGeneratedPost | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, filterStatus]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading AI posts:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load AI-generated posts",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData: AIGeneratedPost[]) => {
    const now = new Date();
    const expired = postsData.filter(post => new Date(post.expires_at) < now && !post.is_claimed);
    const claimed = postsData.filter(post => post.is_claimed);
    const unclaimed = postsData.filter(post => !post.is_claimed && new Date(post.expires_at) >= now);
    
    const totalWords = postsData.reduce((sum, post) => sum + post.word_count, 0);
    
    setStats({
      total: postsData.length,
      claimed: claimed.length,
      unclaimed: unclaimed.length,
      expired: expired.length,
      totalWords,
      averageWords: postsData.length ? Math.round(totalWords / postsData.length) : 0
    });
  };

  const filterPosts = () => {
    let filtered = posts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
        post.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    const now = new Date();
    switch (filterStatus) {
      case 'claimed':
        filtered = filtered.filter(post => post.is_claimed);
        break;
      case 'unclaimed':
        filtered = filtered.filter(post => !post.is_claimed && new Date(post.expires_at) >= now);
        break;
      case 'expired':
        filtered = filtered.filter(post => new Date(post.expires_at) < now && !post.is_claimed);
        break;
    }

    setFilteredPosts(filtered);
  };

  const deletePost = async (postId: string) => {
    try {
      setIsDeleting(postId);
      
      const { error } = await supabase
        .from('ai_generated_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post Deleted",
        description: "AI-generated post has been permanently deleted",
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const cleanupExpiredPosts = async () => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('ai_generated_posts')
        .delete()
        .eq('is_claimed', false)
        .lt('expires_at', now);

      if (error) {
        throw error;
      }

      await loadPosts();
      toast({
        title: "Cleanup Complete",
        description: "All expired unclaimed posts have been removed",
      });
    } catch (error: any) {
      console.error('Error cleaning up posts:', error);
      toast({
        title: "Cleanup Failed", 
        description: error.message || "Failed to cleanup expired posts",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Title', 'Slug', 'Word Count', 'Keywords', 'Status', 'Created', 'Expires'],
      ...filteredPosts.map(post => [
        post.id,
        post.title,
        post.slug,
        post.word_count.toString(),
        post.keywords.join('; '),
        post.is_claimed ? 'Claimed' : 'Unclaimed',
        new Date(post.created_at).toLocaleDateString(),
        new Date(post.expires_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-posts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (post: AIGeneratedPost) => {
    const now = new Date();
    const expires = new Date(post.expires_at);
    
    if (post.is_claimed) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Claimed</Badge>;
    } else if (expires < now) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Unclaimed</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading AI posts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Posts Manager</h2>
          <p className="text-gray-600">Manage all AI-generated blog posts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={cleanupExpiredPosts} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadPosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.claimed}</p>
                  <p className="text-sm text-gray-600">Claimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.unclaimed}</p>
                  <p className="text-sm text-gray-600">Unclaimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageWords}</p>
                  <p className="text-sm text-gray-600">Avg Words</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
            <Input
              placeholder="Search posts by title, keywords, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Tabs value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="claimed">Claimed</TabsTrigger>
            <TabsTrigger value="unclaimed">Unclaimed</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Words</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-500">/{post.slug}</div>
                      <div className="flex gap-1 mt-1">
                        {post.keywords.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post)}</TableCell>
                  <TableCell>{post.word_count}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(post.expires_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedPost(post)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(post.published_url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Post
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deletePost(post.id)}
                          disabled={isDeleting === post.id}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No posts found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Details Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Title</Label>
                  <p className="text-sm">{selectedPost.title}</p>
                </div>
                <div>
                  <Label className="font-medium">Word Count</Label>
                  <p className="text-sm">{selectedPost.word_count} words</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  {getStatusBadge(selectedPost)}
                </div>
                <div>
                  <Label className="font-medium">URL</Label>
                  <a 
                    href={selectedPost.published_url} 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedPost.published_url}
                  </a>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Meta Description</Label>
                <p className="text-sm text-gray-600">{selectedPost.meta_description}</p>
              </div>
              
              <div>
                <Label className="font-medium">Keywords</Label>
                <div className="flex gap-1 mt-1">
                  {selectedPost.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Content Preview</Label>
                <div 
                  className="text-sm border rounded p-4 max-h-40 overflow-y-auto bg-gray-50"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedPost.content.substring(0, 500) + '...' 
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
