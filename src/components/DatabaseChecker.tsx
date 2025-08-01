import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BlogSystemFixUtility } from '@/utils/fixBlogSystem';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface TableCheck {
  name: string;
  exists: boolean;
  error?: string;
  recordCount?: number;
}

export function DatabaseChecker() {
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [tables, setTables] = useState<TableCheck[]>([]);
  const [fixes, setFixes] = useState<any[]>([]);

  const checkTables = async () => {
    setChecking(true);
    const tableResults: TableCheck[] = [];

    // Check blog_posts table
    try {
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });
      
      if (blogError) {
        tableResults.push({
          name: 'blog_posts',
          exists: false,
          error: blogError.message
        });
      } else {
        tableResults.push({
          name: 'blog_posts',
          exists: true,
          recordCount: blogPosts?.length || 0
        });
      }
    } catch (error: any) {
      tableResults.push({
        name: 'blog_posts',
        exists: false,
        error: error.message
      });
    }

    // Check user_saved_posts table
    try {
      const { data: savedPosts, error: savedError, count } = await supabase
        .from('user_saved_posts')
        .select('*', { count: 'exact', head: true });
      
      if (savedError) {
        tableResults.push({
          name: 'user_saved_posts',
          exists: false,
          error: savedError.message
        });
      } else {
        tableResults.push({
          name: 'user_saved_posts',
          exists: true,
          recordCount: count || 0
        });
      }
    } catch (error: any) {
      tableResults.push({
        name: 'user_saved_posts',
        exists: false,
        error: error.message
      });
    }

    setTables(tableResults);
    setChecking(false);
  };

  const runFixes = async () => {
    setFixing(true);
    try {
      const fixer = new BlogSystemFixUtility();
      const results = await fixer.fixBlogSystem();
      setFixes(results);
      
      // Re-check tables after fixes
      setTimeout(() => {
        checkTables();
      }, 2000);
    } catch (error: any) {
      console.error('Fix failed:', error);
      setFixes([{ 
        component: 'General', 
        status: 'error', 
        message: `Fix failed: ${error.message}` 
      }]);
    }
    setFixing(false);
  };

  useEffect(() => {
    checkTables();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Status Checker
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkTables}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{table.name}</h3>
                  {table.error && (
                    <p className="text-sm text-red-600 mt-1">{table.error}</p>
                  )}
                  {table.recordCount !== undefined && (
                    <p className="text-sm text-gray-600 mt-1">
                      {table.recordCount} records
                    </p>
                  )}
                </div>
                <Badge 
                  variant={table.exists ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {table.exists ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {table.exists ? 'Exists' : 'Missing'}
                </Badge>
              </div>
            ))}

            {tables.some(t => !t.exists) && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={runFixes}
                  disabled={fixing}
                  className="w-full"
                >
                  {fixing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Fixes...
                    </>
                  ) : (
                    'Fix Database Issues'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {fixes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fix Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fixes.map((fix, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{fix.component}</span>
                    <p className="text-sm text-gray-600">{fix.message}</p>
                  </div>
                  <Badge 
                    variant={
                      fix.status === 'success' ? 'default' : 
                      fix.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {fix.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
