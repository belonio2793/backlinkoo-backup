import React from 'react';
import { EmailAuthDiagnosticPanel } from '@/components/EmailAuthDiagnosticPanel';
import { ToolsHeader } from '@/components/shared/ToolsHeader';

export const EmailDiagnosticPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToolsHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Authentication Diagnostic
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive testing and troubleshooting for user registration emails
            </p>
          </div>
          
          <EmailAuthDiagnosticPanel />
        </div>
      </div>
    </div>
  );
};
