import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { BetaNotification } from "@/components/BetaNotification";
import { AppWrapper } from "@/components/AppWrapper";
import { AuthProfileChecker } from "@/components/AuthProfileChecker";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cleanupStoredBlogPosts } from "@/utils/contentCleanup";
import "@/utils/routeTest";

const queryClient = new QueryClient();

// Run content cleanup once on app startup
if (typeof window !== 'undefined') {
  // Check if cleanup has been run before
  const cleanupVersion = '1.2.0'; // Updated to trigger geolocation cleanup
  const lastCleanup = localStorage.getItem('content_cleanup_version');

  if (lastCleanup !== cleanupVersion) {
    console.log('🧹 Running one-time content cleanup...');
    const cleanedCount = cleanupStoredBlogPosts();
    if (cleanedCount > 0) {
      console.log(`✅ Fixed ${cleanedCount} blog posts with malformed content`);
    }
    localStorage.setItem('content_cleanup_version', cleanupVersion);
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProfileChecker>
          <Toaster />
          <Sonner />
          <GlobalNotifications />
          <BetaNotification />
          <BrowserRouter>
            <AuthRedirectHandler>
              <AppWrapper />
            </AuthRedirectHandler>
          </BrowserRouter>
        </AuthProfileChecker>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
