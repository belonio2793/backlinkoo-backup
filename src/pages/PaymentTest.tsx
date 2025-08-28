import React from 'react';
import { PaymentDiagnostic } from '../components/debug/PaymentDiagnostic';

export function PaymentTest() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Payment System Test</h1>
        <PaymentDiagnostic />
      </div>
    </div>
  );
}
