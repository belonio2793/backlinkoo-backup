import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap, FileText, Database, Globe, Network, ExternalLink } from 'lucide-react';
import { useFetchTracker } from '@/hooks/useFetchTracker';

interface RealTimeBlogStatusProps {
  isVisible: boolean;
  isGenerating: boolean;
}

export function RealTimeBlogStatus({ isVisible, isGenerating }: RealTimeBlogStatusProps) {
  const { requests, activeRequests, totalRequests, lastRequest, clearRequests } = useFetchTracker(isVisible);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (isGenerating && !startTime) {
      setStartTime(new Date());
      clearRequests();
      setStatusMessage('Initializing blog generation...');
    } else if (!isGenerating && startTime) {
      setStatusMessage('Generation complete!');
    }
  }, [isGenerating, startTime, clearRequests]);

  useEffect(() => {
    if (lastRequest) {
      const url = lastRequest.url;
      let message = '';
      
      if (url.includes('api-status')) {
        message = 'Checking API connection...';
      } else if (url.includes('generate-openai')) {
        message = 'Generating content with AI...';
      } else if (url.includes('supabase') || url.includes('blog')) {
        message = 'Saving to database...';
      } else if (url.includes('check-ai-provider')) {
        message = 'Verifying AI provider...';
      } else {
        message = `Making request to ${url.split('/').pop()}...`;
      }
      
      if (lastRequest.status === 'completed') {
        message = message.replace('...', ' ✓');
      } else if (lastRequest.status === 'error') {
        message = message.replace('...', ' ✗');
      }
      
      setStatusMessage(message);
    }
  }, [lastRequest]);

  const getElapsedTime = (): string => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    return `${elapsed}s`;
  };

  const formatUrl = (url: string): string => {
    if (url.includes('netlify/functions')) {
      return `/.netlify/functions/${url.split('/').pop()}`;
    }
    if (url.includes('supabase')) {
      return 'Supabase Database';
    }
    return new URL(url).pathname;
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="mt-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with stats */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-500" />
              Real-time Generation Status
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {startTime && (
                <span className="font-mono">⏱️ {getElapsedTime()}</span>
              )}
              <span>📡 {totalRequests} requests</span>
              {activeRequests > 0 && (
                <span className="text-blue-600 font-medium">🔄 {activeRequests} active</span>
              )}
            </div>
          </div>

          {/* Current status */}
          {statusMessage && (
            <div className="bg-white/70 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {activeRequests > 0 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">
                    {statusMessage}
                  </div>
                  {lastRequest && lastRequest.status === 'completed' && lastRequest.duration && (
                    <div className="text-xs text-gray-500 mt-1">
                      Completed in {lastRequest.duration}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Request history */}
          {requests.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Network Requests
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {requests.slice(-5).map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center gap-2 p-2 bg-white/50 rounded text-xs border border-gray-100"
                  >
                    <div className="flex-shrink-0">
                      {getRequestStatusIcon(request.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 text-xs">
                          {request.method}
                        </span>
                        <span className="text-gray-700 truncate">
                          {formatUrl(request.url)}
                        </span>
                      </div>
                      
                      <div className="text-gray-500 text-xs">
                        {request.timestamp.toLocaleTimeString()}
                        {request.duration && ` • ${request.duration}ms`}
                        {request.statusCode && ` • ${request.statusCode}`}
                      </div>
                    </div>

                    {request.status === 'error' && request.error && (
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-3 w-3 text-red-500" title={request.error} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {requests.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  ... and {requests.length - 5} more requests
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          {isGenerating && (
            <div className="pt-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 relative"
                  style={{ 
                    width: activeRequests > 0 ? '60%' : '100%',
                    animation: activeRequests > 0 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {activeRequests > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {activeRequests > 0 
                  ? `Processing ${activeRequests} request${activeRequests > 1 ? 's' : ''}...`
                  : 'Generation completed successfully!'
                }
              </div>
            </div>
          )}

          {/* Quick stats */}
          {requests.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {requests.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {requests.filter(r => r.status === 'error').length}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
