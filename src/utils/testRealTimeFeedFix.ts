/**
 * Test utility to verify real-time feed subscription fix
 */

import { realTimeFeedService } from '@/services/realTimeFeedService';

export function testRealTimeFeedSubscription() {
  console.log('🧪 Testing real-time feed subscription/unsubscription...');

  let eventCount = 0;
  
  // Test subscription
  const handleEvent = (event: any) => {
    eventCount++;
    console.log(`📡 Received event ${eventCount}:`, event.type, event.message);
  };

  console.log('1. Testing subscription...');
  const unsubscribe = realTimeFeedService.subscribe(handleEvent);
  
  if (typeof unsubscribe !== 'function') {
    console.error('❌ Subscribe should return unsubscribe function');
    return false;
  }

  console.log('✅ Subscription successful, unsubscribe function returned');

  // Emit a test event
  console.log('2. Testing event emission...');
  realTimeFeedService.emitSystemEvent('Test event for subscription verification', 'info');

  // Test unsubscription
  console.log('3. Testing unsubscription...');
  try {
    unsubscribe();
    console.log('✅ Unsubscription successful');
  } catch (error) {
    console.error('❌ Unsubscription failed:', error);
    return false;
  }

  // Emit another event to verify no longer receiving
  console.log('4. Verifying no more events received after unsubscription...');
  const initialCount = eventCount;
  realTimeFeedService.emitSystemEvent('Test event after unsubscription', 'info');
  
  setTimeout(() => {
    if (eventCount === initialCount) {
      console.log('✅ No events received after unsubscription - fix verified!');
    } else {
      console.error('❌ Still receiving events after unsubscription');
    }
  }, 100);

  return true;
}

// Test the fix for the specific error
export function testComponentUnsubscription() {
  console.log('🧪 Testing component-style subscription pattern...');

  const testComponent = () => {
    const handleEvent = (event: any) => {
      console.log('Component received event:', event.type);
    };

    // This is the pattern used in components
    const unsubscribe = realTimeFeedService.subscribe(handleEvent);

    // Simulate component unmounting
    return () => {
      try {
        unsubscribe(); // This should work without error
        console.log('✅ Component unsubscription successful');
        return true;
      } catch (error) {
        console.error('❌ Component unsubscription failed:', error);
        return false;
      }
    };
  };

  const cleanup = testComponent();
  return cleanup();
}

// Add test functions to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testRealTimeFeedSubscription = testRealTimeFeedSubscription;
  (window as any).testComponentUnsubscription = testComponentUnsubscription;
}
