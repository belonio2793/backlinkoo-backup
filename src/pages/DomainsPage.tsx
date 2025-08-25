import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import EnhancedDomainManager from '@/components/domains/EnhancedDomainManager';
import DomainsAuthGuard from '@/components/DomainsAuthGuard';
// import '@/utils/testSupabaseConfig'; // Import to run tests in development - temporarily disabled

const DomainsPage = () => {
  return (
    <DomainsAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Enhanced Domain Manager with DNS Setup and Validation */}
          <EnhancedDomainManager />
        </div>

        <Footer />
      </div>
    </DomainsAuthGuard>
  );
};

export default DomainsPage;
