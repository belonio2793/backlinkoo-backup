import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Heart, 
  DollarSign, 
  Clock, 
  X,
  Crown,
  Gift,
  Star,
  Zap,
  Target,
  Eye,
  Brain,
  Lightbulb
} from 'lucide-react';

interface ExitIntentTriggerProps {
  onSignUp: () => void;
  onLogin: () => void;
  onStay: () => void;
  contentTitle?: string;
  contentValue?: string;
}

export function ExitIntentTrigger({
  onSignUp,
  onLogin,
  onStay,
  contentTitle = "your valuable content",
  contentValue = "$862"
}: ExitIntentTriggerProps) {
  const [emotionalState, setEmotionalState] = useState(0);
  const [showPersonalization, setShowPersonalization] = useState(false);

  const emotionalMessages = [
    {
      icon: Heart,
      title: "Wait! We Actually Care About Your Success",
      description: "I know popups are annoying, but losing your content would be devastating. Let us help you keep it safe.",
      emotion: "❤️ Genuine concern"
    },
    {
      icon: Brain,
      title: "Smart Marketers Don't Walk Away Empty-Handed",
      description: "You came here for a reason. You invested time creating this content. Don't let that investment go to waste.",
      emotion: "🧠 Strategic thinking"
    },
    {
      icon: Eye,
      title: "I See You're About to Leave...",
      description: "Before you go, can we be honest? This content represents real SEO value. Losing it hurts your rankings.",
      emotion: "👁️ Direct truth"
    },
    {
      icon: Lightbulb,
      title: "What If I Told You This Takes 30 Seconds?",
      description: "Creating an account literally takes less time than making coffee. But the value lasts forever.",
      emotion: "💡 Simple logic"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setEmotionalState((prev) => (prev + 1) % emotionalMessages.length);
    }, 4000);

    // Show personalized message after 8 seconds
    const personalTimer = setTimeout(() => {
      setShowPersonalization(true);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(personalTimer);
    };
  }, []);

  const currentMessage = emotionalMessages[emotionalState];
  const MessageIcon = currentMessage.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-blue-500 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Emotional Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              <MessageIcon className="h-4 w-4" />
              {currentMessage.emotion}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {currentMessage.title}
            </h1>
            
            <p className="text-gray-600 leading-relaxed">
              {currentMessage.description}
            </p>
          </div>

          {/* Personalized Message */}
          {showPersonalization && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="text-sm font-semibold text-yellow-800 mb-2">
                🎯 Personalized for you:
              </div>
              <p className="text-yellow-700 text-sm">
                Based on your activity, you seem serious about SEO. People like you usually see 
                3-5x better results when they secure their content properly.
              </p>
            </div>
          )}

          {/* Value Breakdown */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 mb-3">What you're walking away from:</h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex justify-between">
                <span>Professional content creation</span>
                <span className="font-bold">$297</span>
              </div>
              <div className="flex justify-between">
                <span>SEO optimization & backlink</span>
                <span className="font-bold">$197</span>
              </div>
              <div className="flex justify-between">
                <span>Hosting & publishing</span>
                <span className="font-bold">$97</span>
              </div>
              <div className="flex justify-between">
                <span>Analytics & tracking</span>
                <span className="font-bold">$47</span>
              </div>
              <div className="border-t border-green-300 pt-2 flex justify-between font-bold text-base">
                <span>Total value</span>
                <span>{contentValue}</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <Badge className="bg-green-600 text-white">
                FREE with account (normally $97/month)
              </Badge>
            </div>
          </div>

          {/* Honest Approach */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-left">
            <h4 className="font-semibold text-gray-800 mb-2">Let's be honest:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ You found value in our tool (you created content)</li>
              <li>✓ You want better SEO rankings (that's why you're here)</li>
              <li>✓ Free accounts actually work (no hidden costs)</li>
              <li>✓ This literally takes 30 seconds</li>
            </ul>
          </div>

          {/* Social Proof */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">287 people created accounts today</span>
            </div>
            <p className="text-xs text-blue-600">
              Join successful marketers who chose to secure their content
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onSignUp}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4"
            >
              <Gift className="mr-2 h-5 w-5" />
              Yes, Secure My {contentValue} Content (30 seconds)
            </Button>

            <Button
              onClick={onLogin}
              variant="outline"
              size="lg"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              I already have an account - Log me in
            </Button>

            <Button
              onClick={onStay}
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Let me think about it (stay on page)
            </Button>
          </div>

          {/* Final disclaimer */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>No spam, no hidden fees, cancel anytime.</p>
            <p>We respect your inbox and your time.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to detect exit intent
export function useExitIntent(onExitIntent: () => void) {
  useEffect(() => {
    let isExiting = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isExiting) {
        isExiting = true;
        onExitIntent();
        
        // Reset after 30 seconds
        setTimeout(() => {
          isExiting = false;
        }, 30000);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isExiting) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your content will be lost forever.';
        onExitIntent();
        return e.returnValue;
      }
    };

    // Add event listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onExitIntent]);
}
