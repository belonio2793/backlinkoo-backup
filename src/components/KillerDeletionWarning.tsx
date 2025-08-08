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
  Skull,
  Bomb,
  Flame,
  Zap,
  Crown,
  Gift,
  ShieldAlert,
  Timer,
  Heart,
  Eye,
  Brain,
  Rocket,
  Star,
  Trophy,
  Target,
  Siren
} from 'lucide-react';

interface KillerDeletionWarningProps {
  onSaveContent: () => void;
  onLogin: () => void;
  timeRemaining: string;
  contentTitle: string;
  targetUrl: string;
  onClose?: () => void;
}

export function KillerDeletionWarning({
  onSaveContent,
  onLogin,
  timeRemaining,
  contentTitle,
  targetUrl,
  onClose
}: KillerDeletionWarningProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [shockLevel, setShockLevel] = useState(1);
  const [showMoneyRain, setShowMoneyRain] = useState(false);
  const [panicMode, setPanicMode] = useState(false);

  const deletionPhases = [
    {
      icon: Skull,
      title: "💀 YOUR CONTENT IS DYING! 💀",
      subtitle: "CONTENT EXECUTION IN PROGRESS",
      message: "This masterpiece about '{contentTitle}' is being MURDERED by our deletion system! Every second brings it closer to DEATH!",
      bgColor: "from-red-600 via-black to-red-600",
      urgency: "CRITICAL THREAT LEVEL"
    },
    {
      icon: Bomb,
      title: "💣 CONTENT BOMB ACTIVATED! 💣",
      subtitle: "DETONATION SEQUENCE INITIATED",
      message: "Your SEO goldmine for '{targetUrl}' is rigged with a DELETION BOMB! When the timer hits zero, BOOM - everything EXPLODES into nothing!",
      bgColor: "from-orange-600 via-red-600 to-yellow-600",
      urgency: "EXPLOSIVE DANGER"
    },
    {
      icon: Flame,
      title: "🔥 CONTENT INFERNO! 🔥",
      subtitle: "BURNING EVERYTHING TO ASHES",
      message: "Your content is being consumed by DIGITAL FLAMES! Once it burns, there's NO resurrection, NO recovery, NO second chances!",
      bgColor: "from-red-500 via-orange-500 to-yellow-500",
      urgency: "FIRE EMERGENCY"
    },
    {
      icon: DollarSign,
      title: "💰 MONEY INCINERATOR ACTIVE! 💰",
      subtitle: "YOUR WEALTH IS BEING DESTROYED",
      message: "You're watching $2,847 worth of content get FED INTO A MONEY SHREDDER! This is financial SUICIDE in real time!",
      bgColor: "from-green-600 via-red-600 to-black",
      urgency: "FINANCIAL CATASTROPHE"
    }
  ];

  const panicMessages = [
    "🚨 CONTENT FLATLINE DETECTED",
    "💀 DIGITAL DEATH IMMINENT", 
    "⚡ SYSTEM OVERLOAD - CONTENT CRITICAL",
    "🔥 EMERGENCY PROTOCOLS FAILING",
    "💣 DESTRUCTION SEQUENCE UNSTOPPABLE"
  ];

  const timeValues = timeRemaining.split(':');
  const hours = parseInt(timeValues[0] || '0');
  const minutes = parseInt(timeValues[1] || '0');
  const totalMinutes = hours * 60 + minutes;

  useEffect(() => {
    // Increase shock level based on time remaining
    if (totalMinutes < 60) setShockLevel(5); // Under 1 hour
    else if (totalMinutes < 120) setShockLevel(4); // Under 2 hours
    else if (totalMinutes < 360) setShockLevel(3); // Under 6 hours
    else if (totalMinutes < 720) setShockLevel(2); // Under 12 hours
    else setShockLevel(1);

    // Activate panic mode for final hour
    if (totalMinutes < 60) {
      setPanicMode(true);
    }
  }, [totalMinutes]);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % deletionPhases.length);
    }, 2000);

    // Money rain effect
    const moneyTimer = setTimeout(() => {
      setShowMoneyRain(true);
      setTimeout(() => setShowMoneyRain(false), 3000);
    }, 3000);

    return () => {
      clearInterval(phaseInterval);
      clearTimeout(moneyTimer);
    };
  }, []);

  const currentDeletion = deletionPhases[currentPhase];
  const DeletionIcon = currentDeletion.icon;

  return (
    <>
      {/* Money rain effect */}
      {showMoneyRain && (
        <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-money-rain"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              💰
            </div>
          ))}
        </div>
      )}

      <div className="fixed inset-0 hype-popup-overlay z-[9999] flex items-center justify-center p-4">
        <Card className={`max-w-4xl w-full border-4 border-red-500 shadow-2xl conversion-emergency ${
          panicMode ? 'animate-explosive-shake' : 'animate-mega-pulse'
        }`}>
          <CardContent className="p-0">
            {/* KILLER HEADER */}
            <div className={`p-8 bg-gradient-to-r ${currentDeletion.bgColor} text-white text-center relative overflow-hidden`}>
              {/* Floating danger elements */}
              <div className="absolute top-2 left-2 animate-bounce">
                <Skull className="h-8 w-8 text-red-300" />
              </div>
              <div className="absolute top-2 right-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Bomb className="h-8 w-8 text-orange-300" />
              </div>
              <div className="absolute bottom-2 left-1/4 animate-bounce" style={{ animationDelay: '1s' }}>
                <Flame className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="absolute bottom-2 right-1/4 animate-bounce" style={{ animationDelay: '1.5s' }}>
                <Siren className="h-6 w-6 text-red-400" />
              </div>

              <div className="relative z-10">
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="absolute top-0 right-0 text-white/70 hover:text-white text-2xl font-bold"
                  >
                    <X className="h-8 w-8" />
                  </button>
                )}
                
                <Badge className={`mb-6 text-xl font-black px-6 py-3 animate-emergency-flash ${
                  panicMode ? 'bg-red-600' : 'bg-orange-600'
                }`}>
                  {currentDeletion.urgency}
                </Badge>
                
                <div className="flex items-center justify-center gap-6 mb-6">
                  <DeletionIcon className="h-24 w-24 animate-hyper-bounce" />
                  <div className="text-left">
                    <h1 className="text-4xl md:text-6xl font-black leading-tight mb-2">
                      {currentDeletion.title}
                    </h1>
                    <p className="text-2xl font-bold opacity-90">
                      {currentDeletion.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/40 p-6 rounded-xl backdrop-blur-sm mb-6 border-4 border-yellow-400">
                  <p className="text-xl leading-relaxed font-bold">
                    {currentDeletion.message
                      .replace('{contentTitle}', contentTitle)
                      .replace('{targetUrl}', targetUrl)}
                  </p>
                </div>

                {/* DEATH COUNTDOWN */}
                <div className={`p-6 rounded-xl backdrop-blur-sm border-4 ${
                  panicMode ? 'bg-red-600/80 border-yellow-400 animate-explosive-shake' : 'bg-black/40 border-red-400'
                }`}>
                  <div className="text-lg font-bold mb-2">
                    {panicMode ? "⚰️ FINAL MOMENTS BEFORE DEATH ⚰️" : "⏰ TIME UNTIL EXECUTION ⏰"}
                  </div>
                  <div className="text-8xl font-mono font-black tracking-wider mb-2 animate-mega-pulse">
                    {timeRemaining}
                  </div>
                  <div className={`text-xl font-bold ${panicMode ? 'animate-emergency-flash' : ''}`}>
                    {panicMode ? "FLATLINE APPROACHING" : "Hours : Minutes : Seconds"}
                  </div>
                </div>
              </div>
            </div>

            {/* PANIC STATUS */}
            {panicMode && (
              <div className="p-6 bg-red-600 text-white text-center animate-emergency-flash">
                <div className="text-3xl font-black mb-2">
                  {panicMessages[shockLevel - 1]}
                </div>
                <div className="text-lg">
                  CONTENT LIFE SUPPORT SYSTEMS FAILING!
                </div>
              </div>
            )}

            {/* DESTRUCTION ANALYTICS */}
            <div className="p-8 bg-black text-white">
              <h2 className="text-3xl font-black text-center mb-6 text-red-400">
                📊 DESTRUCTION ANALYTICS 📊
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-red-900/50 rounded-xl border-2 border-red-500">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-3 animate-mega-pulse" />
                    <div className="text-3xl font-black text-green-400">$2,847</div>
                    <div className="text-sm text-red-300">VALUE BEING DESTROYED</div>
                  </div>
                </div>
                
                <div className="p-6 bg-orange-900/50 rounded-xl border-2 border-orange-500">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-orange-400 mx-auto mb-3 animate-hyper-bounce" />
                    <div className="text-3xl font-black text-orange-400">1,247</div>
                    <div className="text-sm text-orange-300">KEYWORDS BEING WASTED</div>
                  </div>
                </div>
                
                <div className="p-6 bg-purple-900/50 rounded-xl border-2 border-purple-500">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-purple-400 mx-auto mb-3 animate-mega-pulse" />
                    <div className="text-3xl font-black text-purple-400">47,839</div>
                    <div className="text-sm text-purple-300">POTENTIAL VISITORS LOST</div>
                  </div>
                </div>
                
                <div className="p-6 bg-blue-900/50 rounded-xl border-2 border-blue-500">
                  <div className="text-center">
                    <Rocket className="h-12 w-12 text-blue-400 mx-auto mb-3 animate-hyper-bounce" />
                    <div className="text-3xl font-black text-blue-400">∞</div>
                    <div className="text-sm text-blue-300">RANKING OPPORTUNITIES GONE</div>
                  </div>
                </div>
              </div>

              {/* EMOTIONAL MANIPULATION */}
              <div className="bg-gradient-to-r from-purple-600 to-red-600 p-6 rounded-xl mb-8 border-4 border-yellow-400">
                <h3 className="text-2xl font-black text-center mb-4">
                  💔 THIS IS WHAT HAPPENS WHEN CONTENT DIES 💔
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Your competitors CELEBRATE as your content gets deleted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Your backlink opportunities VANISH into the digital void</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Your SEO dreams DIE a slow, painful death</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>You'll spend MONTHS trying to recreate this perfection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGENCY RESCUE BUTTONS */}
            <div className="p-8 bg-gradient-to-r from-red-900 via-orange-900 to-yellow-900 text-center">
              <h2 className="text-4xl font-black text-white mb-6 animate-emergency-flash">
                🚨 EMERGENCY CONTENT RESCUE 🚨
              </h2>

              <div className="space-y-6">
                <Button
                  onClick={onSaveContent}
                  size="lg"
                  className="w-full text-3xl py-8 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white font-black shadow-2xl transform hover:scale-110 transition-all duration-300 animate-mega-pulse border-4 border-yellow-400 money-glow"
                >
                  <Heart className="mr-4 h-10 w-10" />
                  ❤️ SAVE MY CONTENT'S LIFE! ❤️
                  <Zap className="ml-4 h-10 w-10" />
                </Button>

                <div className="bg-yellow-400 text-black p-4 rounded-xl border-4 border-green-500">
                  <div className="font-black text-xl mb-2">🎁 EMERGENCY RESCUE BONUS</div>
                  <div className="text-sm">
                    Save now and get INSTANT access to our $497 SEO Multiplier System - 
                    the same system that generated $2.3M in client revenue!
                  </div>
                </div>

                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="lg"
                  className="w-full border-4 border-blue-400 text-blue-300 hover:bg-blue-900/50 text-xl py-6 font-bold"
                >
                  <ShieldAlert className="mr-3 h-6 w-6" />
                  Already Have Account - EMERGENCY REVIVAL ACCESS!
                </Button>

                {onClose && (
                  <div className="text-center">
                    <button
                      onClick={onClose}
                      className="text-sm text-gray-500 hover:text-gray-400 underline"
                    >
                      Let my content die and hand victory to my competitors 😭💀
                    </button>
                  </div>
                )}
              </div>

              {/* FINAL MANIPULATION */}
              <div className="mt-8 p-6 bg-black/50 rounded-xl border-4 border-red-500">
                <div className="text-red-400 font-black text-xl mb-2 animate-emergency-flash">
                  ⚠️ POINT OF NO RETURN: This content will NEVER exist again!
                </div>
                <div className="text-white text-sm">
                  Once deleted, this exact combination of words, this perfect SEO structure, 
                  this golden opportunity - GONE FOREVER. You'll spend years trying to recreate 
                  what you can save in 30 seconds right now.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
