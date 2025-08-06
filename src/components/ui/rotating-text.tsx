import React, { useState, useEffect } from 'react';

interface RotatingTextProps {
  texts: string[];
  duration?: number; // Duration in seconds for each text
  className?: string;
}

export const RotatingText: React.FC<RotatingTextProps> = ({ 
  texts, 
  duration = 4, 
  className = "" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (texts.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setIsVisible(true);
      }, 300); // Half of the transition duration
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [texts.length, duration]);

  return (
    <div className={`transition-all duration-300 ${className}`}>
      <p 
        className={`transition-all duration-300 ${
          isVisible 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform -translate-y-2'
        }`}
      >
        {texts[currentIndex]}
      </p>
    </div>
  );
};
