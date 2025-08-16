import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Shield, Clock, Zap, CheckCircle, Star, Sparkles, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/contexts/ModalContext';

interface ExitIntentPopupProps {
  isVisible: boolean;
  onClose: () => void;
  postTitle?: string;
  timeRemaining?: string;
}

export function ExitIntentPopup({ isVisible, onClose, postTitle, timeRemaining = "24 hours" }: ExitIntentPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const navigate = useNavigate();
  const { openSignupModal } = useAuthModal();

  // No text processing - use original values
  const displayTitle = postTitle;
  const displayTime = timeRemaining;

  // 3-second delay before showing popup
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowPopup(false);
    }
  }, [isVisible]);

  const handleCreateAccount = () => {
    onClose();
    openSignupModal();
  };

  const handleClose = () => {
    setShowPopup(false);
    onClose();
  };

  if (!isVisible) return null;

  if (!showPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-white via-white to-blue-50/20 shadow-2xl border-0 rounded-2xl overflow-hidden animate-slide-up">
        {/* Header with gradient background */}
        <CardHeader className="relative text-center pb-6 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 h-8 w-8 p-0 hover:bg-white/20 text-white rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Animated icon with glow effect */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse-glow">
                <Timer className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-5 w-5 text-yellow-300 animate-bounce" />
              </div>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-white drop-shadow-sm">
            Don't Lose This Content!
          </CardTitle>
          <p className="text-white/90 text-sm mt-2 font-medium">
            Your valuable content is about to expire
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Main warning message */}
          <div className="text-center">
            <p className="text-gray-700 mb-4 leading-relaxed">
              {displayTitle ? (
                <>Your blog post <span className="font-semibold text-gray-900">"{displayTitle}"</span> will be </>
              ) : (
                "Your newly created blog post will be "
              )}
              <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">automatically deleted</span>
              {` in ${displayTime} if left unclaimed.`}
            </p>

            {/* Enhanced time remaining box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-center gap-3 text-amber-800 mb-2">
                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-bold text-lg">Time Remaining: {displayTime}</span>
              </div>
              <p className="text-sm text-amber-700 font-medium">
                ⚡ Create a free account to claim and keep your content permanently
              </p>
            </div>
          </div>

          {/* Benefits section with modern design - 2 column layout for wider display */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-lg flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Claim your post to unlock:
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Permanent ownership of your blog post</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Edit and update content anytime</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
                <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Access to dashboard and analytics</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors">
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Create unlimited blog posts</span>
              </div>
            </div>
          </div>

          {/* Action buttons with enhanced styling */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCreateAccount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Zap className="h-5 w-5 mr-3" />
              Save This Content Forever
              <Sparkles className="h-4 w-4 ml-3" />
            </Button>

            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl transition-all duration-200"
            >
              I'll risk losing my content
            </Button>
          </div>

          {/* Footer with enhanced styling */}
          <div className="text-center pt-2 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-full px-4 py-2 mx-auto w-fit">
              <Shield className="h-3 w-3" />
              <span className="font-medium">No credit card required • Takes 30 seconds • Free forever</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
