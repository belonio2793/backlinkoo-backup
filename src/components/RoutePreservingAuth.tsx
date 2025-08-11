import React from 'react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/LoginModal';
import { SimpleRegistrationModal } from '@/components/SimpleRegistrationModal';
import { useRoutePreservingAuth } from '@/hooks/useRoutePreservingAuth';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Crown } from 'lucide-react';

interface RoutePreservingAuthProps {
  showAuthButtons?: boolean;
  className?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg";
}

export function RoutePreservingAuth({ 
  showAuthButtons = true,
  className = "",
  buttonVariant = "default",
  buttonSize = "default"
}: RoutePreservingAuthProps) {
  const { user, signOut, isPremium } = useAuth();
  const {
    showLoginModal,
    showRegistrationModal,
    defaultTab,
    openLogin,
    openSignup,
    closeLogin,
    closeRegistration,
    handleAuthSuccess
  } = useRoutePreservingAuth();

  if (!showAuthButtons) {
    return (
      <>
        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={closeLogin}
          onAuthSuccess={handleAuthSuccess}
          defaultTab={defaultTab}
        />

        {/* Registration Modal */}
        <SimpleRegistrationModal
          isOpen={showRegistrationModal}
          onClose={closeRegistration}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{user.email}</span>
            {isPremium && (
              <Crown className="h-4 w-4 text-purple-600" />
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size={buttonSize}
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>

        {/* Modals - in case they're needed */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={closeLogin}
          onAuthSuccess={handleAuthSuccess}
          defaultTab={defaultTab}
        />

        <SimpleRegistrationModal
          isOpen={showRegistrationModal}
          onClose={closeRegistration}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button 
        variant="outline" 
        size={buttonSize}
        onClick={openLogin}
      >
        Sign In
      </Button>
      <Button 
        variant={buttonVariant} 
        size={buttonSize}
        onClick={openSignup}
      >
        Get Started
      </Button>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeLogin}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={defaultTab}
      />

      {/* Registration Modal */}
      <SimpleRegistrationModal
        isOpen={showRegistrationModal}
        onClose={closeRegistration}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
