import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { BetaNotification } from "@/components/BetaNotification";
import { OptimizedAppWrapper } from "@/components/OptimizedAppWrapper";
import { AuthProfileChecker } from "@/components/AuthProfileChecker";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { DatabaseHealthLogger } from "@/components/DatabaseHealthLogger";
import { cleanupStoredBlogPosts } from "@/utils/contentCleanup";
import { autoConfigSaver } from "@/services/autoConfigSaver";
import { DebugErrorHandler } from "@/utils/debugErrorHandler";
import "@/services/blogCleanupService"; // Initialize blog cleanup service


import "@/services/rlsStatusService"; // RLS STATUS CHECK AND MANUAL FIX INSTRUCTIONS
import "@/utils/createAdminUser"; // Admin user creation utility
import "@/utils/autoAdminSetup"; // Auto admin user setup

// Initialize performance monitoring in development
if (import.meta.env.DEV) {
  import('@/utils/performance');
}


// Debug utilities removed for better performance and stability
// Diagnostic utilities are available manually via window.runBlogSystemDiagnostic()

import { queryClient } from "@/lib/queryClient";

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

  // Initialize auto-config saver (disabled to prevent fetch errors)
  // console.log('🚀 Initializing automatic configuration monitoring...');
  // autoConfigSaver.startMonitoring();

  // Load heavy initialization modules asynchronously to improve initial load time
  setTimeout(() => {
    // Initialize real-time configuration sync (disabled to prevent fetch errors)
    // import('./utils/initializeConfigSync').then(({ initializeConfigSync }) => {
    //   initializeConfigSync().then(result => {
    //     if (result.success) {
    //       console.log('✅ Real-time configuration sync initialized:', result.message);
    //     } else {
    //       console.error('❌ Configuration sync initialization failed:', result.message);
    //     }
    //   });
    // });

    // Initialize production safety system (disabled to prevent fetch errors)
    // import('./services/productionSafeConfig').then(({ productionSafeConfig }) => {
    //   productionSafeConfig.ensureHomepageSafety().then(result => {
    //     if (result.safe) {
    //       console.log('🛡️ Homepage safety verified - users protected');
    //     } else {
    //       console.warn('⚠️ Homepage safety issues detected:', result.issues);
    //       console.log('��� Automatic fallbacks have been enabled to protect users');
    //     }
    //   });
    // });
  }, 2000); // Delay heavy initialization by 2 seconds
}

const App = () => (
  <EnhancedErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProfileChecker>
          <Toaster />
          <Sonner />
          <GlobalNotifications />
          <DatabaseHealthLogger />
          <BetaNotification />
          <BrowserRouter>
            <AuthRedirectHandler>
              <OptimizedAppWrapper />
            </AuthRedirectHandler>
          </BrowserRouter>
        </AuthProfileChecker>
      </TooltipProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;
