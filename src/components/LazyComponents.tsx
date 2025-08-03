import { lazy } from 'react';

// Lazy load heavy page components for better code splitting
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const LazyEmailMarketing = lazy(() => import('@/pages/EmailMarketing'));
export const LazyBacklinkReport = lazy(() => import('@/pages/BacklinkReport'));
export const LazyReportViewer = lazy(() => import('@/pages/ReportViewer'));
export const LazyNoHandsSEO = lazy(() => import('@/pages/NoHandsSEO'));
export const LazyAffiliateProgram = lazy(() => import('@/pages/AffiliateProgram'));
export const LazyPromotionMaterials = lazy(() => import('@/pages/PromotionMaterials'));
export const LazyCampaignDeliverables = lazy(() => import('@/pages/CampaignDeliverables').then(module => ({ default: module.CampaignDeliverables })));
export const LazyBlogCreator = lazy(() => import('@/pages/BlogCreator').then(module => ({ default: module.BlogCreator })));
export const LazyBlogPost = lazy(() => import('@/pages/BlogPost').then(module => ({ default: module.BlogPost })));
export const LazyBlog = lazy(() => import('@/pages/Blog').then(module => ({ default: module.Blog })));

// New blog system components
export const LazyBlogListing = lazy(() => import('@/pages/BlogListing').then(module => ({ default: module.BlogListing })));
export const LazyBlogCreation = lazy(() => import('@/pages/BlogCreation').then(module => ({ default: module.BlogCreation })));
export const LazyBlogPostView = lazy(() => import('@/pages/BlogPost').then(module => ({ default: module.BlogPost })));

// Enhanced blog system components
export const LazyEnhancedBlogListing = lazy(() => import('@/components/EnhancedBlogListing').then(module => ({ default: module.EnhancedBlogListing })));
export const LazySuperEnhancedBlogListing = lazy(() => import('@/components/SuperEnhancedBlogListing').then(module => ({ default: module.SuperEnhancedBlogListing })));
export const LazyEnhancedBlogPost = lazy(() => import('@/components/EnhancedBlogPost').then(module => ({ default: module.EnhancedBlogPost })));
export const LazyTrialDashboard = lazy(() => import('@/pages/TrialDashboard').then(module => ({ default: module.TrialDashboard })));
export const LazyAIContentTest = lazy(() => import('@/pages/AIContentTest'));

// Debug components (only in development)
export const LazyClaimSystemDebug = lazy(() => import('@/components/ClaimSystemDebug').then(module => ({ default: module.ClaimSystemDebug })));

// Lazy load heavy components
export const LazyEnhancedDashboardRouter = lazy(() => import('@/components/EnhancedDashboardRouter').then(module => ({ default: module.EnhancedDashboardRouter })));
export const LazyUserBlogManagement = lazy(() => import('@/components/UserBlogManagement').then(module => ({ default: module.UserBlogManagement })));
export const LazyBlogEditPage = lazy(() => import('@/pages/BlogEditPage').then(module => ({ default: module.BlogEditPage })));
export const LazyEnhancedAILive = lazy(() => import('@/components/EnhancedAILive').then(module => ({ default: module.EnhancedAILive })));
export const LazyGuestDashboard = lazy(() => import('@/components/GuestDashboard').then(module => ({ default: module.GuestDashboard })));

// SEO-optimized blog components
export const LazySEOOptimizedBlogGenerator = lazy(() => import('@/components/SEOOptimizedBlogGenerator').then(module => ({ default: module.SEOOptimizedBlogGenerator })));
