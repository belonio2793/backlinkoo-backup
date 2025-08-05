/**
 * Navigation utility functions for handling hash-based section navigation
 */

export interface NavigationConfig {
  route: string;
  hash?: string;
  tab?: string;
}

/**
 * Navigate to a specific section with hash support
 */
export const navigateToSection = (config: NavigationConfig): void => {
  const { route, hash, tab } = config;
  
  if (hash) {
    // If we're already on the target route, just update the hash
    if (window.location.pathname === route) {
      window.location.hash = hash;
      
      // Trigger manual scroll after hash change
      setTimeout(() => {
        const element = document.querySelector(`[data-section="${tab || hash}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Navigate to route with hash
      window.location.href = `${route}#${hash}`;
    }
  } else {
    // Standard navigation without hash
    window.location.href = route;
  }
};

/**
 * Predefined navigation configurations for common sections
 */
export const NAVIGATION_CONFIGS = {
  KEYWORD_RESEARCH: {
    route: '/dashboard',
    hash: 'keyword-research',
    tab: 'keyword-research'
  },
  RANK_TRACKER: {
    route: '/dashboard',
    hash: 'rank-tracker', 
    tab: 'rank-tracker'
  },
  BACKLINK_AUTOMATION: {
    route: '/dashboard',
    hash: 'backlink-automation',
    tab: 'no-hands-seo'
  },
  CAMPAIGNS: {
    route: '/dashboard',
    hash: 'campaigns',
    tab: 'campaigns'
  },
  DASHBOARD_OVERVIEW: {
    route: '/dashboard',
    hash: 'overview',
    tab: 'overview'
  }
} as const;
