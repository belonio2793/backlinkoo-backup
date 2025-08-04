import { supabase } from '@/integrations/supabase/client';

/**
 * Debug utility to help identify where "permission denied for table users" errors are coming from
 */
export class ProfileErrorDebugger {
  
  /**
   * Test profile operations with detailed error logging
   */
  static async testProfileOperations() {
    console.log('🔍 Running profile operations debug test...');
    
    const results = {
      getUserProfile: null as any,
      createProfile: null as any,
      updateProfile: null as any,
      listProfiles: null as any,
      checkAuthUser: null as any
    };
    
    try {
      // Test 1: Get current auth user
      console.log('1. Testing auth.getUser()...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.checkAuthUser = { user: user?.email, error: authError?.message };
      
      if (authError) {
        console.error('❌ Auth error:', authError.message);
      } else {
        console.log('✅ Auth user:', user?.email);
      }
      
      if (!user) {
        console.log('ℹ️ No authenticated user - skipping profile tests');
        return results;
      }
      
      // Test 2: Get user profile
      console.log('2. Testing profiles table read...');
      try {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        results.getUserProfile = { 
          found: !!profile, 
          error: fetchError?.message,
          profile: profile ? { email: profile.email, role: profile.role } : null
        };
        
        if (fetchError) {
          console.error('❌ Profile fetch error:', fetchError.message);
          this.analyzeError(fetchError);
        } else {
          console.log('✅ Profile found:', profile?.email, 'Role:', profile?.role);
        }
      } catch (error: any) {
        console.error('❌ Unexpected profile fetch error:', error.message);
        results.getUserProfile = { error: error.message };
        this.analyzeError(error);
      }
      
      // Test 3: List all profiles (admin operation)
      console.log('3. Testing profiles table list...');
      try {
        const { data: profiles, error: listError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(5);
          
        results.listProfiles = { 
          count: profiles?.length || 0, 
          error: listError?.message 
        };
        
        if (listError) {
          console.error('❌ Profile list error:', listError.message);
          this.analyzeError(listError);
        } else {
          console.log('✅ Profiles listed:', profiles?.length || 0);
        }
      } catch (error: any) {
        console.error('❌ Unexpected profile list error:', error.message);
        results.listProfiles = { error: error.message };
        this.analyzeError(error);
      }
      
      // Test 4: Try to update profile
      console.log('4. Testing profile update...');
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
          
        results.updateProfile = { 
          success: !updateError, 
          error: updateError?.message 
        };
        
        if (updateError) {
          console.error('❌ Profile update error:', updateError.message);
          this.analyzeError(updateError);
        } else {
          console.log('✅ Profile updated successfully');
        }
      } catch (error: any) {
        console.error('❌ Unexpected profile update error:', error.message);
        results.updateProfile = { error: error.message };
        this.analyzeError(error);
      }
      
      // Test 5: Try to create a test profile (if current doesn't exist)
      if (!results.getUserProfile?.found) {
        console.log('5. Testing profile creation...');
        try {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
              role: 'user'
            });
            
          results.createProfile = { 
            success: !createError, 
            error: createError?.message 
          };
          
          if (createError) {
            console.error('❌ Profile creation error:', createError.message);
            this.analyzeError(createError);
          } else {
            console.log('✅ Profile created successfully');
          }
        } catch (error: any) {
          console.error('❌ Unexpected profile creation error:', error.message);
          results.createProfile = { error: error.message };
          this.analyzeError(error);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Unexpected error during profile debug:', error.message);
    }
    
    console.log('🔍 Profile debug test complete. Results:', results);
    return results;
  }
  
  /**
   * Analyze error message and provide debugging information
   */
  static analyzeError(error: any) {
    const message = error.message || error;
    
    if (message.includes('permission denied for table users')) {
      console.log('🚨 DETECTED: "permission denied for table users" error');
      console.log('💡 This suggests:');
      console.log('   1. A database trigger is trying to access "auth.users" directly');
      console.log('   2. An RLS policy has a condition that queries "auth.users"');
      console.log('   3. A function/procedure is trying to join with "auth.users"');
      console.log('   4. There might be a table actually named "users" (not "profiles")');
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('   1. Check database triggers on profiles table');
      console.log('   2. Review RLS policies for auth.users references');
      console.log('   3. Ensure all code uses "profiles" table, not "users"');
      console.log('   4. Check for any database views or aliases');
    }
    
    if (message.includes('RLS')) {
      console.log('🛡️ This appears to be a Row Level Security (RLS) related error');
    }
    
    if (message.includes('relation') && message.includes('does not exist')) {
      console.log('📋 This suggests a table or view name mismatch');
    }
  }
  
  /**
   * Check database schema for any tables named "users"
   */
  static async checkDatabaseSchema() {
    console.log('📊 Checking database schema for "users" table...');
    
    try {
      // Try to query information_schema to see if there's a users table
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%users%');
        
      if (data) {
        console.log('📋 Tables with "users" in name:', data);
      }
      
      if (error) {
        console.log('ℹ️ Could not query information_schema (normal in some setups)');
      }
    } catch (error) {
      console.log('ℹ️ Schema check not available in this environment');
    }
  }
}

// Auto-run debug check when imported in development
if (process.env.NODE_ENV === 'development') {
  // Run a delayed check to avoid immediate execution during imports
  setTimeout(() => {
    ProfileErrorDebugger.checkDatabaseSchema();
  }, 2000);
}
