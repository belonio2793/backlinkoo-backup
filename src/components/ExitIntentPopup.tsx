import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Shield, Clock, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/contexts/ModalContext';
import { useTextSpacing } from '@/hooks/useTextSpacing';

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

  // Ensure proper text spacing
  const spacedPostTitle = useTextSpacing(postTitle || "");
  const spacedTimeRemaining = useTextSpacing(timeRemaining);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 animate-fade-in">
        <CardHeader className="relative text-center pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <CardTitle className="text-xl font-semibold text-gray-900">
            Don't Lose This Content!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4 emergency-spacing" style={{ wordSpacing: '0.3em', letterSpacing: '0.02em' }}>
              {spacedPostTitle ? `Your blog post "${spacedPostTitle}" ` : "Your newly created blog post "}
              will be{' '}
              <span className="font-semibold text-red-600">automatically deleted</span>
              {' '}in{' '}
              <span className="time-remaining-fix" style={{ margin: '0 0.5rem' }}>{spacedTimeRemaining}</span>
              {' '}if left unclaimed.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Time Remaining:&nbsp;{spacedTimeRemaining}</span>
              </div>
              <p className="text-sm text-amber-700">
                Create a free account to claim and keep your content permanently.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-center">Claim your post to get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Permanent ownership of your blog post</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Edit and update content anytime</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Access to dashboard and analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Create unlimited blog posts</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateAccount}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              <Zap className="h-4 w-4 mr-2" />
              Save This Content Forever
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleClose}
              className="w-full text-gray-600 hover:text-gray-700 border-gray-300"
            >
              I'll risk losing my content
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              No credit card required • Takes 30 seconds • Free forever
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
