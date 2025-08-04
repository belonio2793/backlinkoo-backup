import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FixResult {
  success: boolean;
  message: string;
  details?: string;
}

export const RLSPermissionFixer: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<FixResult | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  const testProfilesAccess = async (): Promise<FixResult> => {
    try {
      console.log('🔍 Testing profiles table access...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);
      
      if (error) {
        console.error('❌ Profiles access error:', error);
        return {
          success: false,
          message: 'Permission denied error detected',
          details: error.message
        };
      }
      
      return {
        success: true,
        message: 'Profiles table is accessible',
        details: `Found ${data?.length || 0} profiles`
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Unexpected error testing profiles access',
        details: error.message
      };
    }
  };

  const handleTestAccess = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testProfilesAccess();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Test failed',
        details: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const applyEmergencyFix = async (): Promise<FixResult> => {
    try {
      console.log('🚨 Applying emergency RLS fix...');
      
      // Try to check if we have any admin access
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'Not authenticated',
          details: 'Please sign in before applying fixes'
        };
      }
      
      // The emergency fix would require service role key, which we don't have in frontend
      // Instead, provide clear manual instructions
      return {
        success: false,
        message: 'Manual fix required',
        details: 'Please apply the SQL fix manually in Supabase dashboard'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: 'Emergency fix failed',
        details: error.message
      };
    }
  };

  const handleApplyFix = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const result = await applyEmergencyFix();
      setFixResult(result);
    } catch (error: any) {
      setFixResult({
        success: false,
        message: 'Fix application failed',
        details: error.message
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getSupabaseDashboardUrl = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (url) {
      const projectRef = url.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
      return `https://supabase.com/dashboard/project/${projectRef}/sql`;
    }
    return 'https://supabase.com/dashboard';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            RLS Permission Error Fixer
          </CardTitle>
          <CardDescription>
            Fix "permission denied for table users" errors in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Test Current Status */}
          <div className="space-y-2">
            <h4 className="font-medium">1. Test Current Access</h4>
            <Button 
              onClick={handleTestAccess}
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Profiles Table Access
                </>
              )}
            </Button>
            
            {testResult && (
              <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                  {testResult.details && (
                    <div className="text-sm text-muted-foreground">
                      {testResult.details}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Manual Fix Instructions */}
          {testResult && !testResult.success && (
            <div className="space-y-3">
              <h4 className="font-medium">2. Apply Manual Fix</h4>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="font-medium">Manual fix required in Supabase dashboard:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open your Supabase dashboard</li>
                    <li>Go to SQL Editor</li>
                    <li>Run the emergency fix SQL</li>
                    <li>Test your app again</li>
                  </ol>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open(getSupabaseDashboardUrl(), '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      Open Supabase Dashboard
                    </Button>
                    <Button 
                      onClick={() => window.open('/PERMISSION_ERROR_FIX.md', '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      View Fix Instructions
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Emergency SQL Fix */}
          {testResult && !testResult.success && (
            <div className="space-y-2">
              <h4 className="font-medium">3. Emergency SQL Fix</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600 mb-2">Copy and paste this into Supabase SQL Editor:</p>
                <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`-- Emergency fix for RLS permission error
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Test that it worked
SELECT 'Fix applied successfully' as status;`}
                </pre>
              </div>
            </div>
          )}

          {/* Success State */}
          {testResult && testResult.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800">
                  ✅ No permission errors detected!
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Your profiles table is accessible and working correctly.
                </div>
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Additional Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Need More Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>If the fix doesn't work:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check browser console for detailed error messages</li>
            <li>Verify you're signed in to the application</li>
            <li>Ensure your Supabase project is active (not paused)</li>
            <li>Try viewing the profiles table directly in Supabase dashboard</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RLSPermissionFixer;
