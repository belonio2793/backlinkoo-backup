/**
 * Admin Blog Management Panel
 * Full control and edit capability for all blog posts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { blogAutoDeleteService } from '@/services/blogAutoDeleteService';
import { supabase } from '@/integrations/supabase/client';
import { databaseDiagnostic } from '@/utils/databaseDiagnostic';
import {
  FileText,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published_url: string;
  status: 'unclaimed' | 'claimed' | 'expired';
  created_at: string;
  expires_at?: string;
  word_count: number;
  user_id?: string;
  target_url: string;
  anchor_text: string;
}

interface CleanupStats {
  totalPosts: number;
  unclaimedPosts: number;
  claimedPosts: number;
  expiredPosts: number;
  expiringSoon: number;
}

export function BlogManagementPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBlogPosts();
    loadStats();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_trial_post', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading blog posts:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      setPosts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading blog posts:', errorMessage);
      toast({
        title: "Error",
        description: `Failed to load blog posts: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const stats = await blogAutoDeleteService.getCleanupStats();
      setStats(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading stats:', errorMessage);
      toast({
        title: "Warning",
        description: `Could not load statistics: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    setDeleting(postId);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: "Post Deleted",
        description: "Blog post has been permanently deleted",
      });
      
      // Reload stats
      loadStats();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const runCleanup = async () => {
    setRunningCleanup(true);
    try {
      const result = await blogAutoDeleteService.cleanupExpiredPosts();
      
      toast({
        title: "Cleanup Complete",
        description: `Deleted ${result.deletedCount} expired posts. ${result.errors.length} errors.`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });

      // Reload data
      await Promise.all([loadBlogPosts(), loadStats()]);
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to run blog cleanup",
        variant: "destructive",
      });
    } finally {
      setRunningCleanup(false);
    }
  };

  const runDiagnostic = async () => {
    setRunningDiagnostic(true);
    try {
      console.log('🔍 Running database diagnostic...');
      const results = await databaseDiagnostic.runCompleteDiagnostic();

      const hasErrors = results.some(r => !r.success);

      toast({
        title: hasErrors ? "Diagnostic Issues Found" : "Diagnostic Complete",
        description: hasErrors
          ? "Check console for detailed error information"
          : "All database checks passed successfully",
        variant: hasErrors ? "destructive" : "default",
      });

      // If there are errors, also show them in an alert
      if (hasErrors) {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => r.message)
          .join(', ');

        console.error('❌ Diagnostic errors found:', errorMessages);
      }
    } catch (error) {
      console.error('Diagnostic failed:', error);
      toast({
        title: "Diagnostic Failed",
        description: "Could not run diagnostic check",
        variant: "destructive",
      });
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'claimed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Claimed</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Unclaimed</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading blog management panel...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unclaimed</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unclaimedPosts}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Claimed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.claimedPosts}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredPosts}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Blog Management Controls
            <div className="flex gap-2">
              <Button 
                onClick={loadBlogPosts} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={runCleanup}
                variant="secondary"
                size="sm"
                disabled={runningCleanup}
              >
                {runningCleanup ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Run Cleanup
              </Button>
              <Button
                onClick={runDiagnostic}
                variant="outline"
                size="sm"
                disabled={runningDiagnostic}
              >
                {runningDiagnostic ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Run Diagnostic
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin controls: You have full edit and delete capabilities for all blog posts. 
              Posts auto-delete after 24 hours if unclaimed. Use "Run Cleanup" to manually trigger expired post removal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No blog posts found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{post.title}</div>
                        <div className="text-xs text-gray-500">/{post.slug}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.expires_at ? (
                          <span className={post.status === 'unclaimed' ? 'text-orange-600' : ''}>
                            {getTimeRemaining(post.expires_at)}
                          </span>
                        ) : (
                          <span className="text-gray-400">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>{post.word_count}</TableCell>
                      <TableCell className="max-w-xs">
                        <a 
                          href={post.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate block"
                        >
                          {post.target_url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(post.published_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePost(post.id)}
                            disabled={deleting === post.id}
                          >
                            {deleting === post.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
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
    </div>
  );
}
