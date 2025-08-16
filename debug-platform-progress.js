/**
 * Debug Platform Progress Tracking
 * Diagnoses why platform progress isn't updating correctly
 */

import { getOrchestrator } from './src/services/automationOrchestrator.js';
import { supabase } from './src/integrations/supabase/client.js';

const orchestrator = getOrchestrator();

async function debugPlatformProgress() {
  try {
    console.log('🔍 Debugging Platform Progress...');
    
    // Get all campaigns
    const { data: campaigns, error } = await supabase
      .from('automation_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return;
    }

    for (const campaign of campaigns.slice(0, 3)) { // Check first 3 campaigns
      console.log(`\n📊 Campaign: ${campaign.keywords?.[0] || campaign.name} (${campaign.id})`);
      console.log(`   Status: ${campaign.status}`);
      
      // Get platform progress
      const platformProgress = orchestrator.getCampaignPlatformProgress(campaign.id);
      console.log(`   Platform Progress (in-memory):`, platformProgress);
      
      // Get status summary
      const summary = orchestrator.getCampaignStatusSummary(campaign.id);
      console.log(`   Status Summary:`, summary);
      
      // Get published links from database
      const { data: publishedLinks } = await supabase
        .from('automation_published_links')
        .select('*')
        .eq('campaign_id', campaign.id);
      
      console.log(`   Published Links (database): ${publishedLinks?.length || 0}`);
      publishedLinks?.forEach(link => {
        console.log(`     - ${link.platform}: ${link.published_url}`);
      });
      
      // Check active platforms
      const activePlatforms = orchestrator.getActivePlatforms();
      console.log(`   Active Platforms: ${activePlatforms.map(p => p.name).join(', ')}`);
      
      // If there's a mismatch, let's fix it
      if (campaign.status === 'completed' && summary.platformsCompleted === 0 && publishedLinks?.length > 0) {
        console.log(`   🔧 MISMATCH DETECTED! Campaign is completed but platform progress shows 0.`);
        console.log(`   🔧 Attempting to fix platform progress...`);
        
        // Find the platform for each published link and mark as completed
        for (const link of publishedLinks) {
          const platform = activePlatforms.find(p => 
            p.name.toLowerCase() === link.platform.toLowerCase() ||
            p.id.toLowerCase() === link.platform.toLowerCase()
          );
          
          if (platform) {
            console.log(`   🔧 Marking ${platform.name} (${platform.id}) as completed for URL: ${link.published_url}`);
            orchestrator.markPlatformCompleted(campaign.id, platform.id, link.published_url);
          } else {
            console.log(`   ⚠️ Could not find platform for: ${link.platform}`);
          }
        }
        
        // Check summary again
        const updatedSummary = orchestrator.getCampaignStatusSummary(campaign.id);
        console.log(`   ✅ Updated Summary:`, updatedSummary);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in platform progress debug:', error);
  }
}

// Run the debug
debugPlatformProgress().then(() => {
  console.log('\n✅ Platform progress debug complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
