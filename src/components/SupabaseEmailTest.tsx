import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Info,
  Database,
  RefreshCw
} from 'lucide-react';

export const SupabaseEmailTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'warning' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const testSupabaseEmailSystem = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      // Test 1: Check Supabase Connection
      addResult('Supabase Connection', 'info', 'Testing Supabase connection...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        addResult('Supabase Connection', 'success', 'Successfully connected to Supabase');
      } catch (error: any) {
        addResult('Supabase Connection', 'error', `Supabase connection failed: ${error.message}`);
        return;
      }

      // Test 2: Test Signup Email (this will use Supabase's configured SMTP)
      addResult('Signup Email Test', 'info', 'Testing signup email via Supabase SMTP...');
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: 'TempTest123!',
          options: {
            emailRedirectTo: `https://backlinkoo.com/auth/confirm`,
            data: {
              first_name: 'Test User',
              test_signup: true
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered') || 
              error.message.includes('already exists') || 
              error.message.includes('User already registered')) {
            addResult('Signup Email Test', 'warning', 'User already exists - this means Supabase signup is working', { 
              note: 'Existing user detected',
              error: error.message 
            });
            
            // Test resend instead
            addResult('Resend Email Test', 'info', 'Testing resend functionality for existing user...');
            
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: testEmail,
              options: {
                emailRedirectTo: `https://backlinkoo.com/auth/confirm`
              }
            });

            if (resendError) {
              if (resendError.message.includes('already confirmed')) {
                addResult('Resend Email Test', 'success', 'User already confirmed - Supabase email system is working');
              } else {
                addResult('Resend Email Test', 'error', `Resend failed: ${resendError.message}`, resendError);
              }
            } else {
              addResult('Resend Email Test', 'success', 'Resend email sent successfully via Supabase SMTP');
            }
          } else {
            addResult('Signup Email Test', 'error', `Signup failed: ${error.message}`, error);
          }
        } else if (data.user) {
          if (data.user.email_confirmed_at) {
            addResult('Signup Email Test', 'warning', 'User created but already confirmed (no email sent)');
          } else {
            addResult('Signup Email Test', 'success', 'New user created - confirmation email should be sent via Supabase SMTP', {
              userId: data.user.id,
              emailConfirmed: !!data.user.email_confirmed_at
            });
          }
        }
      } catch (error: any) {
        addResult('Signup Email Test', 'error', `Signup test failed: ${error.message}`, error);
      }

      // Test 3: Check Email Configuration Status
      addResult('Configuration Check', 'info', 'Checking email configuration...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        addResult('Configuration Check', 'success', 'Supabase environment variables are configured');
        
        if (supabaseUrl.includes('supabase.co')) {
          addResult('Configuration Check', 'info', 'Using Supabase hosted instance - SMTP should be configured in Supabase dashboard');
        }
      } else {
        addResult('Configuration Check', 'error', 'Missing Supabase environment variables');
      }

      // Test 4: Password Reset Email Test
      addResult('Password Reset Test', 'info', 'Testing password reset email...');
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
          redirectTo: `https://backlinkoo.com/auth/reset-password`
        });

        if (error) {
          addResult('Password Reset Test', 'error', `Password reset failed: ${error.message}`, error);
        } else {
          addResult('Password Reset Test', 'success', 'Password reset email sent successfully via Supabase SMTP');
        }
      } catch (error: any) {
        addResult('Password Reset Test', 'error', `Password reset test failed: ${error.message}`, error);
      }

    } catch (error: any) {
      addResult('System Error', 'error', `Test failed: ${error.message}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Email System Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test email functionality using Supabase's built-in email system with your configured SMTP settings.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={testSupabaseEmailSystem} 
            disabled={isLoading || !testEmail.trim()}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Supabase Email System
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer">Show Details</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Current Email Setup:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Primary System:</strong> Supabase Auth with configured SMTP</li>
            <li>• <strong>SMTP Provider:</strong> Resend (configured in Supabase dashboard)</li>
            <li>• <strong>Email Types:</strong> Signup confirmation, password reset, email change</li>
            <li>• <strong>Templates:</strong> Managed in Supabase Auth settings</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium mb-2 text-yellow-800">Important Notes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure Resend SMTP is properly configured in your Supabase dashboard</li>
            <li>• Check that email templates are set up in Supabase Auth → Email Templates</li>
            <li>• Verify your domain is verified with Resend if using custom domain</li>
            <li>• Check spam folders if emails are not appearing in inbox</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
