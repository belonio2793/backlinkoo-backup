import { useReferralTracking } from '@/hooks/useReferralTracking';

export const AppWrapper = () => {
  useReferralTracking();

  return (
    <>
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
        <Route path="/blog" element={<StreamlinedBlog />} />
        <Route path="/blog/create" element={<BlogCreator />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/trial-dashboard" element={<GuestDashboard />} />
        <Route path="/ai-test" element={<AIContentTest />} />
        <Route path="/ai-live" element={<AILive />} />
        <Route path="/free-backlink" element={<FreeBacklink />} />
        <Route path="/free-backlink/:id" element={<FreeBacklink />} />
        <Route path="/test-free-backlink" element={<TestFreeBacklink />} />
        <Route path="*" element={<NotFound />} />

        {/* Protected routes - require authentication and email verification */}
        <Route path="/dashboard" element={<EnhancedDashboardRouter />} />
        <Route path="/my-dashboard" element={<EnhancedDashboardRouter />} />

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
        <Route path="/backlink-report" element={
          <EmailVerificationGuard>
            <BacklinkReport />
          </EmailVerificationGuard>
        } />
        <Route path="/report/:reportId" element={
          <EmailVerificationGuard>
            <ReportViewer />
          </EmailVerificationGuard>
        } />
        <Route path="/no-hands-seo" element={
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
    </>
  );
};
