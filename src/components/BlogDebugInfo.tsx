import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { Database, RefreshCw, Eye, EyeOff } from 'lucide-react';

export function BlogDebugInfo() {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadDebugInfo = () => {
    try {
      // Check localStorage for blog posts
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const freeBacklinkPosts = freeBacklinkService.getAllPosts();
      const unclaimedPosts = freeBacklinkService.getUnclaimedPosts();
      
      // Check individual blog post entries
      const individualPosts = [];
      for (const meta of allBlogPosts) {
        const blogData = localStorage.getItem(`blog_post_${meta.slug}`);
        if (blogData) {
          try {
            const parsed = JSON.parse(blogData);
            individualPosts.push({
              slug: meta.slug,
              title: parsed.title,
              created_at: parsed.created_at,
              is_trial_post: parsed.is_trial_post,
              expires_at: parsed.expires_at
            });
          } catch (e) {
            individualPosts.push({
              slug: meta.slug,
              error: 'Failed to parse'
            });
          }
        }
      }

      setDebugInfo({
        allBlogPostsMeta: allBlogPosts,
        individualPosts,
        freeBacklinkPosts: freeBacklinkPosts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          created_at: post.createdAt,
          expires_at: post.expiresAt,
          viewCount: (post as any).viewCount || 0
        })),
        unclaimedPosts: unclaimedPosts.length,
        storageKeys: Object.keys(localStorage).filter(key =>
          key.startsWith('blog_post_') ||
          key === 'all_blog_posts'
        ).map(key => ({
          key,
          size: localStorage.getItem(key)?.length || 0
        }))
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    if (showDebug) {
      loadDebugInfo();
    }
  }, [showDebug]);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(true)}
          className="bg-white/90 backdrop-blur-sm"
        >
          <Database className="h-4 w-4 mr-2" />
          Debug Blog Storage
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Blog Storage Debug
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDebugInfo}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(false)}
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-3">
          {debugInfo ? (
            <>
              <div>
                <strong>Blog Posts Meta:</strong>
                <Badge variant="secondary" className="ml-2">
                  {debugInfo.allBlogPostsMeta?.length || 0}
                </Badge>
              </div>
              
              <div>
                <strong>Individual Posts:</strong>
                <Badge variant="secondary" className="ml-2">
                  {debugInfo.individualPosts?.length || 0}
                </Badge>
              </div>
              
              <div>
                <strong>Free Backlink Posts:</strong>
                <Badge variant="secondary" className="ml-2">
                  {debugInfo.freeBacklinkPosts?.length || 0}
                </Badge>
              </div>
              
              <div>
                <strong>Unclaimed Posts:</strong>
                <Badge variant="secondary" className="ml-2">
                  {debugInfo.unclaimedPosts || 0}
                </Badge>
              </div>

              {debugInfo.storageKeys && (
                <div>
                  <strong>Storage Keys:</strong>
                  <div className="mt-1 space-y-1">
                    {debugInfo.storageKeys.map((item: any) => (
                      <div key={item.key} className="flex justify-between">
                        <span className="truncate">{item.key}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(item.size / 1024)}KB
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugInfo.freeBacklinkPosts && debugInfo.freeBacklinkPosts.length > 0 && (
                <div>
                  <strong>Recent Free Backlinks:</strong>
                  <div className="mt-1 space-y-1">
                    {debugInfo.freeBacklinkPosts.slice(0, 3).map((post: any) => (
                      <div key={post.id} className="text-xs bg-gray-50 p-1 rounded">
                        <div className="truncate font-medium">{post.title}</div>
                        <div className="text-gray-500">
                          Status: {post.status} | Views: {post.viewCount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugInfo.error && (
                <div className="text-red-600">
                  <strong>Error:</strong> {debugInfo.error}
                </div>
              )}
            </>
          ) : (
            <div>Loading debug info...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
