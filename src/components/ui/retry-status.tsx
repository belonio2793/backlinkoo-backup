import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Clock
} from "lucide-react";

interface RetryStatusProps {
  isRetrying: boolean;
  currentAttempt: number;
  maxAttempts: number;
  lastError?: string;
  nextRetryIn?: number;
  className?: string;
}

export function RetryStatus({ 
  isRetrying, 
  currentAttempt, 
  maxAttempts, 
  lastError,
  nextRetryIn,
  className = "" 
}: RetryStatusProps) {
  const progressPercentage = (currentAttempt / maxAttempts) * 100;
  const isLastAttempt = currentAttempt === maxAttempts;

  if (!isRetrying && currentAttempt === 0) {
    return null;
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />
              <span className="font-medium text-orange-800">
                {isRetrying ? 'Retrying...' : 'Retry Status'}
              </span>
            </div>
            <Badge 
              variant={isLastAttempt ? "destructive" : "secondary"}
              className="text-xs"
            >
              Attempt {currentAttempt}/{maxAttempts}
            </Badge>
          </div>

          <Progress 
            value={progressPercentage} 
            className="w-full h-2"
          />

          {lastError && (
            <div className="flex items-start gap-2 p-2 bg-orange-100 rounded border border-orange-200">
              <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-orange-700">
                Last error: {lastError.substring(0, 100)}{lastError.length > 100 ? '...' : ''}
              </span>
            </div>
          )}

          {nextRetryIn && nextRetryIn > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <Clock className="h-3 w-3" />
              <span>Next retry in {Math.ceil(nextRetryIn / 1000)}s</span>
            </div>
          )}

          <div className="text-xs text-orange-600">
            {isLastAttempt ? (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Final attempt - if this fails, manual retry required</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Automatic retries with exponential backoff</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
