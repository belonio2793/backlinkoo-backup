import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EdgeFunctionDebugger } from '@/components/EdgeFunctionDebugger';

export default function EdgeFunctionDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Edge Function Debug</h1>
          <p className="text-gray-600">
            Test and debug Supabase Edge Functions for payment processing.
          </p>
        </div>
        
        <EdgeFunctionDebugger />
      </div>
      
      <Footer />
    </div>
  );
}
