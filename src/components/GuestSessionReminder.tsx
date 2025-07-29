import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  ArrowRight, 
  X, 
  Shield, 
  Star,
  Clock,
  CheckCircle,
  Zap,
  Crown,
  TrendingUp
} from "lucide-react";

interface GuestSessionReminderProps {
  onSignUp: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "floating" | "banner" | "card";
  position?: "top" | "bottom" | "center";
}

export function GuestSessionReminder({ 
  onSignUp, 
  onDismiss,
  className = "",
  variant = "floating",
  position = "bottom"
}: GuestSessionReminderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Track session start time
    const sessionStart = localStorage.getItem('guest_session_start');
    const currentTime = new Date().getTime();
    
    if (!sessionStart) {
      localStorage.setItem('guest_session_start', currentTime.toString());
    }

    // Get stored interaction count
    const storedInteractions = parseInt(localStorage.getItem('guest_interactions') || '0');
    setInteractionCount(storedInteractions);

    // Calculate session duration
    const startTime = parseInt(sessionStart || currentTime.toString());
    const duration = Math.floor((currentTime - startTime) / 1000 / 60); // minutes
    setSessionDuration(duration);

    // Show reminder based on engagement criteria
    const shouldShow = checkShouldShowReminder(duration, storedInteractions);
    setIsVisible(shouldShow);

    // Update interaction count periodically
    const interval = setInterval(() => {
      const newInteractions = parseInt(localStorage.getItem('guest_interactions') || '0');
      setInteractionCount(newInteractions);
      
      const newDuration = Math.floor((new Date().getTime() - startTime) / 1000 / 60);
      setSessionDuration(newDuration);
      
      if (checkShouldShowReminder(newDuration, newInteractions)) {
        setIsVisible(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkShouldShowReminder = (duration: number, interactions: number): boolean => {
    // Don't show if dismissed recently
    const lastDismissed = localStorage.getItem('guest_reminder_dismissed');
    if (lastDismissed) {
      const dismissTime = parseInt(lastDismissed);
      const timeSinceDismiss = (new Date().getTime() - dismissTime) / 1000 / 60; // minutes
      if (timeSinceDismiss < 15) return false; // Wait 15 minutes after dismissal
    }

    // Show based on engagement criteria
    return (
      (duration >= 3 && interactions >= 2) || // 3+ minutes and 2+ interactions
      (duration >= 5) || // 5+ minutes regardless
      (interactions >= 5) // 5+ interactions regardless
    );
  };

  const trackInteraction = () => {
    const current = parseInt(localStorage.getItem('guest_interactions') || '0');
    localStorage.setItem('guest_interactions', (current + 1).toString());
    setInteractionCount(current + 1);
  };

  const handleDismiss = () => {
    localStorage.setItem('guest_reminder_dismissed', new Date().getTime().toString());
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSignUp = () => {
    trackInteraction();
    onSignUp();
  };

  const benefits = [
    { icon: Shield, text: "Save your work permanently", highlight: true },
    { icon: TrendingUp, text: "Access advanced analytics", highlight: false },
    { icon: Star, text: "Priority customer support", highlight: false },
    { icon: Crown, text: "Unlock premium features", highlight: false }
  ];

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-4 left-4 right-4";
      case "center":
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      default: // bottom
        return "bottom-4 left-4 right-4";
    }
  };

  if (variant === "floating") {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 max-w-sm mx-auto ${className}`}>
        <Card className="shadow-xl border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Welcome back!</div>
                  <div className="text-xs text-muted-foreground">
                    {sessionDuration}m session • {interactionCount} actions
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Create an account to save your progress and unlock premium features.
            </p>

            <div className="space-y-2 mb-4">
              {benefits.slice(0, 2).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <benefit.icon className="h-3 w-3 text-green-600" />
                  <span className={benefit.highlight ? "font-medium" : ""}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSignUp}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="h-3 w-3 mr-1" />
                Sign Up Free
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSignUp}
                className="flex-shrink-0"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                Guest Session
              </Badge>
            </div>
            <div className="hidden sm:block text-sm">
              <span className="font-medium">
                {sessionDuration}m browsing • {interactionCount} interactions
              </span>
              <span className="ml-2 opacity-90">
                Sign up to save your progress and unlock features!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSignUp}
              className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
            >
              <Crown className="mr-1 h-4 w-4" />
              Sign Up Free
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/10 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <Card className={`border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Ready to unlock more?</h3>
            <p className="text-sm text-muted-foreground">
              You've been exploring for {sessionDuration} minutes. Create an account to save your progress.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <benefit.icon className="h-4 w-4 text-green-600" />
              <span className={benefit.highlight ? "font-medium" : ""}>
                {benefit.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSignUp}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Create Free Account
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
            className="flex-shrink-0"
          >
            Sign In
          </Button>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-blue-200 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>100% secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>30-second setup</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>No credit card required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
