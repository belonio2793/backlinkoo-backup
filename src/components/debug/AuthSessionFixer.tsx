import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Trash2, CheckCircle, AlertCircle, Key, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthSessionFixerProps {
  onFixed?: () => void;
}

export const AuthSessionFixer = ({ onFixed }: AuthSessionFixerProps) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const clearAuthSession = async () => {
    setIsFixing(true);
    setFixResult('');

    try {
      console.log('🧹 Starting authentication session cleanup...');

      // Step 1: Clear localStorage
      const localKeysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          localKeysToRemove.push(key);
        }
      }

      localKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Cleared localStorage: ${key}`);
      });

      // Step 2: Clear sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          sessionKeysToRemove.push(key);
        }
      }

      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`✅ Cleared sessionStorage: ${key}`);
      });

      // Step 3: Sign out from Supabase
      try {
        await supabase.auth.signOut();
        console.log('✅ Signed out from Supabase');
      } catch (signOutError) {
        console.warn('⚠️ Sign out error (expected if already signed out):', signOutError);
      }

      // Step 4: Test connection
      const { data, error } = await supabase
        .from('domains')
        .select('count')
        .limit(1);

      if (error) {
        console.warn('⚠️ Database test failed:', error.message);
        setFixResult(`✅ Session cleared successfully! 
⚠️ Database connection issue detected: ${error.message}
💡 Please sign in again to restore full functionality.`);
      } else {
        console.log('✅ Database connection test successful');
        setFixResult(`✅ Authentication session fixed successfully!
✅ Database connection restored
🎯 You can now sign in again.`);
      }

      // Trigger callback if provided
      if (onFixed) {
        onFixed();
      }

    } catch (error: any) {
      console.error('❌ Auth session fix failed:', error);
      setFixResult(`❌ Fix failed: ${error.message}
💡 Try refreshing the page manually.`);
    } finally {
      setIsFixing(false);
    }
  };

  const checkCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSessionInfo({
        hasSession: !!session,
        user: session?.user?.email || 'No user',
        error: error?.message || null,
        expires: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'No expiry'
      });
    } catch (error: any) {
      setSessionInfo({
        hasSession: false,
        user: 'Error',
        error: error.message,
        expires: 'Unknown'
      });
    }
  };

  const testApiKeys = () => {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔑 API Key Test Results:', {
      VITE_SUPABASE_URL: hasUrl ? 'Present' : 'Missing',
      VITE_SUPABASE_ANON_KEY: hasKey ? 'Present' : 'Missing',
      url: import.meta.env.VITE_SUPABASE_URL,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
    });

    setFixResult(`🔑 API Key Status:
${hasUrl ? '✅' : '❌'} VITE_SUPABASE_URL: ${hasUrl ? 'Present' : 'Missing'}
${hasKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY: ${hasKey ? 'Present' : 'Missing'}

${!hasUrl || !hasKey ? '💡 Environment variables may need dev server restart.' : '✅ API keys are properly configured.'}`);
  };

  React.useEffect(() => {
    checkCurrentSession();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Authentication Session Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Session Info */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Current Session Status
          </h4>
          {sessionInfo && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <div><strong>Has Session:</strong> {sessionInfo.hasSession ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>User:</strong> {sessionInfo.user}</div>
                  <div><strong>Expires:</strong> {sessionInfo.expires}</div>
                  {sessionInfo.error && <div className="text-red-600"><strong>Error:</strong> {sessionInfo.error}</div>}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkCurrentSession}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>

        {/* API Keys Test */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Configuration Test
          </h4>
          <Button 
            variant="outline" 
            onClick={testApiKeys}
            className="mb-3"
          >
            Test API Keys
          </Button>
        </div>

        {/* Fix Button */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Corrupted Session
          </h4>
          <Button 
            onClick={clearAuthSession}
            disabled={isFixing}
            className="w-full"
            variant="destructive"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing Authentication...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Session & Fix Auth
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {fixResult && (
          <Alert className={fixResult.includes('❌') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-sm">{fixResult}</pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <p><strong>Common Auth Issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>AuthSessionMissingError: Corrupted localStorage data</li>
                <li>No API key found: Environment variable issues</li>
                <li>Auth session missing: Expired or invalid session</li>
              </ul>
              <p className="mt-3"><strong>This tool will:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Clear all corrupted authentication data</li>
                <li>Sign out from any existing sessions</li>
                <li>Test database connectivity</li>
                <li>Allow you to sign in fresh</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AuthSessionFixer;
