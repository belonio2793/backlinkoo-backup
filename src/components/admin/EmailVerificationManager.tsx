import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResendEmailService } from '@/services/resendEmailService';
import { 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  RefreshCw, 
  Shield, 
  User,
  ExternalLink
} from 'lucide-react';

export function EmailVerificationManager() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const { toast } = useToast();

  const testEmailVerification = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to test.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test sending verification email
      const result = await ResendEmailService.sendConfirmationEmail(testEmail);
      
      if (result.success) {
        toast({
          title: "Test email sent!",
          description: `Verification email sent to ${testEmail}`,
        });
      } else {
        toast({
          title: "Email test failed",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test email verification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserVerificationStatus = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to check.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Query user status from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (error) {
        setVerificationStatus({
          exists: false,
          error: error.message
        });
      } else {
        setVerificationStatus({
          exists: true,
          user: data,
          verified: !!data.email_confirmed_at
        });
      }
    } catch (error: any) {
      setVerificationStatus({
        exists: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!testEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        toast({
          title: "Resend failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email resent!",
          description: `New verification email sent to ${testEmail}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Resend failed",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Email Verification Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Email Enforcement</span>
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Login blocked until email verified
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Email Service</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  <Mail className="h-3 w-3 mr-1" />
                  Netlify + Resend
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Via Netlify function
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">SMTP Status</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Check Supabase
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                May need SMTP config
              </p>
            </div>
          </div>

          {/* Test Section */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Test Email Verification</h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="test-email">Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={testEmailVerification}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send Test Verification Email
                </Button>
                
                <Button 
                  onClick={checkUserVerificationStatus}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Check User Status
                </Button>
                
                <Button 
                  onClick={resendVerificationEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Resend via Supabase
                </Button>
              </div>
            </div>
          </div>

          {/* User Status Results */}
          {verificationStatus && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">User Verification Status</h4>
              <div className="p-4 border rounded-lg">
                {verificationStatus.exists ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={verificationStatus.verified ? "default" : "destructive"}>
                        {verificationStatus.verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Not Verified
                          </>
                        )}
                      </Badge>
                      <span className="font-medium">{testEmail}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>User ID: {verificationStatus.user.id}</p>
                      <p>Created: {new Date(verificationStatus.user.created_at).toLocaleString()}</p>
                      {verificationStatus.user.email_confirmed_at && (
                        <p>Verified: {new Date(verificationStatus.user.email_confirmed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>User not found</span>
                    {verificationStatus.error && (
                      <span className="text-sm text-muted-foreground">
                        ({verificationStatus.error})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration Links */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Configuration Links</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/settings/auth', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Supabase Auth Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://resend.com/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Resend Dashboard
              </Button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              Implementation Summary
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>✅ Email verification now enforced in login flow</p>
              <p>✅ Protected routes require verified email</p>
              <p>✅ Users see verification screen if not verified</p>
              <p>✅ Multiple email sending fallbacks configured</p>
              <p>⚠️ Set actual RESEND_API_KEY environment variable</p>
              <p>⚠️ Configure SMTP in Supabase dashboard if needed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
