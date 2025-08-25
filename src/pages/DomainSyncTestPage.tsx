import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import DomainSyncTester from '@/components/domains/DomainSyncTester';

const DomainSyncTestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Sync Integration Test</h1>
          <p className="text-gray-600">Test the complete domain sync integration between Supabase, Netlify, and Backlinkoo</p>
        </div>
        
        <DomainSyncTester />
      </div>
      
      <Footer />
    </div>
  );
};

export default DomainSyncTestPage;
