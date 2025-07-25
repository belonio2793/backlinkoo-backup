import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';

export function EmailVerificationTest() {
  const [email, setEmail] = useState('support@backlinkoo.com');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const testEmailVerification = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Test 1: Check if user already exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
      console.log('Existing users check:', existingUser, userError);

      // Test 2: Try to sign up with the email to trigger verification
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'TestPassword123!', // Temporary password for testing
        options: {
          data: {
            display_name: 'Test User'
          }
        }
      });

      console.log('SignUp response:', signUpData, signUpError);

      // Test 3: Try resend if user exists
      if (signUpError?.message?.includes('already registered')) {
        const { data: resendData, error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email
        });
        
        console.log('Resend response:', resendData, resendError);
        
        setTestResults({
          success: !resendError,
          message: resendError ? resendError.message : 'Verification email resent successfully',
          data: resendData,
          error: resendError
        });
      } else {
        setTestResults({
          success: !signUpError,
          message: signUpError ? signUpError.message : 'Verification email sent successfully',
          data: signUpData,
          error: signUpError
        });
      }

      toast({
        title: testResults?.success ? 'Email Sent' : 'Email Failed',
        description: testResults?.message,
        variant: testResults?.success ? 'default' : 'destructive'
      });

    } catch (error: any) {
      console.error('Email test failed:', error);
      setTestResults({
        success: false,
        message: error.message,
        error
      });
      
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testResendOnly = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      console.log('Resend only response:', data, error);
      
      setTestResults({
        success: !error,
        message: error ? error.message : 'Resend verification email attempted',
        data,
        error
      });

      toast({
        title: !error ? 'Resend Attempted' : 'Resend Failed',
        description: error ? error.message : 'Verification email resend attempted',
        variant: !error ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Resend failed:', error);
      toast({
        title: 'Resend Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Verification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
          />
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={testEmailVerification}
            disabled={isLoading}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Testing...' : 'Test Sign Up Email'}
          </Button>
          
          <Button 
            onClick={testResendOnly}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Resend Only
          </Button>
        </div>

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
            <p className={`text-sm ${
              testResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResults.message}
            </p>
            
            {testResults.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs opacity-70">
                  View Response Data
                </summary>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </details>
            )}
            
            {testResults.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs opacity-70">
                  View Error Details
                </summary>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Test Instructions:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Click "Test Sign Up Email" to trigger a new verification email</li>
            <li>2. If user exists, click "Test Resend Only" to resend verification</li>
            <li>3. Check the email inbox for support@backlinkoo.com</li>
            <li>4. Review the response data and error details if any</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
