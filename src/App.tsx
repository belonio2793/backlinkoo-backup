import React, { Suspense, lazy, useEffect, useState } from 'react';
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
import { SupabaseErrorBoundary } from "@/components/SupabaseErrorBoundary";
import { UserFlowProvider } from "@/contexts/UserFlowContext";
import { useSymbolCleaner } from "@/utils/symbolCleaner";
import "@/utils/consoleSymbolCleaner"; // Load console utilities
import { useGlobalAutoCleaner } from "@/hooks/useTextCleaner";
import "@/utils/emergencyDisable"; // Load emergency disable utilities
// import "@/utils/testReplacementCharacter"; // Disabled to prevent errors when cleaners are off
import { LazyBeautifulBlogPost } from "@/components/LazyComponents";
import EmergencyErrorBoundary from "@/components/EmergencyErrorBoundary";
import { DomainErrorBoundary } from "@/components/DomainErrorBoundary";
import SupabaseErrorRecovery from "@/components/SupabaseErrorRecovery";
import { SupabaseConnectionFixer } from "@/utils/supabaseConnectionFixer";
import Index from "./pages/Index";
import CheckoutIntentHandler from "./components/CheckoutIntentHandler";

const LazyEmergencyBlogPost = lazy(() => import("./components/EmergencyBlogPost"));

const LazyBlogCommentsSystem = lazy(() => import("./pages/BlogCommentsSystem"));
const LazyBacklinkReport = lazy(() => import("./pages/BacklinkReport"));
const LazyRecursiveDiscoveryDashboard = lazy(() => import("./pages/RecursiveDiscoveryDashboard"));
const LazyAdminLanding = lazy(() => import("./pages/AdminLanding"));
const LazyBlog = lazy(() => import("./pages/Blog"));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyAutomation = lazy(() => import("./pages/Automation"));
const LazyAutomationDiscovery = lazy(() => import("./pages/AutomationDiscovery"));
const LazyLogin = lazy(() => import("./pages/Login"));
// Removed - using LazyBeautifulBlogPost from LazyComponents instead
const LazyAuthCallback = lazy(() => import("./pages/AuthCallback"));
const LazyEmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const LazyPasswordReset = lazy(() => import("./pages/PasswordReset"));
const LazyPaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const LazyPaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const LazySecurePayment = lazy(() => import("./pages/SecurePayment"));
const LazySubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const LazySubscriptionCancelled = lazy(() => import("./pages/SubscriptionCancelled"));
const LazyTermsOfService = lazy(() => import("./pages/TermsOfService"));
const LazyPrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LazyPaymentTest = lazy(() => import("./pages/PaymentTest"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));
const LazyTwitterAdGenerator = lazy(() => import("./pages/TwitterAdGenerator"));
const LazyAffiliate = lazy(() => import("./pages/Affiliate"));
const LazyDomainsPage = lazy(() => import("./pages/DomainsPage"));
const LazyEnhancedDomainsPage = lazy(() => import("./pages/EnhancedDomainsPage"));
const LazyNetlifyTest = lazy(() => import("./pages/NetlifyTest"));
const LazyNetlifyConnectionTest = lazy(() => import("./pages/NetlifyConnectionTest"));
const LazySupabaseTest = lazy(() => import("./pages/SupabaseTest"));
const LazyEdgeFunctionDebugPage = lazy(() => import("./pages/EdgeFunctionDebugPage"));
const LazyBlogGenerationTest = lazy(() => import("./components/BlogGenerationTest"));
const LazyAuthFix = lazy(() => import("./pages/AuthFix"));
const LazyTestPaymentModal = lazy(() => import("./pages/TestPaymentModal"));
const LazyTestPaymentFunction = lazy(() => import("./pages/TestPaymentFunction"));
const LazyTestAllPaymentMethods = lazy(() => import("./pages/TestAllPaymentMethods"));
import BlogGenerationFixTestPage from "./pages/BlogGenerationFixTest";

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

