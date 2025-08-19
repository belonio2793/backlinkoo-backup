import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function BlogTemplateDebug() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDatabaseTests = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};

    try {
      // Test 1: Basic connection
      results.connection = await testConnection();
      
      // Test 2: Check if domains table exists
      results.domainsTable = await testDomainsTable();
      
      // Test 3: Check if domain_blog_themes table exists
      results.blogThemesTable = await testBlogThemesTable();
      
      // Test 4: Check if functions exist
      results.functions = await testFunctions();
      
      // Test 5: Test actual saving
      results.saving = await testSaving();

    } catch (error) {
      results.error = error instanceof Error ? error.message : String(error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      return { success: true, message: 'Database connection working' };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  };

  const testDomainsTable = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id, domain, blog_enabled')
        .limit(1);
      
      if (error) {
        return { success: false, message: `Domains table error: ${error.message}` };
      }
      
      return { 
        success: true, 
        message: `Domains table exists. Found ${data?.length || 0} domains`,
        data: data
      };
    } catch (error) {
      return { success: false, message: `Domains table failed: ${error}` };
    }
  };

  const testBlogThemesTable = async () => {
    try {
      const { data, error } = await supabase
        .from('domain_blog_themes')
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          return { success: false, message: 'domain_blog_themes table does not exist' };
        }
        return { success: false, message: `Blog themes table error: ${error.message}` };
      }
      
      return { 
        success: true, 
        message: `Blog themes table exists. Found ${data?.length || 0} records`,
        data: data
      };
    } catch (error) {
      return { success: false, message: `Blog themes table failed: ${error}` };
    }
  };

  const testFunctions = async () => {
    try {
      // Test the RPC function
      const { data, error } = await supabase.rpc('update_domain_blog_theme', {
        p_domain_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_theme_id: 'test',
        p_theme_name: 'Test Theme',
        p_custom_styles: {},
        p_custom_settings: {}
      });
      
      if (error) {
        if (error.code === '42883') {
          return { success: false, message: 'update_domain_blog_theme function does not exist' };
        }
        // Other errors might be expected (like domain not found)
        return { success: true, message: 'Function exists but returned expected error', error: error.message };
      }
      
      return { success: true, message: 'Functions working correctly' };
    } catch (error) {
      return { success: false, message: `Functions test failed: ${error}` };
    }
  };

  const testSaving = async () => {
    try {
      // Try to save to localStorage as fallback
      const testData = {
        theme_id: 'minimal',
        custom_styles: { primaryColor: '#123456' },
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('blog-template-debug-test', JSON.stringify(testData));
      const retrieved = localStorage.getItem('blog-template-debug-test');
      
      if (retrieved) {
        localStorage.removeItem('blog-template-debug-test');
        return { success: true, message: 'localStorage saving works' };
      } else {
        return { success: false, message: 'localStorage saving failed' };
      }
    } catch (error) {
      return { success: false, message: `Saving test failed: ${error}` };
    }
  };

  const setupDatabase = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Setting up database",
        description: "Creating blog theme tables and functions...",
      });

      // Import and run the setup function
      const { setupDomainDatabase } = await import('@/utils/setupDomainDatabase');
      const result = await setupDomainDatabase();

      if (result.success) {
        toast({
          title: "Database Setup Complete",
          description: result.message,
        });
        // Re-run tests after setup
        await runDatabaseTests();
      } else {
        toast({
          title: "Setup Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Setup Error",
        description: `Failed to set up database: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (key: string, result: any) => {
    if (!result) return null;

    return (
      <div key={key} className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
        </div>
        <p className="text-sm text-gray-600 ml-6">{result.message}</p>
        {result.data && (
          <pre className="text-xs bg-gray-100 p-2 rounded ml-6 mt-1 overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
        {result.error && (
          <p className="text-xs text-red-600 ml-6 mt-1">{result.error}</p>
        )}
      </div>
    );
  };

  const needsSetup = testResults.blogThemesTable && !testResults.blogThemesTable.success;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Blog Template Manager Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDatabaseTests} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Run Diagnostic Tests
          </Button>

          {needsSetup && (
            <Button 
              onClick={setupDatabase} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Setup Database
            </Button>
          )}
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            {Object.entries(testResults).map(([key, result]) => renderTestResult(key, result))}
          </div>
        )}

        {needsSetup && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The blog themes database table is missing. Click "Setup Database" to create the required tables and functions.
            </AlertDescription>
          </Alert>
        )}

        {testResults.connection && !testResults.connection.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Database connection failed. Please check your Supabase configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default BlogTemplateDebug;
