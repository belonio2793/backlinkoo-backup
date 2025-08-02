import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/authService';

export default function AuthTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testDirectSupabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing direct Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      const testResult = {
        type: 'Direct Supabase',
        success: !error,
        error: error?.message,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at
        } : null,
        session: !!data.session
      };

      setResult(testResult);
      console.log('Direct Supabase result:', testResult);

      if (testResult.success) {
        toast({
          title: "Success!",
          description: "Direct Supabase authentication works",
        });
      } else {
        toast({
          title: "Failed",
          description: testResult.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      const testResult = {
        type: 'Direct Supabase',
        success: false,
        error: err.message,
        exception: true
      };
      setResult(testResult);
      console.error('Direct Supabase error:', err);
    }
    
    setLoading(false);
  };

  const testAuthService = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing AuthService...');
      const result = await AuthService.signIn({
        email,
        password
      });

      const testResult = {
        type: 'AuthService',
        success: result.success,
        error: result.error,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          emailConfirmed: !!result.user.email_confirmed_at
        } : null,
        session: !!result.session,
        requiresEmailVerification: result.requiresEmailVerification
      };

      setResult(testResult);
      console.log('AuthService result:', testResult);

      if (testResult.success) {
        toast({
          title: "Success!",
          description: "AuthService authentication works",
        });
      } else {
        toast({
          title: "Failed",
          description: testResult.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      const testResult = {
        type: 'AuthService',
        success: false,
        error: err.message,
        exception: true
      };
      setResult(testResult);
      console.error('AuthService error:', err);
    }
    
    setLoading(false);
  };

  const createTestUser = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Creating test user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: 'Test',
            display_name: 'Test User'
          }
        }
      });

      const testResult = {
        type: 'Create User',
        success: !error,
        error: error?.message,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at
        } : null,
        session: !!data.session,
        needsConfirmation: !data.user?.email_confirmed_at
      };

      setResult(testResult);
      console.log('Create user result:', testResult);

      if (testResult.success) {
        toast({
          title: "Success!",
          description: "Test user created successfully",
        });
      } else {
        toast({
          title: "Failed",
          description: testResult.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      const testResult = {
        type: 'Create User',
        success: false,
        error: err.message,
        exception: true
      };
      setResult(testResult);
      console.error('Create user error:', err);
    }
    
    setLoading(false);
  };

  const checkConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

      const testResult = {
        type: 'Connection Test',
        success: !error,
        error: error?.message,
        canAccessProfiles: !error,
        count: data
      };

      setResult(testResult);
      console.log('Connection test result:', testResult);

      if (testResult.success) {
        toast({
          title: "Success!",
          description: "Database connection works",
        });
      } else {
        toast({
          title: "Failed",
          description: testResult.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      const testResult = {
        type: 'Connection Test',
        success: false,
        error: err.message,
        exception: true
      };
      setResult(testResult);
      console.error('Connection test error:', err);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={checkConnection} disabled={loading}>
                Test Connection
              </Button>
              <Button onClick={createTestUser} disabled={loading}>
                Create Test User
              </Button>
              <Button onClick={testDirectSupabase} disabled={loading}>
                Test Direct Supabase
              </Button>
              <Button onClick={testAuthService} disabled={loading}>
                Test AuthService
              </Button>
            </div>

            {result && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Test Result: {result.type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
