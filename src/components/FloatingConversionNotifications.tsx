import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  X,
  Flame,
  Heart,
  Eye,
  Zap,
  Crown,
  Gift,
  Target,
  Timer,
  Rocket,
  Star,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bell,
  Megaphone,
  Siren,
  Lightbulb,
  Brain
} from 'lucide-react';

interface FloatingConversionNotificationsProps {
  isVisible: boolean;
  onSignUp: () => void;
  onLogin: () => void;
  onClose: () => void;
  formProgress: {
    hasKeyword: boolean;
    hasUrl: boolean;
    hasAnchor: boolean;
  };
}

export function FloatingConversionNotifications({
  isVisible,
  onSignUp,
  onLogin,
  onClose,
  formProgress
}: FloatingConversionNotificationsProps) {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showFloatingAlert, setShowFloatingAlert] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [urgencyLevel, setUrgencyLevel] = useState(1);

  const notifications = [
    {
      icon: Flame,
      title: "🔥 CONTENT QUALITY DETECTED!",
      message: "Your keyword choice is FIRE! This will dominate the SERPs!",
      color: "from-red-500 to-orange-500",
      action: "Secure this winner!"
    },
    {
      icon: Rocket,
      title: "🚀 TRAFFIC EXPLOSION INCOMING!",
      message: "This URL combo will send your rankings TO THE MOON!",
      color: "from-blue-500 to-purple-500",
      action: "Lock in these gains!"
    },
    {
      icon: Crown,
      title: "👑 AUTHORITY CONTENT DETECTED!",
      message: "You're about to become the KING/QUEEN of your niche!",
      color: "from-yellow-500 to-orange-500",
      action: "Claim your throne!"
    },
    {
      icon: DollarSign,
      title: "💰 MONEY-MAKER ALERT!",
      message: "This content will generate SERIOUS revenue!",
      color: "from-green-500 to-emerald-500",
      action: "Activate money printer!"
    },
    {
      icon: Target,
      title: "🎯 PERFECT TARGETING!",
      message: "Your anchor text strategy is GENIUS level!",
      color: "from-purple-500 to-pink-500",
      action: "Don't lose this edge!"
    }
  ];

  const stickyMessages = [
    "🚨 Your content is TOO GOOD to lose!",
    "⚡ This will DESTROY your competition!",
    "💎 You're sitting on a GOLDMINE!",
    "🔥 This content is PURE FIRE!",
    "🚀 Your traffic is about to EXPLODE!"
  ];

  const floatingAlerts = [
    { text: "Sarah just saved her content!", time: "2 sec ago", color: "green" },
    { text: "Mike's rankings jumped 347%!", time: "5 sec ago", color: "blue" },
    { text: "Jennifer got 2,847 new visitors!", time: "8 sec ago", color: "purple" },
    { text: "Alex's revenue increased $23,847!", time: "12 sec ago", color: "orange" },
    { text: "Maria dominated page 1!", time: "15 sec ago", color: "red" }
  ];

  // Show notifications based on form progress
  useEffect(() => {
    if (!isVisible) return;

    let notificationIndex = 0;
    if (formProgress.hasKeyword) notificationIndex = 1;
    if (formProgress.hasUrl) notificationIndex = 2;
    if (formProgress.hasAnchor) notificationIndex = 3;

    setCurrentNotification(notificationIndex);

    // Show sticky bar after keyword is entered
    if (formProgress.hasKeyword) {
      setShowStickyBar(true);
    }

    // Show floating alerts after URL is entered
    if (formProgress.hasUrl) {
      setShowFloatingAlert(true);
    }
  }, [formProgress, isVisible]);

  // Animation effects
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.1 : 1);
    }, 800);

    const notificationInterval = setInterval(() => {
      if (showStickyBar) {
        setCurrentNotification(prev => (prev + 1) % notifications.length);
      }
    }, 4000);

    const urgencyInterval = setInterval(() => {
      setUrgencyLevel(prev => prev >= 5 ? 1 : prev + 1);
    }, 3000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(notificationInterval);
      clearInterval(urgencyInterval);
    };
  }, [showStickyBar]);

  if (!isVisible) return null;

  const currentNote = notifications[currentNotification];
  const NoteIcon = currentNote.icon;

  return (
    <>
      {/* FLOATING SOCIAL PROOF ALERTS */}
      {showFloatingAlert && (
        <div className="fixed top-20 right-4 z-[9998] space-y-3">
          {floatingAlerts.slice(0, 3).map((alert, index) => (
            <Card 
              key={index}
              className={`border-2 border-${alert.color}-400 shadow-xl animate-slide-in-right`}
              style={{ 
                animationDelay: `${index * 0.5}s`,
                transform: `scale(${pulseIntensity})`
              }}
            >
              <CardContent className={`p-3 bg-gradient-to-r from-${alert.color}-50 to-${alert.color}-100`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 bg-${alert.color}-500 rounded-full animate-pulse`}></div>
                  <div>
                    <div className={`text-sm font-bold text-${alert.color}-800`}>{alert.text}</div>
                    <div className={`text-xs text-${alert.color}-600`}>{alert.time}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* STICKY BOTTOM BAR */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-[9997] bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 shadow-2xl animate-slide-in-bottom">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <NoteIcon className="h-8 w-8 animate-bounce" />
              <div>
                <div className="font-black text-lg">{currentNote.title}</div>
                <div className="text-sm opacity-90">{currentNote.message}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className="bg-yellow-400 text-black font-bold text-lg px-4 py-2 animate-pulse">
                {stickyMessages[urgencyLevel - 1]}
              </Badge>
              
              <Button
                onClick={onSignUp}
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-3 text-lg animate-bounce"
              >
                <Crown className="mr-2 h-5 w-5" />
                {currentNote.action}
              </Button>
              
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white ml-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORNER NOTIFICATION */}
      {formProgress.hasKeyword && (
        <div className="fixed top-4 right-4 z-[9996] animate-bounce">
          <Card className="border-4 border-yellow-400 shadow-2xl bg-gradient-to-r from-yellow-400 to-orange-500">
            <CardContent className="p-4 text-center">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-black animate-pulse" />
                <div className="text-black">
                  <div className="font-black text-sm">GENIUS DETECTED!</div>
                  <div className="text-xs">Your keyword is PERFECT!</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PROGRESS CELEBRATION */}
      {formProgress.hasUrl && formProgress.hasKeyword && (
        <div className="fixed top-1/2 left-4 z-[9995] animate-pulse">
          <Card className="border-4 border-green-400 shadow-xl bg-gradient-to-r from-green-400 to-blue-500 text-white">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-2 animate-bounce" />
              <div className="font-black text-lg">UNSTOPPABLE!</div>
              <div className="text-sm">This combo will DOMINATE!</div>
              <Button
                onClick={onSignUp}
                size="sm"
                className="mt-3 bg-yellow-400 text-black font-bold"
              >
                Secure Victory!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* URGENCY TICKER */}
      {urgencyLevel >= 3 && (
        <div className="fixed top-0 left-0 right-0 z-[9994] bg-red-600 text-white p-2 animate-pulse">
          <div className="text-center font-bold">
            🚨 ALERT: {Math.floor(Math.random() * 50) + 20} people are viewing this page RIGHT NOW! 
            Don't let them steal your advantage! 🚨
          </div>
        </div>
      )}

      {/* SIDE NOTIFICATION STACK */}
      {formProgress.hasAnchor && (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-[9993] space-y-3">
          <Card className="border-4 border-purple-400 shadow-xl animate-pulse">
            <CardContent className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Brain className="h-8 w-8 mx-auto mb-2" />
              <div className="text-center">
                <div className="font-black text-sm">MASTERMIND!</div>
                <div className="text-xs">Your strategy is FLAWLESS!</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// CSS for animations (add to global styles)
export const floatingNotificationStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out forwards;
}

.animate-slide-in-bottom {
  animation: slide-in-bottom 0.3s ease-out forwards;
}
`;
