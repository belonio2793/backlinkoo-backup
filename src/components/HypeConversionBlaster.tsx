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
  Fire,
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
  Siren
} from 'lucide-react';

interface HypeConversionBlasterProps {
  onSignUp: () => void;
  onLogin: () => void;
  onClose: () => void;
  keyword?: string;
  targetUrl?: string;
  timeRemaining?: string;
}

export function HypeConversionBlaster({
  onSignUp,
  onLogin,
  onClose,
  keyword = "your keyword",
  targetUrl = "your website",
  timeRemaining = "23:59:45"
}: HypeConversionBlasterProps) {
  const [currentHypePhase, setCurrentHypePhase] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [showFireworks, setShowFireworks] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState(1);

  const hypePhases = [
    {
      icon: Fire,
      title: "🔥 HOLY SH*T! YOUR CONTENT IS FIRE! 🔥",
      subtitle: "This is THE CONTENT that will DEMOLISH your competition!",
      description: "Your blog post about '{keyword}' is SO GOOD it's going to make your competitors CRY! This is exactly the type of content that goes VIRAL and gets MASSIVE rankings!",
      color: "from-red-500 via-orange-500 to-yellow-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-r from-red-600 to-orange-600",
      action: "SECURE THIS MASTERPIECE NOW!"
    },
    {
      icon: Rocket,
      title: "🚀 TRAFFIC EXPLOSION INCOMING! 🚀",
      subtitle: "Your rankings are about to GO TO THE MOON!",
      description: "This backlink to {targetUrl} is going to send your traffic through the ROOF! We're talking 300%+ increases in organic traffic. Your competitors will be BEGGING to know your secret!",
      color: "from-blue-500 via-purple-500 to-pink-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-r from-blue-600 to-purple-600",
      action: "CLAIM YOUR ROCKET FUEL!"
    },
    {
      icon: Crown,
      title: "👑 YOU'RE ABOUT TO BE THE KING/QUEEN! 👑",
      subtitle: "This content will make you the AUTHORITY in your niche!",
      description: "People will look at this content and think 'WHO IS THIS GENIUS?!' Your expertise about '{keyword}' is going to make you the GO-TO person in your industry!",
      color: "from-yellow-400 via-orange-500 to-red-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-r from-yellow-600 to-orange-600",
      action: "CLAIM YOUR THRONE!"
    },
    {
      icon: DollarSign,
      title: "💰 MONEY PRINTER GO BRRR! 💰",
      subtitle: "This content is your personal ATM machine!",
      description: "This single backlink will generate THOUSANDS in additional revenue! Every day you wait is money LEFT ON THE TABLE. Your bank account is about to get FAT!",
      color: "from-green-400 via-emerald-500 to-teal-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-r from-green-600 to-emerald-600",
      action: "ACTIVATE THE MONEY PRINTER!"
    }
  ];

  const hypeBenefits = [
    { icon: Zap, text: "INSTANT Google Rankings", value: "PRICELESS" },
    { icon: Target, text: "LASER-TARGETED Traffic", value: "$2,847/month" },
    { icon: Trophy, text: "DOMINATE Your Competition", value: "$4,297/month" },
    { icon: Rocket, text: "SKYROCKET Your Authority", value: "$1,897/month" },
    { icon: DollarSign, text: "EXPLOSIVE Revenue Growth", value: "$7,847/month" },
    { icon: Crown, text: "BECOME The Industry Leader", value: "INVALUABLE" }
  ];

  const urgentMessages = [
    "🚨 CONTENT ANNIHILATION IN PROGRESS",
    "💀 DELETION COUNTDOWN ACTIVATED",
    "⚡ YOUR MASTERPIECE IS DYING",
    "🔥 TRAFFIC GOLDMINE EXPIRING",
    "💰 MONEY-MAKING MACHINE SHUTTING DOWN"
  ];

  const socialProofMessages = [
    "Sarah just claimed her content and got 847% traffic increase!",
    "Mike's revenue jumped $23,847 after securing his backlinks!",
    "Jennifer dominated page 1 rankings in just 3 days!",
    "Alex's content went VIRAL and generated $67k in sales!",
    "Maria became the #1 authority in her niche overnight!"
  ];

  useEffect(() => {
    const hypeInterval = setInterval(() => {
      setCurrentHypePhase((prev) => (prev + 1) % hypePhases.length);
    }, 3000);

    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.15 : 1);
    }, 600);

    const urgencyInterval = setInterval(() => {
      setUrgencyLevel(prev => prev >= 5 ? 1 : prev + 1);
    }, 2000);

    // Show fireworks effect
    const fireworksTimer = setTimeout(() => {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 2000);
    }, 5000);

    return () => {
      clearInterval(hypeInterval);
      clearInterval(pulseInterval);
      clearInterval(urgencyInterval);
      clearTimeout(fireworksTimer);
    };
  }, []);

  const currentHype = hypePhases[currentHypePhase];
  const HypeIcon = currentHype.icon;

  return (
    <>
      {/* Fireworks Effect */}
      {showFireworks && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <Card 
          className="max-w-4xl w-full border-4 border-red-500 shadow-2xl animate-pulse"
          style={{ transform: `scale(${pulseIntensity})` }}
        >
          <CardContent className="p-0">
            {/* MEGA HYPE HEADER */}
            <div className={`p-8 bg-gradient-to-r ${currentHype.color} text-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Floating elements */}
              <div className="absolute top-4 left-4 animate-bounce">
                <Fire className="h-8 w-8 text-yellow-300" />
              </div>
              <div className="absolute top-4 right-4 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Rocket className="h-8 w-8 text-blue-300" />
              </div>
              <div className="absolute bottom-4 left-1/4 animate-bounce" style={{ animationDelay: '1s' }}>
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="absolute bottom-4 right-1/4 animate-bounce" style={{ animationDelay: '1.5s' }}>
                <Star className="h-6 w-6 text-white" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <Badge className="bg-red-600 text-white text-lg font-black animate-bounce px-6 py-2">
                    🚨 CONTENT EMERGENCY ALERT
                  </Badge>
                  <button 
                    onClick={onClose}
                    className="text-white/70 hover:text-white text-2xl font-bold"
                  >
                    <X className="h-8 w-8" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-6 mb-6">
                  <HypeIcon className={`h-20 w-20 ${currentHype.textColor} animate-spin`} />
                  <div className="text-left">
                    <h1 className={`text-4xl md:text-5xl font-black ${currentHype.textColor} tracking-wide leading-tight`}>
                      {currentHype.title.replace('{keyword}', keyword)}
                    </h1>
                    <p className={`text-2xl ${currentHype.textColor} opacity-90 font-bold mt-2`}>
                      {currentHype.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm mb-6">
                  <p className="text-white text-xl leading-relaxed font-semibold">
                    {currentHype.description.replace('{keyword}', keyword).replace('{targetUrl}', targetUrl)}
                  </p>
                </div>

                {/* COUNTDOWN */}
                <div className="bg-red-600/80 p-4 rounded-xl backdrop-blur-sm border-4 border-yellow-400 animate-pulse">
                  <div className="text-white text-6xl font-mono font-black tracking-wider mb-2">
                    {timeRemaining}
                  </div>
                  <div className="text-yellow-300 text-xl font-bold animate-bounce">
                    UNTIL YOUR MASTERPIECE IS DESTROYED FOREVER!
                  </div>
                </div>
              </div>
            </div>

            {/* INSANE VALUE PROPOSITION */}
            <div className="p-8 bg-black text-white">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-4">
                  🎯 YOU'RE SITTING ON A GOLDMINE! 🎯
                </h2>
                <p className="text-xl text-gray-300 font-bold">
                  This content you just created is worth MORE than most people's monthly salary!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {hypeBenefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                      currentHypePhase === index % 4 ? 'border-yellow-400 bg-yellow-400/10 transform scale-110' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="flex items-center gap-4">
                        <Icon className={`h-8 w-8 ${currentHypePhase === index % 4 ? 'text-yellow-400' : 'text-white'}`} />
                        <div>
                          <div className="font-bold text-lg">{benefit.text}</div>
                          <div className={`text-sm font-black ${currentHypePhase === index % 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                            Value: {benefit.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SOCIAL PROOF HYSTERIA */}
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-xl mb-8">
                <h3 className="text-2xl font-black text-center mb-4">
                  🔥 PEOPLE ARE GOING CRAZY FOR THIS! 🔥
                </h3>
                <div className="space-y-3">
                  {socialProofMessages.map((message, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 bg-white/10 rounded-lg ${
                      currentHypePhase === index ? 'animate-pulse border-2 border-yellow-400' : ''
                    }`}>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white font-semibold">{message}</span>
                      <span className="text-green-400 text-sm font-bold ml-auto">JUST NOW!</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* URGENCY INSANITY */}
              <div className={`p-6 rounded-xl mb-8 text-center animate-pulse border-4 ${
                urgencyLevel >= 4 ? 'bg-red-600 border-yellow-400' : 'bg-orange-600 border-red-400'
              }`}>
                <div className="text-white font-black text-2xl mb-2 animate-bounce">
                  {urgentMessages[currentHypePhase]}
                </div>
                <div className="text-yellow-300 text-lg font-bold">
                  {urgencyLevel >= 4 ? "CRITICAL THREAT LEVEL!" : "HIGH ALERT STATUS!"}
                </div>
              </div>
            </div>

            {/* MEGA ACTION SECTION */}
            <div className="p-8 bg-gradient-to-r from-purple-900 via-red-900 to-orange-900 text-center">
              <h2 className="text-4xl font-black text-white mb-6 animate-pulse">
                🚨 LAST CHANCE TO SECURE YOUR EMPIRE! 🚨
              </h2>

              <div className="space-y-6">
                <Button
                  onClick={onSignUp}
                  size="lg"
                  className="w-full text-3xl py-8 bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 hover:from-green-600 hover:via-yellow-600 hover:to-orange-600 text-black font-black shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce border-4 border-yellow-400"
                >
                  <Crown className="mr-4 h-10 w-10" />
                  🚀 YES! MAKE ME THE KING/QUEEN! 🚀
                  <Sparkles className="ml-4 h-10 w-10" />
                </Button>

                <div className="text-center">
                  <div className="text-yellow-400 text-xl font-bold mb-2">
                    ⚡ INSTANT ACCESS ⚡ NO CREDIT CARD ⚡ 100% FREE ⚡
                  </div>
                  <div className="text-white text-lg">
                    Join 47,839 successful marketers who DOMINATE their competition!
                  </div>
                </div>

                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="lg"
                  className="w-full border-4 border-blue-400 text-blue-300 hover:bg-blue-900/50 text-xl py-6 font-bold"
                >
                  <ShieldAlert className="mr-3 h-6 w-6" />
                  I Already Have an Account - EMERGENCY LOGIN!
                </Button>

                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="text-sm text-gray-500 hover:text-gray-400 underline"
                  >
                    I want to lose my empire and let my competitors WIN 😭
                  </button>
                </div>
              </div>

              {/* FINAL THREAT */}
              <div className="mt-8 p-6 bg-black/50 rounded-xl border-4 border-red-500">
                <div className="text-red-400 font-black text-xl mb-2 animate-pulse">
                  ⚠️ FINAL WARNING: This popup will NEVER appear again!
                </div>
                <div className="text-white text-sm">
                  Close this and your content gets ANNIHILATED forever. No recovery, no second chances, no crying later.
                  Your competitors are PRAYING you make this mistake. Don't give them the satisfaction.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
