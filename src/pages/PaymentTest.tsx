import React from 'react';
import { PaymentFlowTest } from '@/components/PaymentFlowTest';

/**
 * Payment Test Page
 * Dedicated page for testing payment flows
 */
export function PaymentTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentFlowTest />
    </div>
  );
}

export default PaymentTest;
