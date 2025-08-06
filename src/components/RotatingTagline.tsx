import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface RotatingTaglineProps {
  className?: string;
}

export const RotatingTagline = ({ className }: RotatingTaglineProps) => {
  const taglines = [
    "Your Trusted Source for High-Quality Backlinks",
    "Backlinks That Boost Rankings — Guaranteed",
    "The Smartest Way to Build SEO Authority",
    "Where SEO Pros Go for Powerful Backlinks",
    "Top-Tier Backlinks for Top-Ranking Results",
    "Buy Backlinks That Actually Work",
    "Fuel Your SEO with Premium Backlinks",
    "Rank Higher with Proven Backlink Strategies",
    "The Ultimate Backlink Marketplace for SEO Growth",
    "Backlinks Made Easy — Results Made Real"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % taglines.length);
        setIsVisible(true);
      }, 300); // Half of the fade duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <Badge 
      variant="outline" 
      className={`mb-8 bg-gray-100 border-gray-300 text-gray-900 font-mono text-xs px-4 py-2 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {taglines[currentIndex]}
    </Badge>
  );
};
