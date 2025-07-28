import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ArrowRight, 
  Zap, 
  Shield, 
  Star,
  X,
  CheckCircle
} from "lucide-react";

interface TrialConversionBannerProps {
  onUpgrade: () => void;
  onDismiss?: () => void;
  trialExpiresAt?: string;
  className?: string;
}

export function TrialConversionBanner({ 
  onUpgrade, 
  onDismiss, 
  trialExpiresAt,
  className = ""
}: TrialConversionBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!trialExpiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(trialExpiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setIsExpiring(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 2) {
        setIsExpiring(true);
      }

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialExpiresAt]);

  return (
    <Card className={`border-l-4 ${isExpiring ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'} shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`${isExpiring ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300'} font-mono text-xs`}
              >
                {isExpiring ? "TRIAL EXPIRING" : "TRIAL ACTIVE"}
              </Badge>
              {trialExpiresAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{timeRemaining}</span>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-1">
              {isExpiring ? "Don't Lose Your Backlinks!" : "Upgrade Your Trial"}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isExpiring 
                ? "Your trial backlinks will expire soon. Upgrade now to make them permanent and unlock all features."
                : "Convert your trial backlinks to permanent ones and unlock advanced features."
              }
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Permanent links</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Campaign management</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={onUpgrade}
                className={`flex-1 ${isExpiring ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'} text-white`}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isExpiring ? "Upgrade Now" : "Upgrade Trial"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              {!isExpiring && (
                <Button 
                  variant="outline" 
                  onClick={() => {/* Show more details */}}
                  className="flex-shrink-0"
                >
                  Learn More
                </Button>
              )}
            </div>
          </div>

          {onDismiss && !isExpiring && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-amber-200 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Money-back guarantee</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>Well rated</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Instant activation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
