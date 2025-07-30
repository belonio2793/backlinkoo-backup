import { useEffect } from 'react';
import DatabaseHealthChecker from '@/utils/databaseHealth';

/**
 * Component that logs database health status on mount
 * This helps with debugging database-related issues
 */
export const DatabaseHealthLogger = () => {
  useEffect(() => {
    // Log database health status on app startup
    DatabaseHealthChecker.logDatabaseStatus().catch(error => {
      console.warn('Failed to log database status:', error);
    });
  }, []);

  // This component renders nothing but provides debugging info
  return null;
};

export default DatabaseHealthLogger;
