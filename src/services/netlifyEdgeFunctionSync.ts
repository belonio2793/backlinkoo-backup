/**
 * Netlify Edge Function Sync Service
 * Uses Supabase Edge Functions to sync domains from Netlify
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EdgeFunctionSyncResult {
  success: boolean;
  message: string;
  totalDomains: number;
  syncedDomains: number;
  errors: string[];
  domains?: any[];
}

class NetlifyEdgeFunctionSync {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly EDGE_FUNCTION_URL = `${this.SUPABASE_URL}/functions/v1/netlify-domains`;

  /**
   * Sync domains from Netlify using Supabase Edge Function
   */
  async syncDomainsViaEdgeFunction(): Promise<EdgeFunctionSyncResult> {
    console.log('🚀 Starting Netlify sync via Supabase Edge Function...');
    
    const result: EdgeFunctionSyncResult = {
      success: false,
      message: '',
      totalDomains: 0,
      syncedDomains: 0,
      errors: []
    };

    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        result.errors.push('User not authenticated');
        result.message = 'Authentication required';
        return result;
      }

      console.log('📡 Calling Netlify domains edge function...');
      
      // Call the edge function to fetch and sync domains
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Edge function error: ${response.status} - ${errorText}`;
        console.error('❌', errorMessage);
        
        result.errors.push(errorMessage);
        result.message = `Failed to sync: ${response.status}`;
        return result;
      }

      const domains = await response.json();
      console.log(`✅ Edge function returned ${domains?.length || 0} domains`);

      // Update result with success data
      result.success = true;
      result.totalDomains = domains?.length || 0;
      result.syncedDomains = domains?.length || 0;
      result.domains = domains;
      result.message = `Successfully synced ${result.totalDomains} domains from Netlify`;

      console.log(`✅ Sync complete: ${result.message}`);
      return result;

    } catch (error: any) {
      console.error('❌ Edge function sync failed:', error);
      result.errors.push(`Sync error: ${error.message}`);
      result.message = `Sync failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Add domain to Netlify via edge function
   */
  async addDomainViaEdgeFunction(domain: string): Promise<EdgeFunctionSyncResult> {
    console.log(`🚀 Adding domain ${domain} via Supabase Edge Function...`);
    
    const result: EdgeFunctionSyncResult = {
      success: false,
      message: '',
      totalDomains: 0,
      syncedDomains: 0,
      errors: []
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        result.errors.push('User not authenticated');
        result.message = 'Authentication required';
        return result;
      }

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to add domain: ${response.status} - ${errorText}`;
        console.error('❌', errorMessage);
        
        result.errors.push(errorMessage);
        result.message = errorMessage;
        return result;
      }

      const addResult = await response.json();
      console.log(`✅ Domain ${domain} added successfully`);

      result.success = true;
      result.syncedDomains = 1;
      result.message = `Successfully added domain ${domain} to Netlify`;

      return result;

    } catch (error: any) {
      console.error('❌ Add domain via edge function failed:', error);
      result.errors.push(`Add domain error: ${error.message}`);
      result.message = `Failed to add domain: ${error.message}`;
      return result;
    }
  }

  /**
   * Remove domain from Netlify via edge function
   */
  async removeDomainViaEdgeFunction(domain: string): Promise<EdgeFunctionSyncResult> {
    console.log(`🚀 Removing domain ${domain} via Supabase Edge Function...`);
    
    const result: EdgeFunctionSyncResult = {
      success: false,
      message: '',
      totalDomains: 0,
      syncedDomains: 0,
      errors: []
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        result.errors.push('User not authenticated');
        result.message = 'Authentication required';
        return result;
      }

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to remove domain: ${response.status} - ${errorText}`;
        console.error('❌', errorMessage);
        
        result.errors.push(errorMessage);
        result.message = errorMessage;
        return result;
      }

      const removeResult = await response.json();
      console.log(`✅ Domain ${domain} removed successfully`);

      result.success = true;
      result.syncedDomains = 1;
      result.message = `Successfully removed domain ${domain} from Netlify`;

      return result;

    } catch (error: any) {
      console.error('❌ Remove domain via edge function failed:', error);
      result.errors.push(`Remove domain error: ${error.message}`);
      result.message = `Failed to remove domain: ${error.message}`;
      return result;
    }
  }

  /**
   * Test edge function connectivity
   */
  async testEdgeFunctionConnection(): Promise<{
    success: boolean;
    message: string;
    edgeFunctionUrl?: string;
  }> {
    try {
      console.log('🔍 Testing edge function connectivity...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Authentication required to test edge function'
        };
      }

      // Try a simple connectivity test
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Edge function is deployed and accessible',
          edgeFunctionUrl: this.EDGE_FUNCTION_URL
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Edge function error: ${response.status} - ${errorText}`,
          edgeFunctionUrl: this.EDGE_FUNCTION_URL
        };
      }

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        edgeFunctionUrl: this.EDGE_FUNCTION_URL
      };
    }
  }

  /**
   * Get edge function deployment status
   */
  getDeploymentInstructions(): {
    isDeployed: boolean;
    deployCommand: string;
    functionPath: string;
    instructions: string[];
  } {
    return {
      isDeployed: false, // Will be true once deployed
      deployCommand: 'supabase functions deploy netlify-domains --no-verify-jwt',
      functionPath: 'supabase/functions/netlify-domains/index.ts',
      instructions: [
        '1. Ensure Supabase CLI is installed and authenticated',
        '2. Run: supabase functions deploy netlify-domains --no-verify-jwt',
        '3. Verify deployment in Supabase Dashboard > Edge Functions',
        '4. Test the function using the "Test Connection" button',
        '5. Use "Sync from Netlify" to pull domains via edge function'
      ]
    };
  }
}

// Export singleton instance
export const netlifyEdgeFunctionSync = new NetlifyEdgeFunctionSync();

// Export convenience functions
export const syncDomainsViaEdgeFunction = () => netlifyEdgeFunctionSync.syncDomainsViaEdgeFunction();
export const addDomainViaEdgeFunction = (domain: string) => netlifyEdgeFunctionSync.addDomainViaEdgeFunction(domain);
export const removeDomainViaEdgeFunction = (domain: string) => netlifyEdgeFunctionSync.removeDomainViaEdgeFunction(domain);
export const testEdgeFunctionConnection = () => netlifyEdgeFunctionSync.testEdgeFunctionConnection();
export const getEdgeFunctionDeploymentInfo = () => netlifyEdgeFunctionSync.getDeploymentInstructions();
