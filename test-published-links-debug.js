// Test published links database query
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPublishedLinks() {
    console.log('🔍 Testing published links query...');
    
    try {
        // Test direct query on automation_published_links
        console.log('1. Direct query on automation_published_links...');
        const { data: directLinks, error: directError } = await supabase
            .from('automation_published_links')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(20);

        if (directError) {
            console.error('❌ Direct query error:', directError);
            return;
        }

        console.log(`📊 Total published links found: ${directLinks.length}`);
        
        if (directLinks.length === 0) {
            console.log('No published links found in database');
            return;
        }

        // Group by platform
        const platformCounts = {};
        directLinks.forEach(link => {
            const platform = link.platform || 'unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });

        console.log('\n📈 Platform distribution:');
        Object.entries(platformCounts).forEach(([platform, count]) => {
            console.log(`   "${platform}": ${count} links`);
        });

        // Show recent links
        console.log('\n🕒 Recent links (last 10):');
        directLinks.slice(0, 10).forEach((link, index) => {
            console.log(`   ${index + 1}. Platform: "${link.platform}" | Campaign: ${link.campaign_id.substring(0, 8)}... | URL: ${link.published_url.substring(0, 60)}...`);
        });

        // Check for Write.as variations
        console.log('\n🔍 Looking for Write.as related links...');
        const writeAsLinks = directLinks.filter(link => {
            const platform = (link.platform || '').toLowerCase();
            return platform.includes('write') || platform === 'writeas' || platform === 'write.as';
        });

        console.log(`✅ Write.as related links found: ${writeAsLinks.length}`);
        if (writeAsLinks.length > 0) {
            writeAsLinks.forEach((link, index) => {
                console.log(`   ${index + 1}. Platform: "${link.platform}" | Campaign: ${link.campaign_id.substring(0, 8)}... | URL: ${link.published_url}`);
            });
        } else {
            console.log('❌ No Write.as links found with platform names containing "write", "writeas", or "write.as"');
        }

        // Test getCampaignWithLinks query
        console.log('\n2. Testing getCampaignWithLinks query...');
        const { data: campaigns, error: campaignError } = await supabase
            .from('automation_campaigns')
            .select(`
                *,
                automation_published_links(*)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (campaignError) {
            console.error('❌ Campaign query error:', campaignError);
            return;
        }

        console.log(`📊 Found ${campaigns.length} campaigns with links`);

        campaigns.forEach((campaign, index) => {
            console.log(`\n   ${index + 1}. Campaign: "${campaign.keyword}" (${campaign.id.substring(0, 8)}...)`);
            console.log(`      Status: ${campaign.status}`);
            console.log(`      Published links: ${campaign.automation_published_links?.length || 0}`);
            
            if (campaign.automation_published_links?.length > 0) {
                campaign.automation_published_links.forEach((link, linkIndex) => {
                    console.log(`      ${linkIndex + 1}. Platform: "${link.platform}" | URL: ${link.published_url.substring(0, 50)}...`);
                });
            }
        });

        // Find a specific campaign for the user to check
        const recentCampaign = campaigns.find(c => c.automation_published_links?.length > 0);
        if (recentCampaign) {
            console.log(`\n🎯 Example campaign "${recentCampaign.keyword}" has ${recentCampaign.automation_published_links.length} published links:`);
            recentCampaign.automation_published_links.forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.platform}: ${link.published_url}`);
            });
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Run the test
testPublishedLinks().catch(console.error);
