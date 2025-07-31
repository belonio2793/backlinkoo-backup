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
        // Fallback to local check with demo key detection
        const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
        const demoKey = localStorage.getItem('demo_openai_key');
        const hasRealKey = envApiKey && envApiKey.startsWith('sk-') && envApiKey.length > 20;
        const hasDemoKey = demoKey && demoKey.includes('demo-fallback');

        let message = '';
        let online = false;

        if (hasRealKey) {
          message = 'API key configured (AI generation)';
          online = true;
        } else if (hasDemoKey) {
          message = 'Demo mode (template generation)';
          online = true;
        } else {
          message = 'No API key configured';
          online = false;
        }

        setStatus({
          online,
          message,
          providers: {
            OpenAI: {
              configured: hasRealKey || hasDemoKey,
              status: hasRealKey ? 'configured' : (hasDemoKey ? 'demo' : 'not_configured')
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      const hasApiKey = !!import.meta.env.OPENAI_API_KEY;
      setStatus({
        online: hasApiKey,
        message: hasApiKey ? 'Local check (API key available)' : 'Local check (no API key)'
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
