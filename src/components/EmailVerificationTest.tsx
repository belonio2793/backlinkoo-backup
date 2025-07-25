import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EmailService } from '@/services/emailService';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const EmailVerificationTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const testConfirmationEmail = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('Testing confirmation email to support@backlinkoo.com...');

      const result = await EmailService.sendConfirmationEmail('support@backlinkoo.com');
      console.log('Email test result:', result);

      setLastResult(result);

      if (result.success) {
        toast({
          title: "Test confirmation email sent!",
          description: `Successfully sent to support@backlinkoo.com via Resend. Check your inbox!`,
        });
      } else {
        console.error('Email service returned failure:', result.error);
        toast({
          title: "Email test failed",
          description: result.error || 'Unknown error from email service',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);

      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      setLastResult({
        success: false,
        error: errorMessage,
        provider: 'netlify_resend'
      });

      toast({
        title: "Email test failed",
        description: errorMessage,
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
          Resend Verification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Test if your Resend email service is working by sending a confirmation email.
        </p>

        <Button 
          onClick={testConfirmationEmail} 
          disabled={isLoading}
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
              Send Test Confirmation Email
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
          This sends to: support@backlinkoo.com<br/>
          Using: Netlify Function + Resend API
        </div>
      </CardContent>
    </Card>
  );
};
