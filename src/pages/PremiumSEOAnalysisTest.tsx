import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PremiumSEOTest } from '@/components/PremiumSEOTest';

/**
 * Test page for debugging Premium SEO Analysis Modal
 * Navigate to /premium-seo-test to see this page
 */
export function PremiumSEOAnalysisTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Premium SEO Analysis Test
          </h1>
          <p className="text-gray-600">
            Testing the new premium analysis modal with 100/100 scores and tier 2/tier 3 link building metrics
          </p>
        </div>
        <PremiumSEOTest />
      </main>
      <Footer />
    </div>
  );
}

export default PremiumSEOAnalysisTest;
