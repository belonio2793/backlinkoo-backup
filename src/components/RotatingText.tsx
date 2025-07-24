import { useState, useEffect } from 'react';

interface RotatingTextProps {
  phrases: string[];
  interval?: number;
  className?: string;
}

export function RotatingText({ phrases, interval = 3000, className = "" }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setIsAnimating(false);
      }, 300); // Half of the transition duration
      
    }, interval);

    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <span className={`inline-block transition-all duration-500 ${className}`}>
      <span
        className={`inline-block transition-all duration-300 ${
          isAnimating 
            ? 'opacity-0 transform -translate-y-2 scale-95' 
            : 'opacity-100 transform translate-y-0 scale-100'
        }`}
      >
        {phrases[currentIndex]}
      </span>
    </span>
  );
}
