import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MarkdownFormattingTest } from '@/components/MarkdownFormattingTest';

/**
 * Test page for debugging markdown formatting issues
 * Navigate to /markdown-test to see this page
 */
export function MarkdownTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Markdown Formatting Test
          </h1>
          <p className="text-gray-600">
            Testing bold text formatting in lists and content areas
          </p>
        </div>
        <MarkdownFormattingTest />
      </main>
      <Footer />
    </div>
  );
}

export default MarkdownTest;
