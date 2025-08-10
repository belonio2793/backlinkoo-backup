import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, RefreshCw, Database, Zap } from 'lucide-react';

interface FixResult {
  success: boolean;
  message: string;
  alreadyFixed?: boolean;
  testResult?: {
    error: string | null;
    dataCount: number;
  };
  nextSteps?: string[];
  error?: string;
  details?: string;
  manualInstructions?: string;
}

export const RLSRecursionFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFix = async () => {
    setIsFixing(true);
    setFixResult(null);

    try {
      const response = await fetch('/.netlify/functions/fix-rls-recursion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      setFixResult(result);

      // If successful, refresh the page after a short delay
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    } catch (error: any) {
      setFixResult({
        success: false,
        error: 'Network error',
        details: error.message
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-red-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-red-800">RLS Infinite Recursion Detected</CardTitle>
            <p className="text-sm text-red-600 mt-1">
              Database policies are causing infinite loops preventing login
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error: </strong>infinite recursion detected in policy for relation "profiles"
            <br />
            This prevents user authentication and database queries from working properly.
          </AlertDescription>
        </Alert>

        {!fixResult && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This issue occurs when RLS (Row Level Security) policies create circular dependencies. 
              Click the button below to automatically fix the database policies.
            </p>

            <Button 
              onClick={handleFix}
              disabled={isFixing}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing Database Policies...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Fix RLS Recursion Now
                </>
              )}
            </Button>
          </div>
        )}

        {fixResult && (
          <div className="space-y-3">
            {fixResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> {fixResult.message}
                  {fixResult.alreadyFixed && (
                    <Badge variant="outline" className="ml-2 border-green-200 text-green-700">
                      Already Fixed
                    </Badge>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fix Failed: </strong>{fixResult.error || fixResult.message}
                  {fixResult.details && (
                    <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                      {fixResult.details}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {fixResult.nextSteps && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {fixResult.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="font-medium">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {fixResult.testResult && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-2">Test Results:</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Query Status:</span> {
                      fixResult.testResult.error 
                        ? `Error: ${fixResult.testResult.error}` 
                        : 'Success'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Records Found:</span> {fixResult.testResult.dataCount}
                  </div>
                </div>
              </div>
            )}

            {(fixResult.success && !fixResult.alreadyFixed) && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Page will refresh automatically in 3 seconds to apply the fix...
                </p>
              </div>
            )}

            {!fixResult.success && (
              <div className="space-y-2">
                <Button 
                  onClick={handleFix}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Fix Again
                </Button>

                <Button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Manual Instructions
                </Button>
              </div>
            )}
          </div>
        )}

        {showAdvanced && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <h4 className="text-green-300 mb-2">Manual Fix Instructions:</h4>
            <p className="mb-2">1. Go to Supabase Dashboard → SQL Editor</p>
            <p className="mb-2">2. Run this SQL:</p>
            <div className="bg-black p-2 rounded text-green-300 overflow-x-auto">
              <pre>{`-- Fix infinite recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
    LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Re-enable with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_profiles" ON public.profiles
FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM auth.users WHERE email = 'support@backlinkoo.com')
);`}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
