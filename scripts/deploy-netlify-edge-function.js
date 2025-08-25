#!/usr/bin/env node

/**
 * Deploy Netlify Domains Edge Function Helper
 * 
 * This script provides instructions and helps deploy the Netlify domains
 * edge function to Supabase for optimized domain syncing.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Netlify Domains Edge Function Deployment Helper\n');

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Supabase CLI not found');
    console.log('📥 Install Supabase CLI: https://supabase.com/docs/guides/cli');
    console.log('   npm install -g supabase');
    return false;
  }
}

// Check if edge function exists
function checkEdgeFunction() {
  const edgeFunctionPath = 'supabase/functions/netlify-domains/index.ts';
  if (fs.existsSync(edgeFunctionPath)) {
    console.log('✅ Edge function found at:', edgeFunctionPath);
    return true;
  } else {
    console.log('❌ Edge function not found at:', edgeFunctionPath);
    return false;
  }
}

// Check Supabase project status
function checkSupabaseProject() {
  try {
    execSync('supabase status', { stdio: 'pipe' });
    console.log('✅ Supabase project is linked');
    return true;
  } catch (error) {
    console.log('❌ Supabase project not linked or CLI not authenticated');
    console.log('🔗 Link your project: supabase link --project-ref YOUR_PROJECT_REF');
    console.log('🔑 Login: supabase login');
    return false;
  }
}

// Deploy the edge function
function deployEdgeFunction() {
  try {
    console.log('\n🚀 Deploying netlify-domains edge function...');
    execSync('supabase functions deploy netlify-domains --no-verify-jwt', { 
      stdio: 'inherit' 
    });
    console.log('\n✅ Edge function deployed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Go to your domains page in the app');
    console.log('2. Click "Test Connection" to verify the edge function');
    console.log('3. Use "Sync via Edge Function" for faster domain syncing');
    return true;
  } catch (error) {
    console.log('\n❌ Deployment failed:', error.message);
    return false;
  }
}

// Main deployment process
async function main() {
  console.log('🔍 Running pre-deployment checks...\n');

  const cliInstalled = checkSupabaseCLI();
  const edgeFunctionExists = checkEdgeFunction();
  const projectLinked = checkSupabaseProject();

  if (!cliInstalled || !edgeFunctionExists || !projectLinked) {
    console.log('\n❌ Pre-deployment checks failed. Please fix the issues above and try again.');
    process.exit(1);
  }

  console.log('\n✅ All pre-deployment checks passed!');
  
  // Ask for user confirmation
  console.log('\n📋 About to deploy:');
  console.log('   Function: netlify-domains');
  console.log('   Path: supabase/functions/netlify-domains/index.ts');
  console.log('   Command: supabase functions deploy netlify-domains --no-verify-jwt');
  
  // In a real interactive script, you'd prompt for confirmation
  // For now, we'll proceed with deployment
  
  const success = deployEdgeFunction();
  
  if (success) {
    console.log('\n🎉 Deployment complete!');
    console.log('\nYour edge function is now available at:');
    console.log('https://YOUR_PROJECT_REF.supabase.co/functions/v1/netlify-domains');
    console.log('\nThe domains manager will automatically detect and use the edge function.');
  } else {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Ensure you have the correct permissions in Supabase');
    console.log('2. Check your internet connection');
    console.log('3. Verify your project ref is correct');
    console.log('4. Try: supabase login and supabase link again');
    process.exit(1);
  }
}

// Edge function information
function showEdgeFunctionInfo() {
  console.log('📋 Edge Function Information:\n');
  console.log('Name: netlify-domains');
  console.log('Purpose: Sync domains between Netlify and Supabase');
  console.log('Features:');
  console.log('  • GET: Fetch domains from Netlify → sync to Supabase');
  console.log('  • POST: Add domain to Netlify → sync to Supabase');
  console.log('  • DELETE: Remove domain from Netlify → remove from Supabase');
  console.log('\nBenefits:');
  console.log('  • Faster domain syncing');
  console.log('  • Server-side processing');
  console.log('  • Better error handling');
  console.log('  • Reduced client-side API calls');
  console.log('\nDeployment Command:');
  console.log('  supabase functions deploy netlify-domains --no-verify-jwt');
}

// Run based on command line argument
const command = process.argv[2];

switch (command) {
  case 'info':
    showEdgeFunctionInfo();
    break;
  case 'deploy':
  default:
    main().catch(console.error);
    break;
}
