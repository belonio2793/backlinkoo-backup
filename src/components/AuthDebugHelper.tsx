import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, User, Database, Shield } from 'lucide-react';

export function AuthDebugHelper() {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDebugResults(null);

    const results = {
      timestamp: new Date().toISOString(),
      supabaseConnection: false,
      authConfig: false,
      testSignIn: false,
      errors: [] as string[]
    };

    try {
      // Test 1: Supabase connection
      console.log('🔍 Testing Supabase connection...');
      const { data: healthCheck, error: healthError } = await supabase
        .from('auth.users')
        .select('count')
        .limit(1)
        .single();
      
      if (!healthError) {
        results.supabaseConnection = true;
        console.log('✅ Supabase connection OK');
      } else {
        results.errors.push(`Supabase connection failed: ${healthError.message}`);
        console.error('❌ Supabase connection failed:', healthError);
      }

      // Test 2: Auth configuration
      console.log('🔍 Testing auth configuration...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError) {
        results.authConfig = true;
        console.log('✅ Auth configuration OK');
      } else {
        results.errors.push(`Auth config error: ${sessionError.message}`);
        console.error('❌ Auth config error:', sessionError);
      }

      // Test 3: Test sign-in (if credentials provided)
      if (testEmail && testPassword) {
        console.log('🔍 Testing sign-in with provided credentials...');
        const signInResult = await AuthService.signIn({
          email: testEmail,
          password: testPassword
        });

        if (signInResult.success) {
          results.testSignIn = true;
          console.log('✅ Test sign-in successful');
          toast({
            title: "Sign-in test successful!",
            description: "The provided credentials work correctly.",
          });
        } else {
          results.errors.push(`Sign-in failed: ${signInResult.error}`);
          console.error('❌ Test sign-in failed:', signInResult.error);
        }
      }

    } catch (error: any) {
      results.errors.push(`Diagnostic error: ${error.message}`);
      console.error('🚨 Diagnostic error:', error);
    }

    setDebugResults(results);
    setIsLoading(false);

    if (results.errors.length === 0) {
      toast({
        title: "Diagnostics completed",
        description: "All authentication systems are working properly.",
      });
    } else {
      toast({
        title: "Issues detected",
        description: `Found ${results.errors.length} issue(s) with authentication.`,
        variant: "destructive",
      });
    }
  };

  const createTestAccount = async () => {
    if (!testEmail || !testPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter email and password for test account creation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await AuthService.signUp({
        email: testEmail,
        password: testPassword,
        firstName: 'Test'
      });

      if (result.success) {
        toast({
          title: "Test account created",
          description: result.requiresEmailVerification 
            ? "Account created. Check email for verification." 
            : "Account created and ready to use.",
        });
      } else {
        toast({
          title: "Account creation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Account creation error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Debug Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Credentials */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-password">Test Password</Label>
              <Input
                id="test-password"
                type="password"
                placeholder="test123"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runDiagnostics}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Run Diagnostics
          </Button>
          
          <Button 
            onClick={createTestAccount}
            disabled={isLoading || !testEmail || !testPassword}
            variant="outline"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Create Test Account
          </Button>
        </div>

        {/* Results */}
        {debugResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Diagnostic Results</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {debugResults.supabaseConnection ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span>Supabase Connection</span>
              </div>
              
              <div className="flex items-center gap-2">
                {debugResults.authConfig ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span>Auth Configuration</span>
              </div>
              
              {testEmail && testPassword && (
                <div className="flex items-center gap-2">
                  {debugResults.testSignIn ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Test Sign-in</span>
                </div>
              )}
            </div>

            {debugResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Issues Found:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {debugResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Common Solutions */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Common Solutions</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Verify your Supabase URL and API keys are correct</li>
            <li>Check that email confirmation is not required (or test with verified account)</li>
            <li>Ensure your test credentials exist in the database</li>
            <li>Check browser console for additional error details</li>
            <li>Verify your Supabase project is active and accessible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthDebugHelper;
