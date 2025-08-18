const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPublishedLinks() {
  console.log('🔍 Debugging published links in database...\n');

  try {
    // Get all published links
    const { data: links, error } = await supabase
      .from('automation_published_links')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`📊 Total published links in database: ${links.length}\n`);

    if (links.length === 0) {
      console.log('No published links found in database');
      return;
    }

    // Group by platform
    const platformGroups = {};
    links.forEach(link => {
      const platform = link.platform || 'unknown';
      if (!platformGroups[platform]) {
        platformGroups[platform] = [];
      }
      platformGroups[platform].push(link);
    });

    console.log('📈 Links by platform:');
    Object.entries(platformGroups).forEach(([platform, platformLinks]) => {
      console.log(`  ${platform}: ${platformLinks.length} links`);
    });

    console.log('\n🔍 Recent links (last 10):');
    links.slice(0, 10).forEach((link, index) => {
      console.log(`${index + 1}. Platform: "${link.platform}" | URL: ${link.published_url} | Campaign: ${link.campaign_id.substring(0, 8)}... | Date: ${link.published_at}`);
    });

    // Check for Write.as variants
    const writeAsVariants = links.filter(link => {
      const platform = (link.platform || '').toLowerCase();
      return platform.includes('write') || platform.includes('as');
    });

    if (writeAsVariants.length > 0) {
      console.log(`\n✅ Found ${writeAsVariants.length} Write.as links with these platform names:`);
      const variantNames = [...new Set(writeAsVariants.map(l => l.platform))];
      variantNames.forEach(name => {
        console.log(`  - "${name}"`);
      });
    } else {
      console.log('\n❌ No Write.as links found in database');
    }

    // Check specific campaign if provided
    if (process.argv[2]) {
      const campaignId = process.argv[2];
      console.log(`\n🎯 Links for campaign ${campaignId}:`);
      const campaignLinks = links.filter(l => l.campaign_id === campaignId);
      campaignLinks.forEach(link => {
        console.log(`  Platform: "${link.platform}" | URL: ${link.published_url}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPublishedLinks();
