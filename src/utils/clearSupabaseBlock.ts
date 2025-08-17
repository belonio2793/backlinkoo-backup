/**
 * Immediate fix for Supabase connection block
 * This utility immediately clears the localStorage flag that blocks Supabase requests
 */

/**
 * Clear the Supabase connection failure flag immediately
 */
export function clearSupabaseConnectionBlock(): void {
  try {
    console.log('🔧 Clearing Supabase connection block...');
    
    // Remove the flag that blocks Supabase requests
    localStorage.removeItem('supabase_connection_failed');
    
    // Also clear any other related flags that might exist
    localStorage.removeItem('supabase_error_flag');
    localStorage.removeItem('network_error_flag');
    
    console.log('✅ Supabase connection block cleared successfully');
    
    // Refresh the page to restart all services
    if (typeof window !== 'undefined') {
      console.log('🔄 Refreshing page to restart services...');
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Failed to clear Supabase connection block:', error);
  }
}

/**
 * Check if the connection is currently blocked
 */
export function isSupabaseConnectionBlocked(): boolean {
  try {
    return localStorage.getItem('supabase_connection_failed') === 'true';
  } catch (error) {
    console.error('❌ Failed to check connection block status:', error);
    return false;
  }
}

// Auto-clear if we detect the block on module load
if (typeof window !== 'undefined' && isSupabaseConnectionBlocked()) {
  console.log('🚨 Detected Supabase connection block on page load - auto-clearing...');
  clearSupabaseConnectionBlock();
}
