import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { scrollToTop } from '@/utils/scrollToTop';
import { ReportSyncProvider } from '@/contexts/ReportSyncContext';
import { RouteSync } from '@/components/RouteSync';

// Import lightweight page components directly
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import EmailConfirmation from '@/pages/EmailConfirmation';
import AuthCallback from '@/pages/AuthCallback';
import PasswordReset from '@/pages/PasswordReset';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import BlogPreview from '@/pages/BlogPreview';
import NotFound from '@/pages/NotFound';
// import AffiliateTest from '@/pages/AffiliateTest';
import SafeAffiliateProgram from '@/pages/SafeAffiliateProgram';
import Dashboard from '@/pages/Dashboard';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancelled from '@/pages/PaymentCancelled';
import SubscriptionSuccess from '@/pages/SubscriptionSuccess';
import SubscriptionCancelled from '@/pages/SubscriptionCancelled';
import BlogSystemDiagnostic from '@/pages/BlogSystemDiagnostic';
import { BlogPostDiagnostic } from '@/components/BlogPostDiagnostic';
import EmergencyRLSFix from '@/pages/EmergencyRLSFix';
import AuthDiagnostic from '@/pages/AuthDiagnostic';
import { EmailDiagnosticPage } from '@/pages/EmailDiagnosticPage';

// Import optimized instant authentication components
import { InstantEmailVerificationGuard } from '@/components/InstantEmailVerificationGuard';
import { TrialNotificationBanner } from '@/components/TrialNotificationBanner';
import { AdminDiagnostic } from '@/components/AdminDiagnostic';
import InstantAdminLanding from '@/components/InstantAdminLanding';

// Import lazy-loaded components
import {
  LazyAdminDashboard,
  LazyEmailMarketing,
  LazyBacklinkReport,
  LazyReportViewer,
  LazySavedReports,
  LazyNoHandsSEO,
  LazyAffiliateProgram,
  LazyPromotionMaterials,
  LazyCampaignDeliverables,
  LazyBlogCreator,
  LazyBlogPost,
  LazyBlog,
  LazyBlogListing,
  LazyBlogCreation,
  LazyBlogPostView,
  LazyEnhancedBlogListing,
  LazySuperEnhancedBlogListing,
  LazyEnhancedBlogPost,
  LazyBeautifulBlogPost,
  LazyBeautifulBlogTemplate,

  LazyTrialDashboard,
  LazyAIContentTest,
  LazyEnhancedDashboardRouter,
  LazyUserBlogManagement,
  LazyBlogEditPage,
  LazyEnhancedAILive,
  LazyGuestDashboard,
  LazyClaimSystemDebug,
  LazySEOOptimizedBlogGenerator,
  LazyScrapePage,
  LazyBacklinkAutomation,
  LazyAdminCampaignManager,
  LazyOpenAITest,
  LazySystemTest,
  LazyPaymentTest,
  LazyWebhookTest,
  LazyPaymentDiagnostic,
  LazyEdgeFunctionDiagnostic,
  LazyRouteSyncTest,
  LazyEmailAuthenticationAudit,
  LazyEmailDiagnostic
} from './LazyComponents';

// Loading component for better UX
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-8">
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

// Component to handle scroll-to-top on route changes
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);

  return null;
};

