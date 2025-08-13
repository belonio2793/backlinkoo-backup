import guestPostingSites from '@/data/guestPostingSites.json';

interface Site {
  url: string;
  name: string;
  htmlSupport: boolean;
  linksAllowed: boolean;
  accountRequired: boolean;
  signupMethod?: string;
  features: string[];
}

interface SiteCategory {
  description: string;
  sites: Site[];
}

interface AnalysisResult {
  bestForQuickPosting: Site[];
  bestForSEO: Site[];
  bestForTech: Site[];
  bestForMarketing: Site[];
  noAccountRequired: Site[];
  highAuthority: Site[];
  recommendations: {
    category: string;
    reason: string;
    sites: Site[];
  }[];
}

class GuestPostingAnalyzer {
  private sites: Site[];
  private categories: Record<string, SiteCategory>;

  constructor() {
    this.categories = guestPostingSites as Record<string, SiteCategory>;
    this.sites = Object.values(this.categories).flatMap(category => category.sites);
  }

  // Get sites that don't require account creation
  getNoAccountSites(): Site[] {
    return this.sites.filter(site => !site.accountRequired);
  }

  // Get sites that support HTML and links (best for SEO)
  getSEOFriendlySites(): Site[] {
    return this.sites.filter(site => site.htmlSupport && site.linksAllowed);
  }

  // Get instant publishing sites
  getInstantPublishSites(): Site[] {
    const instantCategories = ['instantPublishSites', 'anonymousPlatforms', 'pastebinWithFormatting'];
    return instantCategories.flatMap(categoryKey => 
      this.categories[categoryKey]?.sites || []
    );
  }

  // Get high authority sites (based on known platforms)
  getHighAuthoritySites(): Site[] {
    const highAuthorityDomains = [
      'medium.com', 'dev.to', 'hackernoon.com', 'freecodecamp.org',
      'hubspot.com', 'moz.com', 'sitepoint.com', 'css-tricks.com',
      'geeksforgeeks.org', 'searchenginejournal.com', 'dzone.com',
      'hubpages.com', 'linkedin.com', 'github.com', 'codepen.io'
    ];

    return this.sites.filter(site => 
      highAuthorityDomains.some(domain => site.url.includes(domain))
    );
  }

  // Get tech-focused sites
  getTechSites(): Site[] {
    const techCategories = ['devPlatforms', 'techBlogs', 'codeHosting'];
    return techCategories.flatMap(categoryKey => 
      this.categories[categoryKey]?.sites || []
    );
  }

  // Get marketing-focused sites
  getMarketingSites(): Site[] {
    const marketingCategories = ['marketingBlogs', 'contentPlatforms'];
    return marketingCategories.flatMap(categoryKey => 
      this.categories[categoryKey]?.sites || []
    );
  }

  // Generate recommendations based on user goals
  generateRecommendations(goals: {
    quickPosting?: boolean;
    seoFocus?: boolean;
    techContent?: boolean;
    marketingContent?: boolean;
    noAccount?: boolean;
    highAuthority?: boolean;
  }): AnalysisResult {
    const recommendations: AnalysisResult['recommendations'] = [];

    if (goals.quickPosting) {
      recommendations.push({
        category: 'Quick Posting',
        reason: 'Sites that allow immediate publishing without lengthy approval processes',
        sites: this.getInstantPublishSites().slice(0, 5)
      });
    }

    if (goals.seoFocus) {
      recommendations.push({
        category: 'SEO Optimized',
        reason: 'Sites that support HTML formatting and allow dofollow links',
        sites: this.getSEOFriendlySites().slice(0, 8)
      });
    }

    if (goals.techContent) {
      recommendations.push({
        category: 'Technology Focused',
        reason: 'Platforms with technical audiences and developer communities',
        sites: this.getTechSites().slice(0, 6)
      });
    }

    if (goals.marketingContent) {
      recommendations.push({
        category: 'Marketing Focused',
        reason: 'Platforms with business and marketing audiences',
        sites: this.getMarketingSites().slice(0, 6)
      });
    }

    if (goals.noAccount) {
      recommendations.push({
        category: 'No Registration Required',
        reason: 'Sites that allow posting without creating an account',
        sites: this.getNoAccountSites().slice(0, 10)
      });
    }

    if (goals.highAuthority) {
      recommendations.push({
        category: 'High Authority',
        reason: 'Well-established platforms with high domain authority',
        sites: this.getHighAuthoritySites().slice(0, 8)
      });
    }

    return {
      bestForQuickPosting: this.getInstantPublishSites().slice(0, 5),
      bestForSEO: this.getSEOFriendlySites().slice(0, 8),
      bestForTech: this.getTechSites().slice(0, 6),
      bestForMarketing: this.getMarketingSites().slice(0, 6),
      noAccountRequired: this.getNoAccountSites(),
      highAuthority: this.getHighAuthoritySites(),
      recommendations
    };
  }

