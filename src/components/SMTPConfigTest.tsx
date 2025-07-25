import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle, XCircle, Settings } from 'lucide-react';

export function SMTPConfigTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const resendConfig = {
    host: 'smtp.resend.com',
    port: 465,
    username: 'resend',
    password: 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq'
  };

  const testSMTPConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    const testEmail = {
      to: 'support@backlinkoo.com',
      subject: `Resend SMTP Configuration Test - ${new Date().toLocaleString()}`,
      message: `Hello Support Team,

🔧 SMTP Configuration Test Report

Connection Details:
- Host: ${resendConfig.host}
- Port: ${resendConfig.port} (SSL)
- Username: ${resendConfig.username}
- Authentication: Configured ✅

This email confirms that the Resend SMTP configuration is working correctly!

Test performed at: ${new Date().toISOString()}

Best regards,
SMTP Configuration Test System`,
      from: 'noreply@backlinkoo.com',
      smtpConfig: {
        host: resendConfig.host,
        port: resendConfig.port,
        secure: true,
        auth: {
          user: resendConfig.username,
          pass: resendConfig.password
        }
      }
    };

    try {
      console.log('🔧 Testing Resend SMTP configuration...');
      console.log('📧 Sending test email to:', testEmail.to);

      const { data, error } = await supabase.functions.invoke('send-email-smtp', {
        body: testEmail
      });

      console.log('SMTP Test Response:', data, error);

      if (error) {
        throw new Error(error.message || 'SMTP test failed');
      }

      setTestResult({
        success: true,
        message: 'SMTP configuration test successful!',
        data: data,
        config: resendConfig
      });

      toast({
        title: 'SMTP Test Successful',
        description: 'Email sent successfully via Resend SMTP configuration',
      });

    } catch (error: any) {
      console.error('SMTP test failed:', error);
      
      setTestResult({
        success: false,
        message: error.message,
        error: error,
        config: resendConfig
      });

      toast({
        title: 'SMTP Test Failed',
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
          <Settings className="h-5 w-5" />
          Resend SMTP Configuration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3">Current Configuration:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Host:</span> {resendConfig.host}
            </div>
            <div>
              <span className="font-medium">Port:</span> {resendConfig.port} (SSL)
            </div>
            <div>
              <span className="font-medium">Username:</span> {resendConfig.username}
            </div>
            <div>
              <span className="font-medium">Password:</span> ••••••••••••••••••••
            </div>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testSMTPConnection} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Mail className="h-4 w-4 mr-2 animate-spin" />
              Testing SMTP Configuration...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Resend SMTP Configuration
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'SMTP Test Successful' : 'SMTP Test Failed'}
              </span>
              <Badge variant="outline">
                {testResult.config.host}:{testResult.config.port}
              </Badge>
            </div>
            <p className={`text-sm ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>
            
            {testResult.success && (
              <div className="mt-3 text-xs text-green-600">
                ✅ Check support@backlinkoo.com inbox to verify email delivery
              </div>
            )}
            
            {testResult.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs opacity-70">
                  View Response Data
                </summary>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">Test Instructions:</h4>
          <ol className="text-sm text-amber-700 space-y-1">
            <li>1. Click "Test Resend SMTP Configuration" button</li>
            <li>2. Wait for the SMTP connection and email sending process</li>
            <li>3. Check the test results displayed below</li>
            <li>4. Verify email delivery by checking support@backlinkoo.com inbox</li>
            <li>5. If successful, the SMTP configuration is working correctly!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
