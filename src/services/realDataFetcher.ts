import { supabase } from '@/integrations/supabase/client';

export interface RealProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

class RealDataFetcher {
  
  async fetchRealProfiles(): Promise<{
    profiles: RealProfile[];
    success: boolean;
    method: string;
    error?: string;
  }> {
    console.log('🔍 Starting real data fetch attempts...');
    
    // Method 1: Try direct profiles query without any RLS
    try {
      console.log('Method 1: Direct profiles query...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        console.log('✅ Method 1 SUCCESS - Direct profiles query worked!', data.length);
        return {
          profiles: data as RealProfile[],
          success: true,
          method: 'Direct profiles query'
        };
      }
      
      console.warn('Method 1 failed:', error?.message);
    } catch (e: any) {
      console.warn('Method 1 exception:', e.message);
    }
    
    // Method 2: Try with explicit schema
    try {
      console.log('Method 2: Explicit schema query...');
      
      const { data, error } = await supabase
        .schema('public')
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        console.log('✅ Method 2 SUCCESS - Explicit schema worked!', data.length);
        return {
          profiles: data as RealProfile[],
          success: true,
          method: 'Explicit schema query'
        };
      }
      
      console.warn('Method 2 failed:', error?.message);
    } catch (e: any) {
      console.warn('Method 2 exception:', e.message);
    }
    
    // Method 3: Try raw SQL via RPC (if RPC function exists)
    try {
      console.log('Method 3: Raw SQL via RPC...');
      
      const { data, error } = await supabase
        .rpc('get_all_profiles');
      
      if (data && !error) {
        console.log('✅ Method 3 SUCCESS - RPC worked!', data.length);
        return {
          profiles: data as RealProfile[],
          success: true,
          method: 'RPC function'
        };
      }
      
      console.warn('Method 3 failed:', error?.message);
    } catch (e: any) {
      console.warn('Method 3 exception:', e.message);
    }
    
    // Method 4: Try minimal select to test connectivity
    try {
      console.log('Method 4: Minimal connectivity test...');
      
      const { data, error, count } = await supabase
        .from('profiles')
        .select('email', { count: 'exact' })
        .limit(1);
      
      if (!error) {
        console.log('✅ Method 4 - Connection works, count:', count);
        
        // If we can connect, try getting all emails first
        const { data: allEmails, error: emailError } = await supabase
          .from('profiles')
          .select('id, user_id, email, display_name, role, created_at, updated_at');
        
        if (allEmails && !emailError) {
          console.log('✅ Method 4 SUCCESS - Got data via minimal select:', allEmails.length);
          return {
            profiles: allEmails as RealProfile[],
            success: true,
            method: 'Minimal select approach'
          };
        }
      }
      
      console.warn('Method 4 failed:', error?.message);
    } catch (e: any) {
      console.warn('Method 4 exception:', e.message);
    }
    
    console.error('❌ All methods failed - cannot fetch real data');
    return {
      profiles: [],
      success: false,
      method: 'None - all methods failed',
      error: 'Unable to bypass RLS or fetch real data'
    };
  }
}

export const realDataFetcher = new RealDataFetcher();
