import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, CheckCircle, AlertCircle } from "lucide-react";

export function BlogPostsDebugger() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testBlogPostsTable = async () => {
    setTesting(true);
    setResults(null);

    try {
      console.log('🔍 Testing blog_posts table connection...');

      // Test 1: Check if table exists and get count
      const { count, error: countError } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        setResults({
          success: false,
          message: `Table access failed: ${countError.message}`,
          details: countError
        });
        return;
      }

      // Test 2: Get sample data
      const { data, error: dataError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, is_trial_post, created_at')
        .limit(5);

      if (dataError) {
        setResults({
          success: false,
          message: `Data fetch failed: ${dataError.message}`,
          details: dataError
        });
        return;
      }

      // Test 3: Check different status types
      const statusTypes = ['published', 'draft', 'archived'];
      const statusCounts = {};

      for (const status of statusTypes) {
        const { count: statusCount } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        statusCounts[status] = statusCount || 0;
      }

      // Test 4: Check trial posts
      const { count: trialCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_trial_post', true);

      setResults({
        success: true,
        message: `Found ${count} total blog posts in database`,
        details: {
          totalPosts: count,
          statusBreakdown: statusCounts,
          trialPosts: trialCount,
          samplePosts: data?.slice(0, 3) || []
        }
      });

    } catch (error: any) {
      console.error('❌ Blog posts test failed:', error);
      setResults({
        success: false,
        message: `Test failed: ${error.message}`,
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Blog Posts Database Test
          </div>
          <Button
            onClick={testBlogPostsTable}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!results && !testing && (
          <p className="text-muted-foreground">
            Click "Test Connection" to check if blog posts are properly synced with Supabase.
          </p>
        )}

        {testing && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Testing blog_posts table connection and data...
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <Alert className={results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {results.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={results.success ? 'text-green-700' : 'text-red-700'}>
              <div className="font-medium">{results.message}</div>
              {results.details && (
                <div className="mt-2">
                  <pre className="text-xs mt-2 font-mono bg-white/50 p-2 rounded">
                    {JSON.stringify(results.details, null, 2)}
                  </pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
