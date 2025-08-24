import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import SimpleDomainManager from '@/components/domains/SimpleDomainManager';
import DomainsAuthGuard from '@/components/DomainsAuthGuard';
import '@/utils/testSupabaseConfig'; // Import to run tests in development

const DomainsPage = () => {
  return (
    <DomainsAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Simple Domain Manager */}
          <SimpleDomainManager />
        </div>

        <Footer />
      </div>
    </DomainsAuthGuard>
  );
};

export default DomainsPage;
