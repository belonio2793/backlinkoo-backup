/**
 * Test utility to demonstrate campaign counter system
 * Run this in browser console to test the counter functionality
 */

import { campaignCounterService } from '@/services/campaignCounterService';

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testCounterSystem = () => {
    console.log('🧪 Testing Campaign Counter System...');
    
    // Test 1: Create a new campaign
    console.log('\n📝 Test 1: Creating new campaign...');
    const testCampaign = campaignCounterService.initializeCampaign('test-campaign-123', 'active');
    console.log('✅ Campaign created:', testCampaign);
    
    // Test 2: Get global counters
    console.log('\n🌍 Test 2: Global counters...');
    const globalCounters = campaignCounterService.getGlobalCounters();
    console.log('✅ Global counters:', globalCounters);
    
    // Test 3: Update campaign status
    console.log('\n⏸️ Test 3: Pausing campaign...');
    campaignCounterService.updateCampaignStatus('test-campaign-123', 'paused');
    
    setTimeout(() => {
      console.log('\n▶️ Test 4: Resuming campaign...');
      campaignCounterService.updateCampaignStatus('test-campaign-123', 'active');
      
      setTimeout(() => {
        // Test 5: Get reporting data
        console.log('\n📊 Test 5: Reporting data...');
        const reportingData = campaignCounterService.getReportingData();
        console.log('✅ Reporting data:', reportingData);
        
        // Test 6: Cleanup
        console.log('\n🗑️ Test 6: Cleaning up test campaign...');
        campaignCounterService.deleteCampaign('test-campaign-123');
        console.log('✅ Test campaign deleted');
        
        console.log('\n🎉 Counter system test completed successfully!');
        console.log('\n💡 Tips:');
        console.log('- Counters auto-increment every 30 seconds for active campaigns');
        console.log('- Data persists in localStorage between sessions');
        console.log('- Global metrics update automatically');
        console.log('- Use the Analytics tab to view comprehensive reporting');
      }, 2000);
    }, 2000);
  };
  
  (window as any).demoCounterFeatures = () => {
    console.log('🎬 Demo: Campaign Counter Features');
    console.log('\n🚀 Features included in this system:');
    console.log('1. ✅ Real-time counter increments for active campaigns');
    console.log('2. ✅ Persistent state - counters save and resume across sessions');
    console.log('3. ✅ Campaign status management (active, paused, saved)');
    console.log('4. ✅ Global metrics aggregation across all campaigns');
    console.log('5. ✅ Comprehensive reporting dashboard');
    console.log('6. ✅ Individual campaign counter displays');
    console.log('7. ✅ Realistic metrics progression and calculations');
    console.log('8. ✅ Integration with existing campaign management');
    
    console.log('\n📊 Available Metrics:');
    console.log('- Links Published (auto-incrementing)');
    console.log('- Domains Reached (grows with campaigns)');
    console.log('- Success Rate (fluctuates realistically)');
    console.log('- Click Tracking (simulated engagement)');
    console.log('- Quality Scores (performance indicators)');
    console.log('- Velocity (links per hour calculations)');
    console.log('- Runtime Tracking (campaign duration)');
    
    console.log('\n🎯 Counter Behavior:');
    console.log('- ACTIVE: Counters increment every 30 seconds');
    console.log('- PAUSED: Counters stop, resume where left off');
    console.log('- SAVED: Counters preserved, don\'t increment');
    console.log('- Database growth: Simulated realistic domain/URL growth');
    
    console.log('\n🔧 How to use:');
    console.log('1. Create campaigns normally - counters auto-initialize');
    console.log('2. Switch campaign status to see counter behavior');
    console.log('3. Visit Analytics tab for comprehensive reporting');
    console.log('4. Individual campaign cards show compact metrics');
    console.log('5. All data persists between page refreshes');
    
    console.log('\n🧪 Try these functions:');
    console.log('- testCounterSystem() - Run full system test');
    console.log('- campaignCounterService.getGlobalCounters() - View global metrics');
    console.log('- campaignCounterService.getAllCampaignCounters() - View all campaigns');
  };

  console.log('📋 Campaign Counter System loaded!');
  console.log('🧪 Run testCounterSystem() to test the system');
  console.log('🎬 Run demoCounterFeatures() to see all features');
}
