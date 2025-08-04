import { supabase } from '@/integrations/supabase/client';

/**
 * Simple test function to debug subscription creation
 */
export async function testSubscriptionCreation() {
  console.log('🧪 Testing subscription creation...');
  
  const testData = {
    priceId: 'price_premium_monthly',
    tier: 'premium',
    isGuest: true,
    guestEmail: 'test@example.com'
  };
  
  console.log('📤 Sending request:', testData);
  
  try {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: testData
    });
    
    console.log('📥 Raw response data:', data);
    console.log('📥 Raw response error:', error);
    console.log('📥 Error type:', typeof error);
    console.log('📥 Error keys:', error ? Object.keys(error) : 'no error');
    
    if (error) {
      console.log('📥 Stringified error:', JSON.stringify(error, null, 2));
    }
    
    return { data, error };
  } catch (exception) {
    console.error('❌ Exception in test:', exception);
    return { exception };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).testSubscription = testSubscriptionCreation;
}
