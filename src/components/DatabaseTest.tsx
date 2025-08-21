import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DatabaseTest: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test blog_posts table
      console.log('Testing blog_posts table...');
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, created_at')
        .limit(5);

      testResults.blog_posts = {
        success: !blogError,
        error: blogError?.message,
        count: blogPosts?.length || 0,
        data: blogPosts || []
      };

      // Test published_blog_posts table
      console.log('Testing published_blog_posts table...');
      const { data: publishedPosts, error: publishedError } = await supabase
        .from('published_blog_posts')
        .select('id, title, slug, status, created_at')
        .limit(5);

      testResults.published_blog_posts = {
        success: !publishedError,
        error: publishedError?.message,
        count: publishedPosts?.length || 0,
        data: publishedPosts || []
      };

      // Test database connection
      const { data: dbTest, error: dbError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%blog%');

      testResults.database_connection = {
        success: !dbError,
        error: dbError?.message,
        blog_tables: dbTest || []
      };

    } catch (error: any) {
      testResults.general_error = error.message;
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Test - Blog Posts</CardTitle>
        <Button onClick={testDatabase} disabled={loading}>
          {loading ? 'Testing...' : 'Test Database'}
        </Button>
      </CardHeader>
      <CardContent>
        {results && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">blog_posts table:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(results.blog_posts, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">published_blog_posts table:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(results.published_blog_posts, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Database Connection:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(results.database_connection, null, 2)}
              </pre>
            </div>

            {results.general_error && (
              <div>
                <h3 className="font-semibold text-red-600">General Error:</h3>
                <pre className="bg-red-100 p-2 rounded text-sm">
                  {results.general_error}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
