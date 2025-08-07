import React, { useState, useRef, useEffect } from 'react';
import { Download, Eye, FileText, Palette, Type, Layout, Target, BookOpen, Star, Shield, Globe, Infinity, Sparkles, Zap, TrendingUp, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const BrandGuidelinesPDF: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Import html2pdf dynamically
      const html2pdf = await import('html2pdf.js');
      
      const element = contentRef.current;
      if (!element) return;

      const opt = {
        margin: 0,
        filename: 'Backlink-Infinity-Brand-Guidelines.pdf',
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
    { name: 'Primary Blue', hex: '#2563eb', hsl: 'hsl(219, 95%, 44%)', usage: 'Primary actions, links, brand elements' },
    { name: 'Secondary Blue', hex: '#3b82f6', hsl: 'hsl(217, 91%, 60%)', usage: 'Secondary actions, hover states' },
    { name: 'Purple Accent', hex: '#8b5cf6', hsl: 'hsl(258, 90%, 66%)', usage: 'Premium features, highlights' },
    { name: 'Deep Purple', hex: '#7c3aed', hsl: 'hsl(258, 90%, 58%)', usage: 'Gradients, special emphasis' },
    { name: 'Success Green', hex: '#10b981', hsl: 'hsl(167, 85%, 39%)', usage: 'Success states, achievements' },
    { name: 'Warning Orange', hex: '#f59e0b', hsl: 'hsl(45, 93%, 47%)', usage: 'Alerts, notifications' },
    { name: 'Error Red', hex: '#ef4444', hsl: 'hsl(0, 85%, 60%)', usage: 'Errors, critical states' },
    { name: 'Neutral Gray', hex: '#6b7280', hsl: 'hsl(220, 9%, 46%)', usage: 'Text, subtle elements' }
  ];

  const gradients = [
    { name: 'Primary Gradient', css: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', usage: 'Hero sections, CTAs' },
    { name: 'Success Gradient', css: 'linear-gradient(135deg, #10b981, #059669)', usage: 'Success indicators' },
    { name: 'Premium Gradient', css: 'linear-gradient(135deg, #8b5cf6, #db2777)', usage: 'Premium features' },
    { name: 'Warm Gradient', css: 'linear-gradient(135deg, #f59e0b, #ea580c)', usage: 'Warm accents' }
  ];

  const services = [
    {
      category: 'Core Services',
      items: [
        { name: 'High-Quality Backlinks', description: 'Premium backlinks from DA 50+ websites' },
        { name: 'SEO Content Generation', description: 'AI-powered, contextual content creation' },
        { name: 'Link Building Campaigns', description: 'Strategic, white-hat link building' },
        { name: 'Domain Authority Boosting', description: 'Systematic authority improvement' }
      ]
    },
    {
      category: 'Premium Features',
      items: [
        { name: 'Unlimited Backlinks', description: 'No caps on backlink generation' },
        { name: 'SEO Academy Access', description: '50+ comprehensive SEO lessons' },
        { name: 'Advanced Analytics', description: 'Deep insights and performance tracking' },
        { name: 'Priority Support', description: '24/7 dedicated account management' }
      ]
    },
    {
      category: 'Technology Platform',
      items: [
        { name: 'AI Content Engine', description: 'GPT-4 powered content generation' },
        { name: 'Automated Workflows', description: 'Streamlined campaign management' },
        { name: 'Real-time Monitoring', description: 'Live performance tracking' },
        { name: 'Integration APIs', description: 'Seamless third-party connections' }
      ]
    }
  ];

  const academyModules = [
    { module: 'Keyword Research Mastery', lessons: 8, duration: '2 hours' },
    { module: 'On-Page SEO Excellence', lessons: 12, duration: '3 hours' },
    { module: 'Link Building Strategies', lessons: 15, duration: '4 hours' },
    { module: 'Technical SEO Deep Dive', lessons: 10, duration: '2.5 hours' },
    { module: 'Content Marketing Integration', lessons: 9, duration: '2 hours' },
    { module: 'Local SEO Optimization', lessons: 6, duration: '1.5 hours' },
    { module: 'E-commerce SEO', lessons: 7, duration: '2 hours' },
    { module: 'SEO Analytics & Reporting', lessons: 5, duration: '1 hour' }
  ];

  const PreviewContent = () => (
    <div ref={contentRef} className="bg-white text-black max-w-none" style={{ fontSize: '14px', lineHeight: '1.4' }}>
      {/* Cover Page */}
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-16 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="mb-8">
          <div className="text-8xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Backlink ∞
          </div>
          <div className="text-2xl font-light mb-8 opacity-90">
            COMPREHENSIVE BRAND GUIDELINES
          </div>
        </div>
        
        <div className="max-w-2xl mb-12">
          <p className="text-xl mb-6 opacity-80">
            The definitive guide to our brand identity, visual language, and communication standards
          </p>
          <div className="flex justify-center gap-8 text-sm opacity-70">
            <div>Version 1.0</div>
            <div>•</div>
            <div>{new Date().getFullYear()}</div>
            <div>•</div>
            <div>backlinkoo.com</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">Brand Identity</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Palette className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">Visual Language</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">SEO Academy</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Globe className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">Global Standards</div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-12 text-gray-900">Table of Contents</h1>
        
        <div className="space-y-6 text-lg">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>1. Brand Overview & Mission</span>
            <span>3</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>2. Logo Guidelines & Usage</span>
            <span>4</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>3. Color Palette & Guidelines</span>
            <span>6</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>4. Typography System</span>
            <span>8</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>5. Visual Elements & Patterns</span>
            <span>10</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>6. Service Offerings</span>
            <span>12</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>7. SEO Academy Curriculum</span>
            <span>15</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>8. Communication Guidelines</span>
            <span>18</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>9. Digital Applications</span>
            <span>20</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span>10. Brand Assets & Downloads</span>
            <span>22</span>
          </div>
        </div>
      </div>

      {/* Brand Overview */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">1. Brand Overview & Mission</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Backlink ∞ revolutionizes SEO and link building by providing unlimited, high-quality backlinks 
              that drive sustainable organic growth. We empower businesses, agencies, and SEO professionals 
              with the tools, knowledge, and resources needed to dominate search rankings and achieve 
              measurable results.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Brand Values</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Infinity className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="font-semibold">Unlimited Potential</h3>
                </div>
                <p className="text-gray-600">No caps, no limits – infinite possibilities for growth</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Shield className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="font-semibold">Quality Assurance</h3>
                </div>
                <p className="text-gray-600">Premium backlinks from DA 50+ websites only</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="font-semibold">Measurable Results</h3>
                </div>
                <p className="text-gray-600">Data-driven approach with transparent reporting</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Zap className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="font-semibold">Innovation</h3>
                </div>
                <p className="text-gray-600">AI-powered technology for next-gen SEO solutions</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Brand Personality</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Award className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold">Professional</h4>
                <p className="text-sm text-gray-600">Enterprise-grade solutions</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold">Innovative</h4>
                <p className="text-sm text-gray-600">Cutting-edge technology</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <h4 className="font-semibold">Trustworthy</h4>
                <p className="text-sm text-gray-600">Reliable and transparent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Guidelines */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">2. Logo Guidelines & Usage</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Primary Logo</h2>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                Backlink ∞
              </div>
              <p className="text-gray-600">Primary logo with infinity symbol</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Logo Variations</h3>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">Backlink ∞</div>
                  <p className="text-sm text-gray-500 mt-2">Horizontal Full Logo</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">Backlink ∞</div>
                  <p className="text-sm text-gray-400 mt-2">Reverse/Dark Background</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600">∞</div>
                  <p className="text-sm text-gray-500 mt-2">Symbol Only</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Usage Guidelines</h3>
              <div className="space-y-4 text-sm">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✓ DO</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>• Use on clean, uncluttered backgrounds</li>
                    <li>• Maintain minimum clear space</li>
                    <li>• Use approved color variations</li>
                    <li>• Scale proportionally</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">✗ DON'T</h4>
                  <ul className="space-y-1 text-red-700">
                    <li>• Stretch or distort the logo</li>
                    <li>• Use unauthorized colors</li>
                    <li>• Place on busy backgrounds</li>
                    <li>• Rotate or skew the logo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Clear Space Requirements</h3>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-center">
                <div className="inline-block border-2 border-dashed border-gray-300 p-8">
                  <div className="text-3xl font-bold text-blue-600">Backlink ∞</div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Minimum clear space equals the height of the infinity symbol (∞)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">3. Color Palette & Guidelines</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Primary Colors</h2>
            <div className="grid grid-cols-4 gap-4">
              {brandColors.map((color, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="h-24 w-full"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm">{color.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{color.hex}</p>
                    <p className="text-xs text-gray-500">{color.hsl}</p>
                    <p className="text-xs text-gray-600 mt-2">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Brand Gradients</h2>
            <div className="grid grid-cols-2 gap-6">
              {gradients.map((gradient, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="h-20 w-full"
                    style={{ background: gradient.css }}
                  ></div>
                  <div className="p-4">
                    <h4 className="font-semibold">{gradient.name}</h4>
                    <p className="text-xs text-gray-600 mt-2 font-mono">{gradient.css}</p>
                    <p className="text-sm text-gray-600 mt-2">{gradient.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Color Psychology & Usage</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Blue (#2563eb)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Trust and reliability</li>
                    <li>• Professional communication</li>
                    <li>• Primary brand elements</li>
                    <li>• Call-to-action buttons</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Purple (#8b5cf6)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Premium features</li>
                    <li>• Innovation and creativity</li>
                    <li>• Advanced functionality</li>
                    <li>• Luxury positioning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">4. Typography System</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Primary Typeface: Inter</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-black">Inter Black</div>
                  <p className="text-sm text-gray-600">Headings, hero text, brand statements</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">Inter Bold</div>
                  <p className="text-sm text-gray-600">Subheadings, section titles</p>
                </div>
                <div>
                  <div className="text-xl font-semibold">Inter Semibold</div>
                  <p className="text-sm text-gray-600">Button text, labels, emphasis</p>
                </div>
                <div>
                  <div className="text-lg font-medium">Inter Medium</div>
                  <p className="text-sm text-gray-600">Navigation, card titles</p>
                </div>
                <div>
                  <div className="text-base font-normal">Inter Regular</div>
                  <p className="text-sm text-gray-600">Body text, descriptions, content</p>
                </div>
                <div>
                  <div className="text-sm font-light">Inter Light</div>
                  <p className="text-sm text-gray-600">Captions, meta information</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Typography Hierarchy</h2>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">H1 - Hero Heading</h1>
                <p className="text-sm text-gray-600">48px / 3rem, Bold, Line height: 1.1</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">H2 - Section Heading</h2>
                <p className="text-sm text-gray-600">32px / 2rem, Semibold, Line height: 1.2</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="text-xl font-medium text-gray-900 mb-2">H3 - Subsection Heading</h3>
                <p className="text-sm text-gray-600">20px / 1.25rem, Medium, Line height: 1.3</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <p className="text-base text-gray-700 mb-2">Body Text - Regular content and descriptions</p>
                <p className="text-sm text-gray-600">16px / 1rem, Regular, Line height: 1.5</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Small Text - Captions and meta information</p>
                <p className="text-xs text-gray-500">14px / 0.875rem, Regular, Line height: 1.4</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Code & Monospace: Roboto Mono</h2>
            <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono">
              <div className="space-y-2">
                <div>backlink_infinity.init_content_engine()</div>
                <div>backlink_infinity.generate_backlinks(count=unlimited)</div>
                <div>backlink_infinity.boost_domain_authority(target_da=70)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Offerings */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">6. Service Offerings</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Comprehensive SEO Solutions</h2>
            <p className="text-lg text-gray-700 mb-8">
              Backlink ∞ provides a complete ecosystem of SEO tools and services designed to drive 
              sustainable organic growth for businesses of all sizes.
            </p>
          </div>

          {services.map((category, index) => (
            <div key={index} className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-purple-600">{category.category}</h3>
              <div className="grid grid-cols-2 gap-4">
                {category.items.map((service, serviceIndex) => (
                  <div key={serviceIndex} className="bg-white border border-gray-200 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{service.name}</h4>
                    <p className="text-gray-600 text-sm">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Key Differentiators</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg text-center">
                <Infinity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Unlimited Backlinks</h4>
                <p className="text-sm text-gray-600">No caps, no limits on backlink generation</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg text-center">
                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">DA 50+ Quality</h4>
                <p className="text-sm text-gray-600">Premium backlinks from high-authority domains</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg text-center">
                <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">AI-Powered</h4>
                <p className="text-sm text-gray-600">GPT-4 content generation and optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Academy */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">7. SEO Academy Curriculum</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Comprehensive SEO Education</h2>
            <p className="text-lg text-gray-700 mb-8">
              Our SEO Academy provides over 50 lessons covering every aspect of search engine optimization, 
              from fundamentals to advanced strategies used by industry experts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {academyModules.map((module, index) => (
              <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{module.module}</h3>
                  <Badge variant="secondary">{module.lessons} lessons</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{module.lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{module.duration}</span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (module.lessons / 15) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Learning Outcomes</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Technical Skills</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Advanced keyword research techniques</li>
                    <li>• Technical SEO audit and optimization</li>
                    <li>• Link building strategy development</li>
                    <li>• Content optimization for search engines</li>
                    <li>• Local SEO implementation</li>
                    <li>• E-commerce SEO best practices</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Strategic Knowledge</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• SEO strategy planning and execution</li>
                    <li>• Competitive analysis and benchmarking</li>
                    <li>• Performance tracking and reporting</li>
                    <li>• Algorithm update adaptation</li>
                    <li>• ROI measurement and optimization</li>
                    <li>• Team management and workflows</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Certification Program</h2>
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Award className="h-8 w-8 text-yellow-600 mr-3" />
                <h3 className="text-xl font-semibold">Backlink ∞ SEO Specialist Certification</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Upon completion of all academy modules, students receive an official certification 
                recognizing their expertise in modern SEO practices and link building strategies.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-600">72+ Hours</div>
                  <div className="text-sm text-gray-600">Total Content</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="font-semibold text-purple-600">50+ Lessons</div>
                  <div className="text-sm text-gray-600">Comprehensive Modules</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold text-green-600">Lifetime Access</div>
                  <div className="text-sm text-gray-600">Ongoing Updates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Applications */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">9. Digital Applications</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Website & Platform Design</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Design Principles</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Clean, minimalist interface design</li>
                  <li>• Gradient backgrounds for visual appeal</li>
                  <li>• Glass morphism effects for depth</li>
                  <li>• Consistent spacing and alignment</li>
                  <li>• Mobile-first responsive design</li>
                  <li>• Accessibility compliance (WCAG 2.1)</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Interactive Elements</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Hover states with smooth transitions</li>
                  <li>• Loading animations and micro-interactions</li>
                  <li>• Button styles with gradient backgrounds</li>
                  <li>• Form validation with clear feedback</li>
                  <li>• Progress indicators for multi-step processes</li>
                  <li>• Toast notifications for user actions</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Social Media Guidelines</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold mb-2">LinkedIn</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Profile: Professional tone</div>
                  <div>Colors: Blue gradient</div>
                  <div>Content: Industry insights</div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold mb-2">Twitter</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Profile: @backlinkoo</div>
                  <div>Colors: Brand gradient</div>
                  <div>Content: SEO tips & updates</div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold mb-2">YouTube</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Channel: SEO Academy</div>
                  <div>Thumbnails: Brand colors</div>
                  <div>Content: Educational videos</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Email Design Standards</h2>
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Header Design</h4>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg text-center mb-4">
                    <div className="text-xl font-bold">Backlink ∞</div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Brand gradient background</li>
                    <li>• White logo and text</li>
                    <li>• 600px max width</li>
                    <li>• Mobile responsive</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Content Guidelines</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• From: "Backlink ∞ &lt;noreply@backlinkoo.com&gt;"</li>
                    <li>• Subject: Clear, action-oriented</li>
                    <li>• Body: Professional, scannable format</li>
                    <li>• CTA: Blue gradient buttons</li>
                    <li>• Footer: Unsubscribe and contact info</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Assets */}
      <div className="min-h-screen p-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">10. Brand Assets & Downloads</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Available Formats</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold">SVG</h4>
                <p className="text-xs text-gray-600">Scalable vector graphics</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold">PNG</h4>
                <p className="text-xs text-gray-600">High-resolution raster</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold">PDF</h4>
                <p className="text-xs text-gray-600">Print-ready documents</p>
              </div>
              
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h4 className="font-semibold">EPS</h4>
                <p className="text-xs text-gray-600">Professional vector</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Contact Information</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Brand Guidelines</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>For questions about brand usage:</div>
                    <div>Email: brand@backlinkoo.com</div>
                    <div>Website: backlinkoo.com/brand</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Asset Requests</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>For custom assets or formats:</div>
                    <div>Email: assets@backlinkoo.com</div>
                    <div>Response time: 24-48 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Backlink ∞</h3>
              <p className="text-lg opacity-90 mb-6">
                Empowering businesses with unlimited SEO potential
              </p>
              <div className="text-sm opacity-75">
                Brand Guidelines v1.0 • {new Date().getFullYear()} • backlinkoo.com
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
            Comprehensive Brand Guidelines PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Complete brand guidelines covering our identity, services, SEO Academy, and everything about Backlink ∞.
            This extensive document includes logo usage, color palettes, typography, service descriptions, and more.
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
