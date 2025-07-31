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
import { DatabaseHealthLogger } from "@/components/DatabaseHealthLogger";
import { cleanupStoredBlogPosts } from "@/utils/contentCleanup";
import { autoConfigSaver } from "@/services/autoConfigSaver";
import { ConfigSaveNotification } from "@/components/ConfigSaveNotification";

// Import test utilities for debugging
import '@/utils/testBlogClaiming';
import '@/utils/netlifyFunctionDiagnostic';
import '@/utils/dashboardAccessDiagnostic';
import '@/utils/quickDashboardAccess';
import '@/utils/blogClaimDiagnostic';
import '@/utils/testBlogClaimFixes';

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

  // Initialize auto-config saver
  console.log('🚀 Initializing automatic configuration monitoring...');
  autoConfigSaver.startMonitoring();

  // Initialize real-time configuration sync
  import('./utils/initializeConfigSync').then(({ initializeConfigSync }) => {
    initializeConfigSync().then(result => {
      if (result.success) {
        console.log('✅ Real-time configuration sync initialized:', result.message);
      } else {
        console.error('❌ Configuration sync initialization failed:', result.message);
      }
    });
  });

  // Initialize production safety system
  import('./services/productionSafeConfig').then(({ productionSafeConfig }) => {
    productionSafeConfig.ensureHomepageSafety().then(result => {
      if (result.safe) {
        console.log('🛡️ Homepage safety verified - users protected');
      } else {
        console.warn('⚠️ Homepage safety issues detected:', result.issues);
        console.log('🔧 Automatic fallbacks have been enabled to protect users');
      }
    });
  });
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProfileChecker>
          <Toaster />
          <Sonner />
          <GlobalNotifications />
          <DatabaseHealthLogger />
          <BetaNotification />
          <ConfigSaveNotification />
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
