import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
  tier?: string;
  results?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Martinez",
    role: "Digital Marketing Manager",
    company: "TechFlow Solutions",
    content: "Backlink ∞ transformed our SEO strategy. We saw a 400% increase in organic traffic within 3 months. The automated link building is incredibly effective.",
    rating: 5,
    avatar: "SM",
    results: "400% traffic increase"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Founder & CEO",
    company: "GrowthLab",
    content: "The quality of backlinks is outstanding. We went from page 3 to top 3 rankings for our main keywords. ROI was immediate and substantial.",
    rating: 5,
    avatar: "MC",
    results: "Page 3 → Top 3 rankings"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "SEO Consultant",
    company: "Digital Boost Agency",
    content: "I've tried every link building tool out there. Nothing comes close to Backlink ∞'s effectiveness. My clients are seeing incredible results.",
    rating: 5,
    avatar: "ER",
    results: "10x faster results"
  },
  {
    id: 4,
    name: "David Thompson",
    role: "E-commerce Director",
    company: "SalesMaster Pro",
    content: "Our domain authority jumped from 25 to 65 in just 4 months. The automated campaigns saved us 20+ hours per week while delivering better results.",
    rating: 5,
    avatar: "DT",
    results: "DA 25 → 65 in 4 months"
  },
  {
    id: 5,
    name: "Lisa Park",
    role: "Content Marketing Lead",
    company: "InnovateCorp",
    content: "The blog generation feature is a game-changer. High-quality, SEO-optimized content that actually ranks. Our content team productivity increased 5x.",
    rating: 5,
    avatar: "LP",
    results: "5x content productivity"
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Marketing Director",
    company: "ScaleUp Ventures",
    content: "Best investment we've made for our marketing stack. The affiliate program alone pays for itself, and the SEO results are phenomenal.",
    rating: 5,
    avatar: "JW",
    results: "Self-funding ROI"
  },
  {
    id: 7,
    name: "Rachel Foster",
    role: "Digital Strategy Manager",
    company: "BrandBoost Inc",
    content: "Finally, a link building solution that actually works. We've secured partnerships with Fortune 500 companies thanks to our improved domain authority.",
    rating: 5,
    avatar: "RF",
    results: "Fortune 500 partnerships"
  },
  {
    id: 8,
    name: "Alex Kumar",
    role: "SEO Specialist",
    company: "RankRise Media",
    content: "The AI-powered content creation combined with strategic link placement is incredible. Our clients' rankings improved across the board.",
    rating: 5,
    avatar: "AK",
    results: "100% client growth"
  },
  {
    id: 9,
    name: "Sophie Anderson",
    role: "Growth Marketing Manager",
    company: "StartupLaunch",
    content: "From startup to industry leader in 6 months. Backlink ∞ gave us the SEO foundation we needed to compete with established players.",
    rating: 5,
    avatar: "SA",
    results: "Startup → Industry leader"
  },
  {
    id: 10,
    name: "Marcus Johnson",
    role: "VP of Marketing",
    company: "TechGiant Corp",
    content: "Scaled our organic traffic from 10K to 500K monthly visitors. The enterprise features and white-label options are exactly what we needed.",
    rating: 5,
    avatar: "MJ",
    results: "10K → 500K monthly visitors"
  },
  {
    id: 11,
    name: "Jennifer Walsh",
    role: "SEO Manager",
    company: "RetailMax",
    content: "The local SEO features are outstanding. We now dominate local search results in all our target markets. Sales increased 300%.",
    rating: 5,
    avatar: "JWA",
    results: "300% sales increase"
  },
  {
    id: 12,
    name: "Roberto Silva",
    role: "Marketing Consultant",
    company: "Growth Hackers Pro",
    content: "My clients love the detailed reporting and transparent metrics. Finally, a tool that delivers on its promises with measurable results.",
    rating: 5,
    avatar: "RS",
    results: "100% client satisfaction"
  },
  {
    id: 13,
    name: "Amanda Lee",
    role: "Digital Marketing Strategist",
    company: "ConnectDigital",
    content: "The automated outreach saved us countless hours while building genuine relationships. Our link acquisition rate improved by 800%.",
    rating: 5,
    avatar: "AL",
    results: "800% better link acquisition"
  },
  {
    id: 14,
    name: "Thomas Wright",
    role: "Founder",
    company: "EcomSuccess",
    content: "From struggling startup to 7-figure revenue. Backlink ∞'s SEO boost was the catalyst for our explosive growth.",
    rating: 5,
    avatar: "TW",
    results: "7-figure revenue achieved"
  },
  {
    id: 15,
    name: "Maria Gonzalez",
    role: "Head of SEO",
    company: "MultiNational Corp",
    content: "Managing SEO across 15 countries was a nightmare. Backlink ∞'s international features made it seamless and incredibly effective.",
    rating: 5,
    avatar: "MG",
    results: "15 countries dominated"
  }
];

interface AnimatedTestimonialsProps {
  className?: string;
  autoplaySpeed?: number;
  showDots?: boolean;
  showResults?: boolean;
}

export const AnimatedTestimonials: React.FC<AnimatedTestimonialsProps> = ({
  className = '',
  autoplaySpeed = 4000,
  showDots = true,
  showResults = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
      }, autoplaySpeed);

      return () => clearInterval(interval);
    }
  }, [isHovered, autoplaySpeed]);

  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      visible.push(testimonials[index]);
    }
    return visible;
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div 
      className={`w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Trusted by 10,000+ Marketing Professionals
        </h3>
        <p className="text-gray-600">
          See what our customers are saying about their success with Backlink ∞
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {getVisibleTestimonials().map((testimonial, index) => (
          <Card 
            key={`${testimonial.id}-${currentIndex}`}
            className={`relative overflow-hidden border-2 transition-all duration-700 transform ${
              index === 1 
                ? 'scale-105 border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-blue-50' 
                : 'border-gray-200 hover:border-primary/20 hover:shadow-md'
            } animate-in slide-in-from-bottom-4 fade-in`}
            style={{
              animationDelay: `${index * 200}ms`,
              animationDuration: '600ms'
            }}
          >
            <CardContent className="p-6">
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Results Badge */}
              {showResults && testimonial.results && (
                <Badge 
                  variant="secondary" 
                  className="mb-4 bg-green-100 text-green-800 border-green-200"
                >
                  📈 {testimonial.results}
                </Badge>
              )}

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Shine effect for center testimonial */}
            {index === 1 && (
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Dots Navigation */}
      {showDots && (
        <div className="flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="p-4">
          <div className="text-2xl font-bold text-primary">10,000+</div>
          <div className="text-sm text-gray-600">Happy Customers</div>
        </div>
        <div className="p-4">
          <div className="text-2xl font-bold text-primary">500M+</div>
          <div className="text-sm text-gray-600">Backlinks Created</div>
        </div>
        <div className="p-4">
          <div className="text-2xl font-bold text-primary">98%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="p-4">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-sm text-gray-600">Expert Support</div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTestimonials;
