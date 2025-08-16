#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin operations, fallback to anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function updateFacebookPost() {
  try {
    console.log('🎨 Updating Facebook blog post...');

    // Get the specific Facebook post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'unleashing-the-power-of-facebook-the-ultimate-guide-to-dominating-social-media')
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch Facebook post:', fetchError.message);
      return;
    }

    if (!post) {
      console.log('📭 Facebook post not found.');
      return;
    }

    console.log(`📝 Found post: "${post.title}" (ID: ${post.id})`);
    console.log(`📄 Current content length: ${post.content?.length || 0} characters`);

    // Update just this post to refresh its processing
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: post.content // Trigger any database-level processing
      })
      .eq('id', post.id);

    if (updateError) {
      console.error(`❌ Failed to update post: ${updateError.message}`);
      return;
    }

    console.log(`✅ Successfully refreshed Facebook blog post`);
    console.log(`🔄 Page should now reload with improved formatting`);

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
updateFacebookPost()
  .then(() => {
    console.log('🎨 Facebook post update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
