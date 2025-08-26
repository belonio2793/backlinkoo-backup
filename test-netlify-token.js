#!/usr/bin/env node

/**
 * Test Netlify API access with the provided token
 */

require('dotenv').config();

async function testNetlifyAccess() {
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN || 'nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967';
  const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  console.log('🔑 Testing Netlify API access...');
  console.log('Token:', netlifyToken ? `${netlifyToken.substring(0, 8)}...` : 'Not found');
  console.log('Site ID:', siteId);

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Netlify API error:', response.status, errorText);
      return false;
    }

    const siteData = await response.json();
    console.log('✅ Success! Site data retrieved:');
    console.log('Site name:', siteData.name);
    console.log('Site URL:', siteData.url);
    console.log('Custom domain:', siteData.custom_domain);
    console.log('Domain aliases:', siteData.domain_aliases);

    const domains = [];
    if (siteData.custom_domain) domains.push(siteData.custom_domain);
    if (siteData.domain_aliases) domains.push(...siteData.domain_aliases);

    console.log('🌐 Total domains found:', domains.length);
    console.log('Domains:', domains);

    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testNetlifyAccess();
