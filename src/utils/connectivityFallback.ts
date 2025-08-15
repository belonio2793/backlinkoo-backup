/**
 * Connectivity Fallback Utility
 *
 * Provides fallback mechanisms when Supabase connectivity fails
 */

import React from 'react';

export interface ConnectivityStatus {
  isOnline: boolean;
  canReachSupabase: boolean;
  lastChecked: Date;
  errorCount: number;
}

export class ConnectivityFallback {
  private static instance: ConnectivityFallback;
  private status: ConnectivityStatus = {
    isOnline: navigator.onLine,
    canReachSupabase: false,
    lastChecked: new Date(),
    errorCount: 0
  };
  
  private listeners: Set<(status: ConnectivityStatus) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): ConnectivityFallback {
    if (!ConnectivityFallback.instance) {
      ConnectivityFallback.instance = new ConnectivityFallback();
    }
    return ConnectivityFallback.instance;
  }

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicCheck();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Network came back online');
      this.updateStatus({ isOnline: true });
      this.checkSupabaseConnectivity();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network went offline');
      this.updateStatus({ 
        isOnline: false, 
        canReachSupabase: false 
      });
    });
  }

  private startPeriodicCheck() {
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(() => {
      if (this.status.isOnline) {
        this.checkSupabaseConnectivity();
      }
    }, 30000);
  }

  private updateStatus(updates: Partial<ConnectivityStatus>) {
    this.status = {
      ...this.status,
      ...updates,
      lastChecked: new Date()
    };

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }

  async checkSupabaseConnectivity(): Promise<boolean> {
    if (!this.status.isOnline) {
      return false;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.warn('⚠️ No Supabase URL configured');
        return false;
      }

      // Simple HEAD request to check if Supabase is reachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const canReach = response.status < 500; // Accept 401, 403, etc. but not 5xx
      
      this.updateStatus({ 
        canReachSupabase: canReach,
        errorCount: canReach ? 0 : this.status.errorCount + 1
      });

      if (canReach) {
        console.log('✅ Supabase connectivity restored');
      } else {
        console.warn('❌ Supabase returned server error');
      }

      return canReach;
    } catch (error) {
      console.warn('❌ Cannot reach Supabase:', error);
      
      this.updateStatus({ 
        canReachSupabase: false,
        errorCount: this.status.errorCount + 1
      });

      return false;
    }
  }

  getStatus(): ConnectivityStatus {
    return { ...this.status };
  }

  subscribe(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  async waitForConnectivity(timeout: number = 30000): Promise<boolean> {
    if (this.status.canReachSupabase) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.subscribe((status) => {
        if (status.canReachSupabase) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });

      // Immediately check connectivity
      this.checkSupabaseConnectivity();
    });
  }

  getOfflineFallbackData(key: string): any {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Error reading offline data:', error);
      return null;
    }
  }

  setOfflineFallbackData(key: string, data: any): void {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Error storing offline data:', error);
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
    
    this.listeners.clear();
  }
}

export const connectivityFallback = ConnectivityFallback.getInstance();

// React hook for connectivity status
export const useConnectivity = () => {
  const [status, setStatus] = React.useState<ConnectivityStatus>(
    connectivityFallback.getStatus()
  );

  React.useEffect(() => {
    const unsubscribe = connectivityFallback.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    checkConnectivity: () => connectivityFallback.checkSupabaseConnectivity(),
    waitForConnectivity: (timeout?: number) => connectivityFallback.waitForConnectivity(timeout)
  };
};
