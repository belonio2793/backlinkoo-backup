/**
 * Test utility for backlink notifications
 * Allows testing the notification system manually
 */

import { realTimeFeedService } from '@/services/realTimeFeedService';

export function testBacklinkNotification() {
  console.log('🧪 Testing backlink notification system...');

  // Simulate a URL published event
  realTimeFeedService.emitUrlPublished(
    'test-campaign-123',
    'Test Campaign for Notifications',
    'go high level implementation',
    'https://telegra.ph/go-high-level-implementation-a-stepbystep-approach-1755288747550',
    'Telegraph.ph',
    'test-user-123'
  );

  console.log('✅ Test notification sent! Check bottom-right corner.');
}

export function testMultipleNotifications() {
  console.log('🧪 Testing multiple backlink notifications...');

  const testLinks = [
    {
      keyword: 'go high level implementation',
      url: 'https://telegra.ph/go-high-level-implementation-a-stepbystep-approach-1755288747550',
      campaignName: 'GoHighLevel Implementation Guide'
    },
    {
      keyword: 'automation tools',
      url: 'https://telegra.ph/automation-tools-guide-123456789',
      campaignName: 'Automation Tools Campaign'
    },
    {
      keyword: 'digital marketing',
      url: 'https://telegra.ph/digital-marketing-strategies-987654321',
      campaignName: 'Digital Marketing Strategies'
    }
  ];

  testLinks.forEach((link, index) => {
    setTimeout(() => {
      realTimeFeedService.emitUrlPublished(
        `test-campaign-${index + 1}`,
        link.campaignName,
        link.keyword,
        link.url,
        'Telegraph.ph',
        'test-user-123'
      );
    }, index * 2000); // Stagger notifications 2 seconds apart
  });

  console.log('✅ Multiple test notifications scheduled! Watch the bottom-right corner.');
}

// Add test functions to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testBacklinkNotification = testBacklinkNotification;
  (window as any).testMultipleNotifications = testMultipleNotifications;
}
