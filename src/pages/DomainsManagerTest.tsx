import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const DomainsManagerTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Domains Route Working!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The /domains route is now successfully loading.
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            This is a test page to verify the route is working correctly.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsManagerTest;
