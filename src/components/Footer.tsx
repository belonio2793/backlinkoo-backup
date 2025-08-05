import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { FooterNavigationService, FOOTER_NAV_CONFIGS } from "@/utils/footerNavigation";

export const Footer = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);

  const handleSmartNavigation = (config: any) => {
    if (isLoading) return;

    FooterNavigationService.handleNavigation({
      config,
      user,
      navigate,
      onAuthRequired: (pendingNav) => {
        setPendingNavigation(pendingNav);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Features Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Features</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.CAMPAIGNS)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                title={!user ? "Sign in to access Campaign Management" : "Go to Campaign Management"}
                disabled={isLoading}
              >
                Campaign Management
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.BACKLINK_AUTOMATION)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                Backlink ∞ Automation Link Building (beta)
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.KEYWORD_RESEARCH)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                Keyword Research
              </button>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.RANK_TRACKER)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                Rank Tracker
              </button>
              <Link
                to="/blog"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Merchant Tools Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Merchant Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.BACKLINK_REPORTS)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                title={!user ? "Sign in to access Backlink Reports" : "Go to Backlink Reports"}
                disabled={isLoading}
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
              <Link
                to="/affiliate"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Affiliate Program
              </Link>
              <button
                onClick={() => handleSmartNavigation(FOOTER_NAV_CONFIGS.ADMIN)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer disabled:opacity-50"
                title={!user ? "Sign in to access Admin Dashboard" : "Go to Admin Dashboard"}
                disabled={isLoading}
              >
                Admin Dashboard
              </button>
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
        }}
        onAuthSuccess={handleAuthSuccess}
        defaultTab="login"
      />
    </footer>
  );
};
