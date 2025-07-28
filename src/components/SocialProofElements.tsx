import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Star, 
  Users, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  Timer,
  AlertCircle
} from "lucide-react";

// Static activity indicator (removed fake simulation)
export function LiveUserActivity({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 ${className}`}>
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      <span className="font-medium">
        Active community
      </span>
    </div>
  );
}

// Customer testimonials
export function SocialProofTestimonials({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "SEO Manager",
      company: "TechCorp",
      avatar: "SC",
      rating: 5,
      text: "This platform increased our organic traffic by 300% in just 3 months. The backlink quality is outstanding."
    },
    {
      name: "Mike Rodriguez",
      role: "Digital Marketer", 
      company: "GrowthAgency",
      avatar: "MR",
      rating: 5,
      text: "Best ROI we've ever seen from a backlink service. The automation saves us 20+ hours per week."
    },
    {
      name: "Jennifer Park",
      role: "Founder",
      company: "EcomBrand",
      avatar: "JP",
      rating: 5,
      text: "Went from page 3 to page 1 for our main keyword in 2 months. Customer support is incredible."
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    if (variant === "compact") {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [variant, testimonials.length]);

  if (variant === "compact") {
    const testimonial = testimonials[currentTestimonial];
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-500">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {testimonial.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-blue-800 mb-2">"{testimonial.text}"</p>
            <div className="text-xs text-blue-600">
              <span className="font-medium">{testimonial.name}</span>
              <span className="text-blue-500"> • {testimonial.role}, {testimonial.company}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {testimonials.map((testimonial, index) => (
        <Card key={index} className="p-4 border-l-4 border-l-blue-500">
          <CardContent className="p-0">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-3">"{testimonial.text}"</p>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {testimonial.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <div className="font-medium">{testimonial.name}</div>
                <div className="text-muted-foreground">{testimonial.role}, {testimonial.company}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Usage statistics
export function UsageStats({ layout = "horizontal" }: { layout?: "horizontal" | "vertical" }) {
  const stats = [
    { icon: Users, value: "Growing", label: "User Base" },
    { icon: TrendingUp, value: "High", label: "Success Rate" },
    { icon: Star, value: "Rated", label: "User Reviews" },
    { icon: Zap, value: "24/7", label: "Support" }
  ];

  const containerClass = layout === "horizontal" 
    ? "grid grid-cols-2 md:grid-cols-4 gap-4"
    : "grid grid-cols-2 gap-3";

  return (
    <div className={containerClass}>
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <stat.icon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-lg font-semibold text-foreground">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Trust badges
export function TrustBadges({ className = "" }: { className?: string }) {
  const badges = [
    { icon: Shield, text: "SSL Secured" },
    { icon: CheckCircle, text: "GDPR Compliant" },
    { icon: Users, text: "Users Trust Us" },
    { icon: Star, text: "Well Rated" }
  ];

  return (
    <div className={`flex items-center justify-center gap-4 text-xs text-muted-foreground ${className}`}>
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-1">
          <badge.icon className="h-3 w-3" />
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}

// Limited time offer/urgency
export function UrgencyBanner({ 
  offerText = "Limited Time: Get 20% more credits on your first purchase",
  timeLeft = "24:00:00",
  className = ""
}: { 
  offerText?: string;
  timeLeft?: string;
  className?: string;
}) {
  const [time, setTime] = useState(timeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simple countdown simulation (in real app, this would be server-synced)
      const [hours, minutes, seconds] = time.split(':').map(Number);
      let totalSeconds = hours * 3600 + minutes * 60 + seconds - 1;
      
      if (totalSeconds < 0) {
        totalSeconds = 86400; // Reset to 24 hours
      }
      
      const newHours = Math.floor(totalSeconds / 3600);
      const newMinutes = Math.floor((totalSeconds % 3600) / 60);
      const newSeconds = totalSeconds % 60;
      
      setTime(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{offerText}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-mono font-bold">{time}</span>
        </div>
      </div>
    </div>
  );
}

// Feature comparison for signup motivation
export function FeatureComparison() {
  const features = [
    { name: "Backlink Generation", free: "1 trial post", premium: "Unlimited" },
    { name: "Analytics", free: "Basic", premium: "Advanced" },
    { name: "Support", free: "Email", premium: "Priority 24/7" },
    { name: "Campaign Management", free: "❌", premium: "✅" },
    { name: "Custom Reports", free: "❌", premium: "✅" },
    { name: "API Access", free: "❌", premium: "✅" }
  ];

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-center">Why Upgrade?</h3>
      </div>
      <div className="p-4 space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium">{feature.name}</div>
            <div className="text-center text-muted-foreground">{feature.free}</div>
            <div className="text-center text-blue-600 font-medium">{feature.premium}</div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-blue-50 rounded-b-lg">
        <div className="text-center text-sm text-blue-800">
          <strong>Join users</strong> who upgraded for advanced features
        </div>
      </div>
    </div>
  );
}

// Risk-free guarantee
export function MoneyBackGuarantee({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 ${className}`}>
      <Shield className="h-4 w-4" />
      <span className="font-medium">30-day money-back guarantee</span>
    </div>
  );
}

// Recent activity feed
export function RecentActivity() {
  const activities = [
    { user: "Alex M.", action: "upgraded to Pro", time: "2m ago", location: "New York" },
    { user: "Sarah K.", action: "created first campaign", time: "5m ago", location: "London" },
    { user: "Mike R.", action: "generated 5 backlinks", time: "8m ago", location: "Toronto" },
    { user: "Lisa T.", action: "upgraded to Pro", time: "12m ago", location: "Sydney" }
  ];

  const [currentActivity, setCurrentActivity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activities.length]);

  const activity = activities[currentActivity];

  return (
    <div className="bg-gray-50 border rounded-lg p-3 transition-all duration-500">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-medium">{activity.user}</span>
        <span className="text-muted-foreground">{activity.action}</span>
        <span className="text-xs text-muted-foreground ml-auto">{activity.time}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 ml-4">
        📍 {activity.location}
      </div>
    </div>
  );
}
