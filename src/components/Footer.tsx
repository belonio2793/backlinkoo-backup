import { Link } from "react-router-dom";
import { navigateToSection, NAVIGATION_CONFIGS } from "@/utils/navigationUtils";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Features Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Features</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigateToSection(NAVIGATION_CONFIGS.CAMPAIGNS)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full"
              >
                Campaign Management
              </button>
              <button
                onClick={() => navigateToSection(NAVIGATION_CONFIGS.BACKLINK_AUTOMATION)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full"
              >
                Backlink ∞ Automation Link Building (beta)
              </button>
              <button
                onClick={() => navigateToSection(NAVIGATION_CONFIGS.KEYWORD_RESEARCH)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full"
              >
                Keyword Research
              </button>
              <button
                onClick={() => navigateToSection(NAVIGATION_CONFIGS.RANK_TRACKER)}
                className="block text-gray-600 hover:text-gray-900 text-sm text-left w-full"
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
              <Link
                to="/backlink-report"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Backlink Reports
              </Link>
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
              <Link
                to="/admin"
                className="block text-gray-600 hover:text-gray-900 text-sm"
              >
                Admin Dashboard
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
    </footer>
  );
};
