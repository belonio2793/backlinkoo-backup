import React, { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';

interface BannerTestimonial {
  text: string;
  author: string;
  metric: string;
}

const bannerTestimonials: BannerTestimonial[] = [
  {
    text: "Increased organic traffic by 400% in just 3 months",
    author: "Sarah M., Marketing Manager",
    metric: "400% traffic boost"
  },
  {
    text: "Went from page 3 to top 3 rankings for main keywords",
    author: "Michael C., CEO",
    metric: "Top 3 rankings"
  },
  {
    text: "Domain authority jumped from 25 to 65 in 4 months",
    author: "David T., E-commerce Director", 
    metric: "DA +40 points"
  },
  {
    text: "Content productivity increased 5x with AI generation",
    author: "Lisa P., Content Lead",
    metric: "5x productivity"
  },
  {
    text: "Best marketing investment - pays for itself",
    author: "James W., Marketing Director",
    metric: "Self-funding ROI"
  }
];

interface TestimonialBannerProps {
  className?: string;
  autoplaySpeed?: number;
}

export const TestimonialBanner: React.FC<TestimonialBannerProps> = ({
  className = '',
  autoplaySpeed = 4000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === bannerTestimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [autoplaySpeed]);

  const currentTestimonial = bannerTestimonials[currentIndex];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-xs text-gray-600">10,000+ success stories</span>
        </div>
        
        <div 
          key={currentIndex}
          className="animate-in slide-in-from-right-2 fade-in duration-500"
        >
          <p className="text-base font-semibold text-gray-900 mb-3 bg-white/70 p-3 rounded-md border-l-4 border-green-400 shadow-sm">
            "{currentTestimonial.text}"
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              — {currentTestimonial.author}
            </span>
            <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                {currentTestimonial.metric}
              </span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 mt-3 justify-center">
          {bannerTestimonials.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-green-500 w-3'
                  : 'bg-green-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialBanner;
