import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ResendEmailService } from '@/services/resendEmailService';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const EmailTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const testEmailSending = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing email sending to:', testEmail);
      
      // Test the Netlify function directly
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from Backlink ∞',
          message: `This is a test email sent at ${new Date().toISOString()}\n\nIf you received this, the email system is working correctly!`,
          from: 'Backlink ∞ Test <support@backlinkoo.com>'
        })
      });

      const result = await response.json();
      console.log('📧 Email test result:', result);
      setLastResult(result);

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `Email sent successfully to ${testEmail}. Check your inbox!`
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      setLastResult({ success: false, error: error.message });
      toast({
        title: "Test Failed",
        description: error.message || 'Network error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testResendService = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required", 
        description: "Please enter an email address to test",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing ResendEmailService to:', testEmail);
      const result = await ResendEmailService.sendConfirmationEmail(testEmail);
      console.log('📧 ResendEmailService result:', result);
      setLastResult(result);

      if (result.success) {
        toast({
          title: "Confirmation Email Sent!",
          description: `Confirmation email sent successfully to ${testEmail}`
        });
      } else {
        toast({
          title: "Email Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('ResendEmailService test error:', error);
      setLastResult({ success: false, error: error.message });
      toast({
        title: "Test Failed",
        description: error.message || 'Service error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter test email address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={testEmailSending} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test Netlify Function
          </Button>

          <Button 
            onClick={testResendService} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Test Confirmation Email
          </Button>
        </div>

        {lastResult && (
          <div className={`p-3 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium text-sm ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Success' : 'Failed'}
              </span>
            </div>
            {lastResult.emailId && (
              <p className="text-xs text-green-700">Email ID: {lastResult.emailId}</p>
            )}
            {lastResult.error && (
              <p className="text-xs text-red-700">{lastResult.error}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Provider: {lastResult.provider || 'unknown'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
