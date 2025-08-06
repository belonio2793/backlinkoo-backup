import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  "Create a free account and take advantage of our pre-launch special pricing.",
  "We have plans on releasing version 2.0 soon.",
  "Credits for our ∞ backlinks include exclusive links from our private networks.",
  "Secure exclusive lower pricing before our next upcoming version release.",
  "Fully mobile optimized and responsive. Manage campaigns while travelling or on the go.",
  "Get real time updates on keyword rankings with our tracking technology.",
  "Create campaigns and receive backlink reports with full transparency and verification.",
  "Get the leading industry search engine optimization services.",
  "Get started with our SEO Academy as a complimentary e-learning experience for Premium Plan subscribers.",
  "Learn how search engine optimization is changing and take advantage of the opportunities this industry has to offer right now.",
  "Claim up to 3 free blog posts with contextual links and experience SEO for your website.",
  "Generate unlimited blog posts and claim unlimited permanent links as a Premium Plan subscriber.",
  "Get proprietary merchant tools, access to backlink network technology and more."
];

interface RotatingNotificationBannerProps {
  autoRotateInterval?: number;
  showCloseButton?: boolean;
  className?: string;
}

export const RotatingNotificationBanner = ({
  autoRotateInterval = 5000,
  showCloseButton = true,
  className = ""
}: RotatingNotificationBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isVisible || isPaused) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % notifications.length);
        setTimeout(() => setIsAnimating(false), 100);
      }, 300);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotateInterval, isVisible, isPaused]);

  if (!isVisible) return null;

  return (
    <div
      className={`relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient-shift text-white py-2 sm:py-3 px-3 sm:px-4 min-h-[56px] sm:min-h-[64px] flex flex-col justify-center overflow-hidden cursor-pointer ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer transform -skew-x-12"></div>
      </div>
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full relative z-10">
        <div className="flex-1 text-center overflow-hidden px-2 sm:px-0">
          <p
            className={`text-xs sm:text-sm md:text-base font-medium transition-all duration-300 ease-in-out leading-relaxed ${
              isAnimating
                ? 'opacity-0 transform translate-y-4 scale-95'
                : 'opacity-100 transform translate-y-0 scale-100'
            }`}
          >
            {notifications[currentIndex]}
          </p>
        </div>

        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="ml-2 sm:ml-4 text-white hover:text-gray-200 hover:bg-white/10 flex-shrink-0 h-8 w-8 p-0"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>

      {/* Progress indicator dots */}
      <div className="flex justify-center space-x-1 mt-1 relative z-10">
        {notifications.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white shadow-sm'
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
