
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link 
              to="/terms-of-service" 
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy-policy" 
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-gray-600 text-sm">
            Copyright © Backlink ∞ - All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
