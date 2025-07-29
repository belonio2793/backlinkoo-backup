import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";
import {
  ArrowRight,
  Zap,
  Star,
  Users,
  Clock,
  Shield,
  CheckCircle
} from "lucide-react";

interface InlineAuthFormProps {
  onAuthSuccess?: (user: any) => void;
  onTrialConversion?: () => void;
  showTrialUpgrade?: boolean;
  className?: string;
}

export function InlineAuthForm({
  onAuthSuccess,
  onTrialConversion,
  showTrialUpgrade = false,
  className = ""
}: InlineAuthFormProps) {
  const handleTrialUpgrade = () => {
    if (onTrialConversion) {
      onTrialConversion();
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${className}`}>
      {showTrialUpgrade && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Trial Active</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Upgrade your trial to permanent backlinks and unlock all features
          </p>
          <Button
            size="sm"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleTrialUpgrade}
          >
            <Zap className="h-3 w-3 mr-1" />
            Upgrade Trial
          </Button>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-center">
          {showTrialUpgrade ? "Upgrade Your Trial" : "Get Started Today"}
        </CardTitle>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Growing community</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>Well rated</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <AuthFormTabs
          onAuthSuccess={onAuthSuccess}
          showTrialUpgrade={showTrialUpgrade}
          isCompact={true}
        />

        {/* Trust signals */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-xs text-muted-foreground">
              <Shield className="h-3 w-3 mx-auto mb-1" />
              <span>Secure</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mx-auto mb-1" />
              <span>Instant Setup</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3 mx-auto mb-1" />
              <span>Start Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