  // Get sites by specific features
  getSitesByFeatures(requiredFeatures: string[]): Site[] {
    return this.sites.filter(site => 
      requiredFeatures.every(feature => 
        site.features.some(siteFeature => 
          siteFeature.toLowerCase().includes(feature.toLowerCase())
        )
      )
    );
  }

  // Search sites by keyword
  searchSites(keyword: string): Site[] {
    const searchTerm = keyword.toLowerCase();
    return this.sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm) ||
      site.url.toLowerCase().includes(searchTerm) ||
      site.features.some(feature => feature.toLowerCase().includes(searchTerm))
    );
  }

  // Get statistics about the sites
  getStatistics() {
    const totalSites = this.sites.length;
    const noAccountSites = this.getNoAccountSites().length;
    const htmlSupportSites = this.sites.filter(site => site.htmlSupport).length;
    const linksAllowedSites = this.sites.filter(site => site.linksAllowed).length;
    const instantPublishSites = this.getInstantPublishSites().length;
    
    // Count sites by category
    const categoryCounts = Object.entries(this.categories).map(([key, category]) => ({
      category: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      count: category.sites.length
    }));

    // Most common features
    const featureCount: Record<string, number> = {};
    this.sites.forEach(site => {
      site.features.forEach(feature => {
        featureCount[feature] = (featureCount[feature] || 0) + 1;
      });
    });

    const topFeatures = Object.entries(featureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    return {
      total: totalSites,
      noAccount: noAccountSites,
      htmlSupport: htmlSupportSites,
      linksAllowed: linksAllowedSites,
      instantPublish: instantPublishSites,
      categories: categoryCounts,
      topFeatures,
      percentages: {
        noAccount: Math.round((noAccountSites / totalSites) * 100),
        htmlSupport: Math.round((htmlSupportSites / totalSites) * 100),
        linksAllowed: Math.round((linksAllowedSites / totalSites) * 100),
        instantPublish: Math.round((instantPublishSites / totalSites) * 100)
      }
    };
  }

  // Generate URL list for automation tools
  generateUrlList(filters: {
    noAccount?: boolean;
    htmlSupport?: boolean;
    linksAllowed?: boolean;
    categories?: string[];
  } = {}): string[] {
    let filteredSites = this.sites;

    if (filters.noAccount) {
      filteredSites = filteredSites.filter(site => !site.accountRequired);
    }

    if (filters.htmlSupport) {
      filteredSites = filteredSites.filter(site => site.htmlSupport);
    }

    if (filters.linksAllowed) {
      filteredSites = filteredSites.filter(site => site.linksAllowed);
    }

    if (filters.categories && filters.categories.length > 0) {
      const categorySites = filters.categories.flatMap(categoryKey => 
        this.categories[categoryKey]?.sites || []
      );
      filteredSites = filteredSites.filter(site => 
        categorySites.some(catSite => catSite.url === site.url)
      );
    }

    return filteredSites.map(site => site.url);
  }

  // Export data in different formats
  exportData(format: 'json' | 'csv' | 'txt' = 'json', filters?: any) {
    const sites = filters ? this.sites.filter(/* apply filters */) : this.sites;

    switch (format) {
      case 'csv':
        const headers = ['Name', 'URL', 'HTML Support', 'Links Allowed', 'Account Required', 'Features'];
        const rows = sites.map(site => [
          site.name,
          site.url,
          site.htmlSupport ? 'Yes' : 'No',
          site.linksAllowed ? 'Yes' : 'No',
          site.accountRequired ? 'Yes' : 'No',
          site.features.join('; ')
        ]);
        return [headers, ...rows].map(row => 
          row.map(field => `"${field}"`).join(',')
        ).join('\n');

      case 'txt':
        return sites.map(site => site.url).join('\n');

      case 'json':
      default:
        return JSON.stringify(sites, null, 2);
    }
  }
}

// Export singleton instance
export const guestPostingAnalyzer = new GuestPostingAnalyzer();

// Export types for use in components
export type { Site, SiteCategory, AnalysisResult };
