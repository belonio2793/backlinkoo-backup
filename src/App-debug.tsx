import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Progressive loading - start basic and add complexity
const App = () => {
  console.log('🔍 Debug App component rendering...');
  
  try {
    return (
      <div className="min-h-screen">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">🔍 Debug Mode Active</h1>
                    <p className="mt-4">Basic components are working.</p>
                    <div className="mt-4">
                      <a href="/full" className="text-blue-600 underline">Load Full Index Page</a>
                    </div>
                  </div>
                } />
                <Route path="/full" element={<Index />} />
                <Route path="*" element={
                  <div className="p-8">
                    <h1 className="text-xl text-red-600">404</h1>
                  </div>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in Debug App:', error);
    return (
      <div className="min-h-screen bg-red-100 p-8">
        <h1 className="text-2xl font-bold text-red-800">App Error</h1>
        <pre className="mt-4 text-sm">{String(error)}</pre>
      </div>
    );
  }
};

export default App;
