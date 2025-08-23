/**
 * Test script to verify domains page functionality
 * Run this after applying the database migration
 */

import { supabase } from './src/integrations/supabase/client.js';

async function testDomainsPageSetup() {
  console.log('🧪 Testing domains page setup...');

  try {
    // Test 1: Check if domains table exists with correct schema
    console.log('\n1️⃣ Testing domains table schema...');
    
    const { data, error } = await supabase
      .from('domains')
      .select(`
        id,
        user_id,
        domain,
        status,
        netlify_verified,
        dns_verified,
        error_message,
        dns_records,
        selected_theme,
        theme_name,
        blog_enabled,
        created_at,
        updated_at
      `)
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ Missing required columns in domains table');
        console.log('💡 You need to run the database migration first');
        console.log('💡 Run: node scripts/run-domains-migration.js');
        return false;
      }
      console.error('❌ Domains table error:', error.message);
      return false;
    }

    console.log('✅ Domains table schema is correct');

    // Test 2: Check domain_themes table
    console.log('\n2️⃣ Testing domain_themes table...');
    
    const { data: themes, error: themesError } = await supabase
      .from('domain_themes')
      .select('id, name, description')
      .limit(5);

    if (themesError) {
      console.warn('⚠️ Domain themes table issue:', themesError.message);
    } else {
      console.log('✅ Domain themes table accessible');
      console.log(`📊 Found ${themes?.length || 0} themes`);
    }

    // Test 3: Test authentication and RLS
    console.log('\n3️⃣ Testing authentication and RLS...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️ Not authenticated - testing public access');
      
      // Test public access (should be restricted by RLS)
      const { data: publicData, error: publicError } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (publicError && publicError.message.includes('RLS')) {
        console.log('✅ RLS is working (public access restricted)');
      } else {
        console.warn('⚠️ RLS might not be properly configured');
      }
    } else {
      console.log('✅ User authenticated:', user.email);
      
      // Test user's domains access
      const { data: userDomains, error: userError } = await supabase
        .from('domains')
        .select('domain, status')
        .eq('user_id', user.id);

      if (userError) {
        console.error('❌ Error accessing user domains:', userError.message);
      } else {
        console.log(`✅ User can access their domains (${userDomains?.length || 0} found)`);
      }
    }

    // Test 4: Test Netlify services (basic connectivity)
    console.log('\n4️⃣ Testing Netlify services...');
    
    try {
      const response = await fetch('/.netlify/functions/netlify-domain-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSiteInfo' })
      });

      if (response.status === 404) {
        console.warn('⚠️ Netlify functions not deployed (using mock mode)');
      } else if (response.ok) {
        console.log('✅ Netlify functions are accessible');
      } else {
        console.warn(`⚠️ Netlify functions returned: ${response.status}`);
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not test Netlify functions (this is OK for local development)');
    }

    console.log('\n🎉 Domains page setup test completed!');
    console.log('\nNext steps:');
    console.log('1. Visit /domains in your application');
    console.log('2. Try adding a test domain');
    console.log('3. Check DNS validation functionality');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Check if running directly
if (typeof window === 'undefined') {
  // Node.js environment
  testDomainsPageSetup().catch(console.error);
} else {
  // Browser environment - expose as global function
  window.testDomainsPageSetup = testDomainsPageSetup;
  console.log('🧪 Test function loaded. Run: testDomainsPageSetup()');
}

export { testDomainsPageSetup };
