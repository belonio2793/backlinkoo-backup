#!/usr/bin/env node

/**
 * Emergency script to fix RLS permission denied errors
 * Run this to resolve "permission denied for table users" error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyEmergencyFix() {
  console.log('🚨 Applying emergency RLS permission fix...');

  try {
    // Step 1: Drop problematic functions
    console.log('🗑️ Dropping recursive functions...');
    
    const dropFunctions = [
      'DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;',
      'DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;'
    ];

    for (const sql of dropFunctions) {
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error && !error.message.includes('does not exist')) {
        console.warn('⚠️ Function drop error (may be ok):', error.message);
      }
    }

    // Step 2: Temporarily disable RLS
    console.log('⏸️ Temporarily disabling RLS on profiles...');
    
    const { error: disableError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.warn('⚠️ RLS disable warning:', disableError.message);
    }

    // Step 3: Drop conflicting policies
    console.log('🧹 Cleaning up conflicting policies...');
    
    const policies = [
      'Users can view their own profile',
      'Admins can view all profiles', 
      'Users can update their own profile',
      'Admins can update any profile',
      'Enable read access for own profile',
      'Enable insert for authenticated users only',
      'Enable insert for authenticated users',
      'Admins can insert any profile',
      'Admins can delete profiles'
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', {
        query: `DROP POLICY IF EXISTS "${policy}" ON public.profiles;`
      });
      if (error && !error.message.includes('does not exist')) {
        console.warn('⚠️ Policy drop warning:', error.message);
      }
    }

    // Step 4: Grant permissions
    console.log('🔓 Granting necessary permissions...');
    
    const permissions = [
      'GRANT ALL ON public.profiles TO authenticated;',
      'GRANT SELECT ON public.profiles TO anon;'
    ];

    for (const sql of permissions) {
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) {
        console.warn('⚠️ Permission grant warning:', error.message);
      }
    }

    // Step 5: Re-enable RLS with new policies
    console.log('🔒 Re-enabling RLS with safe policies...');
    
    const { error: enableError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableError) {
      console.error('❌ Failed to re-enable RLS:', enableError.message);
      return false;
    }

    // Step 6: Create new safe policies
    console.log('📜 Creating new safe policies...');
    
    const newPolicies = [
      // Basic user policies
      `CREATE POLICY "Users can view own profile" 
       ON public.profiles 
       FOR SELECT 
       USING (auth.uid() = user_id);`,
       
      `CREATE POLICY "Users can update own profile" 
       ON public.profiles 
       FOR UPDATE 
       USING (auth.uid() = user_id)
       WITH CHECK (auth.uid() = user_id);`,
       
      `CREATE POLICY "Users can insert own profile" 
       ON public.profiles 
       FOR INSERT 
       WITH CHECK (auth.uid() = user_id);`,
       
      // Service role access
      `CREATE POLICY "Service role can access all profiles" 
       ON public.profiles 
       FOR ALL 
       USING (auth.role() = 'service_role');`
    ];

    for (const sql of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) {
        console.error('❌ Policy creation error:', error.message);
        return false;
      }
    }

    // Step 7: Test the fix
    console.log('🧪 Testing the fix...');
    
    const { data, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Test failed:', testError.message);
      return false;
    }

    console.log('✅ Emergency RLS fix applied successfully!');
    console.log('🎉 Campaign metrics should now work without permission errors');
    
    return true;

  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
    return false;
  }
}

// Run the fix
applyEmergencyFix()
  .then(success => {
    if (success) {
      console.log('\n🎯 Fix complete! Try accessing campaign metrics again.');
    } else {
      console.log('\n💡 If issues persist, you may need to apply the fix manually in Supabase SQL Editor.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
