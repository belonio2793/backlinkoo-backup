import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const LazyBacklinkAutomation = lazy(() => import("./pages/BacklinkAutomation"));
const LazyRecursiveDiscoveryDashboard = lazy(() => import("./pages/RecursiveDiscoveryDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/automation"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <LazyBacklinkAutomation />
              </Suspense>
            }
          />
          <Route
            path="/recursive-discovery"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <LazyRecursiveDiscoveryDashboard />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
