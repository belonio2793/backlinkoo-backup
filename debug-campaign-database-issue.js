#!/usr/bin/env node

/**
 * Direct database test to identify the exact cause of "expected JSON array" error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCampaignInsertion() {
  console.log('🔍 Debugging campaign insertion issue...\n');

  try {
    // First, check the current table structure
    console.log('1️⃣ Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'automation_campaigns')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }

    console.log('📊 Table columns:');
    columns?.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check for array columns specifically
    const arrayColumns = columns?.filter(col => 
      col.data_type === 'ARRAY' || 
      col.data_type === 'text[]' || 
      col.data_type === 'jsonb' ||
      col.column_name === 'keywords' ||
      col.column_name === 'anchor_texts' ||
      col.column_name === 'target_sites_used' ||
      col.column_name === 'published_articles'
    );

    console.log('\n🎯 Array-related columns:');
    arrayColumns?.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Test 1: Basic insertion with minimal data
    console.log('\n2️⃣ Testing basic insertion...');
    const basicTest = {
      name: 'Debug Test 1 - Basic',
      engine_type: 'web2_platforms',
      user_id: '00000000-0000-0000-0000-000000000000',
      status: 'draft'
    };

    console.log('Basic test data:', basicTest);
    const { data: basicResult, error: basicError } = await supabase
      .from('automation_campaigns')
      .insert(basicTest)
      .select()
      .single();

    if (basicError) {
      console.error('❌ Basic test failed:', basicError);
    } else {
      console.log('✅ Basic test passed, ID:', basicResult.id);
      // Clean up
      await supabase.from('automation_campaigns').delete().eq('id', basicResult.id);
    }

    // Test 2: Test with simple arrays
    console.log('\n3️⃣ Testing with simple arrays...');
    const arrayTest = {
      name: 'Debug Test 2 - Arrays',
      engine_type: 'web2_platforms',
      user_id: '00000000-0000-0000-0000-000000000000',
      status: 'draft',
      keywords: ['test', 'keyword'],
      anchor_texts: ['test anchor', 'click here']
    };

    console.log('Array test data:', {
      ...arrayTest,
      keywords_type: Array.isArray(arrayTest.keywords) ? 'array' : typeof arrayTest.keywords,
      anchor_texts_type: Array.isArray(arrayTest.anchor_texts) ? 'array' : typeof arrayTest.anchor_texts
    });

    const { data: arrayResult, error: arrayError } = await supabase
      .from('automation_campaigns')
      .insert(arrayTest)
      .select()
      .single();

    if (arrayError) {
      console.error('❌ Array test failed:', arrayError);
      console.error('Error details:', {
        message: arrayError.message,
        details: arrayError.details,
        hint: arrayError.hint,
        code: arrayError.code
      });
    } else {
      console.log('✅ Array test passed, ID:', arrayResult.id);
      // Clean up
      await supabase.from('automation_campaigns').delete().eq('id', arrayResult.id);
    }

    // Test 3: Test with all expected columns
    console.log('\n4️⃣ Testing with all columns...');
    const fullTest = {
      name: 'Debug Test 3 - Full',
      engine_type: 'web2_platforms',
      user_id: '00000000-0000-0000-0000-000000000000',
      status: 'draft',
      auto_start: false,
      keywords: ['seo tools', 'link building'],
      anchor_texts: ['best seo tools', 'click here'],
      target_url: 'https://example.com',
      links_built: 0,
      available_sites: 4,
      target_sites_used: [],
      published_articles: [],
      started_at: null
    };

    console.log('Full test data validation:');
    console.log('  keywords:', Array.isArray(fullTest.keywords), fullTest.keywords);
    console.log('  anchor_texts:', Array.isArray(fullTest.anchor_texts), fullTest.anchor_texts);
    console.log('  target_sites_used:', Array.isArray(fullTest.target_sites_used), fullTest.target_sites_used);
    console.log('  published_articles:', Array.isArray(fullTest.published_articles), fullTest.published_articles);

    const { data: fullResult, error: fullError } = await supabase
      .from('automation_campaigns')
      .insert(fullTest)
      .select()
      .single();

    if (fullError) {
      console.error('❌ Full test failed:', fullError);
      console.error('Full error details:', {
        message: fullError.message,
        details: fullError.details,
        hint: fullError.hint,
        code: fullError.code
      });

      // Try to understand which field is causing the issue
      if (fullError.message.includes('expected JSON array')) {
        console.log('\n🔍 JSON Array Error Analysis:');
        
        // Test each array field individually
        const fieldsToTest = [
          { name: 'keywords', value: fullTest.keywords },
          { name: 'anchor_texts', value: fullTest.anchor_texts },
          { name: 'target_sites_used', value: fullTest.target_sites_used },
          { name: 'published_articles', value: fullTest.published_articles }
        ];

        for (const field of fieldsToTest) {
          const testData = {
            name: `Debug ${field.name}`,
            engine_type: 'web2_platforms',
            user_id: '00000000-0000-0000-0000-000000000000',
            status: 'draft',
            [field.name]: field.value
          };

          const { error: fieldError } = await supabase
            .from('automation_campaigns')
            .insert(testData)
            .select()
            .single();

          if (fieldError) {
            console.log(`  ❌ ${field.name} causing issue:`, fieldError.message);
          } else {
            console.log(`  ✅ ${field.name} working fine`);
            // Clean up successful test
            const { data: cleanupData } = await supabase
              .from('automation_campaigns')
              .select('id')
              .eq('name', `Debug ${field.name}`)
              .single();
            if (cleanupData) {
              await supabase.from('automation_campaigns').delete().eq('id', cleanupData.id);
            }
          }
        }
      }
    } else {
      console.log('✅ Full test passed, ID:', fullResult.id);
      console.log('Retrieved data arrays:');
      console.log('  keywords:', Array.isArray(fullResult.keywords), fullResult.keywords);
      console.log('  anchor_texts:', Array.isArray(fullResult.anchor_texts), fullResult.anchor_texts);
      
      // Clean up
      await supabase.from('automation_campaigns').delete().eq('id', fullResult.id);
    }

    // Test 4: Check for any existing malformed data
    console.log('\n5️⃣ Checking for existing malformed data...');
    const { data: existingData, error: existingError } = await supabase
      .from('automation_campaigns')
      .select('id, name, keywords, anchor_texts, target_sites_used, published_articles')
      .limit(5);

    if (existingError) {
      console.error('❌ Error checking existing data:', existingError);
    } else if (existingData && existingData.length > 0) {
      console.log('📋 Sample existing data:');
      existingData.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name}:`);
        console.log(`    keywords: ${Array.isArray(row.keywords)} - ${JSON.stringify(row.keywords)}`);
        console.log(`    anchor_texts: ${Array.isArray(row.anchor_texts)} - ${JSON.stringify(row.anchor_texts)}`);
      });
    } else {
      console.log('📋 No existing campaign data found');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugCampaignInsertion();
