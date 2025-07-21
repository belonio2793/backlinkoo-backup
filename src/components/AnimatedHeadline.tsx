import { useState, useEffect } from "react";

interface AnimatedHeadlineProps {
  baseText: string;
  animatedTexts: string[];
  className?: string;
}

export const AnimatedHeadline = ({ baseText, animatedTexts, className = "" }: AnimatedHeadlineProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => 
          prevIndex === animatedTexts.length - 1 ? 0 : prevIndex + 1
        );
        setIsAnimating(false);
      }, 300);
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(interval);
  }, [animatedTexts.length]);

  return (
    <div className={className}>
      <div className="mb-2">
        {baseText}
      </div>
      <div className="relative">
        <span 
          className={`text-primary block transition-all duration-300 ${
            isAnimating 
              ? 'opacity-0 transform translate-y-4 scale-95' 
              : 'opacity-100 transform translate-y-0 scale-100'
          }`}
        >
          {animatedTexts[currentTextIndex]}
        </span>
      </div>
    </div>
  );
};