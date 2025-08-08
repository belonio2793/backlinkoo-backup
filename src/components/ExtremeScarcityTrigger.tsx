import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingDown, 
  Users, 
  X,
  Flame,
  Skull,
  Heart,
  Eye,
  Zap,
  Crown,
  Gift,
  Target,
  ShieldAlert,
  Timer,
  Siren
} from 'lucide-react';

interface ExtremeScarcityTriggerProps {
  onSignUp: () => void;
  onLogin: () => void;
  onClose: () => void;
  contentValue?: string;
  timeRemaining?: string;
  postTitle?: string;
}

export function ExtremeScarcityTrigger({
  onSignUp,
  onLogin,
  onClose,
  contentValue = "$862",
  timeRemaining = "23:47:32",
  postTitle = "your professional content"
}: ExtremeScarcityTriggerProps) {
  const [currentScareIndex, setCurrentScareIndex] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [showFinalCountdown, setShowFinalCountdown] = useState(false);

  const scareTactics = [
    {
      icon: Skull,
      title: "CONTENT DEATH COUNTDOWN",
      subtitle: "Your work is about to die forever",
      description: "Once this timer hits zero, your content will be permanently executed. No recovery possible.",
      color: "from-red-600 to-black",
      textColor: "text-red-100",
      bgColor: "bg-red-900"
    },
    {
      icon: DollarSign,
      title: "HEMORRHAGING MONEY",
      subtitle: `You're bleeding ${contentValue} in value`,
      description: "Every second you wait, you're literally watching money evaporate. This is financial suicide.",
      color: "from-red-500 to-orange-600",
      textColor: "text-red-100",
      bgColor: "bg-red-800"
    },
    {
      icon: TrendingDown,
      title: "RANKINGS COLLAPSING",
      subtitle: "Your SEO is about to crash",
      description: "Without this backlink, your competitors will crush you. You'll become invisible on Google.",
      color: "from-purple-600 to-red-600",
      textColor: "text-purple-100",
      bgColor: "bg-purple-900"
    },
    {
      icon: Users,
      title: "OTHERS ARE TAKING YOUR SPOT",
      subtitle: "Someone else is getting ahead while you hesitate",
      description: "While you're wasting time, smart marketers are securing their rankings. Don't be left behind.",
      color: "from-orange-600 to-red-600",
      textColor: "text-orange-100",
      bgColor: "bg-orange-900"
    }
  ];

  const urgentMessages = [
    "🚨 FINAL WARNING: Content deletion imminent",
    "💀 POINT OF NO RETURN: Save now or lose forever",
    "⚡ LAST CHANCE: Don't be the 97% who regret this",
    "🔥 EMERGENCY: Your SEO investment is dying",
    "💰 CRITICAL: You're about to lose everything"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScareIndex((prev) => (prev + 1) % scareTactics.length);
    }, 3000);

    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.1 : 1);
    }, 500);

    // Show final countdown after 15 seconds
    const finalTimer = setTimeout(() => {
      setShowFinalCountdown(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(pulseInterval);
      clearTimeout(finalTimer);
    };
  }, []);

  const currentScare = scareTactics[currentScareIndex];
  const ScareIcon = currentScare.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card 
        className="max-w-2xl w-full border-4 border-red-500 shadow-2xl animate-pulse"
        style={{ transform: `scale(${pulseIntensity})` }}
      >
        <CardContent className="p-0">
          {/* Extreme Header */}
          <div className={`p-6 bg-gradient-to-r ${currentScare.color} text-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-red-600 text-white text-xs font-bold animate-bounce">
                  🚨 CONTENT EMERGENCY
                </Badge>
                <button 
                  onClick={onClose}
                  className="text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <ScareIcon className={`h-12 w-12 ${currentScare.textColor} animate-pulse`} />
                <div className="text-left">
                  <h1 className={`text-2xl font-black ${currentScare.textColor} tracking-wide`}>
                    {currentScare.title}
                  </h1>
                  <p className={`text-lg ${currentScare.textColor} opacity-90`}>
                    {currentScare.subtitle}
                  </p>
                </div>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-white text-4xl font-mono font-bold tracking-wider">
                  {timeRemaining}
                </div>
                <div className="text-white/80 text-sm">
                  Until permanent deletion
                </div>
              </div>
            </div>
          </div>

          {/* Rotating Scare Content */}
          <div className={`p-6 ${currentScare.bgColor} text-center transition-all duration-1000`}>
            <p className={`text-lg ${currentScare.textColor} mb-4`}>
              {currentScare.description}
            </p>
            
            <div className="bg-black/40 p-4 rounded-lg mb-4">
              <div className="text-yellow-400 text-2xl font-bold mb-2">
                {contentValue} VALUE VANISHING
              </div>
              <div className="text-white/80 text-sm">
                Professional content + SEO value + backlink authority
              </div>
            </div>
          </div>

          {/* Emotional Manipulation Section */}
          <div className="p-6 bg-gray-900 text-white">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                💔 Don't Let This Be Your Biggest Regret
              </h2>
              <p className="text-gray-300 text-sm">
                97% of people who lose their content say it was their biggest marketing mistake. 
                Don't join them.
              </p>
            </div>

            {/* Fake Social Proof */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-400 mb-2">Recent regret stories:</div>
              <div className="space-y-1 text-xs text-gray-300">
                <div>"I lost my $400 content and my rankings dropped 67%" - Sarah M.</div>
                <div>"Biggest mistake ever. Cost me $2,847 in lost business" - Mike K.</div>
                <div>"My competitor took my spot while I hesitated" - Jennifer R.</div>
              </div>
            </div>

            {/* Urgency Messages */}
            <div className="bg-red-900/50 p-4 rounded-lg mb-6 border border-red-500">
              <div className="text-center">
                <div className="text-red-400 font-bold text-sm animate-pulse">
                  {urgentMessages[currentScareIndex]}
                </div>
              </div>
            </div>

            {/* Final Push */}
            {showFinalCountdown && (
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-lg mb-6 animate-pulse">
                <div className="text-center text-white">
                  <div className="font-bold text-lg mb-1">🔥 FINAL SECONDS</div>
                  <div className="text-sm opacity-90">
                    This popup will never appear again. Last chance to save your work.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-black text-center space-y-4">
            <Button
              onClick={onSignUp}
              size="lg"
              className="w-full text-xl py-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-2xl transform hover:scale-105 transition-all duration-200 animate-pulse"
            >
              <Crown className="mr-3 h-6 w-6" />
              🛡️ SAVE MY CONTENT NOW (FREE)
              <Flame className="ml-3 h-6 w-6" />
            </Button>

            <Button
              onClick={onLogin}
              variant="outline"
              size="lg"
              className="w-full border-2 border-blue-500 text-blue-400 hover:bg-blue-900/50"
            >
              Already have account? Emergency login
            </Button>

            <div className="text-center">
              <button
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-400 underline"
              >
                I accept the risk of losing {contentValue} worth of content
              </button>
            </div>

            {/* Final guilt trip */}
            <div className="text-xs text-gray-400 text-center mt-4 p-3 bg-gray-900 rounded border border-gray-700">
              ⚠️ Warning: Closing this popup means you accept full responsibility for content loss. 
              No recovery options will be available after deletion.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
