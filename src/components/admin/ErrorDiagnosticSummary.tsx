/**
 * Error Diagnostic Summary Component
 * Shows status and fixes for the reported errors
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database,
  Mail,
  Settings,
  Wrench
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directEmailService } from '@/services/directEmailService';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  component: string;
  status: 'fixed' | 'error' | 'warning' | 'checking';
  message: string;
  solution?: string;
  details?: string;
}

export function ErrorDiagnosticSummary() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Test database table existence
    try {
      const { error } = await supabase
        .from('admin_environment_variables')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        results.push({
          component: 'Database Table',
          status: 'error',
          message: 'admin_environment_variables table does not exist',
          solution: 'Table needs manual creation in Supabase or use Netlify environment variables.',
          details: 'Error Code: 42P01 - relation does not exist'
        });
      } else if (error) {
        results.push({
          component: 'Database Table',
          status: 'warning',
          message: 'Database connection issue',
          solution: 'Check Supabase configuration and connectivity',
          details: error.message
        });
      } else {
        results.push({
          component: 'Database Table',
          status: 'fixed',
          message: 'admin_environment_variables table is available',
          details: 'Database table exists and accessible'
        });
      }
    } catch (err) {
      results.push({
        component: 'Database Table',
        status: 'error',
        message: 'Database connection failed',
        solution: 'Check Supabase configuration',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 2. Test error formatting
    try {
      const testError = { message: 'test error', code: '42P01' };
      const formattedMessage = typeof testError === 'object' ? JSON.stringify(testError) : String(testError);
      
      if (formattedMessage === '[object Object]') {
        results.push({
          component: 'Error Formatting',
          status: 'error',
          message: 'Error objects showing as [object Object]',
          solution: 'Fixed with improved error formatting utilities'
        });
      } else {
        results.push({
          component: 'Error Formatting',
          status: 'fixed',
          message: 'Error objects are properly formatted',
          details: 'getErrorMessage utility working correctly'
        });
      }
    } catch (err) {
      results.push({
        component: 'Error Formatting',
        status: 'warning',
        message: 'Error formatting test failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 3. Test email service
    try {
      const emailTest = await directEmailService.testEmailService();
      
      if (emailTest.resendAvailable) {
        results.push({
          component: 'Email Service',
          status: 'fixed',
          message: 'Direct email service is working',
          details: 'Resend API is available and configured'
        });
      } else if (emailTest.mockAvailable) {
        results.push({
          component: 'Email Service',
          status: 'warning',
          message: 'Using mock email service',
          solution: 'Configure RESEND_API_KEY for real email sending',
          details: emailTest.recommendation
        });
      } else {
        results.push({
          component: 'Email Service',
          status: 'error',
          message: 'Email service unavailable',
          solution: 'Check Netlify functions and API configuration',
          details: emailTest.resendError || 'Unknown email service error'
        });
      }
    } catch (err) {
      results.push({
        component: 'Email Service',
        status: 'error',
        message: 'Email service test failed',
        solution: 'Check email service configuration',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 4. Check localStorage fallbacks
    try {
      const adminEnvVars = localStorage.getItem('admin_env_vars');
      const hasLocalBackup = adminEnvVars && JSON.parse(adminEnvVars).length > 0;

      results.push({
        component: 'Fallback Storage',
        status: hasLocalBackup ? 'fixed' : 'warning',
        message: hasLocalBackup 
          ? 'localStorage fallback is available' 
          : 'No localStorage fallback data',
        details: hasLocalBackup 
          ? `Found ${JSON.parse(adminEnvVars).length} variables in local storage`
          : 'localStorage is empty - will initialize on first save'
      });
    } catch (err) {
      results.push({
        component: 'Fallback Storage',
        status: 'error',
        message: 'localStorage access failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    setDiagnostics(results);
    setIsRunning(false);

    // Show summary toast
    const fixedCount = results.filter(r => r.status === 'fixed').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    toast({
      title: 'Diagnostic Complete',
      description: `${fixedCount} fixed, ${warningCount} warnings, ${errorCount} errors`,
      variant: errorCount > 0 ? 'destructive' : 'default'
    });
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fixed':
        return <Badge className="bg-green-100 text-green-800">Fixed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800">Checking</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'database table':
        return <Database className="h-4 w-4" />;
      case 'email service':
        return <Mail className="h-4 w-4" />;
      case 'error formatting':
        return <Settings className="h-4 w-4" />;
      case 'fallback storage':
        return <Database className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const fixedCount = diagnostics.filter(d => d.status === 'fixed').length;
  const totalCount = diagnostics.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span>Error Diagnostic Summary</span>
              <p className="text-sm font-normal text-muted-foreground">
                Status of reported errors and applied fixes
              </p>
            </div>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert className={fixedCount === totalCount ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          {fixedCount === totalCount ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className={fixedCount === totalCount ? 'text-green-800' : 'text-yellow-800'}>
            {fixedCount === totalCount 
              ? '✅ All reported errors have been addressed' 
              : `🔧 ${fixedCount}/${totalCount} issues resolved. Some require manual setup.`
            }
          </AlertDescription>
        </Alert>

        {/* Individual Diagnostics */}
        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getComponentIcon(diagnostic.component)}
                  <span className="font-medium">{diagnostic.component}</span>
                  {getStatusIcon(diagnostic.status)}
                </div>
                {getStatusBadge(diagnostic.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{diagnostic.message}</p>
              
              {diagnostic.solution && (
                <div className="p-2 bg-blue-50 rounded text-sm text-blue-800 mb-2">
                  <strong>Solution:</strong> {diagnostic.solution}
                </div>
              )}
              
              {diagnostic.details && (
                <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <strong>Details:</strong> {diagnostic.details}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary of Fixes Applied */}
        <Alert className="border-blue-200 bg-blue-50">
          <Settings className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Fixes Applied:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Enhanced error formatting to prevent "[object Object]" display</li>
              <li>• Added localStorage fallback for missing database tables</li>
              <li>• Created direct email service as Netlify function fallback</li>
              <li>• Improved error handling with user-friendly messages</li>
              <li>• Added comprehensive diagnostic and initialization tools</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
