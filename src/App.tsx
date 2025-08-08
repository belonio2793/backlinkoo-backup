import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { OptimizedAppWrapper } from "@/components/OptimizedAppWrapper";
import { InstantAuthProvider } from "@/components/InstantAuth";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { DatabaseHealthLogger } from "@/components/DatabaseHealthLogger";
import { PremiumPopupProvider } from "@/components/PremiumPopupProvider";
import { ModalProvider } from "@/contexts/ModalContext";
import { UnifiedModalManager } from "@/components/UnifiedModalManager";
import { affiliateService } from "@/services/affiliateService";

// Lightweight initialization for better performance
if (import.meta.env.DEV) {
  console.log('🚀 Optimized app startup...');
}

import { queryClient } from "@/lib/queryClient";

// Lightweight initialization for faster startup
if (typeof window !== 'undefined') {
  console.log('⚡ Instant app initialization');

  // Initialize affiliate tracking
  setTimeout(() => {
    affiliateService.initializeTracking().catch(() => {
      // Silent fail for affiliate tracking to not impact user experience
    });
  }, 1000);

  // Defer heavy operations to after app mount
  setTimeout(() => {
    // Import cleanup utilities only when needed
    import('@/utils/contentCleanup').then(({ cleanupStoredBlogPosts }) => {
      const cleanupVersion = '1.2.0';
      const lastCleanup = localStorage.getItem('content_cleanup_version');

      if (lastCleanup !== cleanupVersion) {
        const cleanedCount = cleanupStoredBlogPosts();
        if (cleanedCount > 0) {
          console.log(`✅ Cleaned ${cleanedCount} blog posts`);
        }
        localStorage.setItem('content_cleanup_version', cleanupVersion);
      }
    }).catch(() => {});
  }, 5000); // Delay to prioritize app startup
}

const App = () => (
  <EnhancedErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InstantAuthProvider>
          <ModalProvider>
            <Toaster />
            <Sonner />
            <GlobalNotifications />
            <BrowserRouter>
              <PremiumPopupProvider>
                <OptimizedAppWrapper />
                <UnifiedModalManager />
              </PremiumPopupProvider>
            </BrowserRouter>
          </ModalProvider>
        </InstantAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;
