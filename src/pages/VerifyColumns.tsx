import React from 'react';
import { ColumnVerifier } from '@/components/ColumnVerifier';

export function VerifyColumns() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">
          Database Columns Verification
        </h1>
        <ColumnVerifier />
      </div>
    </div>
  );
}

export default VerifyColumns;
