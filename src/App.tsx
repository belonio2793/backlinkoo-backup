import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/contexts/ModalContext";
import { UnifiedModalManager } from "@/components/UnifiedModalManager";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Index from "./pages/Index";

const LazyBacklinkAutomation = lazy(() => import("./pages/BacklinkAutomation"));
const LazyRecursiveDiscoveryDashboard = lazy(() => import("./pages/RecursiveDiscoveryDashboard"));
const LazyAdminLanding = lazy(() => import("./pages/AdminLanding"));
const LazyBlog = lazy(() => import("./pages/Blog"));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyLogin = lazy(() => import("./pages/Login"));
const LazyBeautifulBlogPost = lazy(() => import("./components/BeautifulBlogPost").then(module => ({ default: module.BeautifulBlogPost })));

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
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBlog />
                </Suspense>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBeautifulBlogPost />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyDashboard />
                </Suspense>
              }
            />
            <Route
              path="/automation"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBacklinkAutomation />
                </Suspense>
              }
            />
            <Route
              path="/recursive-discovery"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyRecursiveDiscoveryDashboard />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAdminLanding />
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
