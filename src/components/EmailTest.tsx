import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const EmailTest = () => {
  const [email, setEmail] = useState('support@backlinkoo.com');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const testEmail = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('Testing email send to:', email);
      
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Email from Backlink ∞',
          message: `This is a test email to verify your Resend configuration.

Sent at: ${new Date().toLocaleString()}

If you received this email, your Resend API is working correctly!`,
          from: 'Backlink ∞ Test <support@backlinkoo.com>'
        }),
      });

      const result = await response.json();
      setLastResult(result);

      if (response.ok && result.success) {
        toast({
          title: "Test email sent!",
          description: `Successfully sent test email to ${email}. Check your inbox!`,
        });
      } else {
        throw new Error(result.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      setLastResult({ success: false, error: error.message });
      
      toast({
        title: "Email test failed",
        description: error.message,
        variant: "destructive",
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
          Email Service Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test Email Address:</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
          />
        </div>

        <Button 
          onClick={testEmail} 
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        {lastResult && (
          <div className={`p-3 rounded border-2 ${
            lastResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Success!' : 'Failed'}
              </span>
            </div>
            <div className={`text-sm ${
              lastResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {lastResult.success 
                ? `Email sent successfully (ID: ${lastResult.emailId})`
                : `Error: ${lastResult.error}`
              }
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          This will test the Resend email service via Netlify function.
        </div>
      </CardContent>
    </Card>
  );
};
