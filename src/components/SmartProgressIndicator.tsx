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
  Upload,
  AlertCircle
} from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  duration: number; // Estimated duration in seconds
}

interface SmartProgressIndicatorProps {
  isActive: boolean;
  targetUrl: string;
  keyword: string;
  onProgressUpdate?: (step: string, progress: number) => void;
}

export function SmartProgressIndicator({
  isActive,
  targetUrl,
  keyword,
  onProgressUpdate
}: SmartProgressIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const steps: ProgressStep[] = [
    {
      id: 'validating',
      title: 'Validating Input',
      description: `Checking ${targetUrl} accessibility and keyword "${keyword}"`,
      status: 'pending',
      icon: Search,
      duration: 3
    },
    {
      id: 'analyzing',
      title: 'Analyzing Website',
      description: `Scanning ${targetUrl} for content themes and relevance`,
      status: 'pending',
      icon: Target,
      duration: 8
    },
    {
      id: 'generating',
      title: 'AI Content Generation',
      description: 'Creating high-quality, SEO-optimized blog post content',
      status: 'pending',
      icon: PenTool,
      duration: 25
    },
    {
      id: 'optimizing',
      title: 'SEO Optimization',
      description: 'Adding natural backlinks and optimizing structure',
      status: 'pending',
      icon: Link2,
      duration: 10
    },
    {
      id: 'publishing',
      title: 'Publishing Live',
      description: 'Deploying to blog network and making it discoverable',
      status: 'pending',
      icon: Upload,
      duration: 8
    },
    {
      id: 'finalizing',
      title: 'Final Checks',
      description: 'Verifying links and indexing for search engines',
      status: 'pending',
      icon: CheckCircle2,
      duration: 6
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
      setProgressSteps(steps.map(step => ({ ...step, status: 'pending' })));
    }
  }, [isActive]);

  // Progress animation
  useEffect(() => {
    if (!isActive) return;

    let stepIndex = 0;
    let stepProgress = 0;
    const totalSteps = progressSteps.length;
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);

    const progressTimer = setInterval(() => {
      if (stepIndex >= totalSteps) {
        clearInterval(progressTimer);
        return;
      }

      const currentStep = steps[stepIndex];
      const stepDuration = currentStep.duration * 1000; // Convert to milliseconds
      const stepIncrement = 100 / (stepDuration / 300); // Update every 300ms

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
      const completedSteps = stepIndex;
      const currentStepProgress = stepProgress / 100;
      const overallProgress = ((completedSteps + currentStepProgress) / totalSteps) * 100;
      setProgress(Math.min(overallProgress, 100));

      // Notify parent about progress
      onProgressUpdate?.(currentStep.id, overallProgress);

      // Calculate estimated time remaining
      const completedTime = steps.slice(0, stepIndex).reduce((acc, step) => acc + step.duration, 0);
      const currentStepTime = (stepProgress / 100) * currentStep.duration;
      const remaining = totalDuration - completedTime - currentStepTime;
      setEstimatedTimeRemaining(Math.max(0, remaining));
    }, 300);

    return () => clearInterval(progressTimer);
  }, [isActive, onProgressUpdate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            Creating Your Blog Post...
          </h3>
          <p className="text-gray-600 mb-4">
            Generating high-quality content about "<span className="font-medium text-blue-600">{keyword}</span>" with natural backlinks
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex justify-between text-sm text-gray-500">
              <span className="font-medium">{Math.round(progress)}% Complete</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{Math.ceil(estimatedTimeRemaining)}s remaining
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
              <span>Step {currentStepIndex + 1} of {progressSteps.length}</span>
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
            const isError = step.status === 'error';

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-blue-50 border-2 border-blue-200 shadow-sm scale-[1.02]' :
                  isCompleted ? 'bg-green-50 border border-green-200' :
                  isError ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'bg-green-500 scale-110' :
                  isActive ? 'bg-blue-500 animate-pulse' :
                  isError ? 'bg-red-500' :
                  'bg-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : isError ? (
                    <AlertCircle className="h-5 w-5 text-white" />
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
                      isError ? 'text-red-900' :
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
                        Done
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-700' :
                    isCompleted ? 'text-green-700' :
                    isError ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  {isPending && (
                    <p className="text-xs text-gray-400 mt-1">
                      Estimated: ~{step.duration}s
                    </p>
                  )}
                  {isActive && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(progress * progressSteps.length) % 100}%` }}
                        />
                      </div>
                    </div>
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
              {progressSteps.find(s => s.status === 'running')?.title || 'Initializing...'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
