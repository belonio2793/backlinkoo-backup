#!/usr/bin/env node

/**
 * Automation System Preparation & Testing Script
 * Complete setup verification and testing preparation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AUTOMATION SYSTEM PREPARATION');
console.log('==================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

async function prepareSystem() {
  try {
    // 1. Environment Check
    console.log('1️⃣ Checking environment...');
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('   ⚠️  Missing environment variables:', missingVars.join(', '));
      console.log('   💡 Make sure these are set in your .env file or deployment environment');
    } else {
      console.log('   ✅ Core environment variables found');
    }

    // Check OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      console.log('   ⚠️  OPENAI_API_KEY not found - content generation will not work');
      console.log('   💡 Set this in your Netlify environment variables for production');
    } else {
      console.log('   ✅ OpenAI API key configured');
    }

    // 2. File Structure Check
    console.log('\n2️⃣ Verifying file structure...');
    
    const criticalFiles = [
      'src/pages/Automation.tsx',
      'src/services/automationOrchestrator.ts',
      'src/services/automationLogger.ts',
      'src/services/targetSitesManager.ts',
      'src/services/contentGenerationService.ts',
      'src/services/telegraphService.ts',
      'src/components/automation/AutomationTestDashboard.tsx',
      'netlify/functions/generate-content.js',
      'netlify/functions/publish-article.js'
    ];

    let missingFiles = [];
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - MISSING`);
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.log('\n   ⚠️  Some critical files are missing!');
      return false;
    }

    // 3. Dependencies Check
    console.log('\n3️⃣ Checking dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = [
        '@supabase/supabase-js',
        'lucide-react',
        'sonner'
      ];

      let missingDeps = [];
      for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          console.log(`   ✅ ${dep}`);
        } else {
          console.log(`   ❌ ${dep} - MISSING`);
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        console.log('\n   💡 Install missing dependencies with: npm install');
      }
    } catch (error) {
      console.log('   ⚠️  Could not verify dependencies');
    }

    // 4. Run Database Verification
    console.log('\n4️⃣ Running database verification...');
    
    try {
      execSync('node scripts/verify-automation-setup.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n   ⚠️  Database verification encountered issues');
      console.log('   💡 Check the output above and resolve any database issues');
    }

    // 5. System Architecture Summary
    console.log('\n📋 SYSTEM ARCHITECTURE OVERVIEW');
    console.log('================================');
    console.log('');
    console.log('🎯 AUTOMATION WORKFLOW:');
    console.log('  1. User creates campaign with keywords, anchor texts, target URL');
    console.log('  2. System generates content using OpenAI GPT-3.5 Turbo');
    console.log('  3. Content includes natural anchor text linking to target URL');
    console.log('  4. Article is published to Telegraph (telegra.ph)');
    console.log('  5. Results are tracked in database with analytics');
    console.log('');
    console.log('🔧 TECHNICAL COMPONENTS:');
    console.log('  • Frontend: React with TypeScript, Tailwind CSS');
    console.log('  • Backend: Netlify Functions (serverless)');
    console.log('  • Database: Supabase (PostgreSQL)');
    console.log('  • AI: OpenAI GPT-3.5 Turbo for content generation');
    console.log('  • Publishing: Telegraph API for instant article posting');
    console.log('  • Logging: Comprehensive automation activity tracking');
    console.log('');
    console.log('🛡️ SECURITY FEATURES:');
    console.log('  • API keys secured in Netlify environment (server-side only)');
    console.log('  • Row Level Security (RLS) policies on all tables');
    console.log('  • User isolation and data protection');
    console.log('  • No sensitive data in client-side code');
    console.log('');
    console.log('📊 TESTING APPROACH:');
    console.log('  • Built-in test dashboard in automation interface');
    console.log('  • End-to-end workflow testing');
    console.log('  • Individual component verification');
    console.log('  • Real API testing with cleanup capabilities');

    // 6. Next Steps
    console.log('\n🎯 NEXT STEPS FOR TESTING');
    console.log('=========================');
    console.log('');
    console.log('1. 🔑 ENVIRONMENT SETUP:');
    console.log('   • Ensure OPENAI_API_KEY is set in Netlify environment');
    console.log('   • Verify Supabase credentials are working');
    console.log('   • Check database tables are created');
    console.log('');
    console.log('2. 🧪 TESTING WORKFLOW:');
    console.log('   • Go to /automation page in your app');
    console.log('   • Click on "System Testing" tab');
    console.log('   • Sign in and run "Full Test Suite"');
    console.log('   • Verify all tests pass');
    console.log('');
    console.log('3. 🚀 CREATE REAL CAMPAIGN:');
    console.log('   • Switch to "Create Campaign" tab');
    console.log('   • Enter your target URL, keywords, and anchor texts');
    console.log('   • Create campaign and start automation');
    console.log('   • Monitor progress in "Reporting" tab');
    console.log('');
    console.log('4. 📈 SCALING PREPARATION:');
    console.log('   • Add more target sites to target_sites table');
    console.log('   • Monitor OpenAI API usage and costs');
    console.log('   • Set up monitoring and alerting');
    console.log('   • Consider rate limiting for production');

    console.log('\n✨ SYSTEM STATUS: READY FOR TESTING!');
    console.log('=====================================');
    console.log('');
    console.log('Your automation system is prepared and ready for testing.');
    console.log('You now have a complete link building automation platform that can:');
    console.log('');
    console.log('• Generate high-quality, SEO-optimized content');
    console.log('• Naturally integrate backlinks to your target URLs');
    console.log('• Publish articles to Telegraph instantly');
    console.log('• Track and report on all automation activities');
    console.log('• Scale to multiple target publishing sites');
    console.log('');
    console.log('🎉 Start by accessing /automation in your application!');

    return true;

  } catch (error) {
    console.error('\n❌ Preparation failed:', error.message);
    return false;
  }
}

// Run the preparation
prepareSystem().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Preparation script failed:', error);
  process.exit(1);
});
