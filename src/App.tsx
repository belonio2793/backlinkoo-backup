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
const LazyBlog = lazy(() => import("./pages/Blog"));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyBeautifulBlogPost = lazy(() => import("./components/BeautifulBlogPost"));

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
              element={<LazyBlog />}
            />
            <Route
              path="/blog/:slug"
              element={<LazyBeautifulBlogPost />}
            />
            <Route
              path="/dashboard"
              element={<LazyDashboard />}
            />
            <Route
              path="/automation"
              element={<LazyBacklinkAutomation />}
            />
            <Route
              path="/recursive-discovery"
              element={<LazyRecursiveDiscoveryDashboard />}
            />
            <Route
              path="/admin"
              element={<LazyAdminLanding />}
            />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
