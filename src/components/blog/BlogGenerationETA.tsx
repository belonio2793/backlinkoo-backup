import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface BlogGenerationETAProps {
  isVisible: boolean;
  estimatedTime?: number; // in seconds
  onComplete?: () => void;
}

export function BlogGenerationETA({ isVisible, estimatedTime = 45, onComplete }: BlogGenerationETAProps) {
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);
  const [status, setStatus] = useState<'generating' | 'complete' | 'error'>('generating');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setTimeRemaining(estimatedTime);
      setStatus('generating');
      setStartTime(null);
      return;
    }

    setStartTime(new Date());
    setTimeRemaining(estimatedTime);
    setStatus('generating');

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setStatus('complete');
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, estimatedTime, onComplete]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getElapsedTime = (): string => {
    if (!startTime) return '0s';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    return formatTime(elapsed);
  };

  if (!isVisible) return null;

  return (
    <Card className="mt-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              {status === 'generating' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {status === 'complete' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {status === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              
              {status === 'generating' && 'Generating Your Blog Post...'}
              {status === 'complete' && 'Blog Post Ready!'}
              {status === 'error' && 'Generation Error'}
            </h3>
            
            {startTime && (
              <span className="text-sm text-gray-500 font-mono">
                Elapsed: {getElapsedTime()}
              </span>
            )}
          </div>

          {/* Status Content */}
          {status === 'generating' && (
            <div className="space-y-4">
              <div className="bg-white/60 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Estimated completion time:</span>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    <Clock className="h-4 w-4" />
                    {formatTime(timeRemaining)}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, (estimatedTime - timeRemaining) / estimatedTime * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white/40 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Content Generation</div>
                  <div className="text-xs text-gray-500 mt-1">AI-powered writing</div>
                </div>
                <div className="bg-white/40 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">SEO Optimization</div>
                  <div className="text-xs text-gray-500 mt-1">Keyword integration</div>
                </div>
                <div className="bg-white/40 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Publishing</div>
                  <div className="text-xs text-gray-500 mt-1">Final processing</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-800 text-sm">Important Notice</div>
                    <div className="text-sm text-amber-700 mt-1">
                      You will be redirected to your blog post when complete. 
                      <span className="font-medium"> Create an account to prevent your post from being deleted!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800 text-sm">Blog Post Generated Successfully!</div>
                    <div className="text-sm text-green-700 mt-1">
                      Your content is ready and will be published shortly. You'll be redirected automatically.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Redirecting to Your Blog Post</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Please wait while we prepare your content for viewing...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800 text-sm">Generation Failed</div>
                  <div className="text-sm text-red-700 mt-1">
                    There was an error generating your blog post. Please try again.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
