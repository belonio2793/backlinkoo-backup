import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiStatus {
  netlifyFunctions: 'online' | 'offline' | 'limited' | 'unknown';
  domainManagement: 'working' | 'error' | 'missing_config' | 'unknown';
  environmentConfig: 'complete' | 'partial' | 'missing' | 'unknown';
  lastChecked: Date | null;
}

export function ApiConnectivityStatus() {
  const [status, setStatus] = useState<ApiStatus>({
    netlifyFunctions: 'unknown',
    domainManagement: 'unknown',
    environmentConfig: 'unknown',
    lastChecked: null
  });
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkApiStatus = async () => {
    setLoading(true);
    
    try {
      const newStatus: ApiStatus = {
        netlifyFunctions: 'unknown',
        domainManagement: 'unknown',
        environmentConfig: 'unknown',
        lastChecked: new Date()
      };

      // Test 1: Check if Netlify functions are available
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const functionsTest = await fetch('/.netlify/functions/api-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (functionsTest.ok) {
          newStatus.netlifyFunctions = 'online';
        } else if (functionsTest.status === 404) {
          newStatus.netlifyFunctions = 'offline';
        } else {
          newStatus.netlifyFunctions = 'limited';
        }
      } catch (error: any) {
        // Handle different types of errors
        if (error.name === 'AbortError') {
          newStatus.netlifyFunctions = 'offline';
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NETWORK_ERROR')) {
          newStatus.netlifyFunctions = 'offline';
        } else {
          newStatus.netlifyFunctions = 'offline';
        }
      }

      // Test 2: Check domain management API specifically
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const domainTest = await fetch('/.netlify/functions/netlify-domain-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getSiteInfo' }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (domainTest.ok) {
          const result = await domainTest.json();
          if (result.success) {
            newStatus.domainManagement = 'working';
            newStatus.environmentConfig = 'complete';
          } else if (result.error?.includes('NETLIFY_ACCESS_TOKEN')) {
            newStatus.domainManagement = 'missing_config';
            newStatus.environmentConfig = 'missing';
          } else {
            newStatus.domainManagement = 'error';
            newStatus.environmentConfig = 'partial';
          }
        } else if (domainTest.status === 404) {
          newStatus.domainManagement = 'error';
          newStatus.environmentConfig = 'unknown';
        }
      } catch (error: any) {
        // Handle gracefully when functions are not available
        if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
          newStatus.domainManagement = 'error';
          newStatus.environmentConfig = 'unknown';
        } else {
          newStatus.domainManagement = 'error';
        }
      }

      setStatus(newStatus);

      // Show appropriate toast message (only for significant issues)
      if (newStatus.domainManagement === 'working') {
        toast.success('All domain management APIs are working correctly');
      } else if (newStatus.domainManagement === 'missing_config') {
        toast.info('Domain management requires Netlify API configuration');
      } else if (newStatus.netlifyFunctions === 'offline') {
        // Don't show error toast for offline functions - this is expected in dev mode
        console.info('Netlify functions are offline. This is normal when running "npm run dev". Use "npm run dev:netlify" for full functionality.');
      }

    } catch (error) {
      console.error('API status check failed:', error);
      toast.error('Failed to check API status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-check on component mount (with delay to prevent initial load issues)
    const timer = setTimeout(() => {
      checkApiStatus();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (statusType: 'netlifyFunctions' | 'domainManagement' | 'environmentConfig') => {
    if (loading) return <Loader2 className="h-3 w-3 animate-spin" />;
    
    const statusValue = status[statusType];
    
    switch (statusValue) {
      case 'online':
      case 'working':
      case 'complete':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'limited':
      case 'partial':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'offline':
      case 'error':
      case 'missing_config':
      case 'missing':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (status.domainManagement === 'working') return 'bg-green-50 text-green-700 border-green-200';
    if (status.domainManagement === 'missing_config') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (status.netlifyFunctions === 'offline') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (status.domainManagement === 'working') return 'APIs Online';
    if (status.domainManagement === 'missing_config') return 'Config Needed';
    if (status.netlifyFunctions === 'offline') return 'Functions Offline';
    return 'API Issues';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={`gap-1 ${getStatusColor()}`}>
        {getStatusIcon('domainManagement')}
        {getStatusText()}
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={checkApiStatus}
        disabled={loading}
        className="h-6 w-6 p-0"
        title="Refresh API status"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="h-6 w-6 p-0"
        title="Show API details"
      >
        <Info className="h-3 w-3" />
      </Button>

      {showDetails && (
        <div className="absolute top-10 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
          <h4 className="font-semibold mb-3">API Status Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon('netlifyFunctions')}
              <span className="font-medium">Netlify Functions:</span>
              <span className="capitalize">{status.netlifyFunctions}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon('domainManagement')}
              <span className="font-medium">Domain Management:</span>
              <span className="capitalize">{status.domainManagement.replace('_', ' ')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon('environmentConfig')}
              <span className="font-medium">Environment Config:</span>
              <span className="capitalize">{status.environmentConfig}</span>
            </div>
          </div>

          {status.lastChecked && (
            <div className="text-xs text-gray-500 mt-3">
              Last checked: {status.lastChecked.toLocaleTimeString()}
            </div>
          )}

          {status.domainManagement === 'missing_config' && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Configuration needed:</strong> Domain management requires NETLIFY_ACCESS_TOKEN to be configured in your environment.
            </div>
          )}

          {status.netlifyFunctions === 'offline' && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <strong>Functions offline:</strong> Use "npm run dev:netlify" instead of "npm run dev" to enable Netlify functions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ApiConnectivityStatus;
