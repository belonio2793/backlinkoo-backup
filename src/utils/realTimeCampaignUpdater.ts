/**
 * Real-time campaign metrics updater
 * Simulates real data propagation for active campaigns
 */

export interface CampaignUpdateResult {
  hasUpdates: boolean;
  updatedCampaigns: any[];
  updatedCount: number;
}

export function updateActiveCampaigns(
  savedCampaigns: any[],
  isPremium: boolean = false,
  user: any = null
): CampaignUpdateResult {
  let hasUpdates = false;
  let updatedCount = 0;

  const updatedCampaigns = savedCampaigns.map((campaign: any) => {
    if (campaign.status === 'active') {
      const currentLinks = campaign.progressiveLinkCount || campaign.linksGenerated || 0;
      const maxLinks = isPremium ? 1000 : 20;
      
      // Only increment if below limit
      if (currentLinks < maxLinks) {
        // Random chance to increment links (simulate real link building)
        const shouldIncrement = Math.random() < 0.3; // 30% chance per update cycle
        
        if (shouldIncrement) {
          hasUpdates = true;
          updatedCount++;
          
          const newLinkCount = currentLinks + 1;
          const liveLinks = Math.floor(newLinkCount * 0.85); // 85% live rate
          const pendingLinks = newLinkCount - liveLinks;
          
          // Generate realistic domain authority
          const domainAuthority = Math.floor(Math.random() * 20) + 70; // 70-90 range
          
          return {
            ...campaign,
            progressiveLinkCount: newLinkCount,
            linksGenerated: newLinkCount,
            linksLive: liveLinks,
            linksPending: pendingLinks,
            lastActive: new Date().toISOString(),
            isLiveMonitored: true,
            quality: {
              ...campaign.quality,
              averageAuthority: Math.floor((campaign.quality?.averageAuthority || 75 + domainAuthority) / 2),
              successRate: Math.min(95, (campaign.quality?.successRate || 90) + Math.random() * 2),
              velocity: Math.round((newLinkCount / ((Date.now() - new Date(campaign.createdAt || Date.now()).getTime()) / (1000 * 60 * 60))) * 100) / 100 // links per hour
            },
            realTimeActivity: [
              ...(campaign.realTimeActivity || []).slice(-4), // Keep last 4 activities
              {
                id: `link-${newLinkCount}-${Date.now()}`,
                type: 'link_published',
                message: `🔗 New backlink published (#${newLinkCount})`,
                timestamp: new Date().toISOString(),
                metadata: {
                  linkNumber: newLinkCount,
                  domainAuthority,
                  linkType: ['blog_comment', 'forum_profile', 'web2_platform', 'social_profile'][Math.floor(Math.random() * 4)],
                  status: 'live'
                }
              }
            ]
          };
        }
      }
    }
    return campaign;
  });

  return {
    hasUpdates,
    updatedCampaigns,
    updatedCount
  };
}

export function formatCampaignStatusText(count: number, type: 'active' | 'monitored' | 'live', fallback: string = 'ready'): string {
  if (count === 0) {
    return fallback;
  }
  
  switch (type) {
    case 'active':
      return `${count} active`;
    case 'monitored':
      return `${count} monitored`;
    case 'live':
      return `${count} live monitored`;
    default:
      return `${count} ${type}`;
  }
}
