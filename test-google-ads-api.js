/**
 * Test script to validate Google Ads API integration
 * Run this with: node test-google-ads-api.js
 */

require('dotenv').config({ path: '.env.local' });

const API_ENDPOINT = 'http://localhost:54321/functions/v1/seo-analysis';

async function testGoogleAdsApi() {
  console.log('🧪 Testing Google Ads API Integration...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredEnvVars = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ACCOUNT_ID', 
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN'
  ];

  const missingVars = [];
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`  ✅ ${envVar}: ${'*'.repeat(Math.min(value.length, 20))}...`);
    } else {
      console.log(`  ❌ ${envVar}: Not set`);
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Please set these in your .env.local file');
    console.log('See docs/GOOGLE_ADS_API_SETUP.md for setup instructions');
    return;
  }

  console.log('\n🔍 Testing keyword research endpoint...');

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test-token'}`
      },
      body: JSON.stringify({
        type: 'advanced_keyword_research',
        data: {
          keyword: 'seo tools',
          country: 'US',
          searchEngine: 'google'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log(`📊 Keywords found: ${data.keywords?.length || 0}`);
    
    if (data.dataQuality) {
      console.log(`🎯 Data Source: ${data.dataQuality.apiType || 'Unknown'}`);
      console.log(`📈 Using Google Ads API: ${data.dataQuality.usingGoogleAdsApi ? 'Yes' : 'No'}`);
      console.log(`🎭 Confidence: ${data.dataQuality.confidence}`);
      console.log(`📡 Sources: ${data.dataQuality.sources?.join(', ') || 'Unknown'}`);
    }

    if (data.keywords && data.keywords.length > 0) {
      console.log('\n📋 Sample keyword data:');
      const sample = data.keywords[0];
      console.log(`  Keyword: ${sample.keyword}`);
      console.log(`  Search Volume: ${sample.searchVolume?.toLocaleString() || 'N/A'}`);
      console.log(`  CPC: $${sample.cpc?.toFixed(2) || '0.00'}`);
      console.log(`  Competition: ${sample.competition || 'Unknown'}`);
      console.log(`  Data Sources: ${sample.dataSources?.join(', ') || 'Unknown'}`);
    }

    if (data.dataQuality?.usingGoogleAdsApi) {
      console.log('\n🎉 SUCCESS: Google Ads API is working correctly!');
      console.log('   Your keyword research is now using official Google data.');
    } else {
      console.log('\n⚠️  FALLBACK MODE: Using alternative APIs');
      console.log('   Google Ads API may not be configured or failed.');
      console.log('   Check your credentials and API access.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('  - Make sure Supabase is running locally');
      console.log('  - Check that the seo-analysis function is deployed');
      console.log('  - Verify your local development setup');
    } else if (error.message.includes('401')) {
      console.log('\n🔧 Authentication issue:');
      console.log('  - Check your SUPABASE_ANON_KEY');
      console.log('  - Verify Google Ads API credentials');
    } else if (error.message.includes('400')) {
      console.log('\n🔧 Request issue:');
      console.log('  - Check the request format');
      console.log('  - Verify required parameters');
    }
  }
}

// Run the test
testGoogleAdsApi().catch(console.error);
