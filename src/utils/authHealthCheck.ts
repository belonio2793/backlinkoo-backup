/**
 * Authentication Health Check Utility
 * Helps diagnose authentication connection issues
 */
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/authService';

export interface HealthCheckResult {
  supabaseConnection: boolean;
  supabaseSession: boolean;
  authServiceSession: boolean;
  localStorage: boolean;
  networkConnectivity: boolean;
  overallHealth: 'good' | 'degraded' | 'critical';
  errors: string[];
  recommendations: string[];
}

export const runAuthHealthCheck = async (): Promise<HealthCheckResult> => {
  const result: HealthCheckResult = {
    supabaseConnection: false,
    supabaseSession: false,
    authServiceSession: false,
    localStorage: false,
    networkConnectivity: navigator.onLine,
    overallHealth: 'critical',
    errors: [],
    recommendations: []
  };

  console.log('🏥 Running authentication health check...');

  // Test 1: Supabase Connection
  try {
    const startTime = Date.now();
    await supabase.from('profiles').select('count').limit(1);
    const duration = Date.now() - startTime;
    result.supabaseConnection = true;
    if (duration > 3000) {
      result.errors.push(`Supabase connection slow (${duration}ms)`);
    }
  } catch (error: any) {
    result.errors.push(`Supabase connection failed: ${error.message}`);
  }

  // Test 2: Supabase Session Check
  try {
    const { data, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      )
    ]) as any;
    
    if (!error && data) {
      result.supabaseSession = true;
    } else {
      result.errors.push(`Supabase session error: ${error?.message || 'Unknown'}`);
    }
  } catch (error: any) {
    result.errors.push(`Supabase session check failed: ${error.message}`);
  }

  // Test 3: AuthService Check
  try {
    const { session } = await AuthService.getCurrentSession();
    result.authServiceSession = !!session;
  } catch (error: any) {
    result.errors.push(`AuthService failed: ${error.message}`);
  }

  // Test 4: LocalStorage Check
  try {
    const hasAuthToken = !!localStorage.getItem('sb-dfhanacsmsvvkpunurnp-auth-token');
    result.localStorage = hasAuthToken;
    if (!hasAuthToken) {
      result.recommendations.push('No authentication token found in localStorage');
    }
  } catch (error: any) {
    result.errors.push(`LocalStorage check failed: ${error.message}`);
  }

  // Determine overall health
  const healthyServices = [
    result.supabaseConnection,
    result.supabaseSession,
    result.authServiceSession,
    result.networkConnectivity
  ].filter(Boolean).length;

  if (healthyServices >= 3) {
    result.overallHealth = 'good';
  } else if (healthyServices >= 2) {
    result.overallHealth = 'degraded';
  } else {
    result.overallHealth = 'critical';
  }

  // Add recommendations
  if (!result.networkConnectivity) {
    result.recommendations.push('Check internet connection');
  }
  if (!result.supabaseConnection) {
    result.recommendations.push('Supabase service may be down or blocked');
  }
  if (result.errors.some(e => e.includes('timeout'))) {
    result.recommendations.push('Try refreshing the page or clearing browser cache');
  }
  if (result.overallHealth === 'critical') {
    result.recommendations.push('Contact support if issues persist');
  }

  console.log('🏥 Health check complete:', result);
  return result;
};

// Make available for debugging
if (typeof window !== 'undefined') {
  (window as any).runAuthHealthCheck = runAuthHealthCheck;
}
