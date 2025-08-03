import React from 'react';
import { SEOOptimizedBlogGenerator } from '@/components/SEOOptimizedBlogGenerator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function SEOBlogGenerator() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <SEOOptimizedBlogGenerator />
      </main>
      <Footer />
    </div>
  );
}
