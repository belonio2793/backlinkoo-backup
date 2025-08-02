import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createAdminUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'support@backlinkoo.com',
          password: 'Admin123!@#'
        })
      });

      const data = await response.json();
      setResult(data);

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to create admin user'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create the initial admin user for the system
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p className="font-medium">Admin user created successfully!</p>
                    <div className="mt-2 text-xs">
                      <p>Email: {result.credentials?.email}</p>
                      <p>Password: {result.credentials?.password}</p>
                    </div>
                  </div>
                ) : (
                  result.error || 'Setup failed'
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-2">This will create:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Email: support@backlinkoo.com</li>
              <li>• Password: Admin123!@#</li>
              <li>• Role: Administrator</li>
              <li>• Full access to admin dashboard</li>
            </ul>
          </div>

          <Button
            onClick={createAdminUser}
            disabled={loading || (result?.success)}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Admin User...
              </>
            ) : result?.success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Admin User Created
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Create Admin User
              </>
            )}
          </Button>

          {result?.success && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="w-full"
              >
                Go to Admin Login
              </Button>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground">
            <p>⚠️ This should only be run once during initial setup</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
