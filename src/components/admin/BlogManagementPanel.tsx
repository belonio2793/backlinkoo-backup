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
import ErrorReproductionTest from '@/utils/errorReproductionTest';
import { ExcerptCleaner } from '@/utils/excerptCleaner';
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
  const [runningDebug, setRunningDebug] = useState(false);
  const [runningErrorTest, setRunningErrorTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializePanel = async () => {
      try {
        setLoading(true);
        await Promise.all([loadBlogPosts(), loadStats()]);
      } catch (error) {
        console.error('Failed to initialize blog management panel:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to load blog management panel. Click 'Run Diagnostic' to check for issues.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializePanel();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_trial_post', true)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('📝 blog_posts table does not exist - this is expected for new setups');
          setPosts([]);
          return;
        }

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

      // Set empty posts instead of crashing
      setPosts([]);

      // Only show error toast for non-table-missing errors
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('PGRST116')) {
        toast({
          title: "Database Error",
          description: "Could not load blog posts. Check if database is properly configured.",
          variant: "destructive",
        });
      }
    }
  };

  const loadStats = async () => {
    try {
      const stats = await blogAutoDeleteService.getCleanupStats();
      setStats(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Stats loading failed (non-blocking):', errorMessage);

      // Set default stats instead of showing error
      setStats({
        totalPosts: 0,
        unclaimedPosts: 0,
        claimedPosts: 0,
        expiredPosts: 0,
        expiringSoon: 0
      });

      // Only show toast if it's not a table missing error
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('PGRST116')) {
        toast({
          title: "Stats Warning",
          description: "Could not load statistics. Database may need setup.",
          variant: "destructive",
        });
      }
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

  const runDebugTest = async () => {
    setRunningDebug(true);
    try {
      console.log('🐛 Running debug test...');
      await blogAutoDeleteService.debugDatabaseConnection();

      toast({
        title: "Debug Test Complete",
        description: "Check the browser console for detailed debug information",
      });
    } catch (error) {
      console.error('Debug test failed:', error);
      toast({
        title: "Debug Test Failed",
        description: "Could not run debug test",
        variant: "destructive",
      });
    } finally {
      setRunningDebug(false);
    }
  };

  const runErrorReproductionTest = async () => {
    setRunningErrorTest(true);
    try {
      console.log('🧪 Running error reproduction test...');
      await ErrorReproductionTest.reproduceError();

      toast({
        title: "Error Test Complete",
        description: "Check the browser console for detailed error analysis",
      });
    } catch (error) {
      console.error('Error reproduction test failed:', error);
      toast({
        title: "Error Test Failed",
        description: "Could not run error reproduction test",
        variant: "destructive",
      });
    } finally {
      setRunningErrorTest(false);
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
              <Button
                onClick={runDebugTest}
                variant="destructive"
                size="sm"
                disabled={runningDebug}
              >
                {runningDebug ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Debug Error
              </Button>
              <Button
                onClick={runErrorReproductionTest}
                variant="secondary"
                size="sm"
                disabled={runningErrorTest}
              >
                {runningErrorTest ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Reproduce Error
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
              <br /><br />
              <strong>⚠️ If you see "[object Object]" errors:</strong> The blog_posts table likely doesn't exist in your Supabase database.
              <br />
              <strong>Solution:</strong> Go to your Supabase SQL Editor and run the table creation script.
            </AlertDescription>
          </Alert>

          {/* SQL Script Display */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">🗄️ Database Setup Required</h4>
            <p className="text-sm text-gray-600 mb-3">
              If you're seeing database errors, copy and run this SQL in your Supabase SQL Editor:
            </p>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              <pre>{`-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  keywords TEXT[],
  meta_description TEXT,
  published_url TEXT,
  word_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_trial_post BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'unclaimed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_trial ON blog_posts(is_trial_post);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read trial posts" ON blog_posts
  FOR SELECT USING (is_trial_post = true);`}</pre>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`-- Create blog_posts table for OpenAI
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  keywords TEXT[],
  meta_description TEXT,
  published_url TEXT,
  word_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_trial_post BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_trial ON blog_posts(is_trial_post);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read trial posts" ON blog_posts
  FOR SELECT USING (is_trial_post = true);`);
                  toast({ title: "SQL Copied!", description: "Paste this in your Supabase SQL Editor" });
                }}
              >
                📋 Copy SQL
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open('https://supabase.com/dashboard/project', '_blank')}
              >
                🔗 Open Supabase
              </Button>
            </div>
          </div>
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
                        <div className="truncate font-medium">{ExcerptCleaner.cleanTitle(post.title)}</div>
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
