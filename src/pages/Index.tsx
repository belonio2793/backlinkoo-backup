import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Search, 
  Target, 
  Users, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import Footer from "@/components/Footer";

const Index = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <PaymentModal open={open} setOpen={setOpen} />

      {/* Hero Section */}
      <section className="py-24 md:py-36 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Unlock Your Website's Potential
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Professional backlink building platform to boost your search engine rankings.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100" onClick={() => setOpen(true)}>
              Get Started <ArrowRight className="ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="p-6">
                <TrendingUp className="h-8 w-8 text-blue-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Boost Your Rankings</h2>
                <p className="text-gray-300">
                  Improve your search engine visibility with high-quality backlinks.
                </p>
              </div>
            </Card>

            {/* Feature Card 2 */}
            <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="p-6">
                <Search className="h-8 w-8 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Keyword Research</h2>
                <p className="text-gray-300">
                  Find the best keywords to target for your niche.
                </p>
              </div>
            </Card>

            {/* Feature Card 3 */}
            <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="p-6">
                <Target className="h-8 w-8 text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Targeted Traffic</h2>
                <p className="text-gray-300">
                  Attract more visitors to your website with strategic backlink placements.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Backlink ∞?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefit 1 */}
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="text-xl font-semibold">Proven Strategies</h3>
                <p className="text-gray-300">Effective backlink strategies that deliver results.</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-center space-x-4">
              <Globe className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-xl font-semibold">Global Reach</h3>
                <p className="text-gray-300">Expand your online presence to a global audience.</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-center space-x-4">
              <Shield className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="text-xl font-semibold">Safe & Secure</h3>
                <p className="text-gray-300">Secure backlink building practices that protect your website.</p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex items-center space-x-4">
              <Clock className="h-6 w-6 text-purple-500" />
              <div>
                <h3 className="text-xl font-semibold">Timely Delivery</h3>
                <p className="text-gray-300">Fast and reliable backlink building services.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
