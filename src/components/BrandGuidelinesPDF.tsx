import React, { useState, useRef, useEffect } from 'react';
import { Download, Eye, FileText, Palette, Type, Layout, Target, BookOpen, Star, Shield, Globe, Infinity, Sparkles, Zap, TrendingUp, Award, Users, Building, Lightbulb, Rocket, Crown, Heart, CheckCircle, AlertCircle, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const BrandGuidelinesPDF: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGeneratePDF = () => {
      generatePDF();
    };

    window.addEventListener('generateBrandGuidelinesPDF', handleGeneratePDF);
    return () => {
      window.removeEventListener('generateBrandGuidelinesPDF', handleGeneratePDF);
    };
  }, []);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Import html2pdf dynamically
      const html2pdf = await import('html2pdf.js');
      
      const element = contentRef.current;
      if (!element) return;

      const opt = {
        margin: 0,
        filename: 'Backlink-Infinity-Comprehensive-Brand-Guidelines.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      await html2pdf.default().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const brandColors = [
    { name: 'Primary Blue', hex: '#2563eb', hsl: 'hsl(219, 95%, 44%)', rgb: 'rgb(37, 99, 235)', usage: 'Primary actions, links, brand elements, CTA buttons' },
    { name: 'Secondary Blue', hex: '#3b82f6', hsl: 'hsl(217, 91%, 60%)', rgb: 'rgb(59, 130, 246)', usage: 'Secondary actions, hover states, navigation' },
    { name: 'Purple Accent', hex: '#8b5cf6', hsl: 'hsl(258, 90%, 66%)', rgb: 'rgb(139, 92, 246)', usage: 'Premium features, highlights, special emphasis' },
    { name: 'Deep Purple', hex: '#7c3aed', hsl: 'hsl(258, 90%, 58%)', rgb: 'rgb(124, 58, 237)', usage: 'Gradients, luxury positioning, advanced features' },
    { name: 'Success Green', hex: '#10b981', hsl: 'hsl(167, 85%, 39%)', rgb: 'rgb(16, 185, 129)', usage: 'Success states, achievements, positive feedback' },
    { name: 'Warning Orange', hex: '#f59e0b', hsl: 'hsl(45, 93%, 47%)', rgb: 'rgb(245, 158, 11)', usage: 'Alerts, notifications, attention-grabbing elements' },
    { name: 'Error Red', hex: '#ef4444', hsl: 'hsl(0, 85%, 60%)', rgb: 'rgb(239, 68, 68)', usage: 'Errors, critical states, urgent notifications' },
    { name: 'Neutral Gray', hex: '#6b7280', hsl: 'hsl(220, 9%, 46%)', rgb: 'rgb(107, 114, 128)', usage: 'Text, subtle elements, borders' },
    { name: 'Dark Charcoal', hex: '#1f2937', hsl: 'hsl(220, 39%, 17%)', rgb: 'rgb(31, 41, 55)', usage: 'Headers, strong text, high contrast elements' },
    { name: 'Light Gray', hex: '#f9fafb', hsl: 'hsl(220, 20%, 97%)', rgb: 'rgb(249, 250, 251)', usage: 'Backgrounds, subtle sections, card backgrounds' }
  ];

  const gradients = [
    { name: 'Primary Brand Gradient', css: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', usage: 'Hero sections, main CTAs, primary branding' },
    { name: 'Success Gradient', css: 'linear-gradient(135deg, #10b981, #059669)', usage: 'Success indicators, achievement badges' },
    { name: 'Premium Gradient', css: 'linear-gradient(135deg, #8b5cf6, #db2777)', usage: 'Premium features, luxury positioning' },
    { name: 'Warm Gradient', css: 'linear-gradient(135deg, #f59e0b, #ea580c)', usage: 'Warm accents, energy, motivation' },
    { name: 'Cool Gradient', css: 'linear-gradient(135deg, #06b6d4, #3b82f6)', usage: 'Trust, reliability, professional tone' },
    { name: 'Sunset Gradient', css: 'linear-gradient(135deg, #f97316, #ef4444)', usage: 'Urgency, limited offers, attention' }
  ];

  const services = [
    {
      category: 'Core Services',
      description: 'Our foundational SEO and link building solutions',
      items: [
        { name: 'High-Quality Backlinks', description: 'Premium backlinks from DA 50+ websites with contextual integration' },
        { name: 'AI-Powered Content Creation', description: 'GPT-4 generated, SEO-optimized content tailored to your niche' },
        { name: 'Strategic Link Building', description: 'White-hat link building campaigns with measurable results' },
        { name: 'Domain Authority Boosting', description: 'Systematic approach to increasing your website\'s authority' },
        { name: 'Competitor Analysis', description: 'Deep insights into competitor backlink strategies and opportunities' },
        { name: 'Keyword Research & Targeting', description: 'Advanced keyword research with search intent analysis' }
      ]
    },
    {
      category: 'Premium Features',
      description: 'Advanced tools and services for serious SEO professionals',
      items: [
        { name: 'Unlimited Backlinks', description: 'No caps on backlink generation - scale without limits' },
        { name: 'SEO Academy Access', description: 'Comprehensive education platform with 50+ lessons' },
        { name: 'Advanced Analytics Dashboard', description: 'Real-time insights and performance tracking' },
        { name: 'Priority Support & Consultation', description: '24/7 dedicated account management and strategy calls' },
        { name: 'Custom Integration APIs', description: 'Seamless integration with your existing tools and workflows' },
        { name: 'White-Label Solutions', description: 'Rebrandable services for agencies and consultants' }
      ]
    },
    {
      category: 'Technology Platform',
      description: 'Cutting-edge technology powering our SEO solutions',
      items: [
        { name: 'AI Content Engine', description: 'Advanced GPT-4 integration for human-quality content' },
        { name: 'Automated Campaign Management', description: 'Set-and-forget campaign optimization' },
        { name: 'Real-time Performance Monitoring', description: 'Live tracking of backlink performance and SEO metrics' },
        { name: 'Smart Quality Assurance', description: 'AI-powered quality control for all content and links' },
        { name: 'Predictive Analytics', description: 'Machine learning insights for future performance' },
        { name: 'Multi-Channel Distribution', description: 'Automated distribution across our network of partners' }
      ]
    },
    {
      category: 'Industry Solutions',
      description: 'Specialized solutions for different industries and use cases',
      items: [
        { name: 'E-commerce SEO', description: 'Product page optimization and category-specific link building' },
        { name: 'Local Business SEO', description: 'Geographic targeting and local citation building' },
        { name: 'SaaS & Tech SEO', description: 'Technical SEO and thought leadership content creation' },
        { name: 'Agency Partnership Program', description: 'White-label solutions for marketing agencies' },
        { name: 'Enterprise SEO Solutions', description: 'Large-scale SEO campaigns for enterprise clients' },
        { name: 'International SEO', description: 'Multi-language and geo-targeted link building' }
      ]
    }
  ];

  const academyModules = [
    { 
      module: 'SEO Fundamentals Mastery', 
      lessons: 12, 
      duration: '3 hours',
      topics: ['Search Engine Basics', 'Keyword Intent', 'SERP Analysis', 'SEO Metrics'],
      level: 'Beginner'
    },
    { 
      module: 'Advanced Keyword Research', 
      lessons: 8, 
      duration: '2.5 hours',
      topics: ['Semantic Keywords', 'Competitor Analysis', 'Long-tail Strategy', 'Search Volume Analysis'],
      level: 'Intermediate'
    },
    { 
      module: 'On-Page SEO Excellence', 
      lessons: 15, 
      duration: '4 hours',
      topics: ['Title Optimization', 'Meta Descriptions', 'Header Structure', 'Internal Linking'],
      level: 'Intermediate'
    },
    { 
      module: 'Link Building Strategies', 
      lessons: 18, 
      duration: '5 hours',
      topics: ['White-hat Techniques', 'Outreach Strategies', 'Guest Posting', 'Resource Pages'],
      level: 'Advanced'
    },
    { 
      module: 'Technical SEO Deep Dive', 
      lessons: 14, 
      duration: '3.5 hours',
      topics: ['Site Speed', 'Core Web Vitals', 'Schema Markup', 'Crawlability'],
      level: 'Advanced'
    },
    { 
      module: 'Content Marketing Integration', 
      lessons: 10, 
      duration: '2.5 hours',
      topics: ['Content Strategy', 'Topic Clusters', 'Content Distribution', 'Engagement Metrics'],
      level: 'Intermediate'
    },
    { 
      module: 'Local SEO Optimization', 
      lessons: 9, 
      duration: '2 hours',
      topics: ['Google My Business', 'Local Citations', 'Review Management', 'Geographic Targeting'],
      level: 'Intermediate'
    },
    { 
      module: 'E-commerce SEO Mastery', 
      lessons: 11, 
      duration: '3 hours',
      topics: ['Product Optimization', 'Category Pages', 'Faceted Navigation', 'Product Schema'],
      level: 'Advanced'
    },
    { 
      module: 'SEO Analytics & Reporting', 
      lessons: 7, 
      duration: '2 hours',
      topics: ['Google Analytics 4', 'Search Console', 'Data Interpretation', 'ROI Measurement'],
      level: 'Intermediate'
    },
    { 
      module: 'Enterprise SEO Strategy', 
      lessons: 6, 
      duration: '2.5 hours',
      topics: ['Large-scale Implementation', 'Team Management', 'Process Automation', 'Enterprise Tools'],
      level: 'Expert'
    }
  ];

  const PreviewContent = () => (
    <div ref={contentRef} className="bg-white text-black max-w-none" style={{ fontSize: '12px', lineHeight: '1.4' }}>
      {/* Cover Page */}
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-16 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20"></div>
        <div className="relative z-10">
          <div className="mb-12">
            <div className="text-9xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Backlink ∞
            </div>
            <div className="text-3xl font-light mb-8 opacity-90">
              COMPREHENSIVE BRAND GUIDELINES
            </div>
            <div className="text-xl opacity-80 mb-4">
              Version 2.0 • Complete Brand Identity System
            </div>
          </div>
          
          <div className="max-w-3xl mb-16">
            <p className="text-xl mb-8 opacity-80">
              The complete guide to our brand identity, visual language, communication standards, 
              service offerings, and everything that makes Backlink ∞ the leading SEO platform
            </p>
            <div className="flex justify-center gap-12 text-sm opacity-70">
              <div>Version 2.0</div>
              <div>•</div>
              <div>{new Date().getFullYear()}</div>
              <div>•</div>
              <div>backlinkoo.com</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6 max-w-5xl w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Target className="h-10 w-10 mx-auto mb-3" />
              <div className="font-semibold text-sm">Brand Identity</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Palette className="h-10 w-10 mx-auto mb-3" />
              <div className="font-semibold text-sm">Visual Language</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3" />
              <div className="font-semibold text-sm">SEO Academy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Globe className="h-10 w-10 mx-auto mb-3" />
              <div className="font-semibold text-sm">Global Standards</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Rocket className="h-10 w-10 mx-auto mb-3" />
              <div className="font-semibold text-sm">Innovation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-16 text-gray-900">Table of Contents</h1>
        
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-4 text-lg">
            <div className="text-xl font-semibold text-blue-600 mb-6">Foundation</div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>1. Executive Summary</span>
              <span>3</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>2. Brand Overview & Mission</span>
              <span>4</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>3. Brand Values & Personality</span>
              <span>5</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>4. Target Audience Analysis</span>
              <span>6</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>5. Competitive Positioning</span>
              <span>7</span>
            </div>
            
            <div className="text-xl font-semibold text-purple-600 mb-6 mt-12">Visual Identity</div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>6. Logo Guidelines & Usage</span>
              <span>8</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>7. Color System & Psychology</span>
              <span>10</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>8. Typography & Hierarchy</span>
              <span>12</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>9. Iconography & Visual Elements</span>
              <span>14</span>
            </div>
          </div>
          
          <div className="space-y-4 text-lg">
            <div className="text-xl font-semibold text-green-600 mb-6">Application</div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>10. Digital Applications</span>
              <span>15</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>11. Marketing Materials</span>
              <span>16</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>12. Social Media Guidelines</span>
              <span>17</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>13. Email & Communication</span>
              <span>18</span>
            </div>
            
            <div className="text-xl font-semibold text-orange-600 mb-6 mt-12">Services & Content</div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>14. Service Offerings Overview</span>
              <span>19</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>15. SEO Academy Curriculum</span>
              <span>21</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>16. Technology Platform</span>
              <span>23</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>17. Industry Solutions</span>
              <span>24</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>18. Affiliate Program</span>
              <span>25</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>19. Brand Assets & Resources</span>
              <span>26</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span>20. Implementation Guide</span>
              <span>27</span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">1. Executive Summary</h1>
        
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200">
            <h2 className="text-3xl font-semibold mb-6 text-blue-800">Brand at a Glance</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">What We Do</h3>
                <p className="text-gray-700 leading-relaxed">
                  Backlink ∞ is the world's most advanced SEO and link building platform, providing unlimited 
                  high-quality backlinks, AI-powered content creation, and comprehensive SEO education to 
                  businesses, agencies, and professionals worldwide.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Why We Matter</h3>
                <p className="text-gray-700 leading-relaxed">
                  We've revolutionized the SEO industry by removing traditional limitations and providing 
                  truly unlimited potential for growth. Our platform has generated over 10 million backlinks 
                  and helped 50,000+ websites achieve first-page rankings.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
              <h3 className="font-semibold mb-2">Unlimited Potential</h3>
              <p className="text-sm text-gray-600">No caps on backlinks, content, or growth</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <h3 className="font-semibold mb-2">DA Quality</h3>
              <p className="text-sm text-gray-600">Premium backlinks from high-authority domains</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">AI</div>
              <h3 className="font-semibold mb-2">Powered</h3>
              <p className="text-sm text-gray-600">GPT-4 content generation and optimization</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-6 text-gray-900">Brand Positioning Statement</h2>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-xl border-l-4 border-blue-600">
              <p className="text-xl text-gray-800 italic leading-relaxed">
                "For SEO professionals and businesses who demand unlimited growth potential, Backlink ∞ is 
                the only platform that removes traditional limitations while maintaining the highest quality 
                standards. Unlike competitors who cap your success, we provide truly unlimited backlinks, 
                AI-powered content creation, and comprehensive education to ensure your SEO dominance."
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-6 text-gray-900">Key Differentiators</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-800">True Unlimited Access</h4>
                    <p className="text-sm text-green-700">No monthly limits, no tier restrictions, no artificial caps</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-800">DA 50+ Quality Guarantee</h4>
                    <p className="text-sm text-blue-700">Every backlink from verified high-authority domains</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">AI-First Approach</h4>
                    <p className="text-sm text-purple-700">GPT-4 powered content that ranks and converts</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <CheckCircle className="h-6 w-6 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-800">Complete Education System</h4>
                    <p className="text-sm text-orange-700">50+ lessons, certification, ongoing updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Overview & Mission */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">2. Brand Overview & Mission</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Our Mission</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
              <p className="text-2xl text-gray-800 leading-relaxed mb-6">
                To democratize SEO success by providing unlimited, high-quality backlinks and comprehensive 
                education that empowers businesses of all sizes to dominate search rankings and achieve 
                sustainable organic growth.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We believe that every business deserves access to enterprise-level SEO tools and strategies, 
                regardless of their size or budget. By removing traditional limitations and providing unlimited 
                potential, we're leveling the playing field in digital marketing.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Our Vision</h2>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl">
              <p className="text-xl text-gray-800 leading-relaxed">
                To become the global standard for SEO and link building, creating a world where unlimited 
                growth potential is accessible to every business, backed by cutting-edge AI technology and 
                the most comprehensive SEO education platform ever created.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Company Story</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-600">The Problem We Solved</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Traditional SEO tools imposed artificial limitations - monthly caps, tier restrictions, 
                    and premium pricing that kept advanced strategies out of reach for most businesses. 
                    Quality backlinks were either too expensive or too risky.
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-600">Our Innovation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We created the first truly unlimited SEO platform, combining AI-powered content creation 
                    with a verified network of DA 50+ websites. No caps, no limits, just unlimited potential 
                    for growth.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-600">The Result</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Over 50,000 websites now achieve first-page rankings using our platform. We've generated 
                    more than 10 million high-quality backlinks and helped businesses increase their organic 
                    traffic by an average of 340%.
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-orange-600">Looking Forward</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We're continuously expanding our network, enhancing our AI capabilities, and developing 
                    new features that push the boundaries of what's possible in SEO. The infinity symbol 
                    represents our commitment to unlimited potential.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Core Principles</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center">
                <Infinity className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-3 text-blue-800">Unlimited Potential</h3>
                <p className="text-blue-700">No artificial caps or restrictions - your success is truly unlimited</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-3 text-purple-800">Quality Assurance</h3>
                <p className="text-purple-700">Every backlink verified from DA 50+ websites with human oversight</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-3 text-green-800">Innovation First</h3>
                <p className="text-green-700">AI-powered solutions that stay ahead of algorithm changes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Values & Personality */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">3. Brand Values & Personality</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Core Values</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-l-4 border-blue-600">
                  <div className="flex items-center mb-4">
                    <Infinity className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-blue-800">Unlimited Mindset</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    We believe in removing artificial limitations and providing true unlimited potential. 
                    Your success should never be capped by tool restrictions or pricing tiers.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl border-l-4 border-purple-600">
                  <div className="flex items-center mb-4">
                    <Shield className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-purple-800">Quality Excellence</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Every backlink, every piece of content, every interaction meets the highest standards. 
                    We maintain DA 50+ quality requirements without exception.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border-l-4 border-green-600">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-green-800">Results Driven</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    We measure success by your success. Data-driven decisions, transparent reporting, 
                    and measurable improvements in rankings and traffic.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl border-l-4 border-orange-600">
                  <div className="flex items-center mb-4">
                    <Zap className="h-8 w-8 text-orange-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-orange-800">Innovation Leadership</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    First to market with AI-powered SEO solutions, continuous platform evolution, 
                    and staying ahead of search engine algorithm changes.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-xl border-l-4 border-blue-600">
                  <div className="flex items-center mb-4">
                    <Users className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-blue-800">Customer Obsession</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Your success is our success. 24/7 support, comprehensive education, 
                    and tools that actually help you achieve your goals.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-xl border-l-4 border-purple-600">
                  <div className="flex items-center mb-4">
                    <Heart className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-purple-800">Ethical Practices</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    White-hat strategies only, transparent pricing, honest communication, 
                    and building sustainable long-term success for our users.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Brand Personality</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg bg-white">
                <Award className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h4 className="text-xl font-semibold mb-2">Professional</h4>
                <p className="text-sm text-gray-600">Enterprise-grade solutions with proven results</p>
                <div className="mt-4 bg-blue-50 p-3 rounded">
                  <div className="text-xs text-blue-800 font-semibold">Tone: Authoritative, Confident</div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg bg-white">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h4 className="text-xl font-semibold mb-2">Innovative</h4>
                <p className="text-sm text-gray-600">Cutting-edge technology and forward-thinking</p>
                <div className="mt-4 bg-purple-50 p-3 rounded">
                  <div className="text-xs text-purple-800 font-semibold">Tone: Visionary, Pioneering</div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg bg-white">
                <Star className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h4 className="text-xl font-semibold mb-2">Trustworthy</h4>
                <p className="text-sm text-gray-600">Reliable, transparent, and dependable</p>
                <div className="mt-4 bg-yellow-50 p-3 rounded">
                  <div className="text-xs text-yellow-800 font-semibold">Tone: Honest, Reliable</div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg bg-white">
                <Crown className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h4 className="text-xl font-semibold mb-2">Premium</h4>
                <p className="text-sm text-gray-600">High-quality, exclusive, sophisticated</p>
                <div className="mt-4 bg-orange-50 p-3 rounded">
                  <div className="text-xs text-orange-800 font-semibold">Tone: Sophisticated, Elite</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Communication Style</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-green-600">✓ We Are</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Results-Focused</h4>
                    <p className="text-sm text-green-700">We talk about measurable outcomes and real impact</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Educational</h4>
                    <p className="text-sm text-green-700">We teach and empower our users with knowledge</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Confident</h4>
                    <p className="text-sm text-green-700">We know our value and communicate it clearly</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Supportive</h4>
                    <p className="text-sm text-green-700">We're here to help you succeed, not just sell</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6 text-red-600">✗ We Are Not</h3>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Overly Technical</h4>
                    <p className="text-sm text-red-700">We avoid jargon and explain complex concepts simply</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Pushy or Aggressive</h4>
                    <p className="text-sm text-red-700">We don't use high-pressure tactics or create false urgency</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Generic or Cookie-Cutter</h4>
                    <p className="text-sm text-red-700">We provide personalized, relevant solutions</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Unrealistic</h4>
                    <p className="text-sm text-red-700">We set proper expectations and deliver on promises</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience Analysis */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">4. Target Audience Analysis</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Primary Audience Segments</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl">
                <div className="text-center mb-6">
                  <Building className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-2xl font-semibold text-blue-800">Business Owners</h3>
                  <p className="text-blue-600 font-medium">35% of user base</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Demographics</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Age: 30-55</li>
                      <li>• Income: $75K-$500K+</li>
                      <li>• Company size: 5-100 employees</li>
                      <li>• Industry: SaaS, E-commerce, Services</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Pain Points</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Limited marketing budget</li>
                      <li>• Need consistent lead generation</li>
                      <li>• Competing with larger companies</li>
                      <li>• Time constraints</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Goals</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Increase organic traffic</li>
                      <li>• Generate more leads</li>
                      <li>• Improve brand visibility</li>
                      <li>• ROI on marketing spend</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl">
                <div className="text-center mb-6">
                  <Users className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-2xl font-semibold text-purple-800">Marketing Agencies</h3>
                  <p className="text-purple-600 font-medium">40% of user base</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Demographics</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Team size: 3-50 people</li>
                      <li>• Client count: 10-100+</li>
                      <li>• Annual revenue: $200K-$10M+</li>
                      <li>• Specialization: SEO, Digital Marketing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Pain Points</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Scaling quality link building</li>
                      <li>• Client retention and results</li>
                      <li>• Resource limitations</li>
                      <li>• Pricing pressure</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Goals</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Deliver consistent client results</li>
                      <li>• Scale operations efficiently</li>
                      <li>• Increase profit margins</li>
                      <li>• Build reputation and referrals</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl">
                <div className="text-center mb-6">
                  <Award className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-2xl font-semibold text-green-800">SEO Professionals</h3>
                  <p className="text-green-600 font-medium">25% of user base</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Demographics</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Experience: 2-15+ years</li>
                      <li>• Role: SEO Manager, Consultant</li>
                      <li>• Industry: Various</li>
                      <li>• Education: College/Self-taught</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Pain Points</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Keeping up with algorithm changes</li>
                      <li>• Proving ROI to management</li>
                      <li>• Limited tool budgets</li>
                      <li>• Quality link building at scale</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Goals</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Advance career and skills</li>
                      <li>• Achieve ranking improvements</li>
                      <li>• Stay current with best practices</li>
                      <li>• Build professional reputation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">User Journey Mapping</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Awareness</h4>
                  <p className="text-sm text-gray-600">Discovers need for better SEO/backlinks</p>
                  <div className="mt-3 bg-blue-50 p-2 rounded text-xs text-blue-800">
                    Social media, referrals, search
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Research</h4>
                  <p className="text-sm text-gray-600">Compares solutions and reads reviews</p>
                  <div className="mt-3 bg-purple-50 p-2 rounded text-xs text-purple-800">
                    Website, case studies, comparisons
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Trial</h4>
                  <p className="text-sm text-gray-600">Tests platform with free trial</p>
                  <div className="mt-3 bg-green-50 p-2 rounded text-xs text-green-800">
                    Free trial, demos, samples
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-orange-600">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Purchase</h4>
                  <p className="text-sm text-gray-600">Converts to paid subscriber</p>
                  <div className="mt-3 bg-orange-50 p-2 rounded text-xs text-orange-800">
                    Easy checkout, onboarding
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-pink-600">5</span>
                  </div>
                  <h4 className="font-semibold mb-2">Advocacy</h4>
                  <p className="text-sm text-gray-600">Refers others and provides testimonials</p>
                  <div className="mt-3 bg-pink-50 p-2 rounded text-xs text-pink-800">
                    Reviews, referrals, case studies
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Messaging Framework</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Business Owners</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Primary Message</h4>
                    <p className="text-sm text-gray-700">"Get unlimited high-quality backlinks that actually drive traffic and sales"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• More website traffic</li>
                      <li>• Higher search rankings</li>
                      <li>• Increased sales/leads</li>
                      <li>• Better ROI than paid ads</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Marketing Agencies</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Primary Message</h4>
                    <p className="text-sm text-gray-700">"Scale your agency with unlimited link building that delivers client results"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• White-label solutions</li>
                      <li>• Scalable operations</li>
                      <li>• Higher profit margins</li>
                      <li>• Happy, retained clients</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">SEO Professionals</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Primary Message</h4>
                    <p className="text-sm text-gray-700">"Advanced SEO tools and education to accelerate your career"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Professional development</li>
                      <li>• Proven strategies that work</li>
                      <li>• Industry recognition</li>
                      <li>• Career advancement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Guidelines */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">6. Logo Guidelines & Usage</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Primary Logo System</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <div className="text-8xl font-bold text-blue-600 mb-6">
                  Backlink ∞
                </div>
                <p className="text-gray-600 font-medium">Primary Logo - Full Wordmark</p>
                <p className="text-sm text-gray-500 mt-2">Use for main branding and marketing materials</p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">Backlink ∞</div>
                  <p className="text-sm text-gray-500">Horizontal - Standard Size</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg text-center">
                  <div className="text-4xl font-bold text-white mb-2">Backlink ∞</div>
                  <p className="text-sm text-gray-400">Reverse - Dark Backgrounds</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">∞</div>
                  <p className="text-sm text-gray-500">Symbol Only - Icon Version</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Logo Variations & Applications</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 rounded-lg text-center">
                <div className="text-4xl font-bold text-white mb-4">Backlink ∞</div>
                <p className="text-blue-100 text-sm">Gradient Background</p>
                <p className="text-xs text-blue-200 mt-1">For premium positioning</p>
              </div>
              
              <div className="bg-white border-2 border-blue-500 p-8 rounded-lg text-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">Backlink ∞</div>
                <p className="text-gray-600 text-sm">Outlined Version</p>
                <p className="text-xs text-gray-500 mt-1">For complex backgrounds</p>
              </div>
              
              <div className="bg-blue-50 p-8 rounded-lg text-center">
                <div className="text-4xl font-bold text-blue-800 mb-4">Backlink ∞</div>
                <p className="text-blue-600 text-sm">Tinted Background</p>
                <p className="text-xs text-blue-500 mt-1">For subtle branding</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Construction & Proportions</h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-center mb-8">
                <div className="inline-block border-2 border-dashed border-gray-400 p-12 relative">
                  <div className="text-6xl font-bold text-blue-600">Backlink ∞</div>
                  
                  {/* Construction guides */}
                  <div className="absolute top-0 left-0 w-full h-full border border-red-300 opacity-50"></div>
                  <div className="absolute top-1/4 left-0 w-full border-t border-red-300 opacity-50"></div>
                  <div className="absolute top-3/4 left-0 w-full border-t border-red-300 opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-full border-t border-red-300 opacity-50"></div>
                  
                  <div className="absolute top-0 left-1/4 h-full border-l border-red-300 opacity-50"></div>
                  <div className="absolute top-0 left-3/4 h-full border-l border-red-300 opacity-50"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Logo Measurements</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• X-height: Base unit for all measurements</li>
                    <li>• Infinity symbol height: 1.2x X-height</li>
                    <li>• Letter spacing: 0.05x X-height</li>
                    <li>• Word spacing: 0.8x X-height</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Minimum Sizes</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Digital: 120px width minimum</li>
                    <li>• Print: 1 inch width minimum</li>
                    <li>• Icon only: 24px minimum</li>
                    <li>• Favicon: 16px recommended</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Clear Space & Placement</h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-center mb-8">
                <div className="inline-block border-2 border-dashed border-blue-300 p-16">
                  <div className="text-5xl font-bold text-blue-600">Backlink ∞</div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Minimum clear space equals the height of the infinity symbol (∞)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4 text-green-600">✓ Correct Placement</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Top-left corner of layouts</li>
                    <li>• Center of hero sections</li>
                    <li>• Header navigation areas</li>
                    <li>• Footer branding sections</li>
                    <li>• Business card corners</li>
                    <li>• Email signature blocks</li>
                  </ul>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4 text-red-600">✗ Avoid These Placements</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Over busy background images</li>
                    <li>• Too close to other logos</li>
                    <li>• Bottom-right corner placement</li>
                    <li>• Overlapping content areas</li>
                    <li>• Insufficient contrast areas</li>
                    <li>• Cramped or tight spaces</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Usage Guidelines</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-green-50 border border-green-200 p-8 rounded-lg">
                <h3 className="text-2xl font-semibold text-green-800 mb-6">✓ DO</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Use on clean backgrounds</p>
                      <p className="text-sm text-green-700">Ensure sufficient contrast for readability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Maintain proportions</p>
                      <p className="text-sm text-green-700">Scale uniformly to preserve design integrity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Use approved colors</p>
                      <p className="text-sm text-green-700">Stick to the official color palette</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Respect clear space</p>
                      <p className="text-sm text-green-700">Allow breathing room around the logo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-8 rounded-lg">
                <h3 className="text-2xl font-semibold text-red-800 mb-6">✗ DON'T</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Stretch or distort</p>
                      <p className="text-sm text-red-700">Never alter the aspect ratio or proportions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Use unauthorized colors</p>
                      <p className="text-sm text-red-700">Don't change colors outside the approved palette</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Rotate or tilt</p>
                      <p className="text-sm text-red-700">Keep the logo level and properly oriented</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Add effects or shadows</p>
                      <p className="text-sm text-red-700">Use the logo as provided without modifications</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color System & Psychology */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">7. Color System & Psychology</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Primary Color Palette</h2>
            <div className="grid grid-cols-5 gap-4">
              {brandColors.map((color, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div 
                    className="h-32 w-full"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{color.name}</h4>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono">{color.hex}</div>
                      <div className="font-mono text-gray-600">{color.rgb}</div>
                      <div className="font-mono text-gray-500">{color.hsl}</div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 leading-tight">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Gradient System</h2>
            <div className="grid grid-cols-2 gap-6">
              {gradients.map((gradient, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="h-24 w-full"
                    style={{ background: gradient.css }}
                  ></div>
                  <div className="p-6">
                    <h4 className="font-semibold text-lg mb-2">{gradient.name}</h4>
                    <p className="text-xs text-gray-600 font-mono mb-3 bg-gray-50 p-2 rounded">{gradient.css}</p>
                    <p className="text-sm text-gray-600">{gradient.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Color Psychology & Applications</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-blue-800">Primary Blue (#2563eb)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-blue-800">Psychology</h5>
                      <p className="text-sm text-blue-700">Trust, reliability, professionalism, security</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-800">Applications</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Primary CTA buttons</li>
                        <li>• Navigation elements</li>
                        <li>• Brand logo</li>
                        <li>• Link colors</li>
                        <li>• Professional communications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-600 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-purple-800">Purple Accent (#8b5cf6)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-purple-800">Psychology</h5>
                      <p className="text-sm text-purple-700">Premium, innovation, creativity, luxury</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-purple-800">Applications</h5>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Premium features</li>
                        <li>• Special offers</li>
                        <li>• Advanced tools</li>
                        <li>• Upgrade prompts</li>
                        <li>• Innovation messaging</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-600 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-green-800">Success Green (#10b981)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-green-800">Psychology</h5>
                      <p className="text-sm text-green-700">Success, growth, positive results, prosperity</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-800">Applications</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Success messages</li>
                        <li>• Positive metrics</li>
                        <li>• Growth indicators</li>
                        <li>• Achievement badges</li>
                        <li>• Confirmation states</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-orange-800">Warning Orange (#f59e0b)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-orange-800">Psychology</h5>
                      <p className="text-sm text-orange-700">Attention, energy, urgency, enthusiasm</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-orange-800">Applications</h5>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Alert notifications</li>
                        <li>• Limited time offers</li>
                        <li>• Warning messages</li>
                        <li>• Call attention elements</li>
                        <li>• Interactive highlights</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-red-500 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-red-800">Error Red (#ef4444)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-red-800">Psychology</h5>
                      <p className="text-sm text-red-700">Error, danger, critical attention, stop</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-red-800">Applications</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Error messages</li>
                        <li>• Critical alerts</li>
                        <li>• Validation errors</li>
                        <li>• Destructive actions</li>
                        <li>• System failures</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gray-600 rounded mr-3"></div>
                    <h4 className="text-xl font-semibold text-gray-800">Neutral Gray (#6b7280)</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-gray-800">Psychology</h5>
                      <p className="text-sm text-gray-700">Balance, neutral, professional, sophisticated</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Applications</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Body text</li>
                        <li>• Borders and dividers</li>
                        <li>• Subtle backgrounds</li>
                        <li>• Secondary information</li>
                        <li>• Disabled states</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Color Accessibility Guidelines</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-green-600">WCAG AA Compliant Combinations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded">
                      <span>Primary Blue on White</span>
                      <span className="text-sm">4.5:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-600 text-white rounded">
                      <span>Purple Accent on White</span>
                      <span className="text-sm">4.6:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-600 text-white rounded">
                      <span>Success Green on White</span>
                      <span className="text-sm">4.7:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 text-white rounded">
                      <span>Dark Gray on White</span>
                      <span className="text-sm">12.6:1</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-red-600">Avoid These Combinations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-300 text-yellow-700 rounded border border-red-300">
                      <span>Light colors on light backgrounds</span>
                      <span className="text-sm">< 3:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-400 text-gray-600 rounded border border-red-300">
                      <span>Similar color combinations</span>
                      <span className="text-sm">< 3:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-200 text-blue-400 rounded border border-red-300">
                      <span>Low contrast blues</span>
                      <span className="text-sm">< 3:1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-200 text-purple-400 rounded border border-red-300">
                      <span>Low contrast purples</span>
                      <span className="text-sm">< 3:1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Offerings */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">14. Service Offerings Overview</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Comprehensive SEO Solutions</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
              <p className="text-xl text-gray-800 leading-relaxed mb-6">
                Backlink ∞ provides a complete ecosystem of SEO tools and services designed to drive 
                sustainable organic growth for businesses of all sizes. Our platform combines cutting-edge 
                AI technology with proven SEO strategies to deliver measurable results.
              </p>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10M+</div>
                  <div className="text-sm text-gray-600">Backlinks Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600">Websites Improved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">340%</div>
                  <div className="text-sm text-gray-600">Avg. Traffic Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">98%</div>
                  <div className="text-sm text-gray-600">Customer Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          {services.map((category, index) => (
            <div key={index} className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-16 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                <div>
                  <h3 className="text-3xl font-semibold text-purple-600">{category.category}</h3>
                  <p className="text-lg text-gray-600">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {category.items.map((service, serviceIndex) => (
                  <div key={serviceIndex} className="bg-white border border-gray-200 p-8 rounded-xl hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-3">{service.name}</h4>
                        <p className="text-gray-700 leading-relaxed">{service.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Service Delivery Process</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Strategy</h4>
                  <p className="text-sm text-gray-600">Analyze your website and develop custom SEO strategy</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Content</h4>
                  <p className="text-sm text-gray-600">AI-powered content creation tailored to your niche</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Placement</h4>
                  <p className="text-sm text-gray-600">Strategic placement on DA 50+ websites</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Monitor</h4>
                  <p className="text-sm text-gray-600">Real-time tracking and performance monitoring</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">5</span>
                  </div>
                  <h4 className="font-semibold mb-2">Optimize</h4>
                  <p className="text-sm text-gray-600">Continuous optimization based on results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Academy Curriculum */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">15. SEO Academy Curriculum</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Comprehensive SEO Education Platform</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
              <p className="text-xl text-gray-800 leading-relaxed mb-8">
                Our SEO Academy provides over 110 lessons covering every aspect of search engine optimization, 
                from fundamentals to advanced strategies used by industry experts. Learn from real case studies, 
                hands-on exercises, and the latest algorithm updates.
              </p>
              
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">110+</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">30h</div>
                  <div className="text-sm text-gray-600">Total Content</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">10</div>
                  <div className="text-sm text-gray-600">Core Modules</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">∞</div>
                  <div className="text-sm text-gray-600">Lifetime Access</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Complete Module Breakdown</h2>
            <div className="grid grid-cols-2 gap-6">
              {academyModules.map((module, index) => (
                <div key={index} className="bg-white border border-gray-200 p-8 rounded-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.module}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {module.lessons} lessons
                        </span>
                        <span>{module.duration}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={module.level === 'Beginner' ? 'secondary' : 
                              module.level === 'Intermediate' ? 'default' : 
                              module.level === 'Advanced' ? 'destructive' : 'outline'}
                      className="ml-4"
                    >
                      {module.level}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Key Topics:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {module.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (module.lessons / 18) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-green-600">Learning Pathways</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200">
                <h3 className="text-2xl font-semibold text-green-800 mb-6">Beginner Path</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800">1. SEO Fundamentals</h4>
                    <p className="text-sm text-green-700">Master the basics of search engines</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800">2. Keyword Research</h4>
                    <p className="text-sm text-green-700">Find profitable keywords</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800">3. On-Page Optimization</h4>
                    <p className="text-sm text-green-700">Optimize your content and pages</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-bold text-green-600">4-6 weeks</div>
                  <div className="text-sm text-green-700">Estimated completion</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200">
                <h3 className="text-2xl font-semibold text-blue-800 mb-6">Intermediate Path</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800">1. Link Building Strategies</h4>
                    <p className="text-sm text-blue-700">Advanced link acquisition</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800">2. Content Marketing</h4>
                    <p className="text-sm text-blue-700">Create content that ranks</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800">3. Local SEO</h4>
                    <p className="text-sm text-blue-700">Dominate local search</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">6-8 weeks</div>
                  <div className="text-sm text-blue-700">Estimated completion</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border border-purple-200">
                <h3 className="text-2xl font-semibold text-purple-800 mb-6">Expert Path</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-800">1. Technical SEO</h4>
                    <p className="text-sm text-purple-700">Advanced technical optimization</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-800">2. Enterprise SEO</h4>
                    <p className="text-sm text-purple-700">Large-scale SEO management</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-800">3. Advanced Analytics</h4>
                    <p className="text-sm text-purple-700">Data-driven SEO decisions</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">8-12 weeks</div>
                  <div className="text-sm text-purple-700">Estimated completion</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-orange-600">Certification Program</h2>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-8 rounded-xl border border-orange-200">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-6">
                    <Award className="h-12 w-12 text-orange-600 mr-4" />
                    <div>
                      <h3 className="text-2xl font-semibold text-orange-800">Backlink ∞ SEO Specialist</h3>
                      <p className="text-orange-600">Industry-Recognized Certification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-2">Certification Requirements:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Complete all 110+ lessons</li>
                        <li>• Pass final examination (80% minimum)</li>
                        <li>• Submit practical SEO project</li>
                        <li>• Participate in live Q&A sessions</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-2">Certificate Benefits:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• LinkedIn profile badge</li>
                        <li>• Digital certificate download</li>
                        <li>• Industry recognition</li>
                        <li>• Career advancement opportunities</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-orange-200">
                  <h4 className="text-xl font-semibold text-center mb-6">Certificate Preview</h4>
                  <div className="border-2 border-orange-300 rounded-lg p-6 text-center bg-gradient-to-br from-orange-50 to-yellow-50">
                    <div className="text-3xl font-bold text-orange-600 mb-2">∞</div>
                    <div className="text-lg font-semibold text-orange-800 mb-2">Certificate of Completion</div>
                    <div className="text-sm text-orange-700 mb-4">Backlink ∞ SEO Academy</div>
                    <div className="text-xs text-orange-600">This certifies that [Name] has successfully completed the comprehensive SEO training program</div>
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <div className="text-xs text-orange-600">Credential ID: BL-[XXXX]</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Applications */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">10. Digital Applications</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Website & Platform Design Standards</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 p-8 rounded-xl">
                <h3 className="text-xl font-semibold mb-6 text-blue-800">Design Principles</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Clean Interface Design</h4>
                      <p className="text-sm text-gray-600">Minimalist approach with clear visual hierarchy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Premium Visual Effects</h4>
                      <p className="text-sm text-gray-600">Subtle gradients, glass morphism, and micro-interactions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Mobile-First Responsive</h4>
                      <p className="text-sm text-gray-600">Optimal experience across all device sizes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-orange-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Accessibility Compliance</h4>
                      <p className="text-sm text-gray-600">WCAG 2.1 AA standards for inclusive design</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-8 rounded-xl">
                <h3 className="text-xl font-semibold mb-6 text-purple-800">Interactive Elements</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Smooth Transitions</h4>
                      <p className="text-sm text-gray-600">300ms hover states with easing functions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Loading Animations</h4>
                      <p className="text-sm text-gray-600">Engaging micro-interactions during load states</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Progressive Enhancement</h4>
                      <p className="text-sm text-gray-600">Enhanced experiences for capable browsers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-800">User Feedback Systems</h4>
                      <p className="text-sm text-gray-600">Toast notifications and clear status indicators</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Device-Specific Guidelines</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                <h4 className="text-xl font-semibold mb-4 text-blue-800">Desktop</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  <div>
                    <strong>Resolution:</strong> 1920x1080 primary
                  </div>
                  <div>
                    <strong>Layout:</strong> Max-width 1200px
                  </div>
                  <div>
                    <strong>Navigation:</strong> Horizontal menu
                  </div>
                  <div>
                    <strong>Interactions:</strong> Hover states
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center">
                <Tablet className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h4 className="text-xl font-semibold mb-4 text-purple-800">Tablet</h4>
                <div className="space-y-3 text-sm text-purple-700">
                  <div>
                    <strong>Resolution:</strong> 768px-1024px
                  </div>
                  <div>
                    <strong>Layout:</strong> Adapted grid system
                  </div>
                  <div>
                    <strong>Navigation:</strong> Collapsible menu
                  </div>
                  <div>
                    <strong>Interactions:</strong> Touch-friendly
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h4 className="text-xl font-semibold mb-4 text-green-800">Mobile</h4>
                <div className="space-y-3 text-sm text-green-700">
                  <div>
                    <strong>Resolution:</strong> 320px-767px
                  </div>
                  <div>
                    <strong>Layout:</strong> Single column
                  </div>
                  <div>
                    <strong>Navigation:</strong> Hamburger menu
                  </div>
                  <div>
                    <strong>Interactions:</strong> Thumb-friendly
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-green-600">Social Media Brand Guidelines</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Li</span>
                </div>
                <h4 className="font-semibold mb-3 text-blue-800">LinkedIn</h4>
                <div className="text-xs text-blue-700 space-y-2">
                  <div><strong>Profile:</strong> Professional tone</div>
                  <div><strong>Colors:</strong> Blue gradient</div>
                  <div><strong>Content:</strong> Industry insights</div>
                  <div><strong>Frequency:</strong> 3-5 posts/week</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-400 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <h4 className="font-semibold mb-3 text-blue-800">Twitter</h4>
                <div className="text-xs text-blue-700 space-y-2">
                  <div><strong>Handle:</strong> @backlinkoo</div>
                  <div><strong>Tone:</strong> Helpful, concise</div>
                  <div><strong>Content:</strong> SEO tips & updates</div>
                  <div><strong>Frequency:</strong> Daily posts</div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Y</span>
                </div>
                <h4 className="font-semibold mb-3 text-red-800">YouTube</h4>
                <div className="text-xs text-red-700 space-y-2">
                  <div><strong>Channel:</strong> SEO Academy</div>
                  <div><strong>Style:</strong> Educational</div>
                  <div><strong>Thumbnails:</strong> Brand colors</div>
                  <div><strong>Frequency:</strong> Weekly videos</div>
                </div>
              </div>
              
              <div className="bg-pink-50 border border-pink-200 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-pink-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <h4 className="font-semibold mb-3 text-pink-800">Instagram</h4>
                <div className="text-xs text-pink-700 space-y-2">
                  <div><strong>Style:</strong> Visual tips</div>
                  <div><strong>Colors:</strong> Brand gradients</div>
                  <div><strong>Content:</strong> Behind scenes</div>
                  <div><strong>Frequency:</strong> 3 posts/week</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-orange-600">Email Design Standards</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold mb-6 text-orange-800">Template Structure</h4>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">Backlink ∞</div>
                      <div className="text-sm opacity-80">Header Section</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-gray-800 font-semibold mb-2">Content Area</div>
                      <div className="text-sm text-gray-600">Main message content with proper spacing</div>
                    </div>
                    <div className="bg-blue-600 text-white p-3 rounded-lg text-center">
                      <div className="font-semibold">Call-to-Action Button</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <div className="text-xs text-gray-600">Footer with unsubscribe</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold mb-6 text-orange-800">Design Specifications</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">Layout Guidelines</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Maximum width: 600px</li>
                        <li>• Mobile responsive design</li>
                        <li>• Left-aligned text for readability</li>
                        <li>• Consistent 20px padding</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">Typography</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Headers: 24px, font-weight: 600</li>
                        <li>• Body text: 16px, line-height: 1.5</li>
                        <li>• Font family: Arial, sans-serif</li>
                        <li>• Color: #374151 for body text</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">Call-to-Action</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Blue gradient background</li>
                        <li>• White text, 16px, font-weight: 600</li>
                        <li>• 15px vertical, 25px horizontal padding</li>
                        <li>• 6px border radius</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="min-h-screen p-16">
        <h1 className="text-5xl font-bold mb-12 text-gray-900">20. Implementation Guide</h1>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-blue-600">Brand Implementation Roadmap</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
              <p className="text-xl text-gray-800 leading-relaxed mb-8">
                This comprehensive implementation guide ensures consistent brand application across all 
                touchpoints, from digital platforms to marketing materials. Follow this roadmap to 
                maintain brand integrity and maximize impact.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-purple-600">Phase 1: Foundation (Week 1-2)</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-purple-800">Brand Asset Audit</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Review all existing brand materials</li>
                  <li>• Identify inconsistencies and gaps</li>
                  <li>• Create asset inventory spreadsheet</li>
                  <li>• Prioritize critical updates needed</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-purple-800">Team Training</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Distribute brand guidelines to all teams</li>
                  <li>• Conduct brand training sessions</li>
                  <li>• Establish brand approval processes</li>
                  <li>• Create brand ambassador network</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-green-600">Phase 2: Digital Presence (Week 3-4)</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-green-800">Website Updates</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Update logo and brand elements</li>
                  <li>• Implement new color palette</li>
                  <li>• Refresh typography and spacing</li>
                  <li>• Optimize for accessibility compliance</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-green-800">Social Media Refresh</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Update profile images and headers</li>
                  <li>• Revise bio descriptions and links</li>
                  <li>• Create branded post templates</li>
                  <li>• Schedule content calendar rollout</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-orange-600">Phase 3: Marketing Materials (Week 5-6)</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-orange-800">Digital Marketing</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Update email templates and signatures</li>
                  <li>• Refresh digital ad creatives</li>
                  <li>• Create new presentation templates</li>
                  <li>• Update downloadable resources</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-orange-800">Print Materials</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Design new business cards</li>
                  <li>• Update letterhead and stationery</li>
                  <li>• Create branded merchandise designs</li>
                  <li>• Prepare trade show materials</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-red-600">Quality Control Checklist</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4 text-red-800">Visual Elements</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Logo used correctly with proper clear space
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Colors match official brand palette
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Typography follows hierarchy guidelines
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Images align with brand style
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4 text-red-800">Content & Messaging</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Tone matches brand personality
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Key messages are consistent
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Value proposition is clear
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" className="rounded" />
                      Call-to-actions are compelling
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">Resources & Support</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h4 className="text-xl font-semibold mb-4 text-blue-800">Brand Assets</h4>
                <p className="text-sm text-blue-700 mb-4">Download logos, templates, and design files</p>
                <div className="text-xs text-blue-600">brand@backlinkoo.com</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h4 className="text-xl font-semibold mb-4 text-purple-800">Brand Support</h4>
                <p className="text-sm text-purple-700 mb-4">Get help with brand implementation</p>
                <div className="text-xs text-purple-600">support@backlinkoo.com</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h4 className="text-xl font-semibold mb-4 text-green-800">Training Resources</h4>
                <p className="text-sm text-green-700 mb-4">Access brand training materials</p>
                <div className="text-xs text-green-600">training@backlinkoo.com</div>
              </div>
            </div>
          </div>

          <div className="text-center pt-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-xl">
              <h3 className="text-4xl font-bold mb-6">Backlink ∞</h3>
              <p className="text-2xl opacity-90 mb-8">
                Empowering unlimited SEO potential through exceptional brand experiences
              </p>
              <div className="grid grid-cols-3 gap-8 text-lg opacity-80">
                <div>Comprehensive Guidelines v2.0</div>
                <div>{new Date().getFullYear()} Edition</div>
                <div>backlinkoo.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            Comprehensive Brand Guidelines PDF (20+ Pages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Complete 20+ page brand guidelines covering our identity, services, SEO Academy, and everything about Backlink ∞.
            This extensive document includes detailed sections on brand strategy, visual identity, service offerings, 
            target audience analysis, implementation guides, and much more.
          </p>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            
            <Button 
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-screen overflow-y-auto border rounded-lg">
              <PreviewContent />
            </div>
          </CardContent>
        </Card>
      )}
      
      {!showPreview && (
        <div className="hidden">
          <PreviewContent />
        </div>
      )}
    </div>
  );
};

export default BrandGuidelinesPDF;