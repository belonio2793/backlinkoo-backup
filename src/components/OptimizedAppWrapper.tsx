import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { Skeleton } from '@/components/ui/skeleton';

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
import Dashboard from '@/pages/Dashboard';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancelled from '@/pages/PaymentCancelled';
import SubscriptionSuccess from '@/pages/SubscriptionSuccess';
import SubscriptionCancelled from '@/pages/SubscriptionCancelled';
import BlogSystemDiagnostic from '@/pages/BlogSystemDiagnostic';
import { BlogPostDiagnostic } from '@/components/BlogPostDiagnostic';

// Import lightweight components
import AdminAuthGuard from '@/components/AdminAuthGuard';
import { EmailVerificationGuard } from '@/components/EmailVerificationGuard';
import { TrialNotificationBanner } from '@/components/TrialNotificationBanner';
import { AdminSetup } from '@/components/AdminSetup';
import { AdminDiagnostic } from '@/components/AdminDiagnostic';

// Import lazy-loaded components
import {
  LazyAdminDashboard,
  LazyEmailMarketing,
  LazyBacklinkReport,
  LazyReportViewer,
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
  LazyEnhancedBlogPost,
  LazyTrialDashboard,
  LazyAIContentTest,
  LazyEnhancedDashboardRouter,
  LazyUserBlogManagement,
  LazyBlogEditPage,
  LazyEnhancedAILive,
  LazyGuestDashboard,
  LazyClaimSystemDebug
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

export const OptimizedAppWrapper = () => {
  useReferralTracking();

  return (
    <>
      <TrialNotificationBanner />
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
          <Route path="/blog" element={<LazyEnhancedBlogListing />} />
          <Route path="/blog/create" element={<LazyBlogCreation />} />
          <Route path="/blog/:slug" element={<LazyEnhancedBlogPost />} />

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
            <EmailVerificationGuard>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </EmailVerificationGuard>
          } />
          <Route path="/my-dashboard" element={
            <EmailVerificationGuard>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </EmailVerificationGuard>
          } />
          <Route path="/my-blog" element={
            <EmailVerificationGuard>
              <LazyUserBlogManagement />
            </EmailVerificationGuard>
          } />
          <Route path="/blog/:postId/edit" element={
            <EmailVerificationGuard>
              <LazyBlogEditPage />
            </EmailVerificationGuard>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminAuthGuard>
              <LazyAdminDashboard />
            </AdminAuthGuard>
          } />
          <Route path="/admin/setup" element={
            <Suspense fallback={<PageLoader />}>
              <AdminSetup />
            </Suspense>
          } />
          <Route path="/admin/diagnostic" element={
            <Suspense fallback={<PageLoader />}>
              <AdminDiagnostic />
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

          {/* Payment routes - lightweight, immediate load */}
          <Route path="/payment-success" element={
            <EmailVerificationGuard>
              <PaymentSuccess />
            </EmailVerificationGuard>
          } />
          <Route path="/payment-cancelled" element={
            <EmailVerificationGuard>
              <PaymentCancelled />
            </EmailVerificationGuard>
          } />
          <Route path="/subscription-success" element={
            <EmailVerificationGuard>
              <SubscriptionSuccess />
            </EmailVerificationGuard>
          } />
          <Route path="/subscription-cancelled" element={
            <EmailVerificationGuard>
              <SubscriptionCancelled />
            </EmailVerificationGuard>
          } />

          {/* Feature routes - lazy loaded */}
          <Route path="/campaign/:campaignId" element={
            <EmailVerificationGuard>
              <LazyCampaignDeliverables />
            </EmailVerificationGuard>
          } />
          <Route path="/email" element={
            <EmailVerificationGuard>
              <LazyEmailMarketing />
            </EmailVerificationGuard>
          } />
          <Route path="/backlink-report" element={
            <EmailVerificationGuard>
              <LazyBacklinkReport />
            </EmailVerificationGuard>
          } />
          <Route path="/report/:reportId" element={
            <EmailVerificationGuard>
              <LazyReportViewer />
            </EmailVerificationGuard>
          } />
          <Route path="/no-hands-seo" element={
            <EmailVerificationGuard>
              <LazyNoHandsSEO />
            </EmailVerificationGuard>
          } />
          <Route path="/affiliate" element={
            <EmailVerificationGuard>
              <LazyAffiliateProgram />
            </EmailVerificationGuard>
          } />
          <Route path="/affiliate/promotion-materials" element={
            <EmailVerificationGuard>
              <LazyPromotionMaterials />
            </EmailVerificationGuard>
          } />

          {/* 404 routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};
