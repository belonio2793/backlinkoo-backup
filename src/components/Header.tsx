import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Infinity, Trash2, Home } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { navigateToSection, NAVIGATION_CONFIGS } from '@/utils/navigationUtils';

interface HeaderProps {
  showHomeLink?: boolean;
}

export function Header({ showHomeLink = true }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'login' | 'signup'>('login');

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
      }
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      navigate('/');
    }
  };

  const handleSignInClick = () => {
    setDefaultTab('login');
    setShowLoginModal(true);
  };

  const handleCreateAccountClick = () => {
    setDefaultTab('signup');
    setShowLoginModal(true);
  };

  const handleAuthSuccess = (user: any) => {
    setShowLoginModal(false);
    // Navigate to dashboard after successful auth
    navigate('/dashboard');
  };

  const handleClearCacheAndCookies = async () => {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cookies (domain-specific)
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Clear for parent domain if applicable
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        // Clear for parent domain with leading dot
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }

      // Clear browser cache (if supported)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast({
        title: "Cache & Cookies Cleared",
        description: "Browser cache and cookies have been cleared successfully. Page will reload.",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error clearing cache and cookies:', error);
      toast({
        title: "Clear Failed",
        description: "Some data may not have been cleared completely.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Infinity className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Home Link - Show only on non-home pages */}
            {showHomeLink && location.pathname !== '/' && (
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="bg-transparent hover:bg-green-50/50 border border-green-200/60 text-green-600 hover:text-green-700 hover:border-green-300/80 transition-all duration-200 font-medium px-4 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            )}

            {/* Clear Cache Button - Always visible */}
            <Button
              onClick={handleClearCacheAndCookies}
              variant="outline"
              size="sm"
              className="bg-transparent hover:bg-orange-50/50 border border-orange-200/60 text-orange-600 hover:text-orange-700 hover:border-orange-300/80 transition-all duration-200 font-medium px-4 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
              title="Clear browser cache and cookies"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>

            {user ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-transparent hover:bg-blue-50/50 border border-blue-200/60 text-blue-700 hover:text-blue-800 hover:border-blue-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => navigate("/blog")}
                  className="bg-transparent hover:bg-purple-50/50 border border-purple-200/60 text-purple-700 hover:text-purple-800 hover:border-purple-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                >
                  Blog
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="bg-transparent hover:bg-red-50/50 border border-red-200/60 text-red-600 hover:text-red-700 hover:border-red-300/80 transition-all duration-200 font-medium px-6 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSignInClick} className="font-medium">
                  Sign In
                </Button>
                <Button onClick={handleCreateAccountClick} className="font-medium">
                  Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={defaultTab}
      />
    </header>
  );
}
