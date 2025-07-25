import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const AuthDebugger = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Environment variables:');
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

      // Test basic connection first
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.text();
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: data,
        url: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
        headers: Object.fromEntries(response.headers.entries())
      });

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseClient = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing Supabase client...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setResult({
        success: !error,
        data,
        error: error?.message,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="debug-email">Email</Label>
            <Input
              id="debug-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="debug-password">Password</Label>
            <Input
              id="debug-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={testDirectAuth} disabled={loading}>
            Test Direct API
          </Button>
          <Button onClick={testSupabaseClient} disabled={loading}>
            Test Supabase Client
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <strong>Environment Status:</strong>
          </div>
          <div className="text-xs space-y-1">
            <div>URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</div>
            <div>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</div>
          </div>
        </div>

        {result && (
          <Alert>
            <AlertDescription>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
