import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { testBlogClaiming } from '@/utils/testBlogClaiming';
import { BlogClaimService } from '@/services/blogClaimService';
import { useAuth } from '@/hooks/useAuth';
import { Bug, TestTube, Database, FileText, User } from 'lucide-react';

interface BlogClaimDebugPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function BlogClaimDebugPanel({ isOpen = false, onClose }: BlogClaimDebugPanelProps) {
  const [testSlug, setTestSlug] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!isOpen) return null;

  const runLocalStorageTest = async () => {
    setLoading(true);
    try {
      const posts = await testBlogClaiming.listLocalPosts();
      setTestResults({
        type: 'localStorage',
        data: posts,
        message: `Found ${posts.length} blog posts in localStorage`
      });
      
      if (posts.length > 0) {
        toast({
          title: "localStorage Test Complete",
          description: `Found ${posts.length} blog posts. Check console for details.`,
        });
      } else {
        toast({
          title: "No Blog Posts Found",
          description: "No blog posts found in localStorage. Create one first.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseTest = async () => {
    setLoading(true);
    try {
      const result = await testBlogClaiming.testDatabase();
      setTestResults({
        type: 'database',
        data: result,
        message: result.message
      });
      
      toast({
        title: result.success ? "Database Test Passed" : "Database Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Database Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runSlugTest = async () => {
    if (!testSlug.trim()) {
      toast({
        title: "Slug Required",
        description: "Please enter a blog post slug to test.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await testBlogClaiming.testSlug(testSlug);
      setTestResults({
        type: 'slug',
        data: result,
        message: result.message,
        slug: testSlug
      });
      
      toast({
        title: result.success ? "Slug Test Passed" : "Slug Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Slug Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runActualClaim = async () => {
    if (!testSlug.trim()) {
      toast({
        title: "Slug Required",
        description: "Please enter a blog post slug to claim.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test claiming.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get the blog post from localStorage
      const blogPostKey = `blog_post_${testSlug}`;
      const localBlogPost = localStorage.getItem(blogPostKey);
      
      if (!localBlogPost) {
        throw new Error('Blog post not found in localStorage');
      }
      
      const blogPostData = JSON.parse(localBlogPost);
      const result = await BlogClaimService.claimLocalStoragePost(blogPostData, user);
      
      setTestResults({
        type: 'actual-claim',
        data: result,
        message: result.message,
        slug: testSlug
      });
      
      toast({
        title: result.success ? "Claim Successful!" : "Claim Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Blog Claiming Debug Panel
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* User Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Authentication Status</span>
          </div>
          <p className="text-sm text-gray-600">
            {user ? `Signed in as: ${user.email}` : 'Not signed in'}
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={runLocalStorageTest}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            <FileText className="h-4 w-4" />
            Test localStorage
          </Button>
          
          <Button 
            onClick={runDatabaseTest}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Database className="h-4 w-4" />
            Test Database
          </Button>
        </div>

        {/* Slug Testing */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Test Specific Blog Post</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter blog post slug (e.g., ai-content-strategies)"
              value={testSlug}
              onChange={(e) => setTestSlug(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={runSlugTest}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4" />
            </Button>
          </div>
          
          {testSlug && user && (
            <Button 
              onClick={runActualClaim}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🎯 Actually Claim This Post
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Test Results ({testResults.type})</h4>
            <p className="text-sm text-gray-600 mb-2">{testResults.message}</p>
            
            {testResults.data && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">View Details</summary>
                <pre className="mt-2 p-2 bg-white rounded border overflow-auto max-h-40">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>First, test localStorage to see available blog posts</li>
            <li>Test database connectivity</li>
            <li>Enter a specific slug to test claiming logic</li>
            <li>Use "Actually Claim" to perform real claiming (requires authentication)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
