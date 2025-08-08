import { useState, useEffect } from 'react';
import { HypeConversionBlaster } from './HypeConversionBlaster';
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
  Skull,
  Heart,
  Eye,
  Zap,
  Crown,
  Gift,
  Target,
  ShieldAlert,
  Timer,
  Bomb,
  Rocket,
  Star,
  Trophy,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Siren,
  Brain,
  Lightbulb
} from 'lucide-react';

interface FormData {
  keyword: string;
  targetUrl: string;
  anchorText?: string;
}

interface InstantFormTriggerSystemProps {
  formData: FormData;
  onSignUp: () => void;
  onLogin: () => void;
  isGuestUser: boolean;
}

export function InstantFormTriggerSystem({
  formData,
  onSignUp,
  onLogin,
  isGuestUser
}: InstantFormTriggerSystemProps) {
  const [currentTrigger, setCurrentTrigger] = useState<string | null>(null);
  const [triggerPhase, setTriggerPhase] = useState(0);
  const [showInstantAlert, setShowInstantAlert] = useState(false);
  const [showPreTrigger, setShowPreTrigger] = useState(false);
  const [showMainBlaster, setShowMainBlaster] = useState(false);
  const [showDesperation, setShowDesperation] = useState(false);
  const [userEngagement, setUserEngagement] = useState(0);

  // Instant trigger when form is filled
  useEffect(() => {
    if (isGuestUser && formData.keyword && formData.targetUrl) {
      // Immediate flash alert
      setShowInstantAlert(true);
      
      // Pre-trigger warmup
      setTimeout(() => {
        setShowPreTrigger(true);
        setShowInstantAlert(false);
      }, 2000);

      // Main conversion blaster
      setTimeout(() => {
        setShowMainBlaster(true);
        setShowPreTrigger(false);
      }, 5000);
    }
  }, [formData, isGuestUser]);

  // Track user engagement
  useEffect(() => {
    const handleMouseMove = () => setUserEngagement(prev => prev + 1);
    const handleScroll = () => setUserEngagement(prev => prev + 2);
    const handleClick = () => setUserEngagement(prev => prev + 3);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleTriggerDismiss = () => {
    setShowMainBlaster(false);
    
    // If high engagement, show desperation trigger
    if (userEngagement > 50) {
      setTimeout(() => {
        setShowDesperation(true);
      }, 3000);
    }
  };

  // Don't show anything for authenticated users
  if (!isGuestUser) return null;

  return (
    <>
      {/* INSTANT FLASH ALERT */}
      {showInstantAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-bounce">
          <Card className="border-4 border-red-500 bg-red-600 text-white shadow-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 animate-spin" />
                <div>
                  <div className="font-black text-lg">🔥 CONTENT GENERATED! 🔥</div>
                  <div className="text-sm">Analyzing SEO potential...</div>
                </div>
                <Zap className="h-8 w-8 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PRE-TRIGGER WARMUP */}
      {showPreTrigger && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-4 border-yellow-500 shadow-2xl animate-pulse">
            <CardContent className="p-8 text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
              <div className="space-y-4">
                <div className="text-6xl animate-bounce">🚨</div>
                <h1 className="text-3xl font-black">HOLY SH*T!</h1>
                <p className="text-xl font-bold">
                  Your content about "{formData.keyword}" just triggered our 
                  <span className="bg-red-600 text-white px-2 py-1 rounded mx-1">ALERT SYSTEM!</span>
                </p>
                <div className="bg-black/20 p-4 rounded-xl">
                  <div className="text-lg font-bold">This content is TOO GOOD to lose!</div>
                  <div className="text-sm">Preparing emergency backup procedures...</div>
                </div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN HYPE CONVERSION BLASTER */}
      {showMainBlaster && (
        <HypeConversionBlaster
          onSignUp={onSignUp}
          onLogin={onLogin}
          onClose={handleTriggerDismiss}
          keyword={formData.keyword}
          targetUrl={formData.targetUrl}
          timeRemaining="23:59:32"
        />
      )}

      {/* DESPERATION TRIGGER FOR HIGH ENGAGEMENT */}
      {showDesperation && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <Card className="max-w-xl w-full border-4 border-red-500 shadow-2xl">
            <CardContent className="p-8 text-center bg-gradient-to-r from-purple-900 to-red-900 text-white">
              <div className="space-y-6">
                <div className="text-4xl animate-bounce">😭</div>
                
                <h1 className="text-3xl font-black">WAIT! I'M BEGGING YOU!</h1>
                
                <div className="bg-black/40 p-6 rounded-xl">
                  <p className="text-lg font-semibold mb-4">
                    Look, I've been watching your session. You spent {Math.floor(userEngagement / 10)} seconds 
                    creating this AMAZING content about "{formData.keyword}".
                  </p>
                  <p className="text-yellow-300 font-bold">
                    Don't let that work go to waste! I'll personally make sure your content 
                    gets the attention it deserves.
                  </p>
                </div>

                <div className="bg-red-600/50 p-4 rounded-xl border-2 border-yellow-400">
                  <div className="font-black text-xl mb-2">🎁 PERSONAL OFFER</div>
                  <div className="text-sm">
                    Create your account right now and I'll personally monitor your content's performance 
                    and send you weekly reports. That's a $297/month service, FREE.
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={onSignUp}
                    size="lg"
                    className="w-full text-xl py-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-black"
                  >
                    <Heart className="mr-3 h-6 w-6" />
                    OK, I'll Accept Your Personal Help!
                  </Button>

                  <button
                    onClick={() => setShowDesperation(false)}
                    className="text-gray-400 text-sm hover:text-gray-300 underline"
                  >
                    No thanks, I don't want personal attention from experts
                  </button>
                </div>

                <div className="text-xs text-gray-400 p-3 bg-black/30 rounded">
                  This is my final offer. I won't contact you again if you decline.
                  - Alex, Senior Content Strategist
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Hook to trigger the system
export function useInstantFormTrigger() {
  const [formData, setFormData] = useState<FormData>({ keyword: '', targetUrl: '' });
  const [shouldTrigger, setShouldTrigger] = useState(false);

  const triggerConversion = (data: FormData) => {
    setFormData(data);
    setShouldTrigger(true);
  };

  const resetTrigger = () => {
    setShouldTrigger(false);
    setFormData({ keyword: '', targetUrl: '' });
  };

  return {
    formData,
    shouldTrigger,
    triggerConversion,
    resetTrigger
  };
}
