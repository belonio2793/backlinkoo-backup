const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlogPosts() {
  console.log('Checking blog posts with problematic slugs...');
  
  const slugs = [
    'h1-unleashing-the-power-of-faceook-the-ultimate-guide-to-dominating-social-media-medqxdg8',
    'unlocking-the-secrets-of-google-rankings-your-ultimate-guide-to-seo-success-meds4cls'
  ];
  
  for (const slug of slugs) {
    console.log(`\nChecking slug: ${slug}`);
    
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, status, created_at')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.log('Error:', error.message);
      if (error.code === 'PGRST116') {
        console.log('Post not found in database');
      }
    } else {
      console.log('Post found:');
      console.log('- ID:', data.id);
      console.log('- Title:', data.title || 'NO TITLE');
      console.log('- Status:', data.status);
      console.log('- Created:', data.created_at);
      console.log('- Content length:', data.content?.length || 0);
      console.log('- Content preview:', data.content?.substring(0, 200) || 'NO CONTENT');
      console.log('- Content is null/empty:', !data.content || data.content.trim().length === 0);
      
      if (data.content && data.content.length > 0) {
        console.log('- Content starts with:', data.content.substring(0, 50));
        console.log('- Contains HTML:', data.content.includes('<'));
        console.log('- Contains markdown:', data.content.includes('#') || data.content.includes('**'));
      }
    }
  }
  
  // Also check for recent blog posts with empty content
  console.log('\n--- Checking for recent posts with empty content ---');
  const { data: recentPosts, error: recentError } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (recentError) {
    console.log('Error getting recent posts:', recentError.message);
  } else {
    console.log(`Found ${recentPosts.length} recent posts:`);
    recentPosts.forEach(post => {
      const isEmpty = !post.content || post.content.trim().length === 0;
      console.log(`- ${post.slug}: ${isEmpty ? 'EMPTY' : 'HAS CONTENT'} (${post.content?.length || 0} chars)`);
    });
  }
}

checkBlogPosts().catch(console.error);
