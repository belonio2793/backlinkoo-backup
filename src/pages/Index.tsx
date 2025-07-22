
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
      <PaymentModal isOpen={open} onClose={() => setOpen(false)} />

      {/* Background Images */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-space-nebula.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/hero-galaxy-spiral.jpg')] bg-cover bg-center opacity-10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/hero-supernova.jpg')] bg-cover bg-center opacity-5"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-24 md:py-36 px-4 relative">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Professional Backlink Solutions
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Elevate your search rankings with premium backlink services. High DA placements that deliver measurable results for your digital presence.
            </p>
            <div className="flex justify-center space-x-6 mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-2xl" 
                onClick={() => setOpen(true)}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-lg backdrop-blur-sm"
              >
                Learn More
              </Button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
                  <div className="text-3xl font-bold mb-4 text-purple-400">100 Credits</div>
                  <div className="text-lg mb-4 text-gray-300">$70.00</div>
                  <p className="text-sm text-gray-400 mb-6">Perfect for small projects</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setOpen(true)}
                  >
                    Choose Plan
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg border border-purple-500/50 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl ring-2 ring-purple-500/30">
                <div className="text-center">
                  <Badge className="mb-2 bg-purple-600">Most Popular</Badge>
                  <h3 className="text-2xl font-bold mb-2 text-white">Professional</h3>
                  <div className="text-3xl font-bold mb-4 text-purple-400">200 Credits</div>
                  <div className="text-lg mb-4 text-gray-300">$140.00</div>
                  <p className="text-sm text-gray-400 mb-6">Ideal for growing businesses</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setOpen(true)}
                  >
                    Choose Plan
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2 text-white">Enterprise</h3>
                  <div className="text-3xl font-bold mb-4 text-purple-400">300 Credits</div>
                  <div className="text-lg mb-4 text-gray-300">$210.00</div>
                  <p className="text-sm text-gray-400 mb-6">For large-scale campaigns</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setOpen(true)}
                  >
                    Choose Plan
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">Premium Backlink Solutions</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Advanced link building strategies designed to enhance your digital authority and search performance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
                <TrendingUp className="h-12 w-12 text-blue-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-white">Enhanced Rankings</h3>
                <p className="text-gray-300 leading-relaxed">
                  Strategic backlink placements from high DA domains to significantly improve your search engine visibility and organic traffic.
                </p>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
                <Search className="h-12 w-12 text-green-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-white">Strategic Analysis</h3>
                <p className="text-gray-300 leading-relaxed">
                  Comprehensive keyword and competitor analysis to identify optimal link opportunities within your industry vertical.
                </p>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
                <Target className="h-12 w-12 text-red-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-white">Qualified Traffic</h3>
                <p className="text-gray-300 leading-relaxed">
                  Precision-targeted link placements designed to attract qualified visitors and potential customers to your website.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 px-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Why Choose Backlink ∞</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex items-start space-x-6">
                <CheckCircle className="h-8 w-8 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Proven Methodologies</h3>
                  <p className="text-gray-300 leading-relaxed">Data-driven link building strategies with documented success across diverse industry sectors.</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <Globe className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Global Network</h3>
                  <p className="text-gray-300 leading-relaxed">Extensive publisher relationships spanning international markets for comprehensive digital reach.</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <Shield className="h-8 w-8 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Compliant Practices</h3>
                  <p className="text-gray-300 leading-relaxed">White-hat link building techniques that align with search engine guidelines and protect your domain authority.</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <Clock className="h-8 w-8 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Efficient Execution</h3>
                  <p className="text-gray-300 leading-relaxed">Streamlined delivery processes ensuring timely campaign implementation and measurable results.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
