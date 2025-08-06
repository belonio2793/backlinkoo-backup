import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { testSavedReportsFeature } from '@/utils/testSavedReports';
import { useAuth } from '@/hooks/useAuth';

export function SavedReportsStatus() {
  const [status, setStatus] = useState<{
    tableExists: boolean;
    canSave: boolean;
    canRead: boolean;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const checkStatus = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const result = await testSavedReportsFeature();
      setStatus(result);
    } catch (error) {
      setStatus({
        tableExists: false,
        canSave: false,
        canRead: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [isAuthenticated]);

  if (!isAuthenticated || !status) {
    return null;
  }

  const getStatusInfo = () => {
    if (status.tableExists && status.canRead && status.canSave) {
      return {
        color: 'bg-green-100 text-green-800',
        text: 'Database Ready',
        icon: '✅'
      };
    } else if (status.tableExists) {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Partial Access',
        icon: '⚠️'
      };
    } else {
      return {
        color: 'bg-orange-100 text-orange-800',
        text: 'Local Storage',
        icon: '📱'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${statusInfo.color} text-xs`}>
        {statusInfo.icon} {statusInfo.text}
      </Badge>
      {import.meta.env.DEV && (
        <button
          onClick={checkStatus}
          disabled={isLoading}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
          title="Refresh status"
        >
          {isLoading ? '⟳' : '🔄'}
        </button>
      )}
    </div>
  );
}
