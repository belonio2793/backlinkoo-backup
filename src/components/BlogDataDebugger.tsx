import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blogService } from '@/services/blogService';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { supabase } from '@/integrations/supabase/client';

export function BlogDataDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Test 1: Direct Supabase connection
      console.log('🔍 Testing direct Supabase connection...');
      const { data: directData, error: directError } = await supabase
        .from('blog_posts')
        .select('id, title, status, created_at', { count: 'exact' })
        .limit(5);
      
      info.directSupabase = {
        success: !directError,
        error: directError?.message,
        count: directData?.length || 0,
        sampleTitles: directData?.map(p => p.title) || []
      };

      // Test 2: BlogService.getRecentBlogPosts
      console.log('🔍 Testing BlogService.getRecentBlogPosts...');
      try {
        const recentPosts = await blogService.getRecentBlogPosts(10);
        info.blogServiceRecent = {
          success: true,
          count: recentPosts.length,
          sampleTitles: recentPosts.slice(0, 3).map(p => p.title)
        };
      } catch (error: any) {
        info.blogServiceRecent = {
          success: false,
          error: error.message
        };
      }

      // Test 3: EnhancedBlogClaimService.getClaimablePosts
      console.log('🔍 Testing EnhancedBlogClaimService.getClaimablePosts...');
      try {
        const claimablePosts = await EnhancedBlogClaimService.getClaimablePosts(10);
        info.claimableService = {
          success: true,
          count: claimablePosts.length,
          sampleTitles: claimablePosts.slice(0, 3).map(p => p.title)
        };
      } catch (error: any) {
        info.claimableService = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Check localStorage
      console.log('🔍 Testing localStorage blog posts...');
      try {
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const localPostCount = allBlogPosts.length;
        
        info.localStorage = {
          success: true,
          count: localPostCount,
          sampleSlugs: allBlogPosts.slice(0, 3).map((p: any) => p.slug)
        };
      } catch (error: any) {
        info.localStorage = {
          success: false,
          error: error.message
        };
      }

      // Test 5: Table existence and schema
      console.log('🔍 Testing table schema...');
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from('blog_posts')
          .select('*')
          .limit(1);
        
        info.tableSchema = {
          success: !schemaError,
          error: schemaError?.message,
          hasData: !!schemaData && schemaData.length > 0,
          sampleKeys: schemaData && schemaData.length > 0 ? Object.keys(schemaData[0]) : []
        };
      } catch (error: any) {
        info.tableSchema = {
          success: false,
          error: error.message
        };
      }

    } catch (error: any) {
      info.globalError = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
    console.log('🔍 Debug info:', info);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Blog Data Debugging
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Re-run Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(debugInfo).map(([key, value]: [string, any]) => (
              <div key={key} className="border rounded p-3">
                <h4 className="font-semibold text-sm mb-2">{key}</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
