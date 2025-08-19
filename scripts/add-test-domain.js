#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addTestDomain() {
  try {
    console.log('🚀 Adding test domain for DNS validation testing...');
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication required. Please log in to the app first.');
      console.log('');
      console.log('📋 Steps:');
      console.log('1. Open your app in the browser');
      console.log('2. Sign in with your account');
      console.log('3. Run this script again');
      return;
    }
    
    console.log(`✅ Authenticated as: ${user.email}`);
    
    // Generate verification token
    const generateToken = () => {
      return 'blo-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };
    
    // Test domain data
    const testDomain = {
      user_id: user.id,
      domain: 'example-test.com',
      status: 'pending',
      verification_token: generateToken(),
      required_a_record: '192.168.1.100',
      required_cname: 'hosting.backlinkoo.com',
      hosting_provider: 'backlinkoo',
      blog_subdirectory: 'blog',
      ssl_enabled: true,
      blog_enabled: false,
      dns_validated: false,
      txt_record_validated: false,
      a_record_validated: false,
      cname_validated: false,
      pages_published: 0
    };
    
    // Insert test domain
    const { data, error } = await supabase
      .from('domains')
      .insert(testDomain)
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        console.log('ℹ️  Test domain already exists');
        
        // Get existing domain
        const { data: existing } = await supabase
          .from('domains')
          .select('*')
          .eq('domain', testDomain.domain)
          .eq('user_id', user.id)
          .single();
        
        if (existing) {
          console.log(`📋 Existing domain: ${existing.domain} (${existing.status})`);
          console.log(`🔑 Verification token: ${existing.verification_token}`);
        }
        return;
      }
      
      console.error('❌ Error adding test domain:', error);
      return;
    }
    
    console.log('✅ Test domain added successfully!');
    console.log('');
    console.log('📋 Domain Details:');
    console.log(`   Domain: ${data.domain}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Verification Token: ${data.verification_token}`);
    console.log(`   Required A Record: ${data.required_a_record}`);
    console.log(`   Required CNAME: ${data.required_cname}`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Go to /domains page in your app');
    console.log('2. You should see the test domain listed');
    console.log('3. Click "DNS Setup" to see the required records');
    console.log('4. Test DNS validation (will use fallback method)');
    console.log('5. Enable blogging to test blog theme integration');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTestDomain();
}

export { addTestDomain };
