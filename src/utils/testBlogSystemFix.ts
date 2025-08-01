/**
 * Quick test to verify the blog system is working
 */

import { blogService } from '@/services/blogService';
import { SimplifiedClaimService } from '@/services/simplifiedClaimService';
import { DatabaseSetup } from '@/utils/databaseSetup';

export async function testBlogSystemFix(): Promise<boolean> {
  console.log('🧪 Testing blog system fix...');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const isConnected = await DatabaseSetup.testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      return false;
    }
    console.log('✅ Database connection successful');

    // 2. Initialize database if needed
    console.log('2. Initializing database...');
    await DatabaseSetup.initializeDatabase();
    console.log('✅ Database initialized');

    // 3. Test blog post retrieval
    console.log('3. Testing blog post retrieval...');
    const recentPosts = await blogService.getRecentBlogPosts(5);
    console.log(`✅ Found ${recentPosts.length} blog posts`);

    if (recentPosts.length === 0) {
      console.log('⚠️ No blog posts found, but this is expected if database is empty');
      return true;
    }

    // 4. Test individual post retrieval
    console.log('4. Testing individual post retrieval...');
    const firstPost = recentPosts[0];
    const retrievedPost = await SimplifiedClaimService.getBlogPostBySlug(firstPost.slug);
    if (retrievedPost) {
      console.log(`✅ Successfully retrieved post: "${retrievedPost.title}"`);
    } else {
      console.error('❌ Failed to retrieve individual post');
      return false;
    }

    // 5. Test claimable posts
    console.log('5. Testing claimable posts...');
    const claimablePosts = await SimplifiedClaimService.getClaimablePosts(5);
    console.log(`✅ Found ${claimablePosts.length} claimable posts`);

    console.log('🎉 All blog system tests passed!');
    return true;

  } catch (error: any) {
    console.error('❌ Blog system test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('🧪 Auto-running blog system test...');
  
  setTimeout(async () => {
    try {
      const success = await testBlogSystemFix();
      if (success) {
        console.log('🎉 Blog system is working correctly!');
      } else {
        console.error('💥 Blog system has issues that need attention');
      }
    } catch (error) {
      console.error('💥 Blog system test crashed:', error);
    }
  }, 3000);
}
