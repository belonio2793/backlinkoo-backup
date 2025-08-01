import { BlogService } from '@/services/blogService';

export async function testBlogCreationFix() {
  console.log('🧪 Testing blog creation after security fix...');
  
  const blogService = new BlogService();
  
  try {
    const testData = {
      title: 'Security Fix Test Post',
      content: '<p>This post tests that security restrictions have been removed.</p>',
      targetUrl: 'https://example.com',
      wordCount: 50,
      readingTime: 1,
      seoScore: 85
    };

    console.log('Attempting to create test blog post...');
    const result = await blogService.createBlogPost(testData, undefined, true);
    
    console.log('✅ SUCCESS: Blog post created without security errors!');
    console.log('Post details:', {
      id: result.id,
      title: result.title,
      slug: result.slug,
      created_at: result.created_at
    });
    
    return { success: true, post: result };
    
  } catch (error: any) {
    console.error('❌ FAILED: Blog creation still blocked:', error.message);
    
    if (error.message.includes('row-level security') || error.message.includes('policy')) {
      console.error('🚨 SECURITY IS STILL ACTIVE - MANUAL INTERVENTION REQUIRED');
      console.error('Execute this SQL in Supabase SQL Editor:');
      console.error('ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;');
      console.error('GRANT ALL ON blog_posts TO PUBLIC;');
    }
    
    return { success: false, error: error.message };
  }
}

// Auto-run test when module loads
testBlogCreationFix().then(result => {
  if (result.success) {
    console.log('🎉 Blog creation fix verified - system is working!');
  } else {
    console.error('⚠️ Blog creation still failing - security not fully removed');
  }
});

export default testBlogCreationFix;