export const OptimizedAppWrapper = () => {
  useReferralTracking();

  return (
    <ReportSyncProvider>
      <RouteSync />
      <TrialNotificationBanner />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - no authentication required (loaded immediately) */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/confirm" element={<EmailConfirmation />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<PasswordReset />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/preview/:slug" element={<BlogPreview />} />

          {/* Blog routes - enhanced system */}
          <Route path="/blog" element={<LazySuperEnhancedBlogListing />} />
          <Route path="/blog/create" element={<LazyBlogCreation />} />
          <Route path="/blog/seo-generator" element={<LazySEOOptimizedBlogGenerator />} />
          <Route path="/blog/:slug" element={<LazyBeautifulBlogPost />} />
          <Route path="/article/:slug" element={<LazyBeautifulBlogTemplate />} />

          {/* Legacy blog routes for backward compatibility */}
          <Route path="/blog-old" element={<LazyBlog />} />
          <Route path="/blog-creator" element={<LazyBlogCreator />} />

          {/* Dashboard routes */}
          <Route path="/trial" element={<LazyTrialDashboard />} />
          <Route path="/trial-dashboard" element={<LazyGuestDashboard />} />
          <Route path="/ai-test" element={<LazyAIContentTest />} />
          <Route path="/ai-live" element={<LazyEnhancedAILive />} />

          {/* Protected routes - require authentication and email verification */}
          <Route path="/dashboard" element={
            <InstantEmailVerificationGuard>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </InstantEmailVerificationGuard>
          } />

          <Route path="/my-dashboard" element={
            <InstantEmailVerificationGuard>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </InstantEmailVerificationGuard>
          } />
          <Route path="/my-blog" element={
            <InstantEmailVerificationGuard>
              <LazyUserBlogManagement />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/blog/:postId/edit" element={
            <InstantEmailVerificationGuard>
              <LazyBlogEditPage />
            </InstantEmailVerificationGuard>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
              <InstantAdminLanding />
            </Suspense>
          } />

          <Route path="/admin/diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <AdminDiagnostic />
            </Suspense>
          } />

          <Route path="/admin/payment-test" element={
            <Suspense fallback={<PageLoader />}>
              <LazyPaymentTest />
            </Suspense>
          } />

          {/* Emergency fix routes - accessible in all environments */}
          <Route path="/emergency/rls-fix" element={
            <Suspense fallback={<PageLoader />}>
              <EmergencyRLSFix />
            </Suspense>
          } />

          {/* Debug routes - only in development */}
          {import.meta.env.DEV && (
            <Route path="/debug/claim-system" element={<LazyClaimSystemDebug />} />
          )}

          {/* Blog system diagnostic - accessible in all environments */}
          <Route path="/diagnostic/blog-system" element={
            <Suspense fallback={<PageLoader />}>
              <BlogSystemDiagnostic />
            </Suspense>
          } />
          <Route path="/diagnostic/blog-post/:slug" element={
            <div className="min-h-screen bg-gray-50">
              <BlogPostDiagnostic />
            </div>
          } />

          {/* Authentication diagnostic - accessible in all environments */}
          <Route path="/auth-diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <AuthDiagnostic />
            </Suspense>
          } />

          {/* Payment routes - lightweight, immediate load */}
          <Route path="/payment-success" element={
            <InstantEmailVerificationGuard>
              <PaymentSuccess />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/payment-cancelled" element={
            <InstantEmailVerificationGuard>
              <PaymentCancelled />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/subscription-success" element={
            <InstantEmailVerificationGuard>
              <SubscriptionSuccess />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/subscription-cancelled" element={
            <InstantEmailVerificationGuard>
              <SubscriptionCancelled />
            </InstantEmailVerificationGuard>
          } />

          {/* Feature routes - lazy loaded */}
          <Route path="/scrape" element={<LazyScrapePage />} />
          <Route path="/backlink-automation" element={<LazyBacklinkAutomation />} />
          <Route path="/campaign/:campaignId" element={
            <InstantEmailVerificationGuard>
              <LazyCampaignDeliverables />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/email" element={
            <InstantEmailVerificationGuard>
              <LazyEmailMarketing />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/backlink-report" element={<LazyBacklinkReport />} />
          <Route path="/report" element={<LazyBacklinkReport />} />
          <Route path="/saved-reports" element={
            <InstantEmailVerificationGuard>
              <LazySavedReports />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/report/:reportId" element={<LazyReportViewer />} />
          <Route path="/automation-link-building" element={
            <InstantEmailVerificationGuard>
              <LazyNoHandsSEO />
            </InstantEmailVerificationGuard>
          } />
          <Route path="/affiliate" element={<SafeAffiliateProgram />} />
          <Route path="/affiliate/test" element={<SafeAffiliateProgram />} />
          <Route path="/affiliate/promotion-materials" element={
            <InstantEmailVerificationGuard>
              <LazyPromotionMaterials />
            </InstantEmailVerificationGuard>
          } />

          {/* API Testing Route */}
          <Route path="/test-openai" element={
            <Suspense fallback={<PageLoader />}>
              <LazyOpenAITest />
            </Suspense>
          } />
          <Route path="/system-test" element={
            <Suspense fallback={<PageLoader />}>
              <LazySystemTest />
            </Suspense>
          } />
          <Route path="/test-payment" element={
            <Suspense fallback={<PageLoader />}>
              <LazyPaymentTest />
            </Suspense>
          } />
          <Route path="/test-webhooks" element={
            <Suspense fallback={<PageLoader />}>
              <LazyWebhookTest />
            </Suspense>
          } />
          <Route path="/payment-diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <LazyPaymentDiagnostic />
            </Suspense>
          } />
          <Route path="/edge-function-diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <LazyEdgeFunctionDiagnostic />
            </Suspense>
          } />
          <Route path="/email-diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <EmailDiagnosticPage />
            </Suspense>
          } />
          <Route path="/route-sync-test" element={
            <Suspense fallback={<PageLoader />}>
              <LazyRouteSyncTest />
            </Suspense>
          } />
          <Route path="/email-auth-audit" element={
            <Suspense fallback={<PageLoader />}>
              <LazyEmailAuthenticationAudit />
            </Suspense>
          } />
          <Route path="/email-diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <LazyEmailDiagnostic />
            </Suspense>
          } />

          {/* 404 routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ReportSyncProvider>
  );
};
