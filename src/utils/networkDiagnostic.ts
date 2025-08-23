/**
 * Network Diagnostic Utility
 * Helps diagnose connectivity issues with Supabase and Netlify functions
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForUI } from './errorUtils';

export interface DiagnosticResult {
  service: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

export class NetworkDiagnostic {
  
  /**
   * Run comprehensive network diagnostics
   */
  static async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    console.log('🔍 Starting network diagnostic...');
    
    // Test Supabase connectivity
    results.push(await this.testSupabaseConnection());
    
    // Test Netlify function connectivity
    results.push(await this.testNetlifyFunction());
    
    // Test environment variables
    results.push(await this.testEnvironmentVariables());
    
    console.log('✅ Network diagnostic completed:', results);
    return results;
  }
  
  /**
   * Test Supabase database connectivity
   */
  static async testSupabaseConnection(): Promise<DiagnosticResult> {
    try {
      console.log('🔄 Testing Supabase connection...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (error) {
        return {
          service: 'Supabase',
          status: 'error',
          message: `Database connection failed: ${formatErrorForUI(error)}`,
          details: error,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        service: 'Supabase',
        status: 'success',
        message: 'Database connection successful',
        details: { recordsReturned: data?.length || 0 },
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      return {
        service: 'Supabase',
        status: 'error',
        message: `Network error: ${formatErrorForUI(error)}`,
        details: error,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Test Netlify function availability
   */
  static async testNetlifyFunction(): Promise<DiagnosticResult> {
    try {
      console.log('🔄 Testing Netlify function connectivity...');
      
      const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'test-diagnostic.example.com',
          domainId: 'diagnostic-test'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          service: 'Netlify Function',
          status: 'warning',
          message: `Function responded with ${response.status}: ${response.statusText}`,
          details: { status: response.status, error: errorText },
          timestamp: new Date().toISOString()
        };
      }
      
      const result = await response.json();
      
      return {
        service: 'Netlify Function',
        status: 'success',
        message: 'Function is accessible and responding',
        details: { responseReceived: !!result },
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      return {
        service: 'Netlify Function',
        status: 'error',
        message: `Network error: ${formatErrorForUI(error)}`,
        details: error,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Check environment variables and configuration
   */
  static async testEnvironmentVariables(): Promise<DiagnosticResult> {
    try {
      const envCheck = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        hasNetlifyToken: !!import.meta.env.VITE_NETLIFY_ACCESS_TOKEN,
        hasNetlifySiteId: !!import.meta.env.VITE_NETLIFY_SITE_ID,
      };
      
      const missingVars = Object.entries(envCheck)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        return {
          service: 'Environment Variables',
          status: 'warning',
          message: `Some environment variables are missing: ${missingVars.join(', ')}`,
          details: envCheck,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        service: 'Environment Variables',
        status: 'success',
        message: 'All required environment variables are configured',
        details: envCheck,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      return {
        service: 'Environment Variables',
        status: 'error',
        message: `Configuration check failed: ${formatErrorForUI(error)}`,
        details: error,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Quick connectivity test for user service issues
   */
  static async quickConnectivityTest(): Promise<boolean> {
    try {
      // Simple connectivity test
      const results = await Promise.allSettled([
        this.testSupabaseConnection(),
        this.testNetlifyFunction()
      ]);
      
      const hasSuccessfulConnection = results.some(result => 
        result.status === 'fulfilled' && result.value.status === 'success'
      );
      
      return hasSuccessfulConnection;
      
    } catch (error) {
      console.warn('⚠️ Quick connectivity test failed:', error);
      return false;
    }
  }
}

/**
 * Export diagnostic function for easy use
 */
export const runNetworkDiagnostic = NetworkDiagnostic.runFullDiagnostic;
export const quickConnectivityTest = NetworkDiagnostic.quickConnectivityTest;
