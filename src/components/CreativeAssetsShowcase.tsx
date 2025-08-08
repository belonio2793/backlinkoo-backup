import React, { useState } from 'react';
import { Monitor, Share2, FileText, Download, Eye, Sparkles, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateAsset } from '@/utils/assetGenerator';

interface AssetCardProps {
  asset: {
    name: string;
    size: string;
    format: string;
    description: string;
    preview: React.ReactNode;
    category: string;
  };
  onDownload: (name: string) => void;
  onPreview: (name: string) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onDownload, onPreview }) => {
  const handleDownload = async () => {
    try {
      // Generate high-quality asset using the advanced generator
      const dataUrl = await generateAsset(asset.name);

      const link = document.createElement('a');
      link.download = `${asset.name.toLowerCase().replace(/\s+/g, '-')}-${asset.size}.${asset.format.toLowerCase()}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also call the original callback
      onDownload(asset.name, dataUrl, asset.format);
    } catch (error) {
      console.error('Error generating asset:', error);
      // Fallback to a simple notification
      alert('Asset download will be available soon. Please try again.');
    }
  };

  const handlePreview = () => {
    onPreview(asset.name, '');
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/25 transition-all duration-700 hover:scale-[1.02] group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h5 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{asset.name}</h5>
          <p className="text-purple-200 text-base font-medium">{asset.size} • {asset.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm px-4 py-1.5">
            {asset.format}
          </Badge>
          <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-inner backdrop-blur-sm">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-2 cursor-pointer hover:scale-105 transition-transform duration-300" onClick={handlePreview}>
          {asset.preview}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Eye className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white font-bold text-lg py-3 shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
          onClick={handleDownload}
        >
          <Download className="h-5 w-5 mr-3" />
          Download 4K
        </Button>
        <Button
          variant="outline"
          className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white font-bold px-6 py-3 transition-all duration-300"
          onClick={handlePreview}
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

const CreativeAssetsShowcase: React.FC<{
  onDownload: (name: string, preview: string, format: string) => void;
  onPreview: (name: string, preview: string) => void;
}> = ({ onDownload, onPreview }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPreviewAsset, setCurrentPreviewAsset] = useState<{
    name: string;
    size: string;
    format: string;
    description: string;
    dataUrl?: string;
  } | null>(null);

  const handleDownload = (name: string, preview: string, format: string) => {
    onDownload(name, preview, format);
  };

  const handlePreview = async (name: string, preview: string) => {
    try {
      // Find the asset details
      const asset = [...displayBanners, ...socialAssets, ...brandAssets].find(a => a.name === name);
      if (asset) {
        // Generate high-quality asset for preview
        const dataUrl = await generateAsset(asset.name);

        setCurrentPreviewAsset({
          name: asset.name,
          size: asset.size,
          format: asset.format,
          description: asset.description,
          dataUrl: dataUrl
        });
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }

    // Also call the original callback
    onPreview(name, preview);
  };
  
  const displayBanners = [
    {
      name: 'Leaderboard Banner',
      size: '728x90',
      format: 'PNG',
      description: 'High-conversion display ad',
      category: 'display',
      preview: (
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl overflow-hidden h-24 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer transform -skew-x-12"></div>
          <div className="relative h-full flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-2xl font-black text-gray-900">∞</span>
              </div>
              <div>
                <div className="text-white font-black text-3xl drop-shadow-xl">Backlink ∞</div>
                <div className="text-blue-100 text-lg font-bold">Revolutionary AI Link Building</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-yellow-300 font-black text-xl animate-bounce">🚀 500% ROI Guaranteed</div>
              <div className="text-white text-lg font-bold">High-DA Links • AI Powered • 24h Results</div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-full font-black text-lg hover:from-yellow-300 hover:to-orange-400 transition-all cursor-pointer shadow-2xl transform hover:scale-105">
              START FREE TRIAL →
            </div>
          </div>
          
          <div className="absolute top-3 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
          <div className="absolute top-5 right-1/3 w-3 h-3 bg-purple-300 rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-4 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-ping delay-700"></div>
        </div>
      )
    },
    {
      name: 'Rectangle Banner',
      size: '300x250',
      format: 'PNG', 
      description: 'Premium display creative',
      category: 'display',
      preview: (
        <div className="relative bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 rounded-xl overflow-hidden aspect-[6/5] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-transparent to-transparent"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
              <span className="text-4xl font-black text-gray-900">∞</span>
            </div>
            <h3 className="text-white font-black text-4xl mb-3 drop-shadow-xl">Backlink ∞</h3>
            <p className="text-purple-100 text-xl mb-6 font-bold">The Ultimate AI-Powered<br/>Link Building Platform</p>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full font-black text-lg mb-6 animate-bounce shadow-xl">
              ⚡ 1000x Faster Than Manual
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-10 py-4 rounded-full font-black text-xl shadow-2xl transform hover:scale-105 transition-all cursor-pointer">
              GET INSTANT ACCESS
            </div>
          </div>
          
          <div className="absolute top-4 right-4 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 rounded-full animate-ping delay-500"></div>
        </div>
      )
    },
    {
      name: 'Skyscraper Banner',
      size: '160x600',
      format: 'PNG',
      description: 'Vertical premium ad',
      category: 'display',
      preview: (
        <div className="relative bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 rounded-xl overflow-hidden mx-auto shadow-2xl" style={{ width: '200px', height: '500px' }}>
          <div className="absolute top-3 left-3 right-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
          
          <div className="relative h-full flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mt-8 mb-4 shadow-2xl">
              <span className="text-2xl font-black text-gray-900">∞</span>
            </div>
            <h3 className="text-white font-black text-2xl mb-3 drop-shadow-lg">Backlink ∞</h3>
            <p className="text-purple-100 text-base mb-6 leading-tight font-semibold">AI-Powered<br/>Link Building<br/>Revolution</p>
            
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="bg-white/15 backdrop-blur rounded-xl p-3 border border-white/25 shadow-lg">
                <div className="text-yellow-300 text-sm font-black">🎯 High-DA</div>
                <div className="text-white text-sm font-bold">Backlinks</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-3 border border-white/25 shadow-lg">
                <div className="text-green-300 text-sm font-black">⚡ AI Outreach</div>
                <div className="text-white text-sm font-bold">Automation</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-3 border border-white/25 shadow-lg">
                <div className="text-blue-300 text-sm font-black">📊 Real-time</div>
                <div className="text-white text-sm font-bold">Analytics</div>
              </div>
            </div>
            
            <div className="text-yellow-300 font-black text-lg mb-2 animate-pulse">⚡ 500% ROI</div>
            <div className="text-white text-sm mb-4 font-semibold">Guaranteed Results</div>
            
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-full font-black text-lg mb-4 shadow-xl transform hover:scale-105 transition-all cursor-pointer">
              TRY FREE
            </div>
            
            <div className="text-white text-sm font-bold">Start Today &<br/>Dominate SERPs</div>
          </div>
        </div>
      )
    },
    {
      name: 'Mobile Banner',
      size: '320x50', 
      format: 'PNG',
      description: 'Mobile-optimized ad',
      category: 'display',
      preview: (
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl overflow-hidden h-16 shadow-2xl">
          <div className="relative h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-lg font-black text-gray-900">∞</span>
              </div>
              <div>
                <div className="text-white font-black text-lg drop-shadow-lg">Backlink ∞</div>
                <div className="text-blue-100 text-sm font-bold">AI Link Building</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-yellow-300 font-black text-sm animate-pulse">⚡ 500% Faster</div>
              <div className="text-white text-sm font-bold">Try Free Today</div>
            </div>
            
            <div className="text-white text-2xl font-black transform hover:scale-110 transition-all cursor-pointer">→</div>
          </div>
        </div>
      )
    }
  ];

  const socialAssets = [
    {
      name: 'Instagram Post',
      size: '1080x1080',
      format: 'PNG',
      description: 'Premium Instagram creative',
      category: 'social',
      preview: (
        <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-2xl overflow-hidden aspect-square shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-yellow-400 shadow-2xl">
              <span className="text-3xl font-black text-purple-600">∞</span>
            </div>
            <h3 className="text-white font-black text-3xl mb-3 drop-shadow-xl">Backlink ∞</h3>
            <p className="text-purple-100 text-xl mb-6 font-bold">I just increased my<br/>organic traffic by<br/><span className="text-yellow-300 font-black text-3xl animate-pulse">300%!</span></p>
            <div className="space-y-3 mb-6">
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">✨ Automated Outreach</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">📈 High-DA Links Only</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">🚀 Instant Results</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-black text-xl shadow-2xl">
              Link in Bio
            </div>
            <div className="text-yellow-300 text-lg font-bold mt-4">#SEO #LinkBuilding #Growth</div>
          </div>
        </div>
      )
    },
    {
      name: 'Instagram Story',
      size: '1080x1920',
      format: 'PNG', 
      description: 'Engaging story template',
      category: 'social',
      preview: (
        <div className="relative bg-gradient-to-b from-pink-500 via-purple-600 to-indigo-600 rounded-3xl overflow-hidden mx-auto shadow-2xl" style={{ width: '220px', height: '400px' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-gradient-shift"></div>
          <div className="relative h-full flex flex-col items-center text-center p-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 mt-12 border-4 border-yellow-400 shadow-2xl">
              <span className="text-2xl font-black text-purple-600">∞</span>
            </div>
            <h3 className="text-white font-black text-3xl mb-3 drop-shadow-xl">Backlink ∞</h3>
            <p className="text-purple-100 text-xl mb-8 font-bold">Secret to my<br/>SEO success?<br/><span className="text-yellow-300 font-black text-2xl">AI automation!</span></p>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">✨ 500+ Backlinks</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">📊 DA 70+ Sites</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 border border-white/30">
                <div className="text-white text-lg font-black">⚡ 24h Delivery</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-black text-xl shadow-2xl mt-8">
              Swipe Up to Try
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Facebook Post',
      size: '1200x630',
      format: 'PNG',
      description: 'High-conversion Facebook ad',
      category: 'social',
      preview: (
        <div className="relative bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-2xl overflow-hidden aspect-[1200/630] shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-20 h-20 bg-yellow-400 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-6 right-6 w-16 h-16 bg-pink-400 rounded-full blur-lg animate-ping"></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-cyan-400 rounded-full blur-md animate-bounce"></div>
          </div>

          {/* Main content */}
          <div className="relative h-full flex items-center p-10">
            <div className="flex-1 pr-8">
              {/* Success story header */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-400/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-green-300 font-bold text-lg">SUCCESS STORY</span>
                </div>
                <p className="text-white text-xl font-bold">"I went from 0 to 50,000 monthly organic visitors in 90 days!"</p>
              </div>

              {/* Main headline */}
              <h3 className="text-white font-black text-5xl mb-4 drop-shadow-xl leading-tight">
                Backlink <span className="text-yellow-400">∞</span>
              </h3>
              <p className="text-blue-100 text-2xl mb-6 font-bold leading-relaxed">
                The AI That Builds High-DA Backlinks<br/>
                <span className="text-yellow-300">While You Sleep</span>
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-yellow-400 text-2xl font-black">500+</div>
                  <div className="text-cyan-300 text-sm font-bold">Backlinks/Month</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 text-2xl font-black">DA 70+</div>
                  <div className="text-cyan-300 text-sm font-bold">High Authority</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 text-2xl font-black">24h</div>
                  <div className="text-cyan-300 text-sm font-bold">First Results</div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-10 py-5 rounded-2xl font-black text-2xl shadow-2xl inline-block transform hover:scale-105 transition-all cursor-pointer">
                🚀 Start Free Trial - Get 100 Backlinks
              </div>
            </div>

            {/* Right side visual */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse mb-6 relative">
                <span className="text-6xl font-black text-gray-900">∞</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-black">AI</span>
                </div>
              </div>

              {/* Growth arrow */}
              <div className="flex flex-col items-center">
                <div className="text-green-400 text-4xl font-black animate-bounce">↗</div>
                <div className="text-green-300 text-lg font-bold">+500% Growth</div>
              </div>
            </div>
          </div>

          {/* Bottom social proof */}
          <div className="absolute bottom-4 left-10 right-10 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-bold">🔥 2,847 businesses grew 300%+ this month</span>
              <span className="text-yellow-300 font-bold">Limited Time: 50% OFF</span>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Twitter Header',
      size: '1500x500',
      format: 'PNG',
      description: 'Professional Twitter banner',
      category: 'social',
      preview: (
        <div className="relative bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 rounded-2xl overflow-hidden aspect-[3/1] shadow-2xl">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>

          {/* Floating elements */}
          <div className="absolute top-8 right-20 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-12 left-32 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-16 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>

          {/* Main content */}
          <div className="relative h-full flex items-center justify-between p-12">
            {/* Left side */}
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-4xl font-black text-gray-900">∞</span>
              </div>

              <div>
                <h3 className="text-white font-black text-4xl mb-2 drop-shadow-xl">
                  Backlink <span className="text-yellow-400">∞</span> Affiliate
                </h3>
                <p className="text-blue-200 text-xl font-bold mb-3">
                  AI-Powered Link Building • Earn Premium Commissions
                </p>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    💰 Up to 35% Commission
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    🚀 $10K+ Monthly Potential
                  </div>
                </div>
              </div>
            </div>

            {/* Right side metrics */}
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="text-center mb-4">
                  <div className="text-yellow-400 text-3xl font-black">JOIN THE</div>
                  <div className="text-white text-2xl font-bold">SUCCESS NETWORK</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-cyan-400 text-2xl font-black">5,847</div>
                    <div className="text-white text-xs font-bold">Active Affiliates</div>
                  </div>
                  <div>
                    <div className="text-green-400 text-2xl font-black">$2.3M</div>
                    <div className="text-white text-xs font-bold">Paid Out</div>
                  </div>
                  <div>
                    <div className="text-pink-400 text-2xl font-black">89%</div>
                    <div className="text-white text-xs font-bold">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-orange-400 text-2xl font-black">24h</div>
                    <div className="text-white text-xs font-bold">Fast Approval</div>
                  </div>
                </div>

                <div className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-full font-black text-lg text-center shadow-xl">
                  START EARNING TODAY
                </div>
              </div>
            </div>
          </div>

          {/* Top notification bar */}
          <div className="absolute top-4 left-12 right-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-2 border border-green-400/30">
            <div className="text-center">
              <span className="text-green-300 font-bold text-sm">🔥 TRENDING: New affiliate earned $15,247 in their first month!</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const brandAssets = [
    {
      name: 'Premium Logo Suite',
      size: '1024x1024',
      format: 'PNG',
      description: 'High-end primary brand logo',
      category: 'brand',
      preview: (
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-2xl overflow-hidden aspect-square shadow-2xl">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-500/10"></div>
          <div className="absolute top-8 right-8 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-12 left-12 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>

          {/* Main logo container */}
          <div className="relative h-full flex flex-col items-center justify-center p-8">
            {/* Premium logo circle with multiple gradients */}
            <div className="relative mb-6">
              <div className="w-48 h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-2 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full"></div>
                <div className="relative z-10">
                  <span className="text-7xl font-black text-gray-900 drop-shadow-lg">∞</span>
                </div>
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 blur-xl opacity-30 scale-110"></div>
            </div>

            {/* Brand name with premium styling */}
            <div className="text-center">
              <h3 className="text-white font-black text-5xl drop-shadow-2xl mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Backlink ∞
              </h3>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 w-32 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Professional Wordmark',
      size: '1920x1080',
      format: 'PNG',
      description: 'Corporate logo with professional tagline',
      category: 'brand',
      preview: (
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl overflow-hidden aspect-video shadow-2xl">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }}></div>

          {/* Main content */}
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center">
              {/* Logo and brand name combination */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl relative">
                  <span className="text-4xl font-black text-gray-900">∞</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 blur-lg opacity-30 scale-125"></div>
                </div>
                <div>
                  <h3 className="text-white font-black text-6xl drop-shadow-2xl bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                    Backlink ∞
                  </h3>
                  <div className="bg-gradient-to-r from-transparent via-yellow-400 to-transparent h-1 w-full mt-2"></div>
                </div>
              </div>

              {/* Professional tagline */}
              <p className="text-gray-300 text-3xl font-bold mb-4">
                Enterprise AI Link Building Platform
              </p>
              <p className="text-blue-300 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Trusted by 10,000+ SEO professionals worldwide for automated, high-authority backlink acquisition
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Icon Only',
      size: '512x512',
      format: 'PNG',
      description: 'Standalone icon version',
      category: 'brand',
      preview: (
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden aspect-square shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-pulse"></div>
          <div className="relative w-40 h-40 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
            <span className="text-6xl font-black text-white drop-shadow-xl">��</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-2xl"></div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-16">
      {/* DISPLAY BANNERS SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-10 border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10"></div>
        <div className="relative">
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white mb-2">Enterprise Display Banners</h4>
              <p className="text-purple-200 text-xl">Masterfully crafted advertising banners with psychological sales triggers</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
              <Crown className="h-6 w-6 text-purple-400" />
              <Sparkles className="h-6 w-6 text-pink-400 animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {displayBanners.map((asset) => (
              <AssetCard
                key={asset.name}
                asset={asset}
                onDownload={handleDownload}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SOCIAL MEDIA SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900 rounded-3xl p-10 border border-pink-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-transparent to-purple-500/10"></div>
        <div className="relative">
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl shadow-xl">
              <Share2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white mb-2">Social Media Graphics</h4>
              <p className="text-pink-200 text-xl">Viral-ready social content with proven engagement psychology</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
              <Crown className="h-6 w-6 text-pink-400" />
              <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {socialAssets.map((asset) => (
              <AssetCard
                key={asset.name}
                asset={asset}
                onDownload={handleDownload}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* BRAND ASSETS SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10"></div>
        <div className="relative">
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white mb-2">Brand Assets</h4>
              <p className="text-blue-200 text-xl">Professional brand elements for consistent marketing</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
              <Crown className="h-6 w-6 text-blue-400" />
              <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {brandAssets.map((asset) => (
              <AssetCard
                key={asset.name}
                asset={asset}
                onDownload={handleDownload}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Asset Preview Modal */}
      {showPreviewModal && currentPreviewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold">{currentPreviewAsset.name}</h2>
                <p className="text-sm text-gray-600">
                  {currentPreviewAsset.size} • {currentPreviewAsset.format} • {currentPreviewAsset.description}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-120px)] p-6">
              <div className="flex flex-col items-center space-y-4">
                {currentPreviewAsset.dataUrl && (
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-xl shadow-inner max-w-full">
                    <img
                      src={currentPreviewAsset.dataUrl}
                      alt={currentPreviewAsset.name}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '60vh' }}
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (currentPreviewAsset.dataUrl) {
                        const link = document.createElement('a');
                        link.download = `${currentPreviewAsset.name.toLowerCase().replace(/\s+/g, '-')}-${currentPreviewAsset.size}.${currentPreviewAsset.format.toLowerCase()}`;
                        link.href = currentPreviewAsset.dataUrl;
                        link.click();
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download High-Quality Asset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreativeAssetsShowcase;
