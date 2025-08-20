#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!netlifyToken) {
  console.error('❌ Missing NETLIFY_ACCESS_TOKEN environment variable');
  console.log('📝 Please add your Netlify access token to your environment variables:');
  console.log('   NETLIFY_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 5; // Process domains in batches to avoid rate limits
const SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809'; // Default site ID

async function loadDomainsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (filePath.endsWith('.json')) {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : data.domains || [];
    } else {
      // Assume plain text file with one domain per line
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
  } catch (error) {
    console.error(`❌ Error reading domains file ${filePath}:`, error.message);
    return [];
  }
}

async function validateDomain(domain) {
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

async function addDomainsToNetlify(domains, options = {}) {
  const {
    siteId = SITE_ID,
    enableSSL = true,
    forceSSL = true,
    saveToDB = true
  } = options;

  console.log(`🚀 Starting bulk domain addition for ${domains.length} domains`);
  console.log(`📍 Target site: ${siteId}`);
  console.log(`🔒 SSL enabled: ${enableSSL}`);
  
  const results = {
    successful: [],
    failed: [],
    total: domains.length
  };

  // Process in batches
  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(domains.length / BATCH_SIZE)}`);
    
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/add-domain-with-ssl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domains: batch,
          siteId,
          enableSSL,
          forceSSL
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const batchResult = await response.json();
      
      // Process results
      for (const result of batchResult.results) {
        if (result.success) {
          results.successful.push(result);
          console.log(`✅ ${result.domain} - Added successfully`);
          
          // Save to database if requested
          if (saveToDB) {
            await saveDomainToDB(result.domain, siteId);
          }
        } else {
          results.failed.push(result);
          console.log(`❌ ${result.domain} - Failed: ${result.error}`);
        }
      }

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Batch failed:`, error.message);
      
      // Mark all domains in this batch as failed
      for (const domain of batch) {
        results.failed.push({
          domain,
          success: false,
          error: error.message
        });
      }
    }
  }

  return results;
}

async function saveDomainToDB(domain, siteId) {
  try {
    // For now, we'll save to a simple domains tracking table
    // You can extend this to include user_id when auth is available
    const { error } = await supabase
      .from('domains')
      .upsert({
        domain_name: domain,
        netlify_site_id: siteId,
        status: 'active',
        ssl_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain_name'
      });

    if (error) {
      console.log(`⚠️  Database save warning for ${domain}:`, error.message);
    }
  } catch (error) {
    console.log(`⚠️  Database save error for ${domain}:`, error.message);
  }
}

async function checkNetlifyConnection() {
  try {
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${netlifyToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const user = await response.json();
    console.log(`✅ Connected to Netlify as: ${user.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Netlify connection failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🌐 Bulk Domain Management Tool\n');

  // Check Netlify connection
  const connected = await checkNetlifyConnection();
  if (!connected) {
    process.exit(1);
  }

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/bulk-add-domains.js <domains-file>');
    console.log('  node scripts/bulk-add-domains.js example.com,test.com,site.org');
    console.log('\nExample files:');
    console.log('  domains.txt (one domain per line)');
    console.log('  domains.json (JSON array of domains)');
    process.exit(1);
  }

  let domains = [];

  // Parse input
  if (args[0].includes(',')) {
    // Comma-separated domains
    domains = args[0].split(',').map(d => d.trim()).filter(d => d);
  } else if (fs.existsSync(args[0])) {
    // File input
    domains = await loadDomainsFromFile(args[0]);
  } else {
    console.error(`❌ File not found: ${args[0]}`);
    process.exit(1);
  }

  if (domains.length === 0) {
    console.error('❌ No valid domains found');
    process.exit(1);
  }

  // Validate domains
  const validDomains = [];
  const invalidDomains = [];

  for (const domain of domains) {
    const isValid = await validateDomain(domain);
    if (isValid) {
      validDomains.push(domain);
    } else {
      invalidDomains.push(domain);
    }
  }

  if (invalidDomains.length > 0) {
    console.log(`⚠️  Found ${invalidDomains.length} invalid domains:`);
    invalidDomains.forEach(domain => console.log(`   ${domain}`));
  }

  if (validDomains.length === 0) {
    console.error('❌ No valid domains to process');
    process.exit(1);
  }

  console.log(`\n📋 Processing ${validDomains.length} valid domains:`);
  validDomains.slice(0, 5).forEach(domain => console.log(`   ${domain}`));
  if (validDomains.length > 5) {
    console.log(`   ... and ${validDomains.length - 5} more`);
  }

  // Confirm before proceeding
  console.log(`\n⚠️  This will add ${validDomains.length} domains to your Netlify site with SSL certificates.`);
  console.log('Continue? (y/N)');

  // Simple confirmation (you might want to use a proper prompt library)
  const confirmation = await new Promise(resolve => {
    process.stdin.once('data', data => {
      resolve(data.toString().trim().toLowerCase());
    });
  });

  if (confirmation !== 'y' && confirmation !== 'yes') {
    console.log('❌ Operation cancelled');
    process.exit(0);
  }

  // Process domains
  const results = await addDomainsToNetlify(validDomains);

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success rate: ${((results.successful.length / results.total) * 100).toFixed(1)}%`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed domains:');
    results.failed.forEach(result => {
      console.log(`   ${result.domain}: ${result.error}`);
    });
  }

  console.log('\n🎉 Bulk domain addition completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { addDomainsToNetlify, loadDomainsFromFile, validateDomain };
