import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Palette, Type, Layout, Image, Eye, Star } from 'lucide-react';

const BrandGuidelinesPDF = () => {
  const downloadBrandGuide = () => {
    // In a real implementation, this would trigger a PDF download
    console.log('Downloading Brand Guidelines PDF...');
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800 via-gray-900 to-zinc-900 p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(147,51,234,0.3)_0%,transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            {/* Premium Logo */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black text-white">∞</span>
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Backlink ∞ Brand Guidelines
              </h2>
              <p className="text-xl text-gray-300 mb-4 font-medium">
                Complete Enterprise Brand Identity System
              </p>
              <div className="flex gap-3 flex-wrap">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400">Premium Edition</Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400">120+ Pages</Badge>
                <Badge className="bg-green-500/20 text-green-300 border-green-400">Print Ready</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400">Vector Assets</Badge>
              </div>
            </div>
            
            {/* File Icon */}
            <div className="text-right">
              <div className="text-6xl font-black text-red-400 mb-2">PDF</div>
              <div className="text-sm text-gray-400 font-medium">24.5 MB</div>
              <div className="flex items-center gap-1 text-yellow-400 text-sm mt-1">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Palette className="h-6 w-6 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-white">Color System</div>
              <div className="text-xs text-gray-300">Complete palette</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Type className="h-6 w-6 text-purple-400 mb-2" />
              <div className="text-sm font-semibold text-white">Typography</div>
              <div className="text-xs text-gray-300">Font hierarchy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Layout className="h-6 w-6 text-green-400 mb-2" />
              <div className="text-sm font-semibold text-white">Grid System</div>
              <div className="text-xs text-gray-300">Layout guides</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Image className="h-6 w-6 text-yellow-400 mb-2" />
              <div className="text-sm font-semibold text-white">Logo Library</div>
              <div className="text-xs text-gray-300">All variations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Breakdown */}
      <div className="p-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">📋 What's Included</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Design Foundation */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Palette className="h-4 w-4 text-blue-600" />
              </div>
              Design Foundation
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Brand story & positioning
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Color psychology & theory
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Primary & secondary palettes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Accessibility compliance
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Print & digital variations
              </li>
            </ul>
          </div>

          {/* Visual Identity */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Image className="h-4 w-4 text-purple-600" />
              </div>
              Visual Identity
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Logo construction & geometry
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Clear space requirements
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Size specifications
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Do's and don'ts examples
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Icon library (100+ icons)
              </li>
            </ul>
          </div>

          {/* Applications */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Layout className="h-4 w-4 text-green-600" />
              </div>
              Applications
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Business card templates
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Letterhead & stationery
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Digital presentation templates
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Social media guidelines
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Website style guide
              </li>
            </ul>
          </div>
        </div>

        {/* File Formats & Specifications */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-lg text-gray-900 mb-4">📁 File Formats & Assets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">PDF</div>
                <div className="text-xs text-gray-600">Brand Guidelines</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">SVG</div>
                <div className="text-xs text-gray-600">Vector Logos</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">PNG</div>
                <div className="text-xs text-gray-600">Raster Graphics</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">EPS</div>
                <div className="text-xs text-gray-600">Print Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Psychology & Strategy */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-lg text-purple-900 mb-4">🧠 Built-in Sales Psychology</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-purple-800 mb-2">Visual Psychology</h5>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Color psychology for trust & authority</li>
                <li>• Typography hierarchy for readability</li>
                <li>• Visual flow optimization</li>
                <li>• Emotional response mapping</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-purple-800 mb-2">Brand Strategy</h5>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Premium positioning guidelines</li>
                <li>• Trust signal integration</li>
                <li>• Conversion-focused layouts</li>
                <li>• Industry authority establishment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={downloadBrandGuide}
            className="flex-1 bg-gradient-to-r from-slate-800 to-gray-900 hover:from-slate-900 hover:to-black text-white font-bold text-lg py-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Download className="h-6 w-6 mr-3" />
            Download Complete Brand Package
          </Button>
          <Button 
            variant="outline" 
            className="px-6 py-6 border-2 hover:bg-gray-50"
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Professional brand guidelines created by expert designers • Last updated: December 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandGuidelinesPDF;
