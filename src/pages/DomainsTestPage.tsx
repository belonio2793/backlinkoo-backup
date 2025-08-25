import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import DomainsTest from '@/components/debug/DomainsTest';

const DomainsTestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Domains System Test</h1>
          <p className="text-gray-600">Test the domain management system functionality</p>
        </div>
        
        <DomainsTest />
      </div>
      
      <Footer />
    </div>
  );
};

export default DomainsTestPage;
