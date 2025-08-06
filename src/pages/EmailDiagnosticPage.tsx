import React from 'react';
import { EmailAuthDiagnosticPanel } from '@/components/EmailAuthDiagnosticPanel';
import { SupabaseEmailTemplateGuide } from '@/components/SupabaseEmailTemplateGuide';
import ToolsHeader from '@/components/shared/ToolsHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const EmailDiagnosticPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToolsHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Authentication Diagnostic & Configuration
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive testing, troubleshooting, and configuration for user registration emails
            </p>
          </div>

          <Tabs defaultValue="diagnostic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diagnostic">Run Diagnostic</TabsTrigger>
              <TabsTrigger value="configuration">Supabase Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostic" className="mt-6">
              <EmailAuthDiagnosticPanel />
            </TabsContent>

            <TabsContent value="configuration" className="mt-6">
              <SupabaseEmailTemplateGuide />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
