import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthStatusMonitor } from '@/components/AuthStatusMonitor';
import { AuthRecoveryHelper } from '@/components/AuthRecoveryHelper';
import { AuthDebugHelper } from '@/components/AuthDebugHelper';
import { AuthFormTabs } from '@/components/shared/AuthFormTabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Home, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  HelpCircle,
  Bug
} from 'lucide-react';

export function AuthDiagnostic() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('status');

  const handleAuthSuccess = (authenticatedUser: any) => {
    // Redirect to dashboard after successful authentication
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Authentication Diagnostic</h1>
              <p className="text-muted-foreground">
                Debug and resolve authentication issues
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Current Status Alert */}
        {isAuthenticated ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> You are currently signed in as {user?.email}. 
              This diagnostic page can still help troubleshoot any authentication issues.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> You are not currently signed in. 
              Use this page to diagnose and resolve authentication issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="recovery" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Recovery
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <AuthStatusMonitor />
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Authentication Test</CardTitle>
              </CardHeader>
              <CardContent>
                <AuthFormTabs
                  onAuthSuccess={handleAuthSuccess}
                  defaultTab="login"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-6">
            <AuthRecoveryHelper />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <AuthDebugHelper />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Authentication Help & Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Common Issues */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Common Authentication Issues</h3>
                  
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-medium text-red-600">Error: "Invalid login credentials"</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        This usually means the email or password is incorrect.
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>Double-check your email address for typos</li>
                        <li>Ensure caps lock is not on when entering password</li>
                        <li>Try copying and pasting your password</li>
                        <li>Use the password reset function if unsure</li>
                      </ul>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium text-yellow-600">Error: "Email not confirmed"</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your email address needs to be verified before you can sign in.
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>Check your email (including spam/junk folder)</li>
                        <li>Click the confirmation link in the email</li>
                        <li>Use the "Resend Confirmation" feature if needed</li>
                        <li>Make sure the email hasn't expired (links expire after 24 hours)</li>
                      </ul>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium text-blue-600">Error: "Too many attempts"</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        The system has temporarily blocked sign-in attempts for security.
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>Wait 15-30 minutes before trying again</li>
                        <li>Clear your browser's cache and cookies</li>
                        <li>Try using a different browser or incognito mode</li>
                        <li>Use the "Clear All Auth Data" option in Recovery tab</li>
                      </ul>
                    </Card>
                  </div>
                </div>

                {/* Step-by-step Guide */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Step-by-Step Troubleshooting</h3>
                  
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>
                      <strong>Check the Status tab</strong> - This shows if services are working properly
                    </li>
                    <li>
                      <strong>Try signing in on the Auth tab</strong> - Use your normal credentials
                    </li>
                    <li>
                      <strong>If sign-in fails, check the error message</strong> - Each error has specific solutions
                    </li>
                    <li>
                      <strong>Use Recovery tab for password/email issues</strong> - Reset password or resend confirmation
                    </li>
                    <li>
                      <strong>Try the Debug tab</strong> - Run diagnostics and test with known credentials
                    </li>
                    <li>
                      <strong>Clear auth data as last resort</strong> - Use "Clear All Auth Data" if nothing else works
                    </li>
                  </ol>
                </div>

                {/* Browser Issues */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Browser-Related Issues</h3>
                  
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>
                      <strong>Clear browser cache and cookies</strong> - Old data can interfere with authentication
                    </li>
                    <li>
                      <strong>Disable browser extensions</strong> - Ad blockers or security extensions might block requests
                    </li>
                    <li>
                      <strong>Try incognito/private mode</strong> - This isolates the issue from browser data
                    </li>
                    <li>
                      <strong>Check browser console</strong> - Press F12 and look for error messages
                    </li>
                    <li>
                      <strong>Update your browser</strong> - Newer versions have better security support
                    </li>
                  </ul>
                </div>

                {/* Contact Information */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Still having issues?</strong> If none of these solutions work, 
                    there might be a server-side issue. Try again in a few minutes or contact support 
                    with screenshots of any error messages.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AuthDiagnostic;
