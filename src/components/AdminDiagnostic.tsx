import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function AdminDiagnostic() {
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any[] = [];

    // Check 1: Auth connection
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      results.push({
        name: 'Auth Connection',
        status: error ? 'error' : user ? 'success' : 'warning',
        message: error ? error.message : user ? `Authenticated as ${user.email}` : 'Not authenticated',
        details: user ? `User ID: ${user.id}` : null
      });
    } catch (error: any) {
      results.push({
        name: 'Auth Connection',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: null
      });
    }

    // Check 2: Profiles table access (with timeout)
    try {
      const profilePromise = supabase.from('profiles').select('count(*)', { count: 'exact' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 3 seconds')), 3000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]);
      results.push({
        name: 'Profiles Table Access',
        status: 'success',
        message: 'Profiles table accessible',
        details: `Query completed successfully`
      });
    } catch (error: any) {
      results.push({
        name: 'Profiles Table Access',
        status: 'error',
        message: error.message.includes('infinite recursion') ? 'Infinite recursion detected' : `Failed: ${error.message}`,
        details: error.message.includes('infinite recursion') ? 'RLS policies are causing infinite loops' : null
      });
    }

    // Check 3: Admin user existence
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profilePromise = supabase
          .from('profiles')
          .select('role, email')
          .eq('user_id', user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile check timeout')), 2000)
        );

        try {
          const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;
          results.push({
            name: 'Admin Profile Check',
            status: profile?.role === 'admin' ? 'success' : 'warning',
            message: profile?.role === 'admin' ? 'User has admin role' : 'User is not admin',
            details: profile ? `Role: ${profile.role}` : 'No profile found'
          });
        } catch (error: any) {
          results.push({
            name: 'Admin Profile Check',
            status: 'error',
            message: 'Profile check failed (likely RLS issue)',
            details: user.email === 'support@backlinkoo.com' ? 'Emergency bypass available' : null
          });
        }
      } else {
        results.push({
          name: 'Admin Profile Check',
          status: 'warning',
          message: 'No authenticated user',
          details: null
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Admin Profile Check',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: null
      });
    }

    setChecks(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Admin System Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running diagnostics...</span>
                </div>
              ) : (
                <>
                  {checks.map((check, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-muted-foreground">{check.message}</div>
                        {check.details && (
                          <div className="text-xs text-muted-foreground mt-1">{check.details}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button onClick={runDiagnostics} variant="outline" className="w-full">
                      🔄 Run Diagnostics Again
                    </Button>
                  </div>

                  {checks.some(c => c.message.includes('infinite recursion')) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Database Issue Detected:</strong> RLS policies are causing infinite recursion.
                        You need to run the database fix script in your Supabase SQL Editor.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
