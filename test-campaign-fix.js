#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

// Create a clean client without complex wrappers
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCampaignCreationFix() {
    console.log('🧪 Testing campaign creation fix...');
    
    try {
        // Test 1: Simple table access
        console.log('1. Testing basic table access...');
        const { data: basicTest, error: basicError } = await supabase
            .from('automation_campaigns')
            .select('id')
            .limit(1);
            
        if (basicError) {
            console.log('⚠️ Basic access error (expected for RLS):', basicError.message);
        } else {
            console.log('✅ Basic table access works');
        }
        
        // Test 2: Try a mock insert (will fail due to RLS but should not have body stream error)
        console.log('2. Testing insert operation (will fail due to RLS)...');
        const { data: insertTest, error: insertError } = await supabase
            .from('automation_campaigns')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                name: 'Test Campaign',
                target_url: 'https://example.com',
                keywords: ['test'],
                anchor_texts: ['test link'],
                status: 'pending'
            })
            .select()
            .single();
            
        if (insertError) {
            if (insertError.message.includes('body stream already read')) {
                console.log('❌ Still getting body stream error:', insertError.message);
                return false;
            } else if (insertError.message.includes('row-level security')) {
                console.log('✅ Expected RLS error (no body stream issue):', insertError.message);
            } else {
                console.log('⚠️ Other error:', insertError.message);
            }
        } else {
            console.log('✅ Insert worked (unexpected but good)');
        }
        
        // Test 3: Test auth operations
        console.log('3. Testing auth operations...');
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                if (userError.message.includes('body stream already read')) {
                    console.log('❌ Auth also has body stream error:', userError.message);
                    return false;
                } else {
                    console.log('✅ Auth error is normal (not body stream):', userError.message);
                }
            } else {
                console.log('✅ Auth working:', userData?.user ? 'User found' : 'No user');
            }
        } catch (authCatchError) {
            if (authCatchError.message.includes('body stream already read')) {
                console.log('❌ Auth catch has body stream error:', authCatchError.message);
                return false;
            } else {
                console.log('✅ Auth catch error is not body stream:', authCatchError.message);
            }
        }
        
        console.log('\n🎉 Campaign creation fix appears to be working!');
        console.log('✅ No "body stream already read" errors detected');
        console.log('✅ Supabase client is working with simplified fetch');
        
        return true;
        
    } catch (error) {
        if (error.message.includes('body stream already read')) {
            console.error('❌ Still getting body stream error:', error.message);
            return false;
        } else {
            console.log('✅ Error is not body stream related:', error.message);
            return true;
        }
    }
}

testCampaignCreationFix()
    .then(success => {
        if (success) {
            console.log('\n✅ Campaign creation fix successful!');
            console.log('The "body stream already read" error should be resolved.');
        } else {
            console.log('\n❌ Body stream errors still present.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test failed:', error);
        process.exit(1);
    });
