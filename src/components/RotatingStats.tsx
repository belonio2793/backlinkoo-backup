import { useState, useEffect } from "react";

interface StatCombination {
  value: string;
  label: string;
  description: string;
}

interface RotatingStatsProps {
  className?: string;
}

export const RotatingStats = ({ className }: RotatingStatsProps) => {
  const statCombinations: StatCombination[][] = [
    [
      { value: "Authoritative", label: "Backlinks", description: "Trusted domains only" },
      { value: "SEO-Driven", label: "Links", description: "From top-tier websites" }
    ],
    [
      { value: "Premium", label: "Backlinks", description: "Real domain strength" },
      { value: "Verified", label: "Sources", description: "Maximum domain authority" }
    ],
    [
      { value: "Contextual", label: "Links", description: "From niche-relevant sites" },
      { value: "Powerful", label: "Domains", description: "Link juice that ranks" }
    ],
    [
      { value: "Curated", label: "Backlinks", description: "For keyword dominance" },
      { value: "Organic", label: "Placements", description: "On real authority sites" }
    ],
    [
      { value: "Niche", label: "Blog Posts", description: "Tailored to your audience" },
      { value: "High DA", label: "Sites", description: "Real traffic. Real rankings." }
    ]
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % statCombinations.length);
        setIsVisible(true);
      }, 300); // Half of the fade duration
    }, 4000); // Change every 4 seconds (slightly longer than tagline)

    return () => clearInterval(interval);
  }, [statCombinations.length]);

  const currentStats = statCombinations[currentIndex];

  return (
    <div className={`grid grid-cols-2 gap-8 max-w-4xl mx-auto transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    } ${className}`}>
      {currentStats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">{stat.value}</div>
          <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
          <div className="text-xs text-gray-500">{stat.description}</div>
        </div>
      ))}
    </div>
  );
};
