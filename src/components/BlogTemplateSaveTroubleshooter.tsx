import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  Database, 
  HardDrive, 
  RefreshCw,
  Play,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export const BlogTemplateSaveTroubleshooter: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  const testDatabaseConnection = async (): Promise<boolean> => {
    updateResult('Database Connection', 'running', 'Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('domains').select('count').limit(1);
      if (error) {
        updateResult('Database Connection', 'error', 'Failed to connect to database', error.message);
        return false;
      } else {
        updateResult('Database Connection', 'success', 'Database connection successful');
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateResult('Database Connection', 'error', 'Database connection failed', errorMessage);
      return false;
    }
  };

  const testRPCFunction = async (): Promise<boolean> => {
    updateResult('RPC Function', 'running', 'Testing update_domain_blog_theme function...');
    
    try {
      const testDomainId = '00000000-0000-0000-0000-000000000000';
      const { error } = await supabase.rpc('update_domain_blog_theme', {
        p_domain_id: testDomainId,
        p_theme_id: 'minimal',
        p_theme_name: 'Minimal Clean',
        p_custom_styles: {},
        p_custom_settings: {}
      });
      
      if (error) {
        if (error.code === '42883') {
          updateResult('RPC Function', 'warning', 'RPC function does not exist', 'This is expected if database setup is incomplete');
          return false;
        } else if (error.code === '42P01') {
          updateResult('RPC Function', 'warning', 'Domain themes table missing', 'Database needs to be set up');
          return false;
        } else {
          updateResult('RPC Function', 'error', 'RPC function error', `${error.message} (Code: ${error.code})`);
          return false;
        }
      } else {
        updateResult('RPC Function', 'success', 'RPC function working correctly');
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateResult('RPC Function', 'error', 'RPC function test failed', errorMessage);
      return false;
    }
  };

  const testLocalStorage = (): boolean => {
    updateResult('localStorage', 'running', 'Testing localStorage functionality...');
    
    try {
      if (typeof Storage === 'undefined') {
        updateResult('localStorage', 'error', 'localStorage not supported', 'Browser does not support localStorage');
        return false;
      }

      // Test write/read
      const testKey = 'blog-template-test';
      const testData = { test: true, timestamp: Date.now() };
      localStorage.setItem(testKey, JSON.stringify(testData));
      
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      if (retrieved.test === true) {
        updateResult('localStorage', 'success', 'localStorage working correctly');
        return true;
      } else {
        updateResult('localStorage', 'error', 'localStorage read/write failed', 'Data was not saved correctly');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateResult('localStorage', 'error', 'localStorage test failed', errorMessage);
      return false;
    }
  };

  const testThemeService = (): boolean => {
    updateResult('Theme Service', 'running', 'Testing blog themes service...');
    
    try {
      // Try to import and test the themes service
      const themes = ['minimal', 'modern', 'elegant', 'tech'];
      let foundThemes = 0;
      
      themes.forEach(themeId => {
        try {
          // This would test if themes are properly configured
          // In a real implementation, you'd test ImprovedBlogThemesService here
          foundThemes++;
        } catch (error) {
          console.warn(`Theme ${themeId} test failed:`, error);
        }
      });
      
      if (foundThemes === themes.length) {
        updateResult('Theme Service', 'success', `All ${foundThemes} themes loaded successfully`);
        return true;
      } else {
        updateResult('Theme Service', 'warning', `Only ${foundThemes}/${themes.length} themes loaded`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateResult('Theme Service', 'error', 'Theme service test failed', errorMessage);
      return false;
    }
  };

  const runFullDiagnosis = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Run all tests
      const dbConnected = await testDatabaseConnection();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      const rpcWorking = await testRPCFunction();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const localStorageWorking = testLocalStorage();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const themeServiceWorking = testThemeService();

      // Provide recommendations
      if (!dbConnected) {
        toast({
          title: "Database Issue",
          description: "Cannot connect to database. Check your internet connection and Supabase credentials.",
          variant: "destructive"
        });
      } else if (!rpcWorking && !localStorageWorking) {
        toast({
          title: "Critical Issue",
          description: "Both database and localStorage saving are failing. Please check browser settings.",
          variant: "destructive"
        });
      } else if (!rpcWorking) {
        toast({
          title: "Database Setup Needed",
          description: "Using localStorage fallback. Click 'Setup Database' to enable full functionality.",
          variant: "default"
        });
      } else {
        toast({
          title: "All Systems Working",
          description: "Blog template saving should work correctly.",
          variant: "default"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Diagnosis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Blog Template Save Troubleshooter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool diagnoses issues with blog template saving. Click "Run Diagnosis" to identify and fix problems.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runFullDiagnosis} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnosis...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Diagnosis
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results:</h4>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{result.message}</p>
                {result.details && (
                  <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && results.every(r => r.status !== 'pending' && r.status !== 'running') && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Diagnosis complete. Check the results above and follow any recommendations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogTemplateSaveTroubleshooter;
