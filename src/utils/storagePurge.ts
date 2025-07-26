/**
 * Storage Purge Utility
 * Provides functions to clear all browser storage and reset application state
 */

export interface PurgeResult {
  success: boolean;
  clearedItems: string[];
  errors: string[];
}

export class StoragePurge {
  /**
   * Clear all localStorage, sessionStorage, cookies, and cached data
   */
  static async purgeAllStorage(): Promise<PurgeResult> {
    const clearedItems: string[] = [];
    const errors: string[] = [];

    try {
      // Clear localStorage
      try {
        const localStorageKeys = Object.keys(localStorage);
        localStorage.clear();
        clearedItems.push(`localStorage (${localStorageKeys.length} items)`);
      } catch (error) {
        errors.push('Failed to clear localStorage');
        console.error('Error clearing localStorage:', error);
      }

      // Clear sessionStorage
      try {
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorage.clear();
        clearedItems.push(`sessionStorage (${sessionStorageKeys.length} items)`);
      } catch (error) {
        errors.push('Failed to clear sessionStorage');
        console.error('Error clearing sessionStorage:', error);
      }

      // Clear cookies
      try {
        const cookies = document.cookie.split(';');
        let cookieCount = 0;
        
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          if (name) {
            // Clear cookie for current domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            // Clear cookie for parent domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            // Clear cookie for all subdomains
            const domain = window.location.hostname.split('.').slice(-2).join('.');
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
            cookieCount++;
          }
        }
        
        if (cookieCount > 0) {
          clearedItems.push(`cookies (${cookieCount} items)`);
        }
      } catch (error) {
        errors.push('Failed to clear cookies');
        console.error('Error clearing cookies:', error);
      }

      // Clear IndexedDB (if available)
      try {
        if ('indexedDB' in window) {
          // This is a more complex operation, but we'll try to clear known databases
          const databases = await indexedDB.databases?.() || [];
          
          for (const db of databases) {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          }
          
          if (databases.length > 0) {
            clearedItems.push(`IndexedDB (${databases.length} databases)`);
          }
        }
      } catch (error) {
        errors.push('Failed to clear IndexedDB');
        console.error('Error clearing IndexedDB:', error);
      }

      // Clear Cache API (if available)
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
          }
          
          if (cacheNames.length > 0) {
            clearedItems.push(`cache storage (${cacheNames.length} caches)`);
          }
        }
      } catch (error) {
        errors.push('Failed to clear cache storage');
        console.error('Error clearing cache storage:', error);
      }

      console.log('🧹 Storage purge completed:', { clearedItems, errors });

      return {
        success: errors.length === 0,
        clearedItems,
        errors
      };
    } catch (error) {
      console.error('Storage purge failed:', error);
      return {
        success: false,
        clearedItems,
        errors: [...errors, 'Unexpected error during purge']
      };
    }
  }

  /**
   * Get current storage usage info
   */
  static getStorageInfo(): {
    localStorage: number;
    sessionStorage: number;
    cookies: number;
  } {
    let localStorageCount = 0;
    let sessionStorageCount = 0;
    let cookieCount = 0;

    try {
      localStorageCount = Object.keys(localStorage).length;
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }

    try {
      sessionStorageCount = Object.keys(sessionStorage).length;
    } catch (error) {
      console.error('Error reading sessionStorage:', error);
    }

    try {
      cookieCount = document.cookie.split(';').filter(c => c.trim()).length;
    } catch (error) {
      console.error('Error reading cookies:', error);
    }

    return {
      localStorage: localStorageCount,
      sessionStorage: sessionStorageCount,
      cookies: cookieCount
    };
  }
}
