/**
 * Real-Time Feed Test Helper
 * 
 * Test functions to verify real-time feed integration and events
 */

import { realTimeFeedService } from '@/services/realTimeFeedService';

export async function testRealTimeFeedIntegration() {
  console.log('🧪 Testing real-time feed integration...');
  
  // Test service availability
  if (!realTimeFeedService) {
    console.error('❌ Real-time feed service not available');
    return false;
  }
  
  console.log('✅ Real-time feed service available');
  console.log('📊 Service stats:', realTimeFeedService.getStats());
  
  // Test event emission
  console.log('🧪 Testing event emission...');
  
  // Test campaign events
  realTimeFeedService.emitCampaignCreated(
    'test-campaign-id',
    'Test Campaign',
    'test keyword',
    'https://example.com',
    'test-user-id'
  );
  
  realTimeFeedService.emitCampaignPaused(
    'test-campaign-id',
    'Test Campaign',
    'test keyword',
    'Test pause',
    'test-user-id'
  );
  
  realTimeFeedService.emitCampaignResumed(
    'test-campaign-id',
    'Test Campaign',
    'test keyword',
    'Test resume',
    'test-user-id'
  );
  
  realTimeFeedService.emitUrlPublished(
    'test-campaign-id',
    'Test Campaign',
    'test keyword',
    'https://telegra.ph/test-url',
    'Telegraph',
    'test-user-id'
  );
  
  realTimeFeedService.emitCampaignCompleted(
    'test-campaign-id',
    'Test Campaign',
    'test keyword',
    ['https://telegra.ph/test-url'],
    'test-user-id'
  );
  
  console.log('✅ All test events emitted');
  console.log('📊 Updated service stats:', realTimeFeedService.getStats());
  
  // Test subscription
  console.log('🧪 Testing subscription...');
  let receivedEvents = 0;
  
  const unsubscribe = realTimeFeedService.subscribe((event) => {
    console.log('📡 Received event:', event.type, '-', event.message);
    receivedEvents++;
  });
  
  // Emit a test event
  realTimeFeedService.emitSystemEvent('Test subscription event', 'info');
  
  // Wait a bit and check
  setTimeout(() => {
    console.log(`✅ Subscription test complete. Received ${receivedEvents} events`);
    unsubscribe();
  }, 100);
  
  return true;
}

export async function testCampaignActionEvents() {
  console.log('🧪 Testing campaign action events...');
  
  // Simulate user pausing a campaign
  realTimeFeedService.emitUserAction(
    'pause_campaign',
    'User paused campaign "test keyword"',
    'test-user-id',
    'test-campaign-id'
  );
  
  // Simulate user resuming a campaign
  realTimeFeedService.emitUserAction(
    'resume_campaign',
    'User resumed campaign "test keyword"',
    'test-user-id',
    'test-campaign-id'
  );
  
  // Simulate user deleting a campaign
  realTimeFeedService.emitUserAction(
    'delete_campaign',
    'User deleted campaign "test keyword"',
    'test-user-id',
    'test-campaign-id'
  );
  
  console.log('✅ Campaign action events emitted');
  return true;
}

export function clearRealTimeFeedHistory() {
  console.log('🧹 Clearing real-time feed history...');
  realTimeFeedService.clearHistory();
  console.log('✅ Real-time feed history cleared');
}

export function getRealTimeFeedStats() {
  return realTimeFeedService.getStats();
}

export function getRealTimeFeedHistory() {
  return realTimeFeedService.getHistory();
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testRealTimeFeed = testRealTimeFeedIntegration;
  (window as any).testCampaignActions = testCampaignActionEvents;
  (window as any).clearFeedHistory = clearRealTimeFeedHistory;
  (window as any).getFeedStats = getRealTimeFeedStats;
  (window as any).getFeedHistory = getRealTimeFeedHistory;
  
  console.log('🧪 Real-time feed test helpers available:');
  console.log('  - testRealTimeFeed() - Test basic integration');
  console.log('  - testCampaignActions() - Test campaign action events');
  console.log('  - clearFeedHistory() - Clear event history');
  console.log('  - getFeedStats() - Get service statistics');
  console.log('  - getFeedHistory() - Get event history');
}
