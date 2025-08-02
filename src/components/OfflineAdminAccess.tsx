import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface OfflineAdminAccessProps {
  children: React.ReactNode;
}

export const OfflineAdminAccess = ({ children }: OfflineAdminAccessProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Emergency admin passwords (in production, this would be more secure)
  const adminPasswords = ['Admin123!@#', 'emergency2024', 'backlinkoo-admin'];

  const handleEmergencyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminPasswords.includes(password)) {
      console.log('🚨 Offline admin access granted');
      setIsAdmin(true);
      setError(null);
      
      // Store in localStorage for session
      localStorage.setItem('emergency_admin_access', 'true');
      localStorage.setItem('emergency_admin_timestamp', Date.now().toString());
    } else {
      setError('Invalid emergency password');
    }
  };

  const quickAdminAccess = () => {
    console.log('🚨 Quick admin access granted');
    setIsAdmin(true);
    localStorage.setItem('emergency_admin_access', 'true');
    localStorage.setItem('emergency_admin_timestamp', Date.now().toString());
  };

  // Check if already has emergency access
  const hasEmergencyAccess = () => {
    const access = localStorage.getItem('emergency_admin_access');
    const timestamp = localStorage.getItem('emergency_admin_timestamp');
    
    if (access === 'true' && timestamp) {
      const accessTime = parseInt(timestamp);
      const now = Date.now();
      const hoursSinceAccess = (now - accessTime) / (1000 * 60 * 60);
      
      // Emergency access expires after 24 hours
      return hoursSinceAccess < 24;
    }
    
    return false;
  };

  // Auto-grant if already has valid emergency access
  if (!isAdmin && hasEmergencyAccess()) {
    setIsAdmin(true);
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            System Emergency Mode
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Authentication system is offline. Use emergency access to continue.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The Supabase authentication system is not responding. This emergency mode 
              bypasses normal authentication for administrative access.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleEmergencyAccess} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency-password">Emergency Admin Password</Label>
              <Input
                id="emergency-password"
                type="password"
                placeholder="Enter emergency password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11">
              <Shield className="h-4 w-4 mr-2" />
              Grant Emergency Access
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">
              If you're the system administrator and this is your development environment:
            </p>
            <Button 
              onClick={quickAdminAccess}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Quick Dev Access (No Password)
            </Button>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Emergency Passwords:</p>
            <p>• Admin123!@# (default admin)</p>
            <p>• emergency2024 (emergency)</p>
            <p>• backlinkoo-admin (system)</p>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => window.location.reload()}
              variant="ghost"
              size="sm"
            >
              🔄 Retry Normal Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineAdminAccess;
