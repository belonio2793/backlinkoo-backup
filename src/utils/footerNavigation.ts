import { NavigatorFunction } from 'react-router-dom';
import { navigateToSection, NavigationConfig } from './navigationUtils';

export interface SmartNavigationConfig {
  route: string;
  hash?: string;
  tab?: string;
  requiresAuth: boolean;
  allowGuestAccess?: boolean;
  guestRedirect?: string;
}

/**
 * Smart navigation handler that works for both authenticated and unauthenticated users
 */
export class FooterNavigationService {
  /**
   * Handle navigation with smart auth logic
   */
  static handleNavigation({
    config,
    user,
    navigate,
    onAuthRequired
  }: {
    config: SmartNavigationConfig;
    user: any;
    navigate: NavigatorFunction;
    onAuthRequired: (pendingNav: any) => void;
  }) {
    console.log('🧭 FooterNav: Handling navigation for:', config.route, 'User authenticated:', !!user, 'User email:', user?.email);

    // For public routes, always allow access
    if (!config.requiresAuth) {
      console.log('✅ FooterNav: Public route, navigating directly');
      this.executeNavigation({ config, navigate });
      return;
    }

    // For protected routes with guest access
    if (config.allowGuestAccess && !user) {
      if (config.guestRedirect) {
        console.log('👤 FooterNav: Guest access, redirecting to:', config.guestRedirect);
        navigate(config.guestRedirect);
        return;
      }
    }

    // User is authenticated - proceed with navigation
    if (user) {
      console.log('🔑 FooterNav: User authenticated, proceeding with navigation to:', config.route);
      this.executeNavigation({ config, navigate });
      return;
    }

    // User needs authentication
    console.log('🔐 FooterNav: Authentication required, showing login modal');
    onAuthRequired({
      route: config.route,
      hash: config.hash,
      tab: config.tab
    });
  }

  /**
   * Execute the actual navigation
   */
  private static executeNavigation({
    config,
    navigate
  }: {
    config: SmartNavigationConfig;
    navigate: NavigatorFunction;
  }) {
    if (config.hash) {
      // Section navigation with hash
      console.log('📍 FooterNav: Navigating to section with hash:', config.route + '#' + config.hash);
      const navConfig: NavigationConfig = {
        route: config.route,
        hash: config.hash,
        tab: config.tab
      };
      navigateToSection(navConfig);
    } else {
      // Simple route navigation
      console.log('🔗 FooterNav: Navigating to route:', config.route);
      navigate(config.route);
    }
  }
}

/**
 * Footer navigation configurations
 */
export const FOOTER_NAV_CONFIGS = {
  // Features - Protected routes
  CAMPAIGNS: {
    route: '/dashboard',
    hash: 'campaigns',
    tab: 'campaigns',
    requiresAuth: true
  } as SmartNavigationConfig,

  BACKLINK_AUTOMATION: {
    route: '/dashboard',
    hash: 'seo-tools-automation',
    tab: 'automation-link-building',
    requiresAuth: true
  } as SmartNavigationConfig,

  KEYWORD_RESEARCH: {
    route: '/dashboard',
    hash: 'keyword-research',
    tab: 'keyword-research',
    requiresAuth: true
  } as SmartNavigationConfig,

  RANK_TRACKER: {
    route: '/dashboard',
    hash: 'rank-tracker',
    tab: 'rank-tracker',
    requiresAuth: true
  } as SmartNavigationConfig,

  // Blog - Public route
  BLOG: {
    route: '/blog',
    requiresAuth: false
  } as SmartNavigationConfig,

  // Merchant Tools - Protected routes with guest options
  BACKLINK_REPORTS: {
    route: '/backlink-report',
    requiresAuth: true,
    allowGuestAccess: true,
    guestRedirect: '/blog' // Could redirect to demo or info page
  } as SmartNavigationConfig,

  // Legal - Public routes
  TERMS: {
    route: '/terms-of-service',
    requiresAuth: false
  } as SmartNavigationConfig,

  PRIVACY: {
    route: '/privacy-policy',
    requiresAuth: false
  } as SmartNavigationConfig,

  // Company - Mixed access
  AFFILIATE: {
    route: '/affiliate',
    requiresAuth: false
  } as SmartNavigationConfig,

  ADMIN: {
    route: '/admin',
    requiresAuth: true
  } as SmartNavigationConfig,

  // Contact - Public
  CONTACT: {
    route: 'mailto:support@backlinkoo.com',
    requiresAuth: false
  } as SmartNavigationConfig
} as const;
