import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import EnhancedDomainManager from '@/components/domains/EnhancedDomainManager';

const DomainsPage = () => {
  const { isAuthenticated } = useAuthState();

  // Store intended route for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('intended_route', '/domains');
    }
  }, [isAuthenticated]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Domain Manager
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to manage your domains
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Manager
          </h1>
          <p className="text-xl text-gray-600">
            View and manage domains from your Netlify account
          </p>
        </div>

        {/* Netlify Domain Manager - Simple and Direct */}
        <NetlifyDomainManager />
      </div>

      <Footer />
    </div>
  );
};

export default DomainsPage;
