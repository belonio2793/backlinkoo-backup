import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import PaymentDebugger from '@/components/PaymentDebugger';

export default function PaymentDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <PaymentDebugger />
      </div>
      
      <Footer />
    </div>
  );
}
