import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/contexts/ModalContext";
import { UnifiedModalManager } from "@/components/UnifiedModalManager";
import Index from "./pages/Index";

const LazyBacklinkAutomation = lazy(() => import("./pages/BacklinkAutomation"));
const LazyRecursiveDiscoveryDashboard = lazy(() => import("./pages/RecursiveDiscoveryDashboard"));
const LazyAdminLanding = lazy(() => import("./pages/AdminLanding"));
const LazyAffiliateProgram = lazy(() => import("./pages/AffiliateProgram"));
const LazyBlog = lazy(() => import("./pages/Blog").then(module => ({ default: module.Blog })));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModalProvider>
        <Toaster />
        <Sonner />
        <UnifiedModalManager />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/blog"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyBlog />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyDashboard />
                </Suspense>
              }
            />
            <Route
              path="/affiliate"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyAffiliateProgram />
                </Suspense>
              }
            />
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
            <Route
              path="/admin"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyAdminLanding />
                </Suspense>
              }
            />
            <Route
              path="/affiliate"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyAffiliateProgram />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
