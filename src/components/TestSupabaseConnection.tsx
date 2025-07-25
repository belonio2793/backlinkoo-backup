import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const TestSupabaseConnection = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [envCheck, setEnvCheck] = useState({
    url: '',
    hasKey: false
  });

  useEffect(() => {
    // Check environment variables
    setEnvCheck({
      url: import.meta.env.VITE_SUPABASE_URL || '',
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('loading');
    
    try {
      // Test auth connection
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('error');
        setMessage(`Connection failed: ${error.message}`);
        return;
      }
      
      // Test database connection
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (dbError) {
        setStatus('error');
        setMessage(`Database connection failed: ${dbError.message}`);
        return;
      }
      
      setStatus('success');
      setMessage('Supabase connection successful! Authentication and database are working.');
      
    } catch (error: any) {
      setStatus('error');
      setMessage(`Connection test failed: ${error.message}`);
    }
  };

  const getStatusIcon = () => {
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Supabase Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 border rounded">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium">Connection Status</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Supabase URL:</span>
            <span className={envCheck.url ? 'text-green-600' : 'text-red-600'}>
              {envCheck.url ? '✓ Set' : '✗ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Anonymous Key:</span>
            <span className={envCheck.hasKey ? 'text-green-600' : 'text-red-600'}>
              {envCheck.hasKey ? '✓ Set' : '✗ Missing'}
            </span>
          </div>
          {envCheck.url && (
            <div className="text-xs break-all mt-2 p-2 bg-gray-50 rounded">
              URL: {envCheck.url}
            </div>
          )}
        </div>

        <Button onClick={testConnection} className="w-full" size="sm">
          Test Again
        </Button>
      </CardContent>
    </Card>
  );
};
