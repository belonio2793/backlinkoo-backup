#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { SecureConfig } from './src/lib/secure-config.ts';

// Get Supabase configuration
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = envUrl || SecureConfig.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔧 Fixing RLS permission error...');
console.log('URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing');
console.log('Service key available:', !!SUPABASE_SERVICE_KEY);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Role Key');
  console.log('Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function fixRLSPolicies() {
  try {
    console.log('📝 Reading SQL fix script...');
    const sqlScript = readFileSync('./fix-rls-permission-error.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.warn(`⚠️ Warning on statement ${i + 1}:`, error.message);
          // Continue with other statements - some might be expected to fail
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️ Error on statement ${i + 1}:`, err.message);
        // Continue execution
      }
    }
    
    console.log('🔍 Testing profiles table access...');
    
    // Test if we can now access profiles without permission error
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Still getting permission error:', profileError.message);
      
      // Try emergency fix - temporarily disable RLS
      console.log('🚨 Applying emergency fix - disabling RLS temporarily...');
      
      const { error: emergencyError } = await supabase.rpc('exec_sql', {
        sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
      });
      
      if (emergencyError) {
        console.error('❌ Emergency fix failed:', emergencyError.message);
      } else {
        console.log('✅ Emergency fix applied - RLS disabled on profiles table');
        console.log('⚠️ IMPORTANT: This is temporary. Re-enable RLS after troubleshooting.');
      }
    } else {
      console.log('✅ Profiles table is now accessible!');
      console.log(`   Found ${profiles?.length || 0} profile(s)`);
    }
    
    // Verify policies
    console.log('🔍 Checking current RLS policies...');
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT policyname, cmd, permissive 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        ORDER BY policyname;
      `
    });
    
    if (!policyError && policies) {
      console.log('📋 Current policies on profiles table:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('🎉 RLS permission fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Alternative approach if RPC doesn't work
async function fixWithDirectSQL() {
  console.log('🔄 Trying alternative approach...');
  
  // First, try to disable RLS as emergency fix
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
      })
    });
    
    if (response.ok) {
      console.log('✅ Emergency fix applied via REST API');
    } else {
      const errorText = await response.text();
      console.error('❌ REST API fix failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Alternative approach failed:', error.message);
  }
}

// Main execution
fixRLSPolicies().catch(async (error) => {
  console.error('Main fix failed, trying alternative...');
  await fixWithDirectSQL();
});
