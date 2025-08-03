import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap, FileText, Database, Globe } from 'lucide-react';

interface StatusStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  details?: string;
  timestamp?: Date;
}

interface BlogGenerationStatusProps {
  isVisible: boolean;
  onStepUpdate?: (step: string, status: string, details?: string) => void;
}

export function BlogGenerationStatus({ isVisible, onStepUpdate }: BlogGenerationStatusProps) {
  const [steps, setSteps] = useState<StatusStep[]>([
    {
      id: 'validation',
      label: 'Validating Input',
      status: 'pending',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'api-check',
      label: 'Checking API Connection',
      status: 'pending',
      icon: <Globe className="h-4 w-4" />
    },
    {
      id: 'content-generation',
      label: 'Generating Content',
      status: 'pending',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'processing',
      label: 'Processing & Optimizing',
      status: 'pending',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'saving',
      label: 'Saving to Database',
      status: 'pending',
      icon: <Database className="h-4 w-4" />
    }
  ]);

  const [currentFetch, setCurrentFetch] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Auto-progress simulation for demo purposes
  useEffect(() => {
    if (!isVisible) {
      resetSteps();
      return;
    }

    setStartTime(new Date());
    let stepIndex = 0;
    const stepDurations = [500, 800, 3000, 1200, 800]; // Realistic durations in ms

    const progressToNextStep = () => {
      if (stepIndex < steps.length) {
        const currentStep = steps[stepIndex];
        
        // Set current step to active
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === stepIndex 
              ? { ...step, status: 'active', timestamp: new Date() }
              : step
          )
        );

        // Add fetch simulation details
        const fetchDetails = getFetchDetails(currentStep.id);
        if (fetchDetails) {
          setCurrentFetch(fetchDetails);
        }

        // Call callback if provided
        if (onStepUpdate) {
          onStepUpdate(currentStep.id, 'active', fetchDetails);
        }

        // Complete current step after duration
        setTimeout(() => {
          setSteps(prevSteps => 
            prevSteps.map((step, index) => 
              index === stepIndex 
                ? { ...step, status: 'completed', details: getCompletionDetails(step.id) }
                : step
            )
          );

          if (onStepUpdate) {
            onStepUpdate(currentStep.id, 'completed', getCompletionDetails(currentStep.id));
          }

          stepIndex++;
          if (stepIndex < steps.length) {
            progressToNextStep();
          } else {
            setCurrentFetch('✅ Generation Complete!');
          }
        }, stepDurations[stepIndex] || 1000);
      }
    };

    progressToNextStep();
  }, [isVisible]);

  const resetSteps = () => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({ 
        ...step, 
        status: 'pending' as const, 
        details: undefined,
        timestamp: undefined 
      }))
    );
    setCurrentFetch('');
    setStartTime(null);
  };

  const getFetchDetails = (stepId: string): string => {
    const fetchMap: Record<string, string> = {
      'validation': 'Validating form data...',
      'api-check': 'GET /.netlify/functions/api-status',
      'content-generation': 'POST /.netlify/functions/generate-openai',
      'processing': 'Processing content & extracting metadata...',
      'saving': 'POST /api/blog-posts (Supabase)'
    };
    return fetchMap[stepId] || '';
  };

  const getCompletionDetails = (stepId: string): string => {
    const detailsMap: Record<string, string> = {
      'validation': 'Input validated successfully',
      'api-check': 'API connection confirmed',
      'content-generation': 'Content generated (1000+ words)',
      'processing': 'Content optimized & SEO enhanced',
      'saving': 'Blog post saved to database'
    };
    return detailsMap[stepId] || '';
  };

  const getElapsedTime = (): string => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    return `${elapsed}s`;
  };

  const getStatusIcon = (step: StatusStep) => {
    switch (step.status) {
      case 'active':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepTextColor = (step: StatusStep): string => {
    switch (step.status) {
      case 'active':
        return 'text-blue-600 font-medium';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="mt-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Blog Generation in Progress
            </h3>
            {startTime && (
              <span className="text-xs text-gray-500 font-mono">
                {getElapsedTime()}
              </span>
            )}
          </div>

          {/* Current Fetch Display */}
          {currentFetch && (
            <div className="bg-white/60 border border-blue-200 rounded-lg p-2">
              <div className="text-xs text-gray-600 mb-1">Current Request:</div>
              <div className="text-sm font-mono text-blue-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {currentFetch}
              </div>
            </div>
          )}

          {/* Steps Progress */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                  step.status === 'active' ? 'bg-blue-100/70' : 
                  step.status === 'completed' ? 'bg-green-50/70' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${getStepTextColor(step)}`}>
                    {step.label}
                  </div>
                  
                  {step.details && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {step.details}
                    </div>
                  )}
                  
                  {step.timestamp && step.status === 'completed' && (
                    <div className="text-xs text-green-600 mt-0.5">
                      Completed at {step.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Progress indicator */}
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {step.status === 'active' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
