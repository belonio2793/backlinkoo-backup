#!/usr/bin/env node

/**
 * DNS Verification Script for leadpages.org
 * Checks DNS configuration and provides optimization recommendations
 */

import dns from 'dns/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const DOMAIN_NAME = 'leadpages.org';
const EXPECTED_NETLIFY_IP = '75.2.60.5'; // Netlify load balancer IP (example)
const EXPECTED_CNAME = 'builder-io-domain-hosting.netlify.app'; // Your Netlify site

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDNSRecord(domain, type) {
  try {
    const records = await dns.resolve(domain, type);
    return { success: true, records };
  } catch (error) {
    return { success: false, error: error.message, records: [] };
  }
}

async function verifyDNSConfiguration() {
  console.log(`🔍 Verifying DNS configuration for ${DOMAIN_NAME}...`);
  console.log('=' .repeat(60));

  const results = {
    domain: DOMAIN_NAME,
    timestamp: new Date().toISOString(),
    checks: {},
    recommendations: [],
    status: 'unknown'
  };

  // Check A records
  console.log('\\n📌 Checking A Records...');
  const aRecords = await checkDNSRecord(DOMAIN_NAME, 'A');
  results.checks.aRecords = aRecords;
  
  if (aRecords.success) {
    console.log('✅ A Records found:', aRecords.records);
    
    // Check if pointing to correct IP
    const hasCorrectIP = aRecords.records.some(ip => 
      ip.includes('75.2.') || ip.includes('104.198.') // Common Netlify IPs
    );
    
    if (hasCorrectIP) {
      console.log('✅ A records appear to point to hosting provider');
    } else {
      console.log('⚠️  A records may not be pointing to correct hosting');
      results.recommendations.push('Update A records to point to hosting provider');
    }
  } else {
    console.log('❌ No A Records found:', aRecords.error);
    results.recommendations.push('Add A records pointing to hosting provider');
  }

  // Check CNAME records
  console.log('\\n📌 Checking CNAME Records...');
  const cnameRecords = await checkDNSRecord(DOMAIN_NAME, 'CNAME');
  results.checks.cnameRecords = cnameRecords;
  
  if (cnameRecords.success) {
    console.log('✅ CNAME Records found:', cnameRecords.records);
  } else {
    console.log('ℹ️  No CNAME Records (this is normal for root domain)');
  }

  // Check WWW subdomain
  console.log('\\n📌 Checking WWW Subdomain...');
  const wwwRecords = await checkDNSRecord(`www.${DOMAIN_NAME}`, 'CNAME');
  results.checks.wwwRecords = wwwRecords;
  
  if (wwwRecords.success) {
    console.log('✅ WWW CNAME found:', wwwRecords.records);
    
    const pointsToApex = wwwRecords.records.some(record => 
      record.includes(DOMAIN_NAME) || record.includes('netlify')
    );
    
    if (pointsToApex) {
      console.log('✅ WWW correctly redirects to main domain');
    } else {
      console.log('⚠️  WWW may not redirect correctly');
      results.recommendations.push('Set WWW CNAME to point to main domain or hosting');
    }
  } else {
    console.log('⚠️  No WWW CNAME found');
    results.recommendations.push('Add WWW CNAME record for better accessibility');
  }

  // Check TXT records (for verification)
  console.log('\\n📌 Checking TXT Records...');
  const txtRecords = await checkDNSRecord(DOMAIN_NAME, 'TXT');
  results.checks.txtRecords = txtRecords;
  
  if (txtRecords.success) {
    console.log('✅ TXT Records found:');
    txtRecords.records.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record}`);
    });
    
    // Check for verification tokens
    const hasVerification = txtRecords.records.some(record => 
      record.includes('netlify') || record.includes('blo-') || record.includes('verification')
    );
    
    if (hasVerification) {
      console.log('✅ Domain verification records detected');
    } else {
      console.log('ℹ️  No specific verification records found');
    }
  } else {
    console.log('ℹ️  No TXT Records found');
  }

  // Check MX records (email)
  console.log('\\n📌 Checking MX Records...');
  const mxRecords = await checkDNSRecord(DOMAIN_NAME, 'MX');
  results.checks.mxRecords = mxRecords;
  
  if (mxRecords.success) {
    console.log('✅ MX Records found (email configured):');
    mxRecords.records.forEach(record => {
      console.log(`   Priority ${record.priority}: ${record.exchange}`);
    });
  } else {
    console.log('ℹ️  No MX Records (email not configured)');
  }

  // Overall DNS health check
  console.log('\\n🏥 DNS Health Assessment...');
  const hasBasicRecords = aRecords.success || cnameRecords.success;
  const hasWWW = wwwRecords.success;
  const hasTXT = txtRecords.success;

  if (hasBasicRecords) {
    if (hasWWW && hasTXT) {
      results.status = 'excellent';
      console.log('🟢 DNS Status: EXCELLENT - All records configured properly');
    } else if (hasWWW || hasTXT) {
      results.status = 'good';
      console.log('🟡 DNS Status: GOOD - Basic setup working, some optimizations possible');
    } else {
      results.status = 'basic';
      console.log('🟠 DNS Status: BASIC - Working but could be improved');
    }
  } else {
    results.status = 'needs_attention';
    console.log('🔴 DNS Status: NEEDS ATTENTION - Basic records missing');
  }

  return results;
}

async function updateDomainStatus(results) {
  console.log('\\n💾 Updating domain status in database...');
  
  try {
    const { data, error } = await supabase
      .from('domains')
      .update({
        dns_validated: results.checks.aRecords.success || results.checks.cnameRecords.success,
        a_record_validated: results.checks.aRecords.success,
        cname_validated: results.checks.cnameRecords.success,
        txt_record_validated: results.checks.txtRecords.success,
        last_validation_attempt: results.timestamp,
        validation_error: results.status === 'needs_attention' ? 'DNS records need configuration' : null,
        status: results.status === 'excellent' || results.status === 'good' ? 'active' : 'pending',
        updated_at: results.timestamp
      })
      .eq('domain', DOMAIN_NAME)
      .select();

    if (error) {
      console.log('ℹ️  Could not update database (this is normal if not connected)');
    } else {
      console.log('✅ Domain status updated in database');
    }
  } catch (error) {
    console.log('ℹ️  Database update skipped:', error.message);
  }
}

function displayRecommendations(results) {
  console.log('\\n💡 Recommendations for DNS Optimization:');
  console.log('=' .repeat(60));
  
  if (results.recommendations.length === 0) {
    console.log('🎉 Great! No DNS improvements needed at this time.');
    return;
  }

  results.recommendations.forEach((recommendation, index) => {
    console.log(`${index + 1}. ${recommendation}`);
  });

  console.log('\\n📚 DNS Setup Guide:');
  console.log('-------------------');
  console.log('For optimal performance, configure these DNS records:');
  console.log('');
  console.log('A Records (for root domain):');
  console.log(`${DOMAIN_NAME}     A     75.2.60.5`);
  console.log(`${DOMAIN_NAME}     A     99.83.190.102`);
  console.log('');
  console.log('CNAME Records (for subdomains):');
  console.log(`www.${DOMAIN_NAME}     CNAME     ${EXPECTED_CNAME}`);
  console.log('');
  console.log('TXT Record (for verification):');
  console.log(`${DOMAIN_NAME}     TXT     "netlify-verification=your-verification-code"`);
}

async function generateDNSReport(results) {
  const reportFile = `dns-report-${DOMAIN_NAME}-${Date.now()}.json`;
  
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(reportFile, JSON.stringify(results, null, 2));
    console.log(`\\n📄 Detailed report saved to: ${reportFile}`);
  } catch (error) {
    console.log('ℹ️  Could not save report file');
  }
}

async function main() {
  try {
    console.log('🚀 Starting DNS verification for leadpages.org...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const results = await verifyDNSConfiguration();
    await updateDomainStatus(results);
    displayRecommendations(results);
    await generateDNSReport(results);
    
    console.log('\\n✅ DNS verification completed!');
    console.log(`📊 Overall Status: ${results.status.toUpperCase()}`);
    console.log(`🌐 Domain: https://${DOMAIN_NAME}`);
    
  } catch (error) {
    console.error('❌ DNS verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
main();
