import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle2,
  Globe,
  Target,
  FileText,
  Link2,
  Sparkles,
  Clock,
  Zap,
  Search,
  PenTool,
  Upload
} from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  estimatedTime?: number;
}

interface RealtimeProgressIndicatorProps {
  isActive: boolean;
  targetUrl: string;
  keyword: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function RealtimeProgressIndicator({
  isActive,
  targetUrl,
  keyword,
  onComplete,
  onError
}: RealtimeProgressIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const steps: ProgressStep[] = [
    {
      id: 'analyzing',
      title: 'Analyzing Target Website',
      description: `Scanning ${targetUrl} for content themes and structure`,
      status: 'pending',
      icon: Search,
      estimatedTime: 8
    },
    {
      id: 'researching',
      title: 'Researching Keywords',
      description: `Finding related topics and semantic keywords for "${keyword}"`,
      status: 'pending',
      icon: Target,
      estimatedTime: 12
    },
    {
      id: 'generating',
      title: 'Generating Content',
      description: 'Creating high-quality, SEO-optimized blog post content',
      status: 'pending',
      icon: PenTool,
      estimatedTime: 25
    },
    {
      id: 'linking',
      title: 'Adding Natural Backlinks',
      description: 'Integrating contextual links that enhance reader experience',
      status: 'pending',
      icon: Link2,
      estimatedTime: 8
    },
    {
      id: 'optimizing',
      title: 'SEO Optimization',
      description: 'Optimizing meta tags, headers, and content structure',
      status: 'pending',
      icon: Zap,
      estimatedTime: 10
    },
    {
      id: 'publishing',
      title: 'Publishing Live',
      description: 'Deploying to high-authority blog network',
      status: 'pending',
      icon: Upload,
      estimatedTime: 15
    }
  ];

  const [progressSteps, setProgressSteps] = useState(steps);

  // Timer for elapsed time
  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  // Progress simulation when active
  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
      setProgress(0);
      setProgressSteps(steps.map(step => ({ ...step, status: 'pending' })));
      return;
    }

    let stepIndex = 0;
    let stepProgress = 0;
    const totalSteps = progressSteps.length;

    const progressTimer = setInterval(() => {
      if (stepIndex >= totalSteps) {
        clearInterval(progressTimer);
        onComplete?.();
        return;
      }

      const currentStep = progressSteps[stepIndex];
      const stepDuration = (currentStep.estimatedTime || 10) * 1000; // Convert to milliseconds
      const stepIncrement = 100 / (stepDuration / 200); // Update every 200ms

      stepProgress += stepIncrement;

      if (stepProgress >= 100) {
        // Complete current step
        setProgressSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === stepIndex ? 'completed' : 
                  index < stepIndex ? 'completed' :
                  index === stepIndex + 1 ? 'running' : 'pending'
        })));

        stepIndex++;
        stepProgress = 0;
        setCurrentStepIndex(stepIndex);
      } else {
        // Update current step as running
        setProgressSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === stepIndex ? 'running' :
                  index < stepIndex ? 'completed' : 'pending'
        })));
      }

      // Calculate overall progress
      const overallProgress = ((stepIndex + (stepProgress / 100)) / totalSteps) * 100;
      setProgress(Math.min(overallProgress, 100));

      // Calculate estimated time remaining
      const totalEstimatedTime = progressSteps.reduce((acc, step) => acc + (step.estimatedTime || 0), 0);
      const completedTime = progressSteps.slice(0, stepIndex).reduce((acc, step) => acc + (step.estimatedTime || 0), 0);
      const currentStepTime = (stepProgress / 100) * (currentStep.estimatedTime || 0);
      const remaining = totalEstimatedTime - completedTime - currentStepTime;
      setEstimatedTimeRemaining(Math.max(0, remaining));
    }, 200);

    return () => clearInterval(progressTimer);
  }, [isActive, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            Creating Your Blog Post...
          </h3>
          <p className="text-gray-600 mb-4">
            Generating high-quality content about "{keyword}" with natural backlinks
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{Math.round(progress)}% Complete</span>
              <span>~{Math.ceil(estimatedTimeRemaining)}s remaining</span>
            </div>
          </div>

          {/* Time Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Step {currentStepIndex + 1} of {progressSteps.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {progressSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'running';
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' :
                  isCompleted ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' :
                  isActive ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${
                      isActive ? 'text-blue-900' :
                      isCompleted ? 'text-green-900' :
                      'text-gray-600'
                    }`}>
                      {step.title}
                    </h4>
                    {isActive && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        In Progress
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-700' :
                    isCompleted ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  {step.estimatedTime && isPending && (
                    <p className="text-xs text-gray-400 mt-1">
                      Estimated: ~{step.estimatedTime}s
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Publishing to Authority Network</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>1,200+ Words Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-green-500" />
              <span>Natural Backlinks Added</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
