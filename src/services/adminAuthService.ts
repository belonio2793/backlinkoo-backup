/**
 * Admin Authentication Service
 * Handles admin-specific authentication with username/password
 */

export interface AdminAuthResult {
  success: boolean;
  error?: string;
}

export class AdminAuthService {
  private static readonly ADMIN_USERNAME = 'admin';
  private static readonly ADMIN_PASSWORD = 'password';
  private static readonly ADMIN_SESSION_KEY = 'admin_authenticated';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Authenticate admin with username and password
   */
  static async authenticateAdmin(username: string, password: string): Promise<AdminAuthResult> {
    try {
      console.log('🔐 AdminAuth: Attempting admin authentication');

      if (username.trim() !== this.ADMIN_USERNAME) {
        return {
          success: false,
          error: 'Invalid username'
        };
      }

      if (password !== this.ADMIN_PASSWORD) {
        return {
          success: false,
          error: 'Invalid password'
        };
      }

      // Set admin session
      const sessionData = {
        authenticated: true,
        timestamp: Date.now(),
        username: this.ADMIN_USERNAME
      };

      localStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      
      console.log('✅ AdminAuth: Admin authentication successful');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('AdminAuth: Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Check if admin is currently authenticated
   */
  static isAdminAuthenticated(): boolean {
    try {
      const sessionData = localStorage.getItem(this.ADMIN_SESSION_KEY);
      
      if (!sessionData) {
        return false;
      }

      const parsed = JSON.parse(sessionData);
      
      // Check if session is valid and not expired
      if (!parsed.authenticated || !parsed.timestamp) {
        return false;
      }

      const now = Date.now();
      const sessionAge = now - parsed.timestamp;
      
      if (sessionAge > this.SESSION_DURATION) {
        // Session expired, clear it
        this.clearAdminSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('AdminAuth: Error checking admin authentication:', error);
      this.clearAdminSession();
      return false;
    }
  }

  /**
   * Get admin session info
   */
  static getAdminSession(): { username: string; authenticated: boolean } | null {
    try {
      if (!this.isAdminAuthenticated()) {
        return null;
      }

      const sessionData = localStorage.getItem(this.ADMIN_SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const parsed = JSON.parse(sessionData);
      return {
        username: parsed.username || this.ADMIN_USERNAME,
        authenticated: true
      };
    } catch (error) {
      console.error('AdminAuth: Error getting admin session:', error);
      return null;
    }
  }

  /**
   * Sign out admin
   */
  static signOutAdmin(): void {
    console.log('🚪 AdminAuth: Signing out admin');
    this.clearAdminSession();
  }

  /**
   * Clear admin session
   */
  private static clearAdminSession(): void {
    try {
      localStorage.removeItem(this.ADMIN_SESSION_KEY);
    } catch (error) {
      console.error('AdminAuth: Error clearing admin session:', error);
    }
  }

  /**
   * Extend admin session (refresh timestamp)
   */
  static extendAdminSession(): void {
    try {
      const sessionData = localStorage.getItem(this.ADMIN_SESSION_KEY);
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        parsed.timestamp = Date.now();
        localStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('AdminAuth: Error extending admin session:', error);
    }
  }
}
