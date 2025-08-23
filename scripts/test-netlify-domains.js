#!/usr/bin/env node

/**
 * Simple Netlify Domain Test
 * Tests only the Netlify API to see what domains are configured
 */

async function testNetlifyDomains() {
  console.log('🌐 Testing Netlify Domain Configuration...\n');

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  console.log(`📋 Configuration:`);
  console.log(`   Site ID: ${siteId}`);
  console.log(`   Token: ${netlifyToken ? '✅ Set' : '❌ Missing'}\n`);

  if (!netlifyToken) {
    console.error('❌ NETLIFY_ACCESS_TOKEN not configured');
    return;
  }

  try {
    console.log('🔍 Fetching site information from Netlify...');
    
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const siteData = await response.json();
    
    console.log('✅ Successfully connected to Netlify API\n');
    console.log(`📊 Site Information:`);
    console.log(`   Name: ${siteData.name}`);
    console.log(`   URL: ${siteData.url}`);
    console.log(`   SSL URL: ${siteData.ssl_url || 'None'}`);
    console.log(`   State: ${siteData.state}`);
    console.log(`   Created: ${new Date(siteData.created_at).toLocaleDateString()}\n`);

    console.log(`🌐 Domain Configuration:`);
    console.log(`   Custom Domain: ${siteData.custom_domain || 'None'}`);
    console.log(`   Domain Aliases: ${siteData.domain_aliases?.length || 0}`);
    
    if (siteData.domain_aliases?.length > 0) {
      console.log(`   Aliases:`);
      siteData.domain_aliases.forEach((alias, index) => {
        console.log(`     ${index + 1}. ${alias}`);
      });
    }
    
    const totalDomains = (siteData.custom_domain ? 1 : 0) + (siteData.domain_aliases?.length || 0);
    console.log(`\n📈 Total Domains: ${totalDomains}`);
    
    if (totalDomains === 0) {
      console.log('\n💡 No domains found in your Netlify account.');
      console.log('   This is why the domain sync isn\'t showing any domains.');
      console.log('   You can add domains directly through:');
      console.log('   - Your Netlify dashboard (https://app.netlify.com)');
      console.log('   - The domain manager in your app');
    } else {
      console.log('\n🎯 These domains should appear in your app after sync!');
      console.log('   If they don\'t appear, check:');
      console.log('   1. The netlify-domain-validation function is deployed');
      console.log('   2. The database sync is working correctly');
      console.log('   3. User authentication is working');
    }

  } catch (error) {
    console.error('❌ Failed to connect to Netlify:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your NETLIFY_ACCESS_TOKEN');
    console.log('   2. Verify the NETLIFY_SITE_ID is correct');
    console.log('   3. Make sure the token has proper permissions');
  }
}

// Run the test
testNetlifyDomains().catch(console.error);