// Global Supabase Error Monitor
const SupabaseErrorMonitor = ({ children }: { children: React.ReactNode }) => {
  const [globalSupabaseError, setGlobalSupabaseError] = useState<Error | null>(null);

  useEffect(() => {
    // Global handler for Supabase network errors
    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'reason' in event ? event.reason : event.error;

      if (SupabaseConnectionFixer.isSupabaseNetworkError(error)) {
        console.error('🚨 Global Supabase error detected:', error);
        setGlobalSupabaseError(error);

        // Auto-clear error after 10 seconds
        setTimeout(() => {
          setGlobalSupabaseError(null);
        }, 10000);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  return (
    <>
      {children}
      {globalSupabaseError && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <SupabaseErrorRecovery
            error={globalSupabaseError}
            onRecovery={() => setGlobalSupabaseError(null)}
            compact={true}
          />
        </div>
      )}
    </>
  );
};

const App = () => {
  console.log('🚀 Main App starting...');

  try {
    return (
      <EmergencyErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ModalProvider>
              <UserFlowProvider>
                <Toaster />
                <GlobalErrorHandler />
                <UnifiedModalManager />
                {/* Resume pending checkouts after authentication */}
                <CheckoutIntentHandler />
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
              path="/automation/discovery"
              element={
                <Suspense fallback={
                  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
                    <div className="text-center">
                      <LoadingSpinner />
                      <div className="mt-4">
                        <h2 className="text-xl font-semibold text-gray-900">Loading Discovery Engine</h2>
                        <p className="text-gray-600 mt-2">Initializing platform discovery and link opportunity scanner...</p>
                      </div>
                    </div>
                  </div>
                }>
                  <LazyAutomationDiscovery />
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
              path="/domains"
              element={
                <DomainErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyEnhancedDomainsPage />
                  </Suspense>
                </DomainErrorBoundary>
              }
            />

            <Route
              path="/domains/legacy"
              element={
                <DomainErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyDomainsPage />
                  </Suspense>
                </DomainErrorBoundary>
              }
            />

            <Route
              path="/netlify-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyNetlifyTest />
                </Suspense>
              }
            />

            <Route
              path="/netlify-connection-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyNetlifyConnectionTest />
                </Suspense>
              }
            />

            <Route
              path="/supabase-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazySupabaseTest />
                </Suspense>
              }
            />

            <Route
              path="/edge-function-debug"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyEdgeFunctionDebugPage />
                </Suspense>
              }
            />

            <Route
              path="/domains-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  {React.createElement(React.lazy(() => import('./pages/DomainsTestPage')))}
                </Suspense>
              }
            />



            <Route
              path="/test"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  {React.createElement(React.lazy(() => import('./pages/TestPage')))}
                </Suspense>
              }
            />
            <Route
              path="/test-stripe"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  {React.createElement(React.lazy(() => import('./pages/TestStripeIntegration')))}
                </Suspense>
              }
            />
            <Route
              path="/test-payment-modal"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTestPaymentModal />
                </Suspense>
              }
            />
            <Route
              path="/test-payment-function"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTestPaymentFunction />
                </Suspense>
              }
            />
            <Route
              path="/test-all-payments"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyTestAllPaymentMethods />
                </Suspense>
              }
            />
            <Route
              path="/payment-test"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyPaymentTest />
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
              path="/secure-payment"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazySecurePayment />
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

            {/* Debug and test routes */}
            <Route
              path="/dev-status"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  {React.createElement(React.lazy(() => import('./pages/DevEnvironmentStatus')))}
                </Suspense>
              }
            />
            <Route
              path="/payment-debug"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  {React.createElement(React.lazy(() => import('./pages/PaymentErrorDebug')))}
                </Suspense>
              }
            />
            <Route
              path="/payment-validation"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  {React.createElement(React.lazy(() => import('./pages/PaymentValidation')))}
                </Suspense>
              }
            />
            <Route
              path="/auth-fix"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyAuthFix />
                </Suspense>
              }
            />
            <Route
              path="/debug/blog-fix"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <BlogGenerationFixTestPage />
                </Suspense>
              }
            />
            <Route
              path="/test/blog-generation"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyBlogGenerationTest />
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
              </UserFlowProvider>
            </ModalProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </EmergencyErrorBoundary>
    );
  } catch (error) {
    console.error('❌ App Error:', error);
    return (
      <div className="min-h-screen bg-red-100 p-8">
        <h1 className="text-2xl font-bold text-red-800">App Loading Error</h1>
        <p className="mt-2">There was an error loading the application.</p>
        <pre className="mt-4 text-sm bg-white p-4 rounded">{String(error)}</pre>
      </div>
    );
  }
};

export default App;
