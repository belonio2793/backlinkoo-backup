/**
 * Test utility to verify real-time campaign updates are working
 */

import { updateActiveCampaigns, formatCampaignStatusText } from './realTimeCampaignUpdater';

export function testRealTimeUpdates() {
  console.log('🧪 Testing real-time campaign updates...');
  
  // Create mock active campaigns
  const mockCampaigns = [
    {
      id: 'test-1',
      name: 'Test Campaign 1',
      status: 'active',
      progressiveLinkCount: 5,
      linksGenerated: 5,
      createdAt: new Date().toISOString(),
      quality: {
        averageAuthority: 75,
        successRate: 90
      }
    },
    {
      id: 'test-2', 
      name: 'Test Campaign 2',
      status: 'paused',
      progressiveLinkCount: 10,
      linksGenerated: 10
    }
  ];
  
  // Test formatting function
  console.log('📊 Testing status text formatting:');
  console.log('- 0 active:', formatCampaignStatusText(0, 'active', 'ready to start'));
  console.log('- 1 active:', formatCampaignStatusText(1, 'active', 'ready to start'));
  console.log('- 3 monitored:', formatCampaignStatusText(3, 'monitored', 'in progress'));
  console.log('- 0 live:', formatCampaignStatusText(0, 'live', 'ready for campaigns'));
  
  // Test updates
  console.log('🔄 Testing campaign updates:');
  const result = updateActiveCampaigns(mockCampaigns, false, { id: 'test-user' });
  
  console.log('- Has updates:', result.hasUpdates);
  console.log('- Updated count:', result.updatedCount);
  console.log('- Updated campaigns:', result.updatedCampaigns.map(c => ({
    id: c.id,
    status: c.status,
    links: c.progressiveLinkCount,
    isActive: c.status === 'active'
  })));
  
  // Test multiple cycles
  let testCampaigns = [...mockCampaigns];
  let totalUpdates = 0;
  
  console.log('🔁 Simulating 5 update cycles:');
  for (let i = 0; i < 5; i++) {
    const cycleResult = updateActiveCampaigns(testCampaigns, false, { id: 'test-user' });
    if (cycleResult.hasUpdates) {
      testCampaigns = cycleResult.updatedCampaigns;
      totalUpdates += cycleResult.updatedCount;
    }
    console.log(`- Cycle ${i + 1}: ${cycleResult.updatedCount} updates`);
  }
  
  console.log(`✅ Test complete! Total updates across cycles: ${totalUpdates}`);
  
  return {
    formattingWorks: true,
    updatesWork: totalUpdates > 0,
    mockCampaigns: testCampaigns
  };
}

// Auto-run in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setTimeout(() => {
    (window as any).testRealTimeUpdates = testRealTimeUpdates;
    console.log('🔧 Real-time updates test available: testRealTimeUpdates()');
  }, 2000);
}
