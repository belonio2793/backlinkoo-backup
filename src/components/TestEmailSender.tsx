import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle, XCircle, TestTube } from 'lucide-react';

export function TestEmailSender() {
  const [emailData, setEmailData] = useState({
    to: 'support@backlinkoo.com',
    subject: 'Email Configuration Test - ' + new Date().toLocaleString(),
    message: `Hello Support Team,

This is a test email to verify that our email configuration is working properly.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Source: Email Configuration Test Component
- Environment: ${import.meta.env.MODE || 'development'}
- Auto-triggered: ${Date.now()}

If you receive this email, the email sending functionality is working correctly.

Best regards,
Backlink Application`
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [autoTestRun, setAutoTestRun] = useState(false);
  const { toast } = useToast();

  // Auto-run test when component mounts (for demonstration)
  useState(() => {
    if (!autoTestRun) {
      setTimeout(() => {
        console.log('🚀 Auto-running email test...');
        sendTestEmail();
        setAutoTestRun(true);
      }, 2000);
    }
  });

  const sendTestEmail = async () => {
    console.log('📧 Starting email configuration test...');
    console.log('Target email:', emailData.to);
    console.log('Subject:', emailData.subject);

    setIsLoading(true);
    setTestResults(null);

    try {
      // Use Supabase Edge Function to send email via proper email service
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message
        }
      });

      console.log('Edge function response:', data, error);

      if (error) {
        throw new Error(error.message || 'Failed to invoke email function');
      }

      setTestResults({
        success: data?.success || false,
        message: data?.message || 'Email sent via Edge Function',
        data: data,
        error: error,
        method: 'edge_function'
      });

      toast({
        title: data?.success ? 'Test Email Sent' : 'Test Email Failed',
        description: data?.message || 'Email function executed',
        variant: data?.success ? 'default' : 'destructive'
      });

    } catch (error: any) {
      console.error('Test email failed:', error);

      // Fallback: Show what would be sent without actually sending
      setTestResults({
        success: false,
        message: `Email service not configured. Would send to: ${emailData.to}`,
        error: error.message,
        method: 'mock',
        mockData: {
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: 'Email Service Not Configured',
        description: `Would send test email to ${emailData.to}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendAlternativeTest = async () => {
    setIsLoading(true);
    try {
      // Alternative method using a different approach
      const { data, error } = await supabase.auth.resetPasswordForEmail(emailData.to, {
        redirectTo: window.location.origin + '/password-reset-test'
      });

      setTestResults({
        success: !error,
        message: error ? error.message : 'Password reset email sent to test email configuration',
        data,
        error,
        method: 'password_reset'
      });

      toast({
        title: !error ? 'Alternative Test Sent' : 'Alternative Test Failed',
        description: error ? error.message : 'Password reset email sent as configuration test',
        variant: !error ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Alternative test failed:', error);
      toast({
        title: 'Alternative Test Failed',
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
          <TestTube className="h-5 w-5" />
          Email Configuration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-to">To Email Address</Label>
            <Input
              id="test-to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="support@backlinkoo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-subject">Subject</Label>
            <Input
              id="test-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email Configuration Test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Test Message</Label>
            <Textarea
              id="test-message"
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              rows={8}
              placeholder="Enter test message..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={sendTestEmail}
            disabled={isLoading}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </Button>
          
          <Button 
            onClick={sendAlternativeTest}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Alternative Test
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
                {testResults.success ? 'Test Email Sent' : 'Test Failed'}
              </span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {testResults.method}
              </span>
            </div>
            <p className={`text-sm ${
              testResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResults.message}
            </p>
            
            <div className="mt-3 text-xs text-gray-600">
              <strong>Next Steps:</strong> Check the inbox for {emailData.to} to verify the email was received.
            </div>
            
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
          <h4 className="font-medium text-blue-800 mb-2">Email Service Setup:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Primary:</strong> Uses Supabase Edge Function with Resend/SendGrid</li>
            <li>• <strong>Alternative:</strong> Direct API call to email service</li>
            <li>• Set <code>RESEND_API_KEY</code> in Supabase environment variables</li>
            <li>• Deploy the Edge Function: <code>supabase functions deploy send-test-email</code></li>
            <li>• Check support@backlinkoo.com inbox to verify delivery</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">Quick Setup Steps:</h4>
          <ol className="text-sm text-amber-700 space-y-1">
            <li>1. Sign up for Resend at <a href="https://resend.com" target="_blank" rel="noopener" className="underline">resend.com</a></li>
            <li>2. Get your API key from Resend dashboard</li>
            <li>3. Add <code>RESEND_API_KEY</code> to Supabase project settings</li>
            <li>4. Deploy the Edge Function: <code>supabase functions deploy send-test-email</code></li>
            <li>5. Test the email functionality using this component</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
