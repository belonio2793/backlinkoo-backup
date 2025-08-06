import { Routes, Route } from 'react-router-dom';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { ReportSyncProvider } from '@/contexts/ReportSyncContext';
import { RouteSync } from '@/components/RouteSync';

// Import all page components
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import EmailConfirmation from '@/pages/EmailConfirmation';
import AuthCallback from '@/pages/AuthCallback';
import PasswordReset from '@/pages/PasswordReset';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import BlogPreview from '@/pages/BlogPreview';
import { Blog } from '@/pages/Blog';
import { BlogCreator } from '@/pages/BlogCreator';
import { BlogPost } from '@/pages/BlogPost';
import AIContentTest from '@/pages/AIContentTest';
import TestBlogClaim from '@/pages/TestBlogClaim';

import NotFound from '@/pages/NotFound';
import AdminDashboard from '@/pages/AdminDashboard';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancelled from '@/pages/PaymentCancelled';
import SubscriptionSuccess from '@/pages/SubscriptionSuccess';
import SubscriptionCancelled from '@/pages/SubscriptionCancelled';
import { CampaignDeliverables } from '@/pages/CampaignDeliverables';
import EmailMarketing from '@/pages/EmailMarketing';
import BacklinkReport from '@/pages/BacklinkReport';
import ReportViewer from '@/pages/ReportViewer';
import NoHandsSEO from '@/pages/NoHandsSEO';
import AffiliateProgram from '@/pages/AffiliateProgram';
import PromotionMaterials from '@/pages/PromotionMaterials';

// Import components (not pages)
import AdminAuthGuard from '@/components/AdminAuthGuard';
import { EmailVerificationGuard } from '@/components/EmailVerificationGuard';
import { TrialNotificationBanner } from '@/components/TrialNotificationBanner';
import { GuestDashboard } from '@/components/GuestDashboard';
import { EnhancedAILive } from '@/components/EnhancedAILive';

import { EnhancedDashboardRouter } from '@/components/EnhancedDashboardRouter';
import { UserBlogManagement } from '@/components/UserBlogManagement';
import { BlogEditPage } from '@/pages/BlogEditPage';


export const AppWrapper = () => {
  useReferralTracking();

  return (
    <ReportSyncProvider>
      <RouteSync />
      <TrialNotificationBanner />
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/confirm" element={<EmailConfirmation />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<PasswordReset />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/preview/:slug" element={<BlogPreview />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/create" element={<BlogCreator />} />

        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/trial-dashboard" element={<GuestDashboard />} />
        <Route path="/ai-test" element={<AIContentTest />} />
        <Route path="/test-blog-claim" element={<TestBlogClaim />} />
        <Route path="/ai-live" element={<EnhancedAILive />} />

        <Route path="*" element={<NotFound />} />

        {/* Protected routes - require authentication and email verification */}
        <Route path="/dashboard" element={<EnhancedDashboardRouter />} />
        <Route path="/my-dashboard" element={<EnhancedDashboardRouter />} />
        <Route path="/my-blog" element={
          <EmailVerificationGuard>
            <UserBlogManagement />
          </EmailVerificationGuard>
        } />
        <Route path="/blog/:postId/edit" element={
          <EmailVerificationGuard>
            <BlogEditPage />
          </EmailVerificationGuard>
        } />

        <Route path="/admin" element={
          <AdminAuthGuard>
            <AdminDashboard />
          </AdminAuthGuard>
        } />
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
        <Route path="/campaign/:campaignId" element={
          <EmailVerificationGuard>
            <CampaignDeliverables />
          </EmailVerificationGuard>
        } />
        <Route path="/email" element={
          <EmailVerificationGuard>
            <EmailMarketing />
          </EmailVerificationGuard>
        } />
        <Route path="/backlink-report" element={<BacklinkReport />} />
        <Route path="/report" element={<BacklinkReport />} />
        <Route path="/report/:reportId" element={<ReportViewer />} />
        <Route path="/automation-link-building" element={
          <EmailVerificationGuard>
            <NoHandsSEO />
          </EmailVerificationGuard>
        } />
        <Route path="/affiliate" element={
          <EmailVerificationGuard>
            <AffiliateProgram />
          </EmailVerificationGuard>
        } />
        <Route path="/affiliate/promotion-materials" element={
          <EmailVerificationGuard>
            <PromotionMaterials />
          </EmailVerificationGuard>
        } />
      </Routes>
    </ReportSyncProvider>
  );
};
