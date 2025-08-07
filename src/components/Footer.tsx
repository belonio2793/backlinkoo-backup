import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { FooterNavigationService, FOOTER_NAV_CONFIGS } from "@/utils/footerNavigation";

export const Footer = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);
  const [pendingActionDescription, setPendingActionDescription] = useState<string>("");

  // Debug logging for user state
  console.log('🦶 Footer: User state:', {
    userEmail: user?.email,
    isAuthenticated: !!user,
    isLoading,
    userId: user?.id
  });

  // Close login modal if user becomes authenticated
  useEffect(() => {
    if (user && showLoginModal) {
      console.log('🔒 Footer: User authenticated, closing login modal');
      setShowLoginModal(false);
      setPendingNavigation(null);
      setPendingActionDescription("");
    }
  }, [user, showLoginModal]);

  const handleSmartNavigation = (config: any, actionDescription?: string) => {
    // Don't block navigation based on isLoading - let the smart nav handle auth state
    FooterNavigationService.handleNavigation({
      config,
      user,
      navigate,
      onAuthRequired: (pendingNav) => {
        setPendingNavigation(pendingNav);
        setPendingActionDescription(actionDescription || "this feature");
        setShowLoginModal(true);
      }
    });
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    console.log('🎯 Footer: handleAuthSuccess called for user:', authenticatedUser?.email);
    setShowLoginModal(false);

    // If there's a pending navigation, execute it after successful auth
    if (pendingNavigation) {
      console.log('🔄 Footer: Executing pending navigation:', pendingNavigation);

      // Use the smart navigation system for consistent handling
      FooterNavigationService.handleNavigation({
        config: { ...pendingNavigation, requiresAuth: false }, // Skip auth check since user just authenticated
        user: authenticatedUser,
        navigate,
        onAuthRequired: () => {} // No-op since user is already authenticated
      });

      setPendingNavigation(null);
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Features Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Features</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.CAMPAIGNS, "Campaign Management")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Campaign Management" : "Go to Campaign Management"}
              >
                Campaign Management
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.BACKLINK_AUTOMATION, "Backlink Automation")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Backlink Automation" : "Go to Backlink Automation"}
              >
                Backlink ∞ Automation Link Building (beta)
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.KEYWORD_RESEARCH, "Keyword Research")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Keyword Research" : "Go to Keyword Research"}
              >
                Keyword Research
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.RANK_TRACKER, "Rank Tracker")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Rank Tracker" : "Go to Rank Tracker"}
              >
                Rank Tracker
              </button>
              <Link
                to="/blog"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Community Blog
              </Link>
            </div>
          </div>

          {/* Merchant Tools Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Merchant Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.BACKLINK_REPORTS, "Backlink Reports")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Backlink Reports" : "Go to Backlink Reports"}
              >
                Backlink Reports
              </button>
            </div>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <div className="space-y-2">
              <Link
                to="/terms-of-service"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy-policy"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.ADMIN, "Admin Dashboard")}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer transition-colors"
                title={!user ? "Sign in to access Admin Dashboard" : "Go to Admin Dashboard"}
              >
                Admin Dashboard
              </button>
              <Link
                to="/affiliate"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Affiliate Program
              </Link>
              <a
                href="mailto:support@backlinkoo.com"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
            </div>
            <div className="text-center text-gray-600 text-sm">
              Copyright © Backlink ∞ - All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal for Authentication */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingNavigation(null);
          setPendingActionDescription("");
        }}
        onAuthSuccess={handleAuthSuccess}
        defaultTab="signup" // Promote signup for new users
        pendingAction={pendingActionDescription}
      />
    </footer>
  );
};
