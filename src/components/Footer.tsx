import { Link } from "react-router-dom";
import { useState } from "react";
import { navigateToSection, NAVIGATION_CONFIGS } from "@/utils/navigationUtils";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";

export const Footer = () => {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);

  const handleProtectedNavigation = (config: any) => {
    if (user) {
      // User is authenticated, navigate directly
      navigateToSection(config);
    } else {
      // User is not authenticated, store pending navigation and show login modal
      setPendingNavigation(config);
      setShowLoginModal(true);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowLoginModal(false);

    // If there's a pending navigation, execute it after successful auth
    if (pendingNavigation) {
      setTimeout(() => {
        if (pendingNavigation.hash) {
          // Section navigation with hash
          navigateToSection(pendingNavigation);
        } else {
          // Simple route navigation
          window.location.href = pendingNavigation.route;
        }
        setPendingNavigation(null);
      }, 300); // Quick redirect for seamless experience
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
                onClick={() => handleProtectedNavigation(NAVIGATION_CONFIGS.CAMPAIGNS)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
                title={!user ? "Sign in to access Campaign Management" : "Go to Campaign Management"}
              >
                Campaign Management
              </button>
              <button
                onClick={() => handleProtectedNavigation(NAVIGATION_CONFIGS.BACKLINK_AUTOMATION)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
              >
                Backlink ∞ Automation Link Building (beta)
              </button>
              <button
                onClick={() => handleProtectedNavigation(NAVIGATION_CONFIGS.KEYWORD_RESEARCH)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
              >
                Keyword Research
              </button>
              <button
                onClick={() => handleProtectedNavigation(NAVIGATION_CONFIGS.RANK_TRACKER)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
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
                onClick={() => {
                  if (user) {
                    window.location.href = '/backlink-report';
                  } else {
                    setPendingNavigation({ route: '/backlink-report' });
                    setShowLoginModal(true);
                  }
                }}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
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
                onClick={() => {
                  if (user) {
                    window.location.href = '/admin';
                  } else {
                    setPendingNavigation({ route: '/admin' });
                    setShowLoginModal(true);
                  }
                }}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full hover:cursor-pointer"
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
