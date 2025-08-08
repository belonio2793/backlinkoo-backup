import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ExternalLink, Copy, ArrowRight, Plus, BarChart3, Crown, Star, Gift, Zap, Timer, AlertTriangle } from 'lucide-react';
import { IrresistibleAccountTrigger } from './IrresistibleAccountTrigger';
import { ExitIntentTrigger, useExitIntent } from './ExitIntentTrigger';
import { ExtremeScarcityTrigger } from './ExtremeScarcityTrigger';
import { Badge } from '@/components/ui/badge';

interface MinimalisticSuccessSectionProps {
  publishedUrl: string;
  generatedPost: any;
  primaryKeyword: string;
  targetUrl: string;
  currentUser: any;
  onCreateAnother?: () => void;
  onSignUp?: () => void;
  onLogin?: () => void;
}

export function MinimalisticSuccessSection({
  publishedUrl,
  generatedPost,
  primaryKeyword,
  targetUrl,
  currentUser,
  onCreateAnother,
  onSignUp,
  onLogin
}: MinimalisticSuccessSectionProps) {
  const { toast } = useToast();
  const [showTrigger, setShowTrigger] = useState(false);
  const [showSecondaryTrigger, setShowSecondaryTrigger] = useState(false);
  const [showFinalTrigger, setShowFinalTrigger] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showExtremeScarcity, setShowExtremeScarcity] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  console.log('🎯 MinimalisticSuccessSection props:', {
    publishedUrl,
    generatedPostSlug: generatedPost?.slug,
    generatedPostId: generatedPost?.id,
    generatedPostTitle: generatedPost?.title
  });

  const blogUrl = publishedUrl || `${window.location.origin}/blog/${generatedPost?.slug}`;
  console.log('🔗 Constructed blog URL:', blogUrl);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(blogUrl);
    toast({
      title: "Link copied",
      description: "Blog post URL copied to clipboard"
    });
  };

  const handleViewPost = () => {
    window.open(blogUrl, '_blank');

    // Trigger first warning for non-authenticated users after they view the post
    if (!currentUser && triggerCount === 0) {
      setTimeout(() => {
        setShowTrigger(true);
        setTriggerCount(1);
      }, 2000);
    }
  };

  // Show progressive trigger warnings for guest users
  useEffect(() => {
    if (!currentUser) {
      // First trigger after 5 seconds
      const timer1 = setTimeout(() => {
        if (triggerCount === 0) {
          setShowTrigger(true);
          setTriggerCount(1);
        }
      }, 5000);

      // Second trigger after 30 seconds if they dismiss the first
      const timer2 = setTimeout(() => {
        if (triggerCount === 1) {
          setShowSecondaryTrigger(true);
          setTriggerCount(2);
        }
      }, 30000);

      // Final trigger after 60 seconds
      const timer3 = setTimeout(() => {
        if (triggerCount === 2) {
          setShowFinalTrigger(true);
          setTriggerCount(3);
        }
      }, 60000);

      // Extreme scarcity trigger after 90 seconds
      const timer4 = setTimeout(() => {
        if (triggerCount === 3) {
          setShowExtremeScarcity(true);
          setTriggerCount(4);
        }
      }, 90000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [currentUser, triggerCount]);

  const handleTriggerDismiss = () => {
    setShowTrigger(false);
    // Show next trigger after a delay
    setTimeout(() => {
      if (triggerCount === 1) {
        setShowSecondaryTrigger(true);
        setTriggerCount(2);
      }
    }, 15000);
  };

  const handleSecondaryTriggerDismiss = () => {
    setShowSecondaryTrigger(false);
    // Show final trigger after a delay
    setTimeout(() => {
      if (triggerCount === 2) {
        setShowFinalTrigger(true);
        setTriggerCount(3);
      }
    }, 20000);
  };

  const handleDefaultSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      window.location.href = '/signup';
    }
  };

  const handleDefaultLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      window.location.href = '/login';
    }
  };

  // Exit intent detection for non-authenticated users
  useExitIntent(() => {
    if (!currentUser && !hasShownExitIntent) {
      setShowExitIntent(true);
      setHasShownExitIntent(true);
    }
  });

  // Calculate real-time remaining for extreme trigger
  useEffect(() => {
    if (!currentUser && generatedPost?.expires_at) {
      const updateTime = () => {
        const expires = new Date(generatedPost.expires_at);
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
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser, generatedPost?.expires_at]);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-8">
        {/* Success Icon and Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Content Published Successfully
          </h2>
          <p className="text-gray-600">
            Your article about "{primaryKeyword}" is now live
          </p>
        </div>

        {/* URL Display */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Live article URL</p>
                <p className="font-mono text-sm text-gray-900 truncate">
                  {blogUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="ml-4 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Article Preview */}
        <div className="mb-8">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>Published today</span>
                <span>•</span>
                <span>{generatedPost?.word_count || 1200}+ words</span>
                <span>•</span>
                <span className="text-green-600">Live</span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">
                Professional content with strategic backlinks to {targetUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleViewPost}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Article
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCopyUrl}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Status Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {currentUser ? 'Permanent backlink' : 'Trial backlink (24 hours)'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {generatedPost?.seo_score || 85}
            </div>
            <div className="text-sm text-gray-600">SEO Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {generatedPost?.word_count || 1200}+
            </div>
            <div className="text-sm text-gray-600">Words</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {currentUser ? '∞' : '24h'}
            </div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
          {currentUser && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCreateAnother}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Another
          </Button>
        </div>

        {/* Enhanced Next Steps for Non-Authenticated Users */}
        {!currentUser && (
          <div className="space-y-4 mt-6">
            {/* Primary Warning */}
            <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500 text-white text-xs font-bold animate-pulse">
                      🚨 URGENT WARNING
                    </Badge>
                    <Badge className="bg-orange-500 text-white text-xs">
                      24 HOURS LEFT
                    </Badge>
                  </div>
                  <h3 className="font-bold text-red-800 text-lg mb-2">
                    Your $297 Backlink Will Be DELETED Forever!
                  </h3>
                  <p className="text-red-700 text-sm mb-3">
                    This professional-grade content will vanish in 24 hours unless you create a free account.
                    Don't lose your valuable SEO investment!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleDefaultSignUp}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      🎁 Save FREE Forever (30 sec)
                    </Button>
                    <Button
                      onClick={handleDefaultLogin}
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Already Have Account? Login
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center justify-center gap-2">
                  <Crown className="h-4 w-4" />
                  FREE Account = $597 Worth of Premium Features
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-blue-700">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Unlimited backlinks</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-700">
                    <Zap className="h-3 w-3 text-orange-500" />
                    <span>Instant publishing</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-700">
                    <BarChart3 className="h-3 w-3 text-green-500" />
                    <span>Analytics dashboard</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  🎯 Normally $97/month • FREE today only
                </p>
              </div>
            </div>

            {/* Countdown Element */}
            {generatedPost?.expires_at && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-800">
                  <Timer className="h-4 w-4 animate-pulse" />
                  <span className="font-bold text-sm">
                    Content expires in: {new Date(generatedPost.expires_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Irresistible Trigger Modals */}
        {showTrigger && !currentUser && (
          <IrresistibleAccountTrigger
            blogPostTitle={generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
            targetUrl={targetUrl}
            expiresAt={generatedPost?.expires_at}
            onSignUp={() => {
              setShowTrigger(false);
              handleDefaultSignUp();
            }}
            onLogin={() => {
              setShowTrigger(false);
              handleDefaultLogin();
            }}
            onDismiss={handleTriggerDismiss}
          />
        )}

        {showSecondaryTrigger && !currentUser && (
          <IrresistibleAccountTrigger
            blogPostTitle={generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
            targetUrl={targetUrl}
            expiresAt={generatedPost?.expires_at}
            onSignUp={() => {
              setShowSecondaryTrigger(false);
              handleDefaultSignUp();
            }}
            onLogin={() => {
              setShowSecondaryTrigger(false);
              handleDefaultLogin();
            }}
            onDismiss={handleSecondaryTriggerDismiss}
          />
        )}

        {showFinalTrigger && !currentUser && (
          <IrresistibleAccountTrigger
            blogPostTitle={generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
            targetUrl={targetUrl}
            expiresAt={generatedPost?.expires_at}
            onSignUp={() => {
              setShowFinalTrigger(false);
              handleDefaultSignUp();
            }}
            onLogin={() => {
              setShowFinalTrigger(false);
              handleDefaultLogin();
            }}
            onDismiss={() => setShowFinalTrigger(false)}
          />
        )}

        {/* Exit Intent Trigger */}
        {showExitIntent && !currentUser && (
          <ExitIntentTrigger
            onSignUp={() => {
              setShowExitIntent(false);
              handleDefaultSignUp();
            }}
            onLogin={() => {
              setShowExitIntent(false);
              handleDefaultLogin();
            }}
            onStay={() => setShowExitIntent(false)}
            contentTitle={generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
            contentValue={"$862"}
          />
        )}

        {/* Extreme Scarcity Trigger */}
        {showExtremeScarcity && !currentUser && (
          <ExtremeScarcityTrigger
            onSignUp={() => {
              setShowExtremeScarcity(false);
              handleDefaultSignUp();
            }}
            onLogin={() => {
              setShowExtremeScarcity(false);
              handleDefaultLogin();
            }}
            onClose={() => setShowExtremeScarcity(false)}
            contentValue={"$862"}
            timeRemaining={timeRemaining && timeRemaining.hours ?
              `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}` :
              "23:47:32"
            }
            postTitle={generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
          />
        )}
      </CardContent>
    </Card>
  );
}
