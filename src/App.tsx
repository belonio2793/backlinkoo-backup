import React, { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/contexts/ModalContext";
import { ReportSyncProvider } from "@/contexts/ReportSyncContext";
import { UnifiedModalManager } from "@/components/UnifiedModalManager";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PremiumUpgradeProvider } from "@/components/PremiumUpgradeProvider";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { UserFlowProvider } from "@/contexts/UserFlowContext";
import { useSymbolCleaner } from "@/utils/symbolCleaner";
import "@/utils/consoleSymbolCleaner"; // Load console utilities
import { useGlobalAutoCleaner } from "@/hooks/useTextCleaner";
import "@/utils/emergencyDisable"; // Load emergency disable utilities
// import "@/utils/testReplacementCharacter"; // Disabled to prevent errors when cleaners are off
import Index from "./pages/Index";

const LazyBlogCommentsSystem = lazy(() => import("./pages/BlogCommentsSystem"));
const LazyBacklinkReport = lazy(() => import("./pages/BacklinkReport"));
const LazyRecursiveDiscoveryDashboard = lazy(() => import("./pages/RecursiveDiscoveryDashboard"));
const LazyAdminLanding = lazy(() => import("./pages/AdminLanding"));
const LazyBlog = lazy(() => import("./pages/Blog"));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyAutomation = lazy(() => import("./pages/Automation"));
const LazyLogin = lazy(() => import("./pages/Login"));
const LazyBeautifulBlogPost = lazy(() => import("./components/BeautifulBlogPost").then(module => ({ default: module.BeautifulBlogPost })));
const LazyAuthCallback = lazy(() => import("./pages/AuthCallback"));
const LazyEmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const LazyPasswordReset = lazy(() => import("./pages/PasswordReset"));
const LazyPaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const LazyPaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const LazyPaymentTestPage = lazy(() => import("./pages/PaymentTestPage"));
const LazySubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const LazySubscriptionCancelled = lazy(() => import("./pages/SubscriptionCancelled"));
const LazyTermsOfService = lazy(() => import("./pages/TermsOfService"));
const LazyPrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));
const LazyTwitterAdGenerator = lazy(() => import("./pages/TwitterAdGenerator"));
const LazyAffiliate = lazy(() => import("./pages/Affiliate"));
const LazySymbolCleanerDebug = lazy(() => import("./components/SymbolCleanerDebug"));
const LazyCampaignMetricsDBVerifier = lazy(() => import("./components/CampaignMetricsDBVerifier"));
const LazyPremiumUpgradeTest = lazy(() => import("./components/PremiumUpgradeTest"));
const LazyAuthErrorDebug = lazy(() => import("./pages/AuthErrorDebug"));
const LazyTextCleanerDebug = lazy(() => import("./pages/TextCleanerDebug"));
const LazyDatabaseColumnsFix = lazy(() => import("./pages/DatabaseColumnsFix"));
const LazyVerifyColumns = lazy(() => import("./pages/VerifyColumns"));
const LazyMarkdownTest = lazy(() => import("./pages/MarkdownTest"));
const LazyPremiumSEOAnalysisTest = lazy(() => import("./pages/PremiumSEOAnalysisTest"));
const LazyEnhancedFeedDemo = lazy(() => import("./pages/EnhancedFeedDemo"));

