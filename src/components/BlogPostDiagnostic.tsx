import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { blogService } from '@/services/blogService';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Database,
  HardDrive,
  Globe
} from 'lucide-react';

export function BlogPostDiagnostic() {
  const { slug } = useParams<{ slug: string }>();
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!slug) return;

    setLoading(true);
    const result: any = {
      slug,
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // Check 1: Database lookup via UnifiedClaimService
      console.log('🔍 Checking database via UnifiedClaimService...');
      try {
        const dbPost = await UnifiedClaimService.getBlogPostBySlug(slug);
        result.checks.push({
          name: 'Database (Unified Service)',
          status: dbPost ? 'success' : 'not_found',
          data: dbPost,
          message: dbPost ? `Found post: "${dbPost.title}"` : 'Post not found in database'
        });
      } catch (error: any) {
        result.checks.push({
          name: 'Database (Unified Service)',
          status: 'error',
          error: error.message,
          message: 'Failed to query database'
        });
      }

      // Check 2: Direct database lookup via blogService
      console.log('🔍 Checking database via blogService...');
      try {
        const blogPost = await blogService.getBlogPostBySlug(slug);
        result.checks.push({
          name: 'Database (Blog Service)',
          status: blogPost ? 'success' : 'not_found',
          data: blogPost,
          message: blogPost ? `Found post: "${blogPost.title}"` : 'Post not found in database'
        });
      } catch (error: any) {
        result.checks.push({
          name: 'Database (Blog Service)',
          status: 'error',
          error: error.message,
          message: 'Failed to query database'
        });
      }

      // Check 3: Local Storage lookup
      console.log('🔍 Checking localStorage...');
      try {
        const localPost = localStorage.getItem(`blog_post_${slug}`);
        if (localPost) {
          const parsedPost = JSON.parse(localPost);
          result.checks.push({
            name: 'Local Storage',
            status: 'success',
            data: parsedPost,
            message: `Found cached post: "${parsedPost.title}"`
          });
        } else {
          result.checks.push({
            name: 'Local Storage',
            status: 'not_found',
            message: 'No cached post found'
          });
        }
      } catch (error: any) {
        result.checks.push({
          name: 'Local Storage',
          status: 'error',
          error: error.message,
          message: 'Failed to check localStorage'
        });
      }

      // Check 4: Get all available posts
      console.log('🔍 Checking available posts...');
      try {
        const availablePosts = await UnifiedClaimService.getAvailablePosts(10);
        result.checks.push({
          name: 'Available Posts',
          status: 'success',
          data: availablePosts.length,
          message: `Found ${availablePosts.length} available posts`,
          extra: availablePosts.map(p => ({ slug: p.slug, title: p.title }))
        });
      } catch (error: any) {
        result.checks.push({
          name: 'Available Posts',
          status: 'error',
          error: error.message,
          message: 'Failed to get available posts'
        });
      }

      setDiagnostic(result);
    } catch (error: any) {
      console.error('Diagnostic failed:', error);
      result.error = error.message;
      setDiagnostic(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      runDiagnostic();
    }
  }, [slug]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'not_found':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'not_found':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!slug) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No slug parameter found in URL
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Blog Post Diagnostic
              </CardTitle>
              <p className="text-sm text-gray-600">
                Diagnosing: <code className="bg-gray-100 px-2 py-1 rounded">/blog/{slug}</code>
              </p>
            </div>
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Re-run Check'
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {diagnostic && (
        <div className="space-y-4">
          {diagnostic.checks.map((check: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <h3 className="font-medium">{check.name}</h3>
                      <p className="text-sm text-gray-600">{check.message}</p>
                      {check.error && (
                        <p className="text-xs text-red-600 mt-1">Error: {check.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status.replace('_', ' ')}
                  </Badge>
                </div>

                {check.data && typeof check.data === 'object' && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Data
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(check.data, null, 2)}
                    </pre>
                  </details>
                )}

                {check.extra && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Slugs:</p>
                    <div className="flex flex-wrap gap-1">
                      {check.extra.slice(0, 5).map((post: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {post.slug}
                        </Badge>
                      ))}
                      {check.extra.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{check.extra.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Overall Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Overall Assessment</h3>
              {diagnostic.checks.some((c: any) => c.status === 'success') ? (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Post data found in at least one source. If the page isn't loading, 
                    check the browser console for JavaScript errors.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Post not found in any data source. The slug might be invalid or the post may have been deleted.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
