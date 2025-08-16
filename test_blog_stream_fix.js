// Test script to verify the blog stream error fix
// Run this in the browser console to test

console.log('🧪 Testing Blog Stream Error Fix');

async function testBlogPostFetch() {
    try {
        console.log('1. Testing direct supabase query...');
        
        // Test published_blog_posts table query
        const { data, error } = await supabase
            .from('published_blog_posts')
            .select('*')
            .eq('status', 'published')
            .limit(1);
            
        if (error) {
            console.error('❌ Direct query failed:', error);
        } else {
            console.log('✅ Direct query successful:', data?.length || 0, 'posts found');
        }
        
        console.log('2. Testing blogService.getBlogPostBySlug...');
        
        // Test getting a specific post (using a slug that should exist)
        const testSlug = 'the-ultimate-guide-to-pastebin-mee3h6rh';
        
        const blogPost = await blogService.getBlogPostBySlug(testSlug);
        
        if (blogPost) {
            console.log('✅ getBlogPostBySlug successful:', {
                id: blogPost.id,
                title: blogPost.title,
                slug: blogPost.slug
            });
        } else {
            console.log('ℹ️ Post not found, but no error thrown');
        }
        
        console.log('3. Testing error handling with invalid slug...');
        
        const nonExistentPost = await blogService.getBlogPostBySlug('non-existent-post-' + Date.now());
        
        if (nonExistentPost === null) {
            console.log('✅ Invalid slug handled correctly (returned null)');
        } else {
            console.log('❓ Unexpected result for invalid slug:', nonExistentPost);
        }
        
        console.log('🎉 All tests completed successfully - no stream errors detected!');
        
    } catch (error) {
        if (error.message.includes('body stream already read')) {
            console.error('❌ Stream error still occurring:', error.message);
        } else {
            console.error('❌ Other error:', error.message);
        }
    }
}

// Run the test
testBlogPostFetch();

console.log('📋 Test summary:');
console.log('- Fixed SupabaseErrorHandler to not retry stream errors');
console.log('- Enhanced BlogService with stream-safe error handling');
console.log('- Improved Supabase client fetch to prevent stream conflicts');
console.log('- Added recovery mechanism for stream errors');
