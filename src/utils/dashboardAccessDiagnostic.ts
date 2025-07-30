/**
 * Dashboard Access Diagnostic Tool
 * Helps debug why users can't access the dashboard
 */

import { supabase } from '@/integrations/supabase/client';

export interface DashboardAccessResult {
  canAccess: boolean;
  issues: string[];
  recommendations: string[];
  authState: {
    hasSession: boolean;
    hasUser: boolean;
    emailVerified: boolean;
    userId?: string;
    userEmail?: string;
  };
  storageState: {
    hasAuthToken: boolean;
    hasRecentClaim: boolean;
    hasAuthError: boolean;
  };
}

export class DashboardAccessDiagnostic {
  static async checkDashboardAccess(): Promise<DashboardAccessResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let canAccess = false;

    // Check current auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const authState = {
      hasSession: !!session,
      hasUser: !!session?.user,
      emailVerified: !!session?.user?.email_confirmed_at,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    };

    // Check localStorage state
    const storageState = {
      hasAuthToken: localStorage.getItem('sb-dfhanacsmsvvkpunurnp-auth-token') !== null,
      hasRecentClaim: !!localStorage.getItem('recent_claim_operation'),
      hasAuthError: !!localStorage.getItem('recent_auth_error')
    };

    // Analyze issues
    if (sessionError) {
      issues.push(`Session error: ${sessionError.message}`);
      recommendations.push('Try signing out and signing back in');
    }

    if (!authState.hasSession) {
      issues.push('No active session found');
      recommendations.push('Sign in to access the dashboard');
    } else if (!authState.hasUser) {
      issues.push('Session exists but no user data');
      recommendations.push('Clear browser storage and sign in again');
    } else if (!authState.emailVerified) {
      issues.push('Email address not verified');
      recommendations.push('Check your email for verification link and click it');
    } else {
      canAccess = true;
    }

    // Check for fallback conditions
    if (!canAccess && (storageState.hasAuthToken || storageState.hasRecentClaim)) {
      canAccess = true;
      recommendations.push('Using fallback authentication - consider refreshing after sign in');
    }

    if (storageState.hasAuthError) {
      issues.push('Recent authentication error detected');
      recommendations.push('Clear recent auth errors and try again');
    }

    // Environment checks
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      recommendations.push('Development environment - auth issues may be normal');
    }

    return {
      canAccess,
      issues,
      recommendations,
      authState,
      storageState
    };
  }

  /**
   * Attempt to fix common dashboard access issues
   */
  static async fixDashboardAccess(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Attempting to fix dashboard access issues...');

      // Clear any auth errors
      localStorage.removeItem('recent_auth_error');
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        // User is properly authenticated
        console.log('✅ User is authenticated, access should work');
        return { success: true, message: 'Authentication verified - you should be able to access the dashboard' };
      }
      
      if (session?.user && !session.user.email_confirmed_at) {
        // User needs email verification
        console.log('📧 Sending verification email...');
        await supabase.auth.resend({
          type: 'signup',
          email: session.user.email!
        });
        return { success: false, message: 'Email verification required - check your email for verification link' };
      }
      
      // No session - need to sign in
      return { success: false, message: 'Please sign in to access the dashboard' };
      
    } catch (error: any) {
      console.error('Failed to fix dashboard access:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  /**
   * Force dashboard access using fallback method
   */
  static forceAllowDashboardAccess(): void {
    console.log('🚨 Force allowing dashboard access...');
    
    // Set fallback user data
    const fallbackUser = {
      id: 'fallback-' + Date.now(),
      email: 'fallback@user.com',
      email_confirmed_at: new Date().toISOString()
    };
    
    // Store in localStorage for EnhancedDashboardRouter to pick up
    localStorage.setItem('force_dashboard_access', JSON.stringify(fallbackUser));
    localStorage.setItem('recent_claim_operation', Date.now().toString());
    
    console.log('✅ Forced dashboard access enabled - navigate to /dashboard');
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).dashboardDiagnostic = DashboardAccessDiagnostic;
  console.log('🧪 Dashboard diagnostic available via window.dashboardDiagnostic');
}
