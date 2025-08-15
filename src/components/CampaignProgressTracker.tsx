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
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
  timestamp?: Date;
  data?: any;
}

export interface CampaignProgress {
  campaignId: string;
  campaignName: string;
  targetUrl: string;
  keyword: string;
  anchorText: string;
  steps: ProgressStep[];
  currentStep: number;
  isComplete: boolean;
  isError: boolean;
  publishedUrls: string[];
  startTime: Date;
  endTime?: Date;
}

interface CampaignProgressTrackerProps {
  progress: CampaignProgress | null;
  onClose: () => void;
  onRetry?: () => void;
}

const CampaignProgressTracker: React.FC<CampaignProgressTrackerProps> = ({
  progress,
  onClose,
  onRetry
}) => {
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: ProgressStep['status']) => {
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Progress
          </span>
          <Badge variant="outline" className="text-sm">
            {formatElapsedTime(elapsedTime)}
          </Badge>
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

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="w-full" />
        </div>

        {/* Step List */}
        <div className="space-y-4">
          {progress.steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium">{step.title}</h4>
                  <Badge className={`text-xs ${getStepBadgeColor(step.status)}`}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                
                {step.details && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {step.details}
                  </div>
                )}

                {step.timestamp && (
                  <div className="text-xs text-gray-400 mt-1">
                    {step.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Published URLs */}
        {progress.publishedUrls.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Published Links ({progress.publishedUrls.length})
            </h4>
            <div className="space-y-2">
              {progress.publishedUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:underline truncate flex-1"
                  >
                    {url}
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(url)}
                    className="h-6 w-6 p-0"
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
        <div className="flex justify-between pt-4 border-t">
          <div>
            {progress.isError && onRetry && (
              <Button variant="outline" onClick={onRetry} className="mr-2">
                <Target className="w-4 h-4 mr-2" />
                Retry Campaign
              </Button>
            )}
          </div>
          
          <Button 
            variant={progress.isComplete || progress.isError ? "default" : "outline"}
            onClick={onClose}
          >
            {progress.isComplete || progress.isError ? "Close" : "Continue in Background"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignProgressTracker;
