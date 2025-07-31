import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { safeNetlifyFetch } from '@/utils/netlifyFunctionHelper';

interface APIStatus {
  online: boolean;
  providers?: {
    OpenAI?: {
      configured: boolean;
      status: string;
    };
  };
  message?: string;
  timestamp?: string;
}

export function APIStatusIndicator() {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAPIStatus = async () => {
    try {
      const result = await safeNetlifyFetch('api-status');

      if (result.success && result.data) {
        setStatus(result.data);
      } else {
        // Fallback to local check
        const hasApiKey = !!import.meta.env.OPENAI_API_KEY;
        const isNetlifyDev = !!import.meta.env.NETLIFY_DEV ||
                            window.location.hostname.includes('localhost');

        setStatus({
          online: hasApiKey || isNetlifyDev,
          message: result.isLocal
            ? (isNetlifyDev ? 'Netlify dev mode (functions available)' :
               hasApiKey ? 'Local development (API key configured)' : 'Local development (no API key)')
            : (hasApiKey ? 'Local check (API key available)' : 'Local check (no API key)'),
          providers: {
            OpenAI: {
              configured: hasApiKey || isNetlifyDev,
              status: (hasApiKey || isNetlifyDev) ? 'configured' : 'not_configured'
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      const hasApiKey = !!import.meta.env.OPENAI_API_KEY;
      const isNetlifyDev = !!import.meta.env.NETLIFY_DEV ||
                          window.location.hostname.includes('localhost');

      setStatus({
        online: hasApiKey || isNetlifyDev,
        message: isNetlifyDev ? 'Netlify dev mode (functions available)' :
                 hasApiKey ? 'Local check (API key available)' : 'Local check (no API key)'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check status immediately when component mounts
    checkAPIStatus();
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Circle className="h-3 w-3 animate-pulse text-gray-400" />
        <span>Checking API status...</span>
      </div>
    );
  }

  const isOnline = status?.online || false;
  const message = status?.message || 'Unknown status';

  return (
    <div className="flex items-center gap-2 text-sm">
      <Circle 
        className={`h-3 w-3 ${
          isOnline 
            ? 'text-green-500 fill-green-500' 
            : 'text-red-500 fill-red-500'
        }`} 
      />
      <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
        API {isOnline ? 'Connected' : 'Disconnected'}
      </span>
      <span className="text-muted-foreground text-xs">
        ({message})
      </span>
    </div>
  );
}
