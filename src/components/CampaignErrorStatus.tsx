import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertCircle, 
  Play, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  XCircle,
  CheckCircle,
  Pause,
  Info
} from 'lucide-react';
import { campaignErrorHandler, type CampaignError } from '@/services/campaignErrorHandler';
import { formatErrorForUI } from '@/utils/errorUtils';
import { useToast } from '@/hooks/use-toast';

interface CampaignErrorStatusProps {
  campaignId: string;
  campaignStatus: 'draft' | 'active' | 'paused' | 'completed';
  errorMessage?: string;
  canAutoResume?: boolean;
  autoPauseReason?: string;
  onResume?: () => Promise<{ success: boolean; message: string }>;
  onRefresh?: () => void;
}

const CampaignErrorStatus: React.FC<CampaignErrorStatusProps> = ({
  campaignId,
  campaignStatus,
  errorMessage,
  canAutoResume,
  autoPauseReason,
  onResume,
  onRefresh
}) => {
  const [errors, setErrors] = useState<CampaignError[]>([]);
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [canResumeCheck, setCanResumeCheck] = useState<{
    canResume: boolean;
    reason?: string;
    suggestedDelay?: number;
  }>({ canResume: true });
  const { toast } = useToast();

  useEffect(() => {
    if (campaignStatus === 'paused') {
      loadErrors();
      checkResumeability();
    }
  }, [campaignId, campaignStatus]);

  const loadErrors = async () => {
    try {
      const campaignErrors = await campaignErrorHandler.getCampaignErrors(campaignId);
      setErrors(campaignErrors);
    } catch (error) {
      console.error('Error loading campaign errors:', error);
    }
  };

  const checkResumeability = async () => {
    try {
      const resumeCheck = await campaignErrorHandler.canAutoResumeCampaign(campaignId);
      setCanResumeCheck(resumeCheck);
    } catch (error) {
      console.error('Error checking resume capability:', error);
    }
  };

  const handleResume = async () => {
    if (!onResume) return;

    setResuming(true);
    try {
      const result = await onResume();
      
      if (result.success) {
        toast({
          title: 'Campaign Resumed',
          description: result.message,
        });
        
        // Mark errors as resolved
        for (const error of errors.filter(e => !e.resolved_at)) {
          await campaignErrorHandler.resolveError(error.id);
        }
        
        onRefresh?.();
      } else {
        toast({
          title: 'Resume Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Resume Error',
        description: formatErrorForUI(error),
        variant: 'destructive',
      });
    } finally {
      setResuming(false);
    }
  };

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <RefreshCw className="w-4 h-4" />;
      case 'rate_limit':
        return <Clock className="w-4 h-4" />;
      case 'authentication':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorTypeBadgeVariant = (errorType: string) => {
    switch (errorType) {
      case 'network':
      case 'rate_limit':
        return 'secondary';
      case 'authentication':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = () => {
    switch (campaignStatus) {
      case 'active':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (campaignStatus) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'paused':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // Don't show for active or completed campaigns without errors
  if ((campaignStatus === 'active' || campaignStatus === 'completed') && !errorMessage && errors.length === 0) {
    return null;
  }

  const unresolvedErrors = errors.filter(error => !error.resolved_at);
  const hasRecentErrors = unresolvedErrors.length > 0;

  return (
    <Card className={`border-l-4 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>Campaign Status</span>
            <Badge variant={campaignStatus === 'paused' ? 'secondary' : 'default'}>
              {campaignStatus === 'paused' ? 'Auto-Paused' : campaignStatus}
            </Badge>
          </div>
          
          {campaignStatus === 'paused' && canResumeCheck.canResume && onResume && (
            <Button
              size="sm"
              onClick={handleResume}
              disabled={resuming}
              className="gap-2"
            >
              {resuming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              )}
            </Button>
          )}
        </CardTitle>
        
        {(autoPauseReason || errorMessage) && (
          <CardDescription className="text-sm">
            {autoPauseReason || errorMessage}
          </CardDescription>
        )}
      </CardHeader>

      {(hasRecentErrors || !canResumeCheck.canResume) && (
        <CardContent className="pt-0">
          {!canResumeCheck.canResume && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <strong>Manual Intervention Required:</strong> {canResumeCheck.reason}
              </AlertDescription>
            </Alert>
          )}

          {canResumeCheck.suggestedDelay && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                Resume will be delayed by {Math.round(canResumeCheck.suggestedDelay / 1000)} seconds due to rate limiting.
              </AlertDescription>
            </Alert>
          )}

          {hasRecentErrors && (
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                  <span>
                    {unresolvedErrors.length} unresolved error{unresolvedErrors.length !== 1 ? 's' : ''}
                  </span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2 mt-2">
                {unresolvedErrors.slice(0, 5).map((error) => (
                  <div key={error.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getErrorTypeIcon(error.error_type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getErrorTypeBadgeVariant(error.error_type)} className="text-xs">
                              {error.error_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Step: {error.step_name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 truncate">
                            {error.error_message}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>
                              Attempt {error.retry_count}/{error.max_retries}
                            </span>
                            <span>
                              {new Date(error.created_at).toLocaleTimeString()}
                            </span>
                            {error.can_auto_resume && (
                              <Badge variant="outline" className="text-xs">
                                Auto-resumable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {unresolvedErrors.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {unresolvedErrors.length - 5} more errors
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {campaignStatus === 'paused' && canAutoResume && canResumeCheck.canResume && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                <strong>Good News:</strong> This campaign can be automatically resumed. The errors encountered are recoverable.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CampaignErrorStatus;
