import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmergencyAuthService } from '@/services/emergencyAuthService';

interface QuickAdminLoginProps {
  onAuthSuccess?: (user: any) => void;
}

export function QuickAdminLogin({ onAuthSuccess }: QuickAdminLoginProps) {
  const [email, setEmail] = useState('support@backlinkoo.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleEmergencyLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setAuthStatus('idle');

    try {
      console.log('🚨 QuickAdmin: Attempting emergency login...');
      
      const result = await EmergencyAuthService.emergencySignIn(email, password);

      if (result.success) {
        setAuthStatus('success');
        toast({
          title: "Emergency Access Granted!",
          description: result.emergencyBypass 
            ? "You're now logged in with emergency bypass"
            : "Normal authentication successful",
        });
        onAuthSuccess?.(result.user);
      } else {
        setAuthStatus('error');
        toast({
          title: "Emergency Login Failed",
          description: result.error || "Unable to authenticate",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('QuickAdmin: Emergency login failed:', error);
      setAuthStatus('error');
      toast({
        title: "Emergency Login Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(`${email}\n${password}`);
      toast({
        title: "Credentials Copied",
        description: "Email and password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the credentials",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Emergency Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This bypasses database issues and provides immediate admin access for troubleshooting.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="emergency-email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="emergency-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyCredentials}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-password">Password</Label>
              <Input
                id="emergency-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <Button 
              onClick={handleEmergencyLogin}
              disabled={isLoading || !email || !password}
              className="w-full"
              variant={authStatus === 'success' ? 'default' : 'destructive'}
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : authStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Authenticating..." : 
               authStatus === 'success' ? "Access Granted" : "Emergency Login"}
            </Button>

            {authStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Emergency access active!</strong> You can now access admin features.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Default Credentials:</strong></p>
            <div className="font-mono bg-gray-100 p-2 rounded">
              <div>Email: support@backlinkoo.com</div>
              <div>Password: Admin123!@#</div>
            </div>
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              Emergency Mode Features
            </Badge>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Bypasses database authentication issues</li>
              <li>• Provides temporary admin access</li>
              <li>• Works even during RLS policy problems</li>
              <li>• Session expires after 24 hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
