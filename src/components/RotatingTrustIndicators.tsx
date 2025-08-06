import { useState, useEffect } from "react";

interface TrustIndicator {
  value: string;
  label: string;
}

interface RotatingTrustIndicatorsProps {
  className?: string;
}

export const RotatingTrustIndicators = ({ className }: RotatingTrustIndicatorsProps) => {
  const trustCombinations: TrustIndicator[][] = [
    [
      { value: "Expanding", label: "Global Reach" },
      { value: "Thriving", label: "User Community" },
      { value: "Rapidly", label: "Scaling Network" }
    ],
    [
      { value: "Increasing", label: "Daily Signups" },
      { value: "Engaged", label: "Active Users" },
      { value: "Proven", label: "Ranking Results" }
    ],
    [
      { value: "Consistent", label: "Client Success" },
      { value: "High", label: "Retention Rates" },
      { value: "Trusted", label: "By Professionals" }
    ],
    [
      { value: "Verified", label: "User Testimonials" },
      { value: "Expanding", label: "Global Reach" },
      { value: "Engaged", label: "Active Users" }
    ],
    [
      { value: "Proven", label: "Ranking Results" },
      { value: "Thriving", label: "User Community" },
      { value: "Trusted", label: "By Professionals" }
    ]
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % trustCombinations.length);
        setIsVisible(true);
      }, 300); // Half of the fade duration
    }, 3500); // Change every 3.5 seconds (between tagline and stats timing)

    return () => clearInterval(interval);
  }, [trustCombinations.length]);

  const currentTrustIndicators = trustCombinations[currentIndex];

  return (
    <div className={`grid grid-cols-3 gap-4 text-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    } ${className}`}>
      {currentTrustIndicators.map((indicator, index) => (
        <div key={index}>
          <div className="text-2xl font-semibold text-primary mb-1">{indicator.value}</div>
          <div className="text-sm text-muted-foreground">{indicator.label}</div>
        </div>
      ))}
    </div>
  );
};
