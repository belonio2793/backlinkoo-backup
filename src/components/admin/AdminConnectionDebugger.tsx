import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, RefreshCw, Database, Shield } from "lucide-react";

interface DebugResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export function AdminConnectionDebugger() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runConnectionTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: DebugResult[] = [];

    // Test 1: Basic Supabase connection
    try {
      const start = Date.now();
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      const duration = Date.now() - start;

      if (error) {
        testResults.push({
          test: 'Direct Supabase Connection',
          success: false,
          error: error.message || 'Unknown error',
          duration
        });
      } else {
        testResults.push({
          test: 'Direct Supabase Connection',
          success: true,
          data: { profileCount: data },
          duration
        });
      }
    } catch (error: any) {
      testResults.push({
        test: 'Direct Supabase Connection',
        success: false,
        error: error.message
      });
    }

    // Test 2: Admin authentication
    try {
      const start = Date.now();
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user }, error } = await supabase.auth.getUser();
      const duration = Date.now() - start;

      if (error || !user) {
        testResults.push({
          test: 'Admin Authentication',
          success: false,
          error: 'Not authenticated or session expired',
          duration
        });
      } else {
        testResults.push({
          test: 'Admin Authentication',
          success: true,
          data: { userId: user.id, email: user.email },
          duration
        });
      }
    } catch (error: any) {
      testResults.push({
        test: 'Admin Authentication',
        success: false,
        error: error.message
      });
    }

    // Test 3: Real Admin User Service
    try {
      const start = Date.now();
      const { realAdminUserService } = await import('@/services/realAdminUserService');
      const connection = await realAdminUserService.testConnection();
      const duration = Date.now() - start;

      if (connection.success) {
        testResults.push({
          test: 'Real Admin User Service',
          success: true,
          data: { profileCount: connection.profileCount },
          duration
        });
      } else {
        testResults.push({
          test: 'Real Admin User Service',
          success: false,
          error: connection.error || 'Service test failed',
          duration
        });
      }
    } catch (error: any) {
      testResults.push({
        test: 'Real Admin User Service',
        success: false,
        error: error.message
      });
    }

    // Test 4: Admin User Management Service
    try {
      const start = Date.now();
      const { adminUserManagementService } = await import('@/services/adminUserManagementService');
      const result = await adminUserManagementService.getUsers({ limit: 5, offset: 0 });
      const duration = Date.now() - start;

      testResults.push({
        test: 'Admin User Management Service',
        success: true,
        data: { userCount: result.users.length, totalCount: result.totalCount },
        duration
      });
    } catch (error: any) {
      testResults.push({
        test: 'Admin User Management Service',
        success: false,
        error: error.message
      });
    }

    // Test 5: Unified Admin Metrics
    try {
      const start = Date.now();
      const { unifiedAdminMetrics } = await import('@/services/unifiedAdminMetrics');
      const metrics = await unifiedAdminMetrics.getAllMetrics(true);
      const duration = Date.now() - start;

      testResults.push({
        test: 'Unified Admin Metrics',
        success: true,
        data: { 
          totalUsers: metrics.totalUsers,
          databaseConnected: metrics.databaseConnected,
          tablesAccessible: metrics.tablesAccessible
        },
        duration
      });
    } catch (error: any) {
      testResults.push({
        test: 'Unified Admin Metrics',
        success: false,
        error: error.message
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const overallSuccess = results.length > 0 && results.filter(r => r.success).length >= 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Connection Debugger
          </div>
          <Button
            onClick={runConnectionTests}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !testing && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Click "Run Tests" to diagnose admin dashboard connection issues.
            </AlertDescription>
          </Alert>
        )}

        {testing && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Running connection tests... This may take a few seconds.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <Alert className={`mb-4 ${overallSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {overallSuccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={overallSuccess ? 'text-green-700' : 'text-red-700'}>
                <div className="font-medium">
                  {overallSuccess 
                    ? '✅ Admin dashboard should be working properly'
                    : '❌ Admin dashboard has connection issues that need to be resolved'
                  }
                </div>
                <div className="text-sm mt-1">
                  {results.filter(r => r.success).length} of {results.length} tests passed
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.test}</span>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                      {getStatusBadge(result.success)}
                    </div>
                  </div>
                  
                  {result.success && result.data && (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                      <strong>Result:</strong> {JSON.stringify(result.data, null, 2)}
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!overallSuccess && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <div className="font-medium">Recommended Actions:</div>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    <li>Check if you're logged in as an admin user</li>
                    <li>Verify Supabase connection settings</li>
                    <li>Check RLS (Row Level Security) policies</li>
                    <li>Ensure admin permissions are properly configured</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
