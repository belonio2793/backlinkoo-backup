import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Infinity, Trash2 } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'login' | 'signup'>('login');

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
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

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Infinity className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
          </div>
          <div className="flex items-center gap-4">
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
