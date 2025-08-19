import { supabase } from '@/integrations/supabase/client';

export interface ConnectionDiagnostic {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  suggestion?: string;
}

export class SupabaseConnectionDiagnostics {
  
  static async runDiagnostics(): Promise<ConnectionDiagnostic[]> {
    const results: ConnectionDiagnostic[] = [];

    // 1. Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    results.push({
      test: 'Environment Variables',
      status: (supabaseUrl && supabaseKey) ? 'pass' : 'fail',
      message: (supabaseUrl && supabaseKey) 
        ? 'Supabase URL and key are configured'
        : 'Missing Supabase environment variables',
      suggestion: !supabaseUrl || !supabaseKey 
        ? 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
        : undefined
    });

    // 2. Check URL format
    if (supabaseUrl) {
      const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
      results.push({
        test: 'URL Format',
        status: isValidUrl ? 'pass' : 'fail',
        message: isValidUrl 
          ? 'Supabase URL format is correct'
          : 'Invalid Supabase URL format',
        suggestion: !isValidUrl 
          ? 'URL should be in format: https://your-project.supabase.co'
          : undefined
      });
    }

    // 3. Check key format
    if (supabaseKey) {
      const isValidKey = supabaseKey.startsWith('eyJ') && supabaseKey.length > 100;
      results.push({
        test: 'API Key Format',
        status: isValidKey ? 'pass' : 'fail',
        message: isValidKey 
          ? 'API key format is correct'
          : 'Invalid API key format',
        suggestion: !isValidKey 
          ? 'API key should be a long JWT token starting with "eyJ"'
          : undefined
      });
    }

    // 4. Test basic connectivity
    try {
      const startTime = Date.now();
      const response = await fetch(supabaseUrl + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const responseTime = Date.now() - startTime;

      results.push({
        test: 'Network Connectivity',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok 
          ? `Connected successfully (${responseTime}ms)`
          : `Connection failed (${response.status}: ${response.statusText})`,
        suggestion: !response.ok 
          ? 'Check your internet connection and firewall settings'
          : undefined
      });
    } catch (error: any) {
      results.push({
        test: 'Network Connectivity',
        status: 'fail',
        message: `Connection error: ${error.message}`,
        suggestion: 'Check your internet connection and try disabling browser extensions'
      });
    }

    // 5. Test authentication
    try {
      const { error } = await supabase.auth.getSession();
      results.push({
        test: 'Authentication',
        status: error ? 'warning' : 'pass',
        message: error 
          ? `Auth warning: ${error.message}`
          : 'Authentication service is working',
        suggestion: error 
          ? 'This may be normal if no user is signed in'
          : undefined
      });
    } catch (error: any) {
      results.push({
        test: 'Authentication',
        status: 'fail',
        message: `Auth error: ${error.message}`,
        suggestion: 'Check Supabase project settings and RLS policies'
      });
    }

    // 6. Test database connection
    try {
      const { error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      results.push({
        test: 'Database Access',
        status: error ? 'fail' : 'pass',
        message: error 
          ? `Database error: ${error.message}`
          : 'Database connection is working',
        suggestion: error 
          ? error.message.includes('relation') 
            ? 'Run database migrations to create missing tables'
            : 'Check RLS policies and table permissions'
          : undefined
      });
    } catch (error: any) {
      results.push({
        test: 'Database Access',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        suggestion: 'Verify database is running and accessible'
      });
    }

    return results;
  }

  static async quickHealthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  static getConnectionTips(): string[] {
    return [
      'Ensure you have a stable internet connection',
      'Try disabling browser extensions (especially ad blockers)',
      'Check if your firewall is blocking the connection',
      'Verify Supabase project is active and not paused',
      'Confirm environment variables are set correctly',
      'Try clearing browser cache and cookies',
      'Test from an incognito/private browser window'
    ];
  }

  static async logDiagnostics(): Promise<void> {
    console.group('🔍 Supabase Connection Diagnostics');
    
    const results = await this.runDiagnostics();
    
    results.forEach(result => {
      const emoji = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${emoji} ${result.test}: ${result.message}`);
      if (result.suggestion) {
        console.log(`   💡 ${result.suggestion}`);
      }
    });

    const tips = this.getConnectionTips();
    console.group('💡 Connection Tips');
    tips.forEach(tip => console.log(`• ${tip}`));
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  // Run diagnostics after a short delay to avoid blocking app startup
  setTimeout(() => {
    SupabaseConnectionDiagnostics.logDiagnostics().catch(console.error);
  }, 2000);
}

export default SupabaseConnectionDiagnostics;
