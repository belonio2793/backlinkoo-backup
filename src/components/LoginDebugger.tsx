import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LoginDebugger = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setAuthState({ event, session });
      setSessionData(session);
      if (session?.user) {
        setUserData(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', { session, sessionError });
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', { user, userError });

      // Get environment info
      const envInfo = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        isLocalhost: window.location.hostname === 'localhost',
        currentPath: window.location.pathname,
        isMockClient: !!(supabase as any).from && typeof (supabase as any).from === 'function' &&
                      (supabase as any).auth.getSession.toString().includes('mock'),
        clientType: (supabase as any).from ? 'Real Supabase' : 'Unknown',
        localStorage: Object.keys(localStorage).filter(key =>
          key.includes('supabase') || key.includes('sb-')
        ),
        sessionStorage: Object.keys(sessionStorage || {}).filter(key =>
          key.includes('supabase') || key.includes('sb-')
        )
      };

      setDebugInfo(envInfo);
      setSessionData(session);
      setUserData(user);
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      if (userError) {
        console.error('User error:', userError);
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setDebugInfo(prev => ({ ...prev, error: error.message }));
    }
  };

  const testLogin = async () => {
    try {
      toast({
        title: "Testing login...",
        description: "Attempting to sign in with test credentials"
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      });

      console.log('Test login result:', result);
      
      if (result.error) {
        toast({
          title: "Login test failed",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login test successful",
          description: "Check the debug info below"
        });
      }
      
      await checkAuthState();
    } catch (error) {
      console.error('Test login error:', error);
      toast({
        title: "Login test error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearAuthStorage = () => {
    // Clear all auth-related storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    toast({
      title: "Storage cleared",
      description: "All auth storage has been cleared"
    });
    
    checkAuthState();
  };

  const forceSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      clearAuthStorage();
      toast({
        title: "Signed out",
        description: "User has been signed out"
      });
      checkAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkAuthState} size="sm">Refresh</Button>
            <Button onClick={testLogin} size="sm" variant="outline">Test Login</Button>
            <Button onClick={clearAuthStorage} size="sm" variant="outline">Clear Storage</Button>
            <Button onClick={forceSignOut} size="sm" variant="destructive">Force Sign Out</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Environment</h4>
              <div className="space-y-1 text-sm">
                <div>Hostname: <Badge variant="outline">{debugInfo.isLocalhost ? 'localhost' : 'production'}</Badge></div>
                <div>Current Path: <Badge variant="outline">{debugInfo.currentPath}</Badge></div>
                <div>Supabase URL: <Badge variant={debugInfo.hasSupabaseUrl ? "default" : "destructive"}>
                  {debugInfo.hasSupabaseUrl ? "✓" : "✗"}
                </Badge></div>
                <div>Supabase Key: <Badge variant={debugInfo.hasSupabaseKey ? "default" : "destructive"}>
                  {debugInfo.hasSupabaseKey ? "✓" : "✗"}
                </Badge></div>
                <div>Client Type: <Badge variant={debugInfo.isMockClient ? "destructive" : "default"}>
                  {debugInfo.isMockClient ? "Mock Client" : "Real Supabase"}
                </Badge></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Storage</h4>
              <div className="space-y-1 text-sm">
                <div>LocalStorage keys: {debugInfo.localStorage?.length || 0}</div>
                <div>SessionStorage keys: {debugInfo.sessionStorage?.length || 0}</div>
                {debugInfo.localStorage?.map((key, index) => (
                  <div key={index} className="text-xs text-muted-foreground">- {key}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Current Session</h4>
            <div className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Current User</h4>
            <div className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(userData, null, 2)}</pre>
            </div>
          </div>
          
          {authState && (
            <div>
              <h4 className="font-semibold mb-2">Last Auth Event</h4>
              <div className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(authState, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginDebugger;
