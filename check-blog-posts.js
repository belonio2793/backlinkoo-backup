#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkBlogPosts() {
  try {
    console.log('🔍 Checking blog posts in database...');
    
    // Get all blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, title, created_at, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching blog posts:', error.message);
      return;
    }

    console.log(`\n📊 Found ${posts?.length || 0} blog posts:`);
    
    if (posts && posts.length > 0) {
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Created: ${new Date(post.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('📝 No blog posts found in database');
    }

    // Check specifically for the target slug
    const targetSlug = 'the-ultimate-guide-to-forum-profile-backlinks-unlocking-the-power-of-quality-lin-me9b9gfz';
    console.log(`\n🎯 Checking for specific slug: ${targetSlug}`);
    
    const { data: targetPost, error: targetError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', targetSlug)
      .single();

    if (targetError) {
      console.log('❌ Target blog post NOT found in database:', targetError.message);
    } else {
      console.log('✅ Target blog post found:', targetPost.title);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

checkBlogPosts();
