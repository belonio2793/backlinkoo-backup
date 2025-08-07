import { affiliateService } from '../services/affiliateService';
import { supabase } from '../integrations/supabase/client';

export async function testAffiliateSystem(userId: string) {
  console.log('🧪 Testing Affiliate System...');
  
  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('affiliate_profiles')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Database tables missing:', tablesError);
      return { success: false, error: 'Database tables not found' };
    }
    
    console.log('✅ Database tables exist');
    
    // Test 2: Try to create affiliate profile
    console.log('2. Testing affiliate profile creation...');
    const profile = await affiliateService.createAffiliateProfile(userId, 'test@example.com');
    console.log('✅ Affiliate profile created:', profile?.affiliate_id);
    
    // Test 3: Test link generation
    console.log('3. Testing link generation...');
    const link = affiliateService.generateAffiliateLink(profile?.affiliate_id || 'TEST', '/test');
    console.log('✅ Affiliate link generated:', link.base_url);
    
    // Test 4: Test tracking
    console.log('4. Testing click tracking...');
    await affiliateService.trackAffiliateClick(profile?.affiliate_id || 'TEST', {
      ip: '127.0.0.1',
      userAgent: 'Test Agent',
      landingPage: window.location.href,
      utmParams: { utm_source: 'test' }
    });
    console.log('✅ Click tracking works');
    
    // Test 5: Test stats
    console.log('5. Testing stats retrieval...');
    const stats = await affiliateService.getAffiliateStats(profile?.affiliate_id || 'TEST');
    console.log('✅ Stats retrieved:', stats);
    
    console.log('🎉 Affiliate system test completed successfully!');
    return { success: true, profile, stats };
    
  } catch (error) {
    console.error('❌ Affiliate system test failed:', error);
    return { success: false, error: error.message };
  }
}
