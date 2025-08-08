import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Crown, 
  Shield, 
  Star, 
  TrendingUp, 
  Zap, 
  Lock, 
  Timer, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Infinity,
  BarChart3,
  Eye,
  Heart,
  Sparkles,
  Gift,
  Target,
  Rocket,
  Users,
  DollarSign
} from 'lucide-react';

interface IrresistibleAccountTriggerProps {
  blogPostTitle: string;
  targetUrl: string;
  expiresAt?: string;
  onSignUp: () => void;
  onLogin: () => void;
  onDismiss?: () => void;
}

export function IrresistibleAccountTrigger({
  blogPostTitle,
  targetUrl,
  expiresAt,
  onSignUp,
  onLogin,
  onDismiss
}: IrresistibleAccountTriggerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [animationPhase, setAnimationPhase] = useState(0);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const updateTime = () => {
      const expires = new Date(expiresAt);
      const now = new Date();
      const diffMs = expires.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });

      // Set urgency level based on time remaining
      if (hours <= 1) {
        setUrgencyLevel('critical');
      } else if (hours <= 3) {
        setUrgencyLevel('high');
      } else if (hours <= 12) {
        setUrgencyLevel('medium');
      } else {
        setUrgencyLevel('low');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Animation cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColors = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: 'from-red-500 to-orange-500',
          text: 'text-red-700',
          bgLight: 'bg-red-50',
          border: 'border-red-200',
          pulse: 'animate-pulse'
        };
      case 'high':
        return {
          bg: 'from-orange-500 to-yellow-500',
          text: 'text-orange-700',
          bgLight: 'bg-orange-50',
          border: 'border-orange-200',
          pulse: 'animate-pulse'
        };
      case 'medium':
        return {
          bg: 'from-yellow-500 to-amber-500',
          text: 'text-yellow-700',
          bgLight: 'bg-yellow-50',
          border: 'border-yellow-200',
          pulse: ''
        };
      default:
        return {
          bg: 'from-blue-500 to-purple-500',
          text: 'text-blue-700',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          pulse: ''
        };
    }
  };

  const colors = getUrgencyColors();

  const triggers = [
    {
      icon: Lock,
      title: "Your Content Will Be LOST Forever",
      description: "This high-quality blog post will disappear in hours unless you save it now",
      emotional: "⚠️ CRITICAL WARNING"
    },
    {
      icon: DollarSign,
      title: "You're About to Lose $297 Worth of SEO Value",
      description: "Professional content writers charge $297+ for this quality. Don't let it vanish!",
      emotional: "💰 FREE VALUE AT RISK"
    },
    {
      icon: TrendingUp,
      title: "Your Rankings Could Suffer Without This",
      description: "This backlink is already indexed and boosting your SEO. Losing it means losing traffic.",
      emotional: "📈 SEO OPPORTUNITY ENDING"
    },
    {
      icon: Users,
      title: "97% of Users Who Don't Save Regret It",
      description: "Don't be one of the 97% who lose their content and wish they had secured it.",
      emotional: "👥 MOST PEOPLE REGRET NOT SAVING"
    }
  ];

  const benefits = [
    { icon: Infinity, text: "Lifetime backlink", value: "$197 value" },
    { icon: Shield, text: "Permanent content", value: "$97 value" },
    { icon: BarChart3, text: "Dashboard tracking", value: "$47 value" },
    { icon: Rocket, text: "Unlimited future posts", value: "$297 value" },
    { icon: Crown, text: "Priority support", value: "$97 value" },
    { icon: Target, text: "Advanced analytics", value: "$127 value" }
  ];

  const socialProof = [
    "Just saved their backlink",
    "Secured content permanently", 
    "Claimed their free account",
    "Protected their SEO investment",
    "Registered for lifetime access"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 ${colors.border} shadow-2xl`}>
        <CardContent className="p-8 space-y-8">
          {/* Warning Header */}
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${colors.bg} text-white text-sm font-bold ${colors.pulse}`}>
              <AlertTriangle className="h-5 w-5" />
              {urgencyLevel === 'critical' ? 'FINAL WARNING' : 'URGENT ACTION REQUIRED'}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              🚨 WAIT! Don't Lose Your 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                $862 Worth of FREE Content!
              </span>
            </h1>
          </div>

          {/* Countdown Timer */}
          {timeRemaining && (
            <div className={`text-center p-6 rounded-xl bg-gradient-to-r ${colors.bg} text-white ${colors.pulse}`}>
              <div className="text-lg font-bold mb-2">YOUR CONTENT EXPIRES IN:</div>
              <div className="text-4xl md:text-6xl font-mono font-bold tracking-wider">
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm mt-2 opacity-90">
                Hours : Minutes : Seconds Until PERMANENT DELETION
              </div>
            </div>
          )}

          {/* Core Trigger Messages */}
          <div className="grid md:grid-cols-2 gap-6">
            {triggers.map((trigger, index) => {
              const Icon = trigger.icon;
              return (
                <div 
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                    animationPhase === index ? 'border-red-500 bg-red-50 transform scale-105' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${animationPhase === index ? 'bg-red-500' : 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${animationPhase === index ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-red-100 text-red-700 text-xs">
                        {trigger.emotional}
                      </Badge>
                      <h3 className="font-bold text-lg mb-2">{trigger.title}</h3>
                      <p className="text-gray-600 text-sm">{trigger.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border-2 border-green-200">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎁 FREE Account = $862 in Instant Value
              </h2>
              <p className="text-gray-600">
                Create your free account in 30 seconds and keep everything forever
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <Icon className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-sm">{benefit.text}</div>
                      <div className="text-green-600 text-xs font-bold">{benefit.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-sm text-gray-500 mb-4">
              <span className="line-through">Regular Price: $862</span>
              <span className="ml-2 text-2xl font-bold text-green-600">FREE Today</span>
            </div>
          </div>

          {/* Social Proof Stream */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-blue-700">Live Activity</span>
            </div>
            <div className="space-y-2">
              {socialProof.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="text-gray-700">
                    Someone just {activity} • <span className="text-green-600 font-semibold">2 seconds ago</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Specific Content Alert */}
          <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400 rounded-full">
                <Eye className="h-6 w-6 text-yellow-800" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 text-lg mb-2">
                  Your Specific Content At Risk:
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-semibold text-gray-900 mb-1">"{blogPostTitle}"</div>
                  <div className="text-sm text-gray-600">
                    → Backlink to: {targetUrl}
                  </div>
                  <div className="text-sm text-red-600 font-semibold mt-2">
                    ⚠️ Will be permanently deleted unless saved
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scarcity Elements */}
          <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-xl">
            <div className="text-center">
              <h3 className="font-bold text-purple-800 text-xl mb-2">
                🔥 Limited Time: Free Account Creation
              </h3>
              <p className="text-purple-700 mb-4">
                We're only offering free accounts for the next few hours. After that, it's $97/month.
              </p>
              <div className="flex justify-center items-center gap-4 text-sm">
                <div className="bg-white px-4 py-2 rounded-full">
                  <span className="text-gray-600">Normal Price:</span>
                  <span className="line-through text-red-500 ml-1">$97/month</span>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
                <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
                  FREE Today Only
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={onSignUp}
              size="lg"
              className="w-full text-xl py-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-2xl transform hover:scale-[1.02] transition-all duration-200"
            >
              <Gift className="mr-3 h-6 w-6" />
              🎁 YES! Create My FREE Account & Save Everything
              <Sparkles className="ml-3 h-6 w-6 animate-pulse" />
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Already have an account?</div>
              <Button
                onClick={onLogin}
                variant="outline"
                size="lg"
                className="text-lg py-3 px-8 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Shield className="mr-2 h-5 w-5" />
                Login to Save Your Content
              </Button>
            </div>

            {onDismiss && (
              <div className="text-center">
                <button
                  onClick={onDismiss}
                  className="text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  No thanks, I want to lose my $862 worth of content
                </button>
              </div>
            )}
          </div>

          {/* Final Warning */}
          <div className="bg-red-50 border-2 border-red-300 p-4 rounded-xl text-center">
            <div className="text-red-700 font-bold text-lg">
              ⚠️ This popup will only appear ONCE. After you close it, you cannot get your content back.
            </div>
            <div className="text-red-600 text-sm mt-1">
              Don't be the 97% who regret not saving their content. Act now while you still can.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
