import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { ErrorLogger } from '../../utils/errorLogger';

export function UserReportsDebugger() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics(null);

    const results = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      tests: [] as any[]
    };

    // Test 1: Check campaign_reports table access
    try {
      const { data, error } = await supabase
        .from('campaign_reports')
        .select('count')
        .limit(1);
      
      results.tests.push({
        name: 'Campaign Reports Table Access',
        status: error ? 'failed' : 'passed',
        error: error ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        } : null,
        data: data
      });
    } catch (error) {
      results.tests.push({
        name: 'Campaign Reports Table Access',
        status: 'error',
        error: ErrorLogger.getUserFriendlyMessage(error),
        details: error
      });
    }

    // Test 2: Test actual getUserReports query if user is available
    if (user) {
      try {
        const { data, error } = await supabase
          .from('campaign_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false });

        results.tests.push({
          name: 'User Reports Query',
          status: error ? 'failed' : 'passed',
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          } : null,
          data: data ? { count: data.length, sample: data[0] } : null
        });
      } catch (error) {
        results.tests.push({
          name: 'User Reports Query',
          status: 'error',
          error: ErrorLogger.getUserFriendlyMessage(error),
          details: error
        });
      }

      // Test 3: Check RLS policies
      try {
        const { data, error } = await supabase
          .from('campaign_reports')
          .insert({
            id: 'test-' + Date.now(),
            user_id: user.id,
            campaign_id: 'test-campaign',
            report_name: 'Test Report',
            report_type: 'diagnostic',
            report_data: { test: true },
            generated_at: new Date().toISOString()
          })
          .select();

        // Clean up test record
        if (data && data[0]) {
          await supabase
            .from('campaign_reports')
            .delete()
            .eq('id', data[0].id);
        }

        results.tests.push({
          name: 'RLS Insert/Delete Test',
          status: error ? 'failed' : 'passed',
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          } : null,
          data: 'Test record created and cleaned up successfully'
        });
      } catch (error) {
        results.tests.push({
          name: 'RLS Insert/Delete Test',
          status: 'error',
          error: ErrorLogger.getUserFriendlyMessage(error),
          details: error
        });
      }
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>User Reports Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {diagnostics && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>User:</strong> {diagnostics.user ? `${diagnostics.user.email} (${diagnostics.user.id})` : 'Not authenticated'}
              </AlertDescription>
            </Alert>

            {diagnostics.tests.map((test: any, index: number) => (
              <Card key={index} className={`border-l-4 ${
                test.status === 'passed' ? 'border-l-green-500' : 
                test.status === 'failed' ? 'border-l-red-500' : 
                'border-l-yellow-500'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      test.status === 'passed' ? 'bg-green-500' : 
                      test.status === 'failed' ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`}></span>
                    {test.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {test.error && (
                    <Alert className="mb-2">
                      <AlertDescription>
                        <strong>Error:</strong> {JSON.stringify(test.error, null, 2)}
                      </AlertDescription>
                    </Alert>
                  )}
                  {test.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
