import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Infinity, Home, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

const Redirect = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeRedirect = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session?.user) {
          console.log('No valid session found, redirecting to login');
          navigate('/login');
          return;
        }
        
        setUser(session.user);
        setIsLoading(false);
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          if (isMounted) {
            navigate('/dashboard');
          }
        }, 3000);
        
      } catch (error) {
        console.error('Redirect initialization error:', error);
        if (isMounted) {
          navigate('/login');
        }
      }
    };

    initializeRedirect();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Infinity className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Infinity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Backlink ∞</h1>
          </div>
          <CardTitle className="text-xl text-gray-800">Welcome Back!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Login Successful</h2>
            <p className="text-gray-600 text-sm">
              {user?.email ? `Signed in as ${user.email}` : 'You have been successfully authenticated'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 text-sm mb-3">
              You'll be automatically redirected to your dashboard in a few seconds...
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard Now
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? <a href="mailto:support@backlinkoo.com" className="text-primary hover:underline">Contact Support</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Redirect;
