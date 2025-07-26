import { Routes, Route } from "react-router-dom";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import Index from "../pages/Index";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import PaymentSuccess from "../pages/PaymentSuccess";
import PaymentCancelled from "../pages/PaymentCancelled";
import EmailConfirmation from "../pages/EmailConfirmation";
import PasswordReset from "../pages/PasswordReset";
import NotFound from "../pages/NotFound";
import TermsOfService from "../pages/TermsOfService";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import { CampaignDeliverables } from "../pages/CampaignDeliverables";
import BlogPreview from "../pages/BlogPreview";
import EmailMarketing from "../pages/EmailMarketing";
import BacklinkReport from "../pages/BacklinkReport";
import ReportViewer from "../pages/ReportViewer";
import NoHandsSEO from "../pages/NoHandsSEO";
import AffiliateProgram from "../pages/AffiliateProgram";
import PromotionMaterials from "../pages/PromotionMaterials";

export const AppWrapper = () => {
  // Initialize referral tracking
  useReferralTracking();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/auth/confirm" element={<EmailConfirmation />} />
      <Route path="/auth/callback" element={<EmailConfirmation />} />
      <Route path="/auth/reset-password" element={<PasswordReset />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/campaign/:campaignId" element={<CampaignDeliverables />} />
      <Route path="/preview/:slug" element={<BlogPreview />} />
      <Route path="/email" element={<EmailMarketing />} />
      <Route path="/backlink-report" element={<BacklinkReport />} />
      <Route path="/report/:reportId" element={<ReportViewer />} />
      <Route path="/no-hands-seo" element={<NoHandsSEO />} />
      <Route path="/affiliate" element={<AffiliateProgram />} />
      <Route path="/affiliate/promotion-materials" element={<PromotionMaterials />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
