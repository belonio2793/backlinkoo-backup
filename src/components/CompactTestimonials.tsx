import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Star } from 'lucide-react';

interface CompactTestimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

const compactTestimonials: CompactTestimonial[] = [
  {
    name: "Sarah M.",
    role: "Marketing Manager",
    content: "400% traffic increase in 3 months. Best SEO investment ever!",
    avatar: "SM",
    rating: 5
  },
  {
    name: "Michael C.",
    role: "CEO",
    content: "Went from page 3 to top 3 rankings. ROI was immediate.",
    avatar: "MC",
    rating: 5
  },
  {
    name: "Emily R.",
    role: "SEO Consultant",
    content: "Nothing comes close to Backlink ∞'s effectiveness.",
    avatar: "ER",
    rating: 5
  },
  {
    name: "David T.",
    role: "E-commerce Director",
    content: "Domain authority jumped from 25 to 65 in 4 months.",
    avatar: "DT",
    rating: 5
  },
  {
    name: "Lisa P.",
    role: "Content Lead",
    content: "Content team productivity increased 5x with AI generation.",
    avatar: "LP",
    rating: 5
  },
  {
    name: "James W.",
    role: "Marketing Director",
    content: "Best marketing investment. Affiliate program pays for itself.",
    avatar: "JW",
    rating: 5
  }
];

interface CompactTestimonialsProps {
  className?: string;
  autoplaySpeed?: number;
}

export const CompactTestimonials: React.FC<CompactTestimonialsProps> = ({
  className = '',
  autoplaySpeed = 3500
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === compactTestimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [autoplaySpeed]);

  const currentTestimonial = compactTestimonials[currentIndex];

  return (
    <div className={`w-full ${className}`}>
      <div className="text-center mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Join 10,000+ Growing Businesses
        </h4>
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-xs text-gray-600 ml-1">4.9/5 from 2,500+ reviews</span>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {compactTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 px-4"
            >
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">{testimonial.role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-4">
        {compactTestimonials.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-primary w-4'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="text-xs text-gray-600">
          <div className="font-semibold text-primary">10K+</div>
          <div>Customers</div>
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-semibold text-primary">98%</div>
          <div>Success Rate</div>
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-semibold text-primary">24/7</div>
          <div>Support</div>
        </div>
      </div>
    </div>
  );
};

export default CompactTestimonials;
