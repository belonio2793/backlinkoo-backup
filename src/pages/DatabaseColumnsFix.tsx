import React from 'react';
import { DatabaseSchemaFixer } from '@/components/admin/DatabaseSchemaFixer';

export function DatabaseColumnsFix() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <DatabaseSchemaFixer />
      </div>
    </div>
  );
}

export default DatabaseColumnsFix;
