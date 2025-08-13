#!/usr/bin/env node

/**
 * Automation System Setup Verification Script
 * Verifies database tables, environment variables, and system readiness
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying Automation System Setup...\n');

  const results = {
    database: false,
    tables: false,
    openai: false,
    functions: false,
    overall: false
  };

  try {
    // 1. Test Database Connection
    console.log('1️⃣ Testing database connection...');
    const { data: dbTest, error: dbError } = await supabase
      .from('automation_campaigns')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.log(`   ❌ Database connection failed: ${dbError.message}`);
    } else {
      console.log('   ✅ Database connected successfully');
      results.database = true;
    }

    // 2. Verify Required Tables
    console.log('\n2️⃣ Verifying required tables...');
    const requiredTables = [
      'automation_campaigns',
      'article_submissions', 
      'automation_logs',
      'target_sites'
    ];

    let tablesExist = 0;
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ Table '${table}' - ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' exists`);
          tablesExist++;
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' - Error checking`);
      }
    }

    results.tables = tablesExist === requiredTables.length;

    // 3. Check OpenAI Configuration
    console.log('\n3️⃣ Checking OpenAI API configuration...');
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log('   ❌ OPENAI_API_KEY environment variable not set');
    } else {
      console.log('   ✅ OpenAI API key configured');
      results.openai = true;
    }

    // 4. Test Netlify Functions
    console.log('\n4️⃣ Checking Netlify functions...');
    const requiredFunctions = [
      'netlify/functions/generate-content.js',
      'netlify/functions/publish-article.js'
    ];

    let functionsExist = 0;
    const fs = require('fs');
    for (const func of requiredFunctions) {
      if (fs.existsSync(func)) {
        console.log(`   ✅ Function '${func}' exists`);
        functionsExist++;
      } else {
        console.log(`   ❌ Function '${func}' missing`);
      }
    }

    results.functions = functionsExist === requiredFunctions.length;

    // 5. Create Test Data (Optional)
    console.log('\n5️⃣ Creating sample target site data...');
    try {
      const { data: existingSites } = await supabase
        .from('target_sites')
        .select('id')
        .limit(1);

      if (!existingSites || existingSites.length === 0) {
        const { error: insertError } = await supabase
          .from('target_sites')
          .insert({
            id: 'telegraph',
            domain: 'telegra.ph',
            url: 'https://telegra.ph',
            type: 'blog',
            status: 'active',
            domain_rating: 85,
            success_rate: 95,
            total_attempts: 0,
            successful_submissions: 0,
            requirements: {
              min_word_count: 200,
              topics: ['any'],
              approval_process: false,
              registration_required: false
            },
            metadata: {
              submission_guidelines: 'Anonymous instant publishing platform',
              response_time_hours: 0,
              notes: 'Instant publishing via API - perfect for automation'
            }
          });

        if (insertError) {
          console.log(`   ⚠️  Could not create sample data: ${insertError.message}`);
        } else {
          console.log('   ✅ Sample target site created');
        }
      } else {
        console.log('   ✅ Target sites data already exists');
      }
    } catch (err) {
      console.log('   ⚠️  Could not verify target sites data');
    }

    // Overall Status
    results.overall = results.database && results.tables && results.openai && results.functions;

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('========================');
    console.log(`Database Connection: ${results.database ? '✅' : '❌'}`);
    console.log(`Required Tables: ${results.tables ? '✅' : '❌'}`);
    console.log(`OpenAI Configuration: ${results.openai ? '✅' : '❌'}`);
    console.log(`Netlify Functions: ${results.functions ? '✅' : '❌'}`);
    console.log(`Overall Status: ${results.overall ? '✅ READY' : '❌ NEEDS SETUP'}`);

    if (results.overall) {
      console.log('\n🎉 Automation system is ready for testing!');
      console.log('You can now:');
      console.log('• Create campaigns in the automation interface');
      console.log('• Test the full workflow with the test dashboard');
      console.log('• Generate content and publish articles');
    } else {
      console.log('\n⚠️  Setup incomplete. Please address the issues above.');
      
      if (!results.database) {
        console.log('\n🔧 Database Issues:');
        console.log('• Check your Supabase connection credentials');
        console.log('• Ensure the database is accessible');
      }
      
      if (!results.tables) {
        console.log('\n🔧 Table Issues:');
        console.log('• Run the database migration scripts');
        console.log('• Check table creation permissions');
      }
      
      if (!results.openai) {
        console.log('\n🔧 OpenAI Issues:');
        console.log('• Set OPENAI_API_KEY in your Netlify environment');
        console.log('• Ensure the API key has sufficient credits');
      }
      
      if (!results.functions) {
        console.log('\n🔧 Function Issues:');
        console.log('• Ensure Netlify functions are deployed');
        console.log('• Check function file paths');
      }
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySetup().catch(console.error);
