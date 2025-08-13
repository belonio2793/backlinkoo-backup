import { createClient } from '@supabase/supabase-js';

// Get Supabase config from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBacklinkDatabase() {
  console.log('🔍 Checking Backlink Automation Database Setup...\n');

  try {
    // Check backlink_campaigns table
    const { error: campaignsError } = await supabase
      .from('backlink_campaigns')
      .select('count')
      .limit(1);

    // Check backlink_posts table
    const { error: postsError } = await supabase
      .from('backlink_posts')
      .select('count')
      .limit(1);

    console.log('📊 Database Table Status:');
    console.log('  backlink_campaigns:', campaignsError ? '❌ Missing' : '✅ Ready');
    console.log('  backlink_posts:', postsError ? '❌ Missing' : '✅ Ready');
    
    if (!campaignsError && !postsError) {
      console.log('\n🎉 SUCCESS: All database tables are properly set up!');
      console.log('✅ The backlink automation system is ready to use.');
      console.log('\n📋 Next Steps:');
      console.log('  1. Create a new backlink campaign');
      console.log('  2. Test the URL autoformatting feature');
      console.log('  3. Run your first automation');
    } else {
      console.log('\n⚠️  WARNING: Some database tables are missing.');
      console.log('📝 Please make sure the SQL script was executed successfully in Supabase.');
      
      if (campaignsError) {
        console.log('   Missing: backlink_campaigns table');
      }
      if (postsError) {
        console.log('   Missing: backlink_posts table');
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Verify Supabase connection');
    console.error('  2. Check environment variables');
    console.error('  3. Ensure SQL script was run correctly');
  }
}

checkBacklinkDatabase();
