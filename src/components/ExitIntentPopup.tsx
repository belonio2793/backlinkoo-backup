import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Shield, Clock, Zap, CheckCircle } from 'lucide-react';
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
        // Run text spacing fixer when modal appears
        setTimeout(() => {
          import('@/utils/textSpacingFixer').then(({ TextSpacingFixer }) => {
            TextSpacingFixer.fixTextSpacing();
          });
        }, 50);
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
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 animate-fade-in modal-perfect-spacing">
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
            <div className="text-gray-700 mb-4 text-center" style={{ lineHeight: '1.8', fontSize: '16px' }}>
              <div style={{ marginBottom: '4px' }}>
                Your blog post <strong>"{spacedPostTitle || 'this content'}"</strong> will be{' '}
                <span className="font-semibold text-red-600" style={{ padding: '0 4px' }}>
                  automatically deleted
                </span>{' '}
                in{' '}
                <span
                  className="font-bold text-gray-800"
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    border: '1px solid #fbbf24',
                    margin: '0 4px'
                  }}
                >
                  {spacedTimeRemaining}
                </span>{' '}
                if left unclaimed.
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium" style={{ fontSize: '15px' }}>
                  Time Remaining:{' '}
                  <span
                    style={{
                      fontWeight: '700',
                      color: '#d97706',
                      padding: '2px 6px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '3px',
                      border: '1px solid #fbbf24'
                    }}
                  >
                    {spacedTimeRemaining}
                  </span>
                </span>
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
