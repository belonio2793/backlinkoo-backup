#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSchema() {
    console.log('🔍 Testing automation schema...');
    
    try {
        // Test 1: Check if automation_campaigns table exists
        console.log('1. Checking automation_campaigns table...');
        const { data, error } = await supabase
            .from('automation_campaigns')
            .select('id')
            .limit(1);
            
        if (error) {
            if (error.message.includes('relation "automation_campaigns" does not exist')) {
                console.log('❌ automation_campaigns table does not exist');
                console.log('');
                console.log('🛠️ SOLUTION: Run this SQL in your Supabase SQL Editor:');
                console.log('');
                console.log('Copy the contents of: EMERGENCY_AUTOMATION_SCHEMA_FIX.sql');
                console.log('');
                return false;
            } else {
                console.log('❌ Error accessing table:', error.message);
                return false;
            }
        }
        
        console.log('✅ automation_campaigns table exists');
        
        // Test 2: Check required columns
        console.log('2. Checking required columns...');
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000', // placeholder
            name: 'Schema Test Campaign',
            target_url: 'https://example.com',
            keywords: ['test'],
            anchor_texts: ['test link'],
            auto_start: false
        };
        
        const { error: insertError } = await supabase
            .from('automation_campaigns')
            .insert(testData)
            .select();
            
        if (insertError) {
            console.log('❌ Column test failed:', insertError.message);
            
            if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
                console.log('');
                console.log('🛠️ SOLUTION: Missing columns detected');
                console.log('Run this SQL in your Supabase SQL Editor:');
                console.log('');
                console.log('Copy the contents of: EMERGENCY_AUTOMATION_SCHEMA_FIX.sql');
                console.log('');
            }
            return false;
        }
        
        console.log('✅ All required columns exist');
        console.log('');
        console.log('🎉 Automation schema is ready!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testSchema()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
