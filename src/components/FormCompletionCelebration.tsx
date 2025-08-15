import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface FormCompletionCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const FormCompletionCelebration: React.FC<FormCompletionCelebrationProps> = ({ 
  isVisible, 
  onComplete 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Hide animation after 2 seconds
      const timeout = setTimeout(() => {
        setShowAnimation(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative">
        {/* Main celebration icon */}
        <div className="animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-500 drop-shadow-lg" />
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute -top-2 -left-2 animate-ping">
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="absolute -top-2 -right-2 animate-ping delay-100">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <div className="absolute -bottom-2 -left-2 animate-ping delay-200">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 animate-ping delay-300">
          <Sparkles className="w-4 h-4 text-pink-400" />
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 animate-ping">
          <div className="w-16 h-16 rounded-full border-2 border-green-300 opacity-30"></div>
        </div>
        <div className="absolute inset-0 animate-ping delay-75">
          <div className="w-16 h-16 rounded-full border-2 border-green-400 opacity-20"></div>
        </div>
      </div>
      
      {/* Success message */}
      <div className="absolute mt-24 text-center animate-fade-in">
        <p className="text-green-700 font-medium text-lg drop-shadow-sm">
          Form Complete!
        </p>
        <p className="text-green-600 text-sm">
          Ready to start your campaign
        </p>
      </div>
    </div>
  );
};

export default FormCompletionCelebration;
