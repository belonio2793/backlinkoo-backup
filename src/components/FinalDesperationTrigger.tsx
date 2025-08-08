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
  Lightbulb,
  HandHeart,
  Users,
  TrendingDown,
  Shield,
  Bomb,
  Skull,
  Flame
} from 'lucide-react';

interface FinalDesperationTriggerProps {
  onSignUp: () => void;
  onLogin: () => void;
  onClose: () => void;
  userName?: string;
  contentTitle?: string;
}

export function FinalDesperationTrigger({
  onSignUp,
  onLogin,
  onClose,
  userName = "Friend",
  contentTitle = "your valuable content"
}: FinalDesperationTriggerProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const desperationPhases = [
    {
      title: "Please... Just Give Us 30 Seconds",
      subtitle: "We're literally begging you",
      message: "Look, I'll be completely honest. Our conversion rates depend on people like you. You seem smart, you understand value. Please don't walk away empty-handed.",
      emotion: "🙏 Desperation",
      style: "from-blue-600 to-purple-600"
    },
    {
      title: "This Hurts Us More Than You",
      subtitle: "We've invested $2,847 creating this for you",
      message: "Every piece of content costs us real money to create. When you walk away, we literally lose money. But we'd rather lose money than see you lose your SEO opportunity.",
      emotion: "💔 Pain",
      style: "from-red-600 to-pink-600"
    },
    {
      title: "Your Success = Our Success",
      subtitle: "We only win when you win",
      message: "We don't make money from premium subscriptions. We make money when our users succeed and refer others. Your success is literally our business model.",
      emotion: "🤝 Partnership",
      style: "from-green-600 to-blue-600"
    },
    {
      title: "What Would Your Future Self Say?",
      subtitle: "Think 6 months from now",
      message: "Six months from now, when your competitors are ranking higher, when you're wondering why your SEO isn't working... you'll remember this moment. Don't let future you down.",
      emotion: "🔮 Regret Prevention",
      style: "from-purple-600 to-indigo-600"
    }
  ];

  const finalMessages = [
    "This is our last attempt to help you",
    "We won't show this popup again",
    "Your content expires in hours",
    "97% of people regret not saving",
    "This decision affects your entire SEO strategy"
  ];

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % desperationPhases.length);
    }, 5000);

    const shakeInterval = setInterval(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }, 3000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(shakeInterval);
    };
  }, []);

  const currentContent = desperationPhases[currentPhase];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <Card 
        className={`max-w-xl w-full border-4 border-red-500 shadow-2xl ${isShaking ? 'animate-bounce' : ''}`}
      >
        <CardContent className="p-0">
          {/* Desperate Header */}
          <div className={`p-8 bg-gradient-to-r ${currentContent.style} text-white text-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white text-xs font-bold mb-4 animate-pulse">
                {currentContent.emotion}
              </Badge>
              
              <h1 className="text-3xl font-black mb-2 leading-tight">
                {currentContent.title}
              </h1>
              
              <p className="text-xl opacity-90 mb-4">
                {currentContent.subtitle}
              </p>

              <div className="bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed">
                  {currentContent.message}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Connection */}
          <div className="p-6 bg-gray-900 text-white">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-2">
                <HandHeart className="h-6 w-6" />
                A Personal Message from Our Team
              </h2>
              <div className="bg-gray-800 p-4 rounded-lg text-left text-sm text-gray-300 leading-relaxed">
                <p className="mb-3">
                  "Hi {userName}, this is Alex from the Backlinkoo team. I've been watching your session, 
                  and I can see you created some really good content about '{contentTitle}'.
                </p>
                <p className="mb-3">
                  I know popups are annoying, but I genuinely don't want you to lose your work. 
                  We've seen thousands of people walk away and then email us days later asking if we can recover their content. 
                  We can't.
                </p>
                <p className="font-semibold text-yellow-400">
                  Please, just click the button below. It takes 30 seconds and saves you from future regret."
                </p>
                <div className="text-right mt-2 text-xs text-gray-400">
                  - Alex, Customer Success Lead
                </div>
              </div>
            </div>

            {/* Guilt Trip Statistics */}
            <div className="bg-red-900/50 p-4 rounded-lg border border-red-500 mb-6">
              <h3 className="font-bold text-red-400 mb-3 text-center">Real Data That Might Change Your Mind:</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">People who regret not saving:</span>
                  <span className="text-red-400 font-bold">97%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average cost to recreate content:</span>
                  <span className="text-red-400 font-bold">$423</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Time to see ranking impact:</span>
                  <span className="text-red-400 font-bold">2-4 weeks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">People who email us asking for recovery:</span>
                  <span className="text-red-400 font-bold">23/day</span>
                </div>
              </div>
            </div>

            {/* Rotating Final Messages */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-lg text-center mb-6 animate-pulse">
              <div className="text-white font-bold">
                {finalMessages[currentPhase]}
              </div>
            </div>
          </div>

          {/* Final Push with Extreme Social Proof */}
          <div className="p-6 bg-black text-white">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">
                🔥 What Happened in the Last 10 Minutes:
              </h3>
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-center gap-3 p-2 bg-gray-900 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Sarah M. just saved her content about "digital marketing"</span>
                  <span className="text-green-400 text-xs">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-900 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Mike K. secured his SEO backlink permanently</span>
                  <span className="text-green-400 text-xs">4 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-900 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Jennifer R. claimed her free account</span>
                  <span className="text-green-400 text-xs">7 min ago</span>
                </div>
              </div>
            </div>

            {/* Extreme Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={onSignUp}
                size="lg"
                className="w-full text-2xl py-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black shadow-2xl transform hover:scale-105 transition-all duration-200 animate-pulse"
              >
                <Crown className="mr-4 h-8 w-8" />
                OK FINE! SAVE MY CONTENT (FREE)
                <Star className="ml-4 h-8 w-8" />
              </Button>

              <Button
                onClick={onLogin}
                variant="outline"
                size="lg"
                className="w-full border-2 border-blue-500 text-blue-400 hover:bg-blue-900/50 py-4 text-lg"
              >
                <Shield className="mr-2 h-5 w-5" />
                I Have Account - Emergency Login
              </Button>

              <div className="text-center space-y-2">
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-400 underline block mx-auto"
                >
                  I understand the consequences and want to lose my content anyway
                </button>
                
                <div className="text-xs text-gray-400 p-3 bg-gray-900 rounded border border-gray-700">
                  ⚠️ Final Warning: This is our last attempt to help. No recovery options exist after content deletion.
                  We will not show this popup again, and our support team cannot restore deleted content.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
