import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Globe, 
  Target,
  ExternalLink,
  Copy,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CampaignProgress } from '@/components/CampaignProgressTracker';

interface InlineProgressTrackerProps {
  progress: CampaignProgress | null;
  onRetry?: () => void;
}

const InlineProgressTracker: React.FC<InlineProgressTrackerProps> = ({
  progress,
  onRetry
}) => {
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    if (!progress || progress.isComplete || progress.isError) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - progress.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress]);

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStepIcon = (step: any) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const calculateProgress = (): number => {
    if (!progress) return 0;
    const completedSteps = progress.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / progress.steps.length) * 100);
  };

  if (!progress) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Progress
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {formatElapsedTime(elapsedTime)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>{progress.campaignName}</strong>
          </div>
          <div className="text-xs text-gray-500">
            Target: {progress.targetUrl} • Keyword: {progress.keyword}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="w-full" />
          </div>

          {/* Step List - Condensed view */}
          <div className="space-y-2">
            {progress.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded border">
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">{step.title}</h4>
                    <Badge className={`text-xs ${getStepBadgeColor(step.status)}`}>
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {step.status === 'in_progress' && (
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Published URLs - Compact view */}
          {progress.publishedUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Published Links ({progress.publishedUrls.length})
              </h4>
              <div className="space-y-1">
                {progress.publishedUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <ExternalLink className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:underline truncate flex-1"
                    >
                      {url}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(url)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {progress.isError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Campaign failed. Please check the error details above and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {progress.isComplete && !progress.isError && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Campaign completed successfully! 
                {progress.publishedUrls.length > 0 && (
                  <> {progress.publishedUrls.length} link{progress.publishedUrls.length !== 1 ? 's' : ''} published.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {progress.isError && onRetry && (
            <div className="flex justify-center pt-4 border-t">
              <Button variant="outline" onClick={onRetry}>
                <Target className="w-4 h-4 mr-2" />
                Retry Campaign
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {/* Minimized view */}
      {isMinimized && (
        <CardContent className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm">
                {progress.isComplete ? (
                  <span className="text-green-600 font-medium">✓ Completed</span>
                ) : progress.isError ? (
                  <span className="text-red-600 font-medium">✗ Failed</span>
                ) : (
                  <span className="text-blue-600 font-medium">⏳ Running...</span>
                )}
              </div>
              <Progress value={calculateProgress()} className="w-32" />
              <span className="text-xs text-gray-500">{calculateProgress()}%</span>
            </div>
            
            {progress.publishedUrls.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {progress.publishedUrls.length} published
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default InlineProgressTracker;
