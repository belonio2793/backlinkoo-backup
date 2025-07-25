import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export function ResendConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const testResendConnection = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Test 1: Try to sign up with the new email to test SMTP
      const testEmail = 'belonio2793@gmail.com';
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            display_name: 'Email Test User'
          }
        }
      });

      console.log('Signup test result:', data, error);

      if (error) {
        if (error.message.includes('User already registered')) {
          // User exists, try resend
          const { data: resendData, error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: testEmail
          });
          
          console.log('Resend test result:', resendData, resendError);
          
          if (resendError) {
            setConnectionStatus('failed');
            setTestResults({
              success: false,
              message: `Resend failed: ${resendError.message}`,
              error: resendError,
              recommendation: 'Check SMTP configuration in Supabase'
            });
          } else {
            setConnectionStatus('connected');
            setTestResults({
              success: true,
              message: 'Email verification sent successfully via Resend!',
              data: resendData,
              recommendation: 'Check belonio2793@gmail.com inbox (including spam folder)'
            });
          }
        } else {
          setConnectionStatus('failed');
          setTestResults({
            success: false,
            message: `Signup failed: ${error.message}`,
            error: error,
            recommendation: 'Check Supabase Auth configuration'
          });
        }
      } else {
        setConnectionStatus('connected');
        setTestResults({
          success: true,
          message: 'New user created and verification email sent via Resend!',
          data: data,
          recommendation: 'Check belonio2793@gmail.com inbox (including spam folder)'
        });
      }

      toast({
        title: connectionStatus === 'connected' ? 'Email Sent Successfully' : 'Email Failed',
        description: testResults?.message,
        variant: connectionStatus === 'connected' ? 'default' : 'destructive'
      });

    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
      setTestResults({
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error,
        recommendation: 'Verify Supabase project is accessible'
      });
      
      toast({
        title: 'Connection Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Working
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Resend Email Connection Test
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Configuration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Test Configuration</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Target Email:</strong> belonio2793@gmail.com</p>
            <p><strong>SMTP Provider:</strong> Resend</p>
            <p><strong>Supabase Project:</strong> dfhanacsmsvvkpunurnp</p>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testResendConnection}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Test Resend Email Connection
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResults && (
          <div className={`p-4 rounded-lg border ${
            testResults.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResults.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResults.success ? 'Success' : 'Failed'}
              </span>
            </div>
            
            <p className={`text-sm mb-2 ${
              testResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResults.message}
            </p>

            {testResults.recommendation && (
              <p className={`text-xs font-medium ${
                testResults.success ? 'text-green-600' : 'text-red-600'
              }`}>
                💡 {testResults.recommendation}
              </p>
            )}
            
            {testResults.data && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs opacity-70">
                  View Response Data
                </summary>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">What This Test Does:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Attempts to trigger email verification to belonio2793@gmail.com</li>
            <li>• Tests if Resend SMTP configuration is working</li>
            <li>• Checks for any authentication or delivery errors</li>
            <li>• Provides recommendations for fixing issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
