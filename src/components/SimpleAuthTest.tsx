/**
 * Simple Auth Test Component
 * Minimal auth test to verify Supabase connection
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SimpleAuthTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testAuth = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing direct Supabase auth...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      console.log('🧪 Auth result:', { data, error });

      setResult({
        success: !!data.user,
        data,
        error: error?.message,
        timestamp: new Date().toISOString()
      });

      if (data.user) {
        toast({
          title: "Auth test successful!",
          description: `Signed in as: ${data.user.email}`,
        });
      } else {
        toast({
          title: "Auth test failed",
          description: error?.message || "Unknown error",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('🧪 Auth test exception:', error);
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Auth test error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing Supabase connection...');
      
      const { data, error } = await supabase.auth.getSession();
      
      setResult({
        connectionTest: true,
        data,
        error: error?.message,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Connection test",
        description: error ? `Error: ${error.message}` : "Connection successful",
        variant: error ? "destructive" : "default",
      });

    } catch (error: any) {
      setResult({
        connectionTest: true,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Auth Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testAuth} 
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            Test Sign In
          </Button>
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Test Connection
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
