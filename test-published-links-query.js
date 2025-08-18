// Test to check published links query
import { supabase } from './src/integrations/supabase/client.js';

async function testPublishedLinksQuery() {
  console.log('🔍 Testing published links query...');

  try {
    // Test the exact query used by getCampaignWithLinks
    const { data: campaigns, error } = await supabase
      .from('automation_campaigns')
      .select(`
        *,
        automation_published_links(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log(`📊 Found ${campaigns.length} campaigns`);

    campaigns.forEach((campaign, index) => {
      console.log(`\n${index + 1}. Campaign: ${campaign.keyword} (${campaign.id.substring(0, 8)}...)`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Published links: ${campaign.automation_published_links?.length || 0}`);
      
      if (campaign.automation_published_links?.length > 0) {
        campaign.automation_published_links.forEach((link, linkIndex) => {
          console.log(`   ${linkIndex + 1}. Platform: "${link.platform}" | URL: ${link.published_url.substring(0, 50)}...`);
        });
      }
    });

    // Test direct query on automation_published_links
    console.log('\n🔍 Direct query on automation_published_links table:');
    const { data: directLinks, error: directError } = await supabase
      .from('automation_published_links')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(10);

    if (directError) {
      console.error('❌ Direct query error:', directError);
      return;
    }

    console.log(`📊 Total published links: ${directLinks.length}`);
    
    // Group by platform
    const platformCounts = {};
    directLinks.forEach(link => {
      const platform = link.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    console.log('\n📈 Platform distribution:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} links`);
    });

    // Check for Write.as variations
    const writeAsLinks = directLinks.filter(link => {
      const platform = (link.platform || '').toLowerCase();
      return platform.includes('write') || platform === 'writeas';
    });

    console.log(`\n✅ Write.as related links found: ${writeAsLinks.length}`);
    writeAsLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. Platform: "${link.platform}" | Campaign: ${link.campaign_id.substring(0, 8)}... | URL: ${link.published_url}`);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run if called directly
if (typeof window === 'undefined') {
  testPublishedLinksQuery();
}

export { testPublishedLinksQuery };
