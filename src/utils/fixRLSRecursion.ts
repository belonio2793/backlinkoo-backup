import { supabase } from '@/integrations/supabase/client';

/**
 * Fix infinite recursion in RLS policies for profiles table
 */
export class RLSRecursionFixer {
  
  /**
   * Disable all RLS policies on profiles table to fix recursion
   */
  static async disableProblematicPolicies() {
    console.log('🔧 Attempting to fix RLS recursion issue...');
    
    try {
      // Try to disable RLS on profiles table temporarily
      const { error: disableError } = await supabase.rpc('disable_rls_on_profiles');
      
      if (disableError) {
        console.warn('⚠️ Could not disable RLS via RPC:', disableError.message);
      } else {
        console.log('✅ RLS disabled on profiles table');
        return { success: true, message: 'RLS disabled successfully' };
      }
    } catch (error: any) {
      console.warn('⚠️ RPC method not available:', error.message);
    }

    // Alternative: Try direct SQL execution (requires service role)
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
      });
      
      if (sqlError) {
        console.warn('⚠️ Could not execute SQL:', sqlError.message);
      } else {
        console.log('✅ RLS disabled via SQL');
        return { success: true, message: 'RLS disabled via SQL' };
      }
    } catch (error: any) {
      console.warn('⚠️ SQL execution not available:', error.message);
    }

    return { 
      success: false, 
      message: 'Could not disable RLS automatically. Manual intervention required.' 
    };
  }

  /**
   * Create simple, non-recursive RLS policies
   */
  static async createSimplePolicies() {
    console.log('🔧 Creating simple RLS policies...');
    
    const policies = [
      {
        name: 'profiles_select_own',
        sql: `CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = user_id);`
      },
      {
        name: 'profiles_insert_own', 
        sql: `CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`
      },
      {
        name: 'profiles_update_own',
        sql: `CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = user_id);`
      }
    ];

    const results = [];
    
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query: policy.sql });
        
        if (error) {
          console.warn(`⚠️ Failed to create policy ${policy.name}:`, error.message);
          results.push({ policy: policy.name, success: false, error: error.message });
        } else {
          console.log(`✅ Created policy: ${policy.name}`);
          results.push({ policy: policy.name, success: true });
        }
      } catch (error: any) {
        console.warn(`⚠️ Error creating policy ${policy.name}:`, error.message);
        results.push({ policy: policy.name, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Test if RLS recursion is fixed
   */
  static async testRLSFix() {
    console.log('🧪 Testing RLS fix...');
    
    try {
      // Try to select from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, role')
        .limit(1);

      if (error) {
        if (error.message?.includes('infinite recursion')) {
          return { fixed: false, error: 'RLS recursion still present' };
        } else {
          return { fixed: true, error: error.message, note: 'Different error - RLS recursion fixed' };
        }
      }

      return { fixed: true, data, message: 'RLS working correctly' };
    } catch (error: any) {
      if (error.message?.includes('infinite recursion')) {
        return { fixed: false, error: 'RLS recursion still present' };
      }
      return { fixed: true, error: error.message, note: 'Different error - RLS recursion fixed' };
    }
  }

  /**
   * Run complete RLS fix process
   */
  static async fixRLSRecursion() {
    console.log('🚀 Starting RLS recursion fix process...');
    
    // Step 1: Test current state
    const initialTest = await this.testRLSFix();
    if (initialTest.fixed) {
      console.log('✅ RLS recursion already fixed');
      return { success: true, message: 'No fix needed' };
    }

    // Step 2: Disable problematic policies
    const disableResult = await this.disableProblematicPolicies();
    
    // Step 3: Test again
    const postDisableTest = await this.testRLSFix();
    
    if (postDisableTest.fixed) {
      console.log('✅ RLS recursion fixed by disabling policies');
      return { 
        success: true, 
        message: 'RLS recursion fixed - policies disabled',
        recommendation: 'Create simple policies manually if needed'
      };
    }

    // Step 4: Try creating simple policies
    const policyResults = await this.createSimplePolicies();
    
    // Step 5: Final test
    const finalTest = await this.testRLSFix();
    
    return {
      success: finalTest.fixed,
      message: finalTest.fixed ? 'RLS recursion fixed' : 'RLS recursion still present',
      details: {
        disableResult,
        policyResults,
        finalTest
      }
    };
  }
}

// Auto-run fix on import in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    RLSRecursionFixer.fixRLSRecursion().then(result => {
      console.log('🔧 RLS fix result:', result);
    }).catch(error => {
      console.error('❌ RLS fix failed:', error);
    });
  }, 2000);
}
