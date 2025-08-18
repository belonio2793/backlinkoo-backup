/**
 * Test Campaign Completion Fix
 * Verifies that campaigns only complete when ALL active platforms have published
 */

const { createClient } = require('@supabase/supabase-js');

async function testCampaignCompletionFix() {
  console.log('🧪 Testing Campaign Completion Fix');
  console.log('==================================');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check current platform configuration
    console.log('\n📋 Test 1: Platform Configuration');
    const activePlatforms = getActivePlatforms();
    console.log('✅ Active platforms:', activePlatforms.map(p => `${p.name} (${p.id})`).join(', '));
    console.log(`   Total active platforms: ${activePlatforms.length}`);

    // Test 2: Analyze existing campaigns for completion issues
    console.log('\n📋 Test 2: Campaign Completion Analysis');
    
    const { data: campaigns, error: campaignError } = await supabase
      .from('automation_campaigns')
      .select(`
        id, 
        name, 
        status,
        created_at,
        automation_published_links (
          platform,
          published_url,
          status,
          published_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (campaignError) {
      console.warn('Failed to fetch campaigns:', campaignError);
      return;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('❌ No campaigns found to test');
      return;
    }

    console.log(`📊 Analyzing ${campaigns.length} recent campaigns:`);
    
    let correctCompletions = 0;
    let incorrectCompletions = 0;
    let properlyActive = 0;

    for (const campaign of campaigns) {
      const publishedLinks = campaign.automation_published_links || [];
      const publishedPlatforms = new Set(
        publishedLinks.map(link => normalizePlatformId(link.platform))
      );
      
      const platformsCompleted = activePlatforms.filter(p => 
        publishedPlatforms.has(p.id)
      ).length;
      
      const allPlatformsCompleted = platformsCompleted === activePlatforms.length;
      const hasAnyPlatform = platformsCompleted > 0;
      
      console.log(`\n   Campaign: ${campaign.name} (${campaign.id.substring(0, 8)}...)`);
      console.log(`      Status: ${campaign.status}`);
      console.log(`      Platforms: ${platformsCompleted}/${activePlatforms.length} completed`);
      console.log(`      Published on: [${Array.from(publishedPlatforms).join(', ')}]`);
      
      // Check for completion issues
      if (campaign.status === 'completed') {
        if (allPlatformsCompleted) {
          console.log(`      ✅ CORRECT: All platforms completed, status is completed`);
          correctCompletions++;
        } else {
          console.log(`      ❌ INCORRECT: Only ${platformsCompleted}/${activePlatforms.length} platforms completed but marked as completed`);
          incorrectCompletions++;
        }
      } else if (campaign.status === 'active' && hasAnyPlatform && !allPlatformsCompleted) {
        console.log(`      ✅ CORRECT: Partial completion, status is active`);
        properlyActive++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Correctly completed: ${correctCompletions}`);
    console.log(`   ❌ Incorrectly completed: ${incorrectCompletions}`);
    console.log(`   🔄 Properly active: ${properlyActive}`);

    // Test 3: Platform completion logic simulation
    console.log('\n📋 Test 3: Platform Completion Logic Test');
    
    const testScenarios = [
      { platforms: [], expected: false, description: 'No platforms completed' },
      { platforms: ['telegraph'], expected: false, description: 'Only Telegraph completed' },
      { platforms: ['writeas'], expected: false, description: 'Only Write.as completed' },
      { platforms: ['telegraph', 'writeas'], expected: true, description: 'Both platforms completed' },
      { platforms: ['Telegraph.ph'], expected: false, description: 'Legacy Telegraph name only' },
      { platforms: ['telegraph', 'Write.as'], expected: true, description: 'Mixed platform names' },
    ];

    for (const scenario of testScenarios) {
      const shouldComplete = checkAllPlatformsCompleted(activePlatforms, scenario.platforms);
      const result = shouldComplete === scenario.expected ? '✅' : '❌';
      
      console.log(`   ${result} ${scenario.description}: ${shouldComplete} (expected: ${scenario.expected})`);
    }

    console.log('\n🎉 Campaign Completion Fix Test Completed!');
    
    if (incorrectCompletions === 0) {
      console.log('✅ All campaigns have correct completion status!');
    } else {
      console.log(`⚠️ Found ${incorrectCompletions} campaigns with incorrect completion status`);
      console.log('   These may have been created before the fix was applied');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Get active platforms (simulates the service)
 */
function getActivePlatforms() {
  const allPlatforms = [
    { id: 'telegraph', name: 'Telegraph.ph', isActive: true, priority: 1 },
    { id: 'writeas', name: 'Write.as', isActive: true, priority: 2 },
    { id: 'medium', name: 'Medium.com', isActive: false, priority: 3 },
    { id: 'devto', name: 'Dev.to', isActive: false, priority: 4 },
    { id: 'linkedin', name: 'LinkedIn Articles', isActive: false, priority: 5 },
    { id: 'hashnode', name: 'Hashnode', isActive: false, priority: 6 },
    { id: 'substack', name: 'Substack', isActive: false, priority: 7 }
  ];
  
  return allPlatforms
    .filter(p => p.isActive)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Normalize platform ID for consistency
 */
function normalizePlatformId(platformId) {
  const normalized = platformId.toLowerCase();
  
  if (normalized === 'write.as' || normalized === 'writeas') return 'writeas';
  if (normalized === 'telegraph.ph' || normalized === 'telegraph') return 'telegraph';
  if (normalized === 'medium.com') return 'medium';
  if (normalized === 'dev.to') return 'devto';
  
  return normalized;
}

/**
 * Check if all platforms completed (simulates the service)
 */
function checkAllPlatformsCompleted(activePlatforms, publishedPlatformIds) {
  const normalizedPublished = new Set(
    publishedPlatformIds.map(id => normalizePlatformId(id))
  );

  return activePlatforms.every(platform => normalizedPublished.has(platform.id));
}

// Run the test
if (require.main === module) {
  testCampaignCompletionFix();
}

module.exports = { testCampaignCompletionFix, getActivePlatforms, checkAllPlatformsCompleted };
