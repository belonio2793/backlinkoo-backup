import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ConnectionTest = () => {
  const [authTest, setAuthTest] = useState<'loading' | 'success' | 'error'>('loading');
  const [dbTest, setDbTest] = useState<'loading' | 'success' | 'error'>('loading');
  const [authMessage, setAuthMessage] = useState('');
  const [dbMessage, setDbMessage] = useState('');

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    // Reset states
    setAuthTest('loading');
    setDbTest('loading');

    // Test 1: Auth connection
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setAuthTest('error');
        setAuthMessage(`Auth error: ${error.message}`);
      } else {
        setAuthTest('success');
        setAuthMessage(session ? 'User session found' : 'Auth connection OK (no user logged in)');
      }
    } catch (error: any) {
      setAuthTest('error');
      setAuthMessage(`Auth connection failed: ${error.message}`);
    }

    // Test 2: Database connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        setDbTest('error');
        const errorMessage = error?.message || error?.details || error?.hint || String(error) || 'Unknown database error';
        setDbMessage(`Database error: ${errorMessage}`);
      } else {
        setDbTest('success');
        setDbMessage('Database connection successful');
      }
    } catch (error: any) {
      setDbTest('error');
      const errorMessage = error?.message || String(error) || 'Unknown connection error';
      setDbMessage(`Database connection failed: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 border rounded">
          {getStatusIcon(authTest)}
          <div>
            <div className="font-medium">Authentication Service</div>
            <div className="text-sm text-muted-foreground">{authMessage}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded">
          {getStatusIcon(dbTest)}
          <div>
            <div className="font-medium">Database Connection</div>
            <div className="text-sm text-muted-foreground">{dbMessage}</div>
          </div>
        </div>

        <Button onClick={testConnections} className="w-full">
          Retest Connections
        </Button>

        <div className="text-xs text-muted-foreground">
          <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</div>
          <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}</div>
        </div>
      </CardContent>
    </Card>
  );
};
