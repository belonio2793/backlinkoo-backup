import { BlogSystemDiagnostic } from './blogSystemDiagnostic';

// Safe wrapper for diagnostic functions that might fail
export class SafeDiagnostic {
  static async runSafeDiagnostic() {
    try {
      const diagnostic = new BlogSystemDiagnostic();
      return await diagnostic.runFullDiagnostic();
    } catch (error) {
      console.warn('Diagnostic failed, returning safe fallback:', error);
      return [{
        component: 'Diagnostic',
        status: 'warning' as const,
        message: 'Diagnostic system temporarily unavailable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }];
    }
  }

  static async getQuickStatus() {
    try {
      // Since getQuickStatus doesn't exist, create a safe version
      const diagnostic = new BlogSystemDiagnostic();
      const results = await diagnostic.runFullDiagnostic();
      
      // Return a simplified status
      return {
        overall: results.some(r => r.status === 'error') ? 'error' : 
                results.some(r => r.status === 'warning') ? 'warning' : 'success',
        components: results.length,
        errors: results.filter(r => r.status === 'error').length,
        warnings: results.filter(r => r.status === 'warning').length
      };
    } catch (error) {
      console.warn('Quick status check failed:', error);
      return {
        overall: 'warning' as const,
        components: 0,
        errors: 0,
        warnings: 1,
        message: 'Status check temporarily unavailable'
      };
    }
  }
}