const LazyDebugUserReports = lazy(() => import("./pages/DebugUserReports"));
const LazyBlogPostChecker = lazy(() => import("./components/BlogPostChecker").then(module => ({ default: module.BlogPostChecker })));
const LazyAutomationTestingDashboard = lazy(() => import("./components/admin/AutomationTestingDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Global Symbol Cleaner Component
const SymbolCleanerProvider = ({ children }: { children: React.ReactNode }) => {
  useSymbolCleaner(false); // Disable automatic symbol cleaning to preserve spaces
  return <>{children}</>;
};

// Global Text Cleaner Component
const TextCleanerProvider = ({ children }: { children: React.ReactNode }) => {
  useGlobalAutoCleaner(false, 1000); // Disable automatic text cleaning to preserve spaces
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModalProvider>
        <UserFlowProvider>
          <SymbolCleanerProvider>
            <TextCleanerProvider>
              <Toaster />
            <Sonner />
            <GlobalErrorHandler />
            <UnifiedModalManager />
            <BrowserRouter>
              <PremiumUpgradeProvider>
                <ReportSyncProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/login"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyLogin />
                </Suspense>
              }
            />
            <Route
          path="/blog"
          element={
            <EnhancedErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyBlog />
              </Suspense>
            </EnhancedErrorBoundary>
          }
        />
            <Route
          path="/blog/:slug"
          element={
            <EnhancedErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyBeautifulBlogPost />
              </Suspense>
            </EnhancedErrorBoundary>
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
                <Suspense fallback={
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                      <LoadingSpinner />
                      <div className="mt-4">
                        <h2 className="text-xl font-semibold text-gray-900">Loading Link Building Automation</h2>
                        <p className="text-gray-600 mt-2">Preparing your automated content generation and publishing system...</p>
                      </div>
                    </div>
                  </div>
                }>
                  <LazyAutomation />
                </Suspense>
              }
            />
            <Route
              path="/backlink-report"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBacklinkReport />
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
            <Route
              path="/ad"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTwitterAdGenerator />
                </Suspense>
              }
            />
            <Route
              path="/affiliate"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAffiliate />
                </Suspense>
              }
            />
            <Route
              path="/symbol-cleaner-debug"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazySymbolCleanerDebug />
                </Suspense>
              }
            />
            <Route
              path="/verify-database"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyCampaignMetricsDBVerifier />
                </Suspense>
              }
            />

            {/* Authentication routes */}
            <Route
              path="/auth/callback"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAuthCallback />
                </Suspense>
              }
            />
            <Route
              path="/auth/confirm"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyEmailConfirmation />
                </Suspense>
              }
            />
            <Route
              path="/auth/reset-password"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPasswordReset />
                </Suspense>
              }
            />

            {/* Payment routes */}
            <Route
              path="/payment-success"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPaymentSuccess />
                </Suspense>
              }
            />
            <Route
              path="/payment-cancelled"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPaymentCancelled />
                </Suspense>
              }
            />
            <Route
              path="/payment-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPaymentTestPage />
                </Suspense>
              }
            />
            <Route
              path="/subscription-success"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazySubscriptionSuccess />
                </Suspense>
              }
            />
            <Route
              path="/subscription-cancelled"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazySubscriptionCancelled />
                </Suspense>
              }
            />

            {/* Legal routes */}
            <Route
              path="/terms-of-service"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTermsOfService />
                </Suspense>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPrivacyPolicy />
                </Suspense>
              }
            />
            <Route
              path="/premium-upgrade-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPremiumUpgradeTest />
                </Suspense>
              }
            />
            <Route
              path="/debug/auth-errors"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAuthErrorDebug />
                </Suspense>
              }
            />
            <Route
              path="/debug/text-cleaner"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTextCleanerDebug />
                </Suspense>
              }
            />
            <Route
              path="/debug/database-fix"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyDatabaseColumnsFix />
                </Suspense>
              }
            />
            <Route
              path="/verify-columns"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyVerifyColumns />
                </Suspense>
              }
            />
            <Route
              path="/debug/blog-checker"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBlogPostChecker />
                </Suspense>
              }
            />
            <Route
              path="/debug/user-reports"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyDebugUserReports />
                </Suspense>
              }
            />
            <Route
              path="/markdown-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyMarkdownTest />
                </Suspense>
              }
            />
            <Route
              path="/admin/automation-testing"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAutomationTestingDashboard />
                </Suspense>
              }
            />
            <Route
              path="/premium-seo-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPremiumSEOAnalysisTest />
                </Suspense>
              }
            />
            <Route
              path="/draggable-demo"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyDraggableDemo />
                </Suspense>
              }
            />
            <Route
              path="/enhanced-feed-demo"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyEnhancedFeedDemo />
                </Suspense>
              }
            />

            {/* 404 Catch-all route */}
            <Route
              path="*"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyNotFound />
                </Suspense>
              }
            />
            </Routes>
                </ReportSyncProvider>
              </PremiumUpgradeProvider>
            </BrowserRouter>
            </TextCleanerProvider>
          </SymbolCleanerProvider>
        </UserFlowProvider>
      </ModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
