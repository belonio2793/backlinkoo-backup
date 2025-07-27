import { useState, useEffect, useRef } from 'react';
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
  Upload,
  AlertCircle
} from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  minDuration: number; // Minimum time to show this step
}

interface AdaptiveProgressIndicatorProps {
  isActive: boolean;
  targetUrl: string;
  keyword: string;
  forceComplete?: boolean; // Signal to complete immediately
  onProgressUpdate?: (step: string, progress: number) => void;
  onNaturalComplete?: () => void;
}

export function AdaptiveProgressIndicator({
  isActive,
  targetUrl,
  keyword,
  forceComplete = false,
  onProgressUpdate,
  onNaturalComplete
}: AdaptiveProgressIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps: ProgressStep[] = [
    {
      id: 'validating',
      title: 'Validating Input',
      description: `Checking ${targetUrl} accessibility and keyword "${keyword}"`,
      status: 'pending',
      icon: Search,
      minDuration: 2
    },
    {
      id: 'analyzing',
      title: 'Analyzing Website',
      description: `Scanning ${targetUrl} for content themes and relevance`,
      status: 'pending',
      icon: Target,
      minDuration: 5
    },
    {
      id: 'generating',
      title: 'AI Content Generation',
      description: 'Creating high-quality, SEO-optimized blog post content',
      status: 'pending',
      icon: PenTool,
      minDuration: 15
    },
    {
      id: 'optimizing',
      title: 'SEO Optimization',
      description: 'Adding natural backlinks and optimizing structure',
      status: 'pending',
      icon: Link2,
      minDuration: 8
    },
    {
      id: 'publishing',
      title: 'Publishing Live',
      description: 'Deploying to blog network and making it discoverable',
      status: 'pending',
      icon: Upload,
      minDuration: 5
    },
    {
      id: 'finalizing',
      title: 'Final Checks',
      description: 'Verifying links and indexing for search engines',
      status: 'pending',
      icon: CheckCircle2,
      minDuration: 3
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

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0);
      setProgress(0);
      setIsCompleting(false);
      setProgressSteps(steps.map(step => ({ ...step, status: 'pending' })));
    }
  }, [isActive]);

  // Handle force completion
  useEffect(() => {
    if (forceComplete && isActive && !isCompleting) {
      setIsCompleting(true);
      // Quickly complete all remaining steps
      const completeAllSteps = () => {
        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
        setProgress(100);
        setCurrentStepIndex(steps.length);
        
        setTimeout(() => {
          onNaturalComplete?.();
        }, 1000); // Brief pause to show completion
      };

      // If we're early in the process, speed up to completion
      const timeToCompletion = Math.max(1000, (3 - currentStepIndex) * 500);
      setTimeout(completeAllSteps, timeToCompletion);
    }
  }, [forceComplete, isActive, isCompleting, currentStepIndex, onNaturalComplete]);

  // Natural progress animation
  useEffect(() => {
    if (!isActive || isCompleting) return;

    let stepIndex = 0;
    let stepStartTime = Date.now();
    const totalSteps = progressSteps.length;

    intervalRef.current = setInterval(() => {
      if (stepIndex >= totalSteps) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onNaturalComplete?.();
        return;
      }

      const currentStep = steps[stepIndex];
      const stepElapsed = (Date.now() - stepStartTime) / 1000;
      const stepProgress = Math.min((stepElapsed / currentStep.minDuration) * 100, 100);

      if (stepProgress >= 100) {
        // Complete current step
        setProgressSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === stepIndex ? 'completed' : 
                  index < stepIndex ? 'completed' :
                  index === stepIndex + 1 ? 'running' : 'pending'
        })));

        stepIndex++;
        stepStartTime = Date.now();
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
      const completedSteps = stepIndex;
      const currentStepProgress = stepProgress / 100;
      const overallProgress = ((completedSteps + currentStepProgress) / totalSteps) * 100;
      setProgress(Math.min(overallProgress, 100));

      // Notify parent about progress
      onProgressUpdate?.(currentStep.id, overallProgress);
    }, 300);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isCompleting, onProgressUpdate, onNaturalComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = (): number => {
    if (isCompleting) return 2;
    
    const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
    const remainingSteps = steps.slice(completedSteps);
    return remainingSteps.reduce((acc, step) => acc + step.minDuration, 0);
  };

  if (!isActive) return null;

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
            {isCompleting ? (
              <CheckCircle2 className="h-8 w-8 text-white animate-bounce" />
            ) : (
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            {isCompleting ? 'Finalizing Your Blog Post...' : 'Creating Your Blog Post...'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isCompleting ? 
              'Almost done! Putting the finishing touches on your content.' :
              `Generating high-quality content about "${keyword}" with natural backlinks`
            }
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex justify-between text-sm text-gray-500">
              <span className="font-medium">{Math.round(progress)}% Complete</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isCompleting ? 'Finishing up...' : `~${Math.ceil(getEstimatedTimeRemaining())}s remaining`}
              </span>
            </div>
          </div>

          {/* Time Stats */}
          <div className="flex justify-center gap-6 text-sm mb-6">
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full">
              <Zap className="h-4 w-4 text-purple-500" />
              <span>Step {Math.min(currentStepIndex + 1, progressSteps.length)} of {progressSteps.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          {progressSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'running';
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-500 ${
                  isActive ? 'bg-blue-50 border-2 border-blue-200 shadow-sm scale-[1.02]' :
                  isCompleted ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted ? 'bg-green-500 scale-110' :
                  isActive ? 'bg-blue-500 animate-pulse' :
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
                    <h4 className={`font-medium transition-colors duration-300 ${
                      isActive ? 'text-blue-900' :
                      isCompleted ? 'text-green-900' :
                      'text-gray-600'
                    }`}>
                      {step.title}
                    </h4>
                    {isActive && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs animate-pulse">
                        Processing
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    isActive ? 'text-blue-700' :
                    isCompleted ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  {isPending && !isCompleting && (
                    <p className="text-xs text-gray-400 mt-1">
                      Estimated: ~{step.minDuration}s
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>High-Authority Network</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>1,200+ Words</span>
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-green-500" />
              <span>Natural Backlinks</span>
            </div>
          </div>
        </div>

        {/* Current Action Display */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Currently: <span className="font-medium text-gray-700">
              {isCompleting ? 'Finalizing and optimizing...' :
               progressSteps.find(s => s.status === 'running')?.title || 'Initializing...'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
