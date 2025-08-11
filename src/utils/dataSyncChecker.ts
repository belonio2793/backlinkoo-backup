/**
 * Data Synchronization Checker
 * 
 * Detects and reports inconsistencies between different data sources
 */

export interface SyncIssue {
  type: 'status_mismatch' | 'links_mismatch' | 'metrics_mismatch';
  campaignId: string;
  campaignName: string;
  source1: any;
  source2: any;
  description: string;
}

export class DataSyncChecker {
  static checkCampaignSync(campaigns1: any[], campaigns2: any[], source1Name: string, source2Name: string): SyncIssue[] {
    const issues: SyncIssue[] = [];
    
    campaigns1.forEach(c1 => {
      const c2 = campaigns2.find(c => c.id === c1.campaign_id || c.campaign_id === c1.id);
      
      if (!c2) {
        issues.push({
          type: 'status_mismatch',
          campaignId: c1.campaign_id || c1.id,
          campaignName: c1.name,
          source1: c1,
          source2: null,
          description: `Campaign exists in ${source1Name} but not in ${source2Name}`
        });
        return;
      }
      
      // Check status sync
      if (c1.status !== c2.status) {
        issues.push({
          type: 'status_mismatch',
          campaignId: c1.campaign_id || c1.id,
          campaignName: c1.name,
          source1: { status: c1.status, source: source1Name },
          source2: { status: c2.status, source: source2Name },
          description: `Status mismatch: ${source1Name} shows ${c1.status}, ${source2Name} shows ${c2.status}`
        });
      }
      
      // Check links built sync
      const links1 = c1.links_built || 0;
      const links2 = c2.links_built || 0;
      if (Math.abs(links1 - links2) > 0) {
        issues.push({
          type: 'links_mismatch',
          campaignId: c1.campaign_id || c1.id,
          campaignName: c1.name,
          source1: { links_built: links1, source: source1Name },
          source2: { links_built: links2, source: source2Name },
          description: `Links built mismatch: ${source1Name} shows ${links1}, ${source2Name} shows ${links2}`
        });
      }
      
      // Check success rate sync
      const rate1 = c1.success_rate || 0;
      const rate2 = c2.success_rate || 0;
      if (Math.abs(rate1 - rate2) > 5) { // Allow 5% tolerance
        issues.push({
          type: 'metrics_mismatch',
          campaignId: c1.campaign_id || c1.id,
          campaignName: c1.name,
          source1: { success_rate: rate1, source: source1Name },
          source2: { success_rate: rate2, source: source2Name },
          description: `Success rate mismatch: ${source1Name} shows ${rate1}%, ${source2Name} shows ${rate2}%`
        });
      }
    });
    
    return issues;
  }
  
  static logSyncIssues(issues: SyncIssue[]): void {
    if (issues.length === 0) {
      console.log('✅ Data synchronization check passed - no issues found');
      return;
    }
    
    console.group('🔄 Data Synchronization Issues Detected');
    issues.forEach(issue => {
      console.warn(`❌ ${issue.type.toUpperCase()}: ${issue.description}`, {
        campaign: issue.campaignName,
        source1: issue.source1,
        source2: issue.source2
      });
    });
    console.groupEnd();
  }
  
  static async forceSyncResolution(): Promise<void> {
    console.log('🔄 Forcing data synchronization...');
    
    try {
      // Clear all caches
      const { stableCampaignMetrics } = await import('@/services/stableCampaignMetrics');
      stableCampaignMetrics.clearCache();
      
      // Clear localStorage caches if any
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('campaign') || key.includes('metrics')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ Data synchronization forced - caches cleared');
      
    } catch (error) {
      console.error('❌ Failed to force sync resolution:', error);
    }
  }
}

// Export a global sync checker for debugging
(window as any).dataSyncChecker = DataSyncChecker;
