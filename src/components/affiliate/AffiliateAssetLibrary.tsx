import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import {
  Download,
  Copy,
  Image,
  Mail,
  Share2,
  Video,
  FileText,
  QrCode,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Eye,
  Edit,
  RefreshCw,
  Zap,
  Star,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  ExternalLink,
  Play,
  Megaphone
} from 'lucide-react';

interface AffiliateAssetLibraryProps {
  affiliateId: string;
  affiliateCode: string;
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  assets: Asset[];
}

interface Asset {
  id: string;
  name: string;
  type: 'banner' | 'button' | 'email' | 'social' | 'video' | 'landing_page' | 'qr_code';
  category: string;
  dimensions?: string;
  fileUrl: string;
  previewUrl?: string;
  description: string;
  downloadCount: number;
  isNew?: boolean;
  isPopular?: boolean;
  customizable?: boolean;
}

export const AffiliateAssetLibrary: React.FC<AffiliateAssetLibraryProps> = ({
  affiliateId,
  affiliateCode
}) => {
  const [assets, setAssets] = useState<AssetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('banners');
  const [searchTerm, setSearchTerm] = useState('');
  const [customText, setCustomText] = useState('');
  const [customColors, setCustomColors] = useState({
    primary: '#2563eb',
    secondary: '#f59e0b',
    text: '#1f2937'
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    // Mock data - in real implementation, this would come from an API
    const mockAssets: AssetCategory[] = [
      {
        id: 'banners',
        name: 'Display Banners',
        description: 'High-converting banner ads for websites and blogs',
        icon: Image,
        assets: [
          {
            id: 'banner_1',
            name: 'Leaderboard Banner - Blue',
            type: 'banner',
            category: 'banners',
            dimensions: '728x90',
            fileUrl: '/assets/banners/affiliate-banner-728x90.svg',
            previewUrl: '/assets/banners/affiliate-banner-728x90.svg',
            description: 'Professional leaderboard banner with affiliate messaging and high conversion rate',
            downloadCount: 1247,
            isPopular: true,
            customizable: true
          },
          {
            id: 'banner_2',
            name: 'Rectangle Banner - Gradient',
            type: 'banner',
            category: 'banners',
            dimensions: '300x250',
            fileUrl: '/api/assets/banner_300x250_gradient.png',
            previewUrl: '/api/assets/preview/banner_300x250_gradient.png',
            description: 'Eye-catching medium rectangle with gradient design',
            downloadCount: 892,
            customizable: true
          },
          {
            id: 'banner_3',
            name: 'Skyscraper Banner - Modern',
            type: 'banner',
            category: 'banners',
            dimensions: '160x600',
            fileUrl: '/api/assets/banner_160x600_modern.png',
            previewUrl: '/api/assets/preview/banner_160x600_modern.png',
            description: 'Vertical banner perfect for sidebar placement',
            downloadCount: 634,
            isNew: true,
            customizable: true
          }
        ]
      },
      {
        id: 'buttons',
        name: 'CTA Buttons',
        description: 'High-converting call-to-action buttons',
        icon: Target,
        assets: [
          {
            id: 'button_1',
            name: 'Primary CTA Button',
            type: 'button',
            category: 'buttons',
            dimensions: '200x50',
            fileUrl: '/api/assets/button_primary.png',
            previewUrl: '/api/assets/preview/button_primary.png',
            description: 'Primary action button with hover effects',
            downloadCount: 2156,
            isPopular: true,
            customizable: true
          },
          {
            id: 'button_2',
            name: 'Secondary CTA Button',
            type: 'button',
            category: 'buttons',
            dimensions: '200x50',
            fileUrl: '/api/assets/button_secondary.png',
            previewUrl: '/api/assets/preview/button_secondary.png',
            description: 'Secondary button style for alternative actions',
            downloadCount: 1843,
            customizable: true
          }
        ]
      },
      {
        id: 'email',
        name: 'Email Templates',
        description: 'Ready-to-use email templates for campaigns',
        icon: Mail,
        assets: [
          {
            id: 'email_1',
            name: 'Welcome Email Template',
            type: 'email',
            category: 'email',
            fileUrl: '/api/assets/email_welcome.html',
            description: 'Professional welcome email template',
            downloadCount: 567,
            customizable: true
          },
          {
            id: 'email_2',
            name: 'Newsletter Template',
            type: 'email',
            category: 'email',
            fileUrl: '/api/assets/email_newsletter.html',
            description: 'Monthly newsletter template with affiliate integration',
            downloadCount: 423,
            isNew: true,
            customizable: true
          }
        ]
      },
      {
        id: 'brand',
        name: 'Brand Assets',
        description: 'Official logos, brand guidelines, and identity assets',
        icon: Award,
        assets: [
          {
            id: 'brand_logo_primary',
            name: 'Primary Logo (SVG)',
            type: 'brand',
            category: 'brand',
            dimensions: '200x60',
            fileUrl: '/assets/logos/backlink-logo-primary.svg',
            previewUrl: '/assets/logos/backlink-logo-primary.svg',
            description: 'Primary brand logo with gradient colors - SVG format',
            downloadCount: 3456,
            isPopular: true,
            customizable: false
          },
          {
            id: 'brand_logo_white',
            name: 'White Logo (SVG)',
            type: 'brand',
            category: 'brand',
            dimensions: '200x60',
            fileUrl: '/assets/logos/backlink-logo-white.svg',
            previewUrl: '/assets/logos/backlink-logo-white.svg',
            description: 'White version for dark backgrounds - SVG format',
            downloadCount: 2987,
            isPopular: true,
            customizable: false
          },
          {
            id: 'brand_guidelines',
            name: 'Brand Guidelines PDF',
            type: 'brand',
            category: 'brand',
            fileUrl: '/brand-guidelines.pdf',
            description: 'Complete brand identity guidelines and usage instructions',
            downloadCount: 1234,
            customizable: false,
            isNew: true
          },
          {
            id: 'brand_colors',
            name: 'Brand Color Palette',
            type: 'brand',
            category: 'brand',
            fileUrl: '/assets/brand-kit/brand-colors.json',
            previewUrl: '/assets/brand-kit/brand-colors.json',
            description: 'Official brand colors with hex codes, RGB values, and usage guidelines',
            downloadCount: 987,
            customizable: false
          }
        ]
      },
      {
        id: 'social',
        name: 'Social Media',
        description: 'Social media posts and graphics',
        icon: Share2,
        assets: [
          {
            id: 'social_1',
            name: 'Instagram Post - Square',
            type: 'social',
            category: 'social',
            dimensions: '1080x1080',
            fileUrl: '/assets/social/instagram-post-1080x1080.svg',
            previewUrl: '/assets/social/instagram-post-1080x1080.svg',
            description: 'Instagram-optimized square post design with affiliate messaging',
            downloadCount: 1234,
            isPopular: true,
            customizable: true
          },
          {
            id: 'social_2',
            name: 'Facebook Cover',
            type: 'social',
            category: 'social',
            dimensions: '1200x630',
            fileUrl: '/api/assets/facebook_cover.png',
            previewUrl: '/api/assets/preview/facebook_cover.png',
            description: 'Facebook cover image with call-to-action',
            downloadCount: 789,
            customizable: true
          },
          {
            id: 'social_3',
            name: 'Twitter Header',
            type: 'social',
            category: 'social',
            dimensions: '1500x500',
            fileUrl: '/api/assets/twitter_header.png',
            previewUrl: '/api/assets/preview/twitter_header.png',
            description: 'Twitter header with branding elements',
            downloadCount: 456,
            isNew: true,
            customizable: true
          }
        ]
      },
      {
        id: 'video',
        name: 'Video Assets',
        description: 'Video content and animated graphics',
        icon: Video,
        assets: [
          {
            id: 'video_1',
            name: 'Product Demo Video',
            type: 'video',
            category: 'video',
            dimensions: '1920x1080',
            fileUrl: '/api/assets/product_demo.mp4',
            previewUrl: '/api/assets/preview/product_demo_thumb.jpg',
            description: '2-minute product demonstration video',
            downloadCount: 234,
            isPopular: true
          },
          {
            id: 'video_2',
            name: 'Animated Logo',
            type: 'video',
            category: 'video',
            dimensions: '512x512',
            fileUrl: '/api/assets/animated_logo.gif',
            previewUrl: '/api/assets/preview/animated_logo.gif',
            description: 'Animated logo for video intros',
            downloadCount: 345,
            isNew: true
          }
        ]
      }
    ];

    setAssets(mockAssets);
  };

  const generateAffiliateLink = (baseUrl: string) => {
    const url = new URL(baseUrl, 'https://backlinkoo.com');
    url.searchParams.set('ref', affiliateCode);
    return url.toString();
  };

  const downloadAsset = async (asset: Asset) => {
    try {
      // Generate affiliate-coded version
      const affiliateUrl = generateAffiliateLink(asset.fileUrl);
      
      // In real implementation, this would trigger a download with embedded affiliate tracking
      const link = document.createElement('a');
      link.href = affiliateUrl;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${asset.name} downloaded with your affiliate code!`);
      
      // Update download count
      setAssets(prev => prev.map(category => ({
        ...category,
        assets: category.assets.map(a => 
          a.id === asset.id ? { ...a, downloadCount: a.downloadCount + 1 } : a
        )
      })));
    } catch (error) {
      toast.error('Failed to download asset');
    }
  };

  const copyAssetCode = async (asset: Asset) => {
    try {
      const affiliateUrl = generateAffiliateLink(asset.fileUrl);
      const htmlCode = `<a href="${affiliateUrl}" target="_blank"><img src="${asset.fileUrl}" alt="${asset.name}" /></a>`;
      
      await navigator.clipboard.writeText(htmlCode);
      toast.success('HTML code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const generateCustomAsset = async () => {
    try {
      // In real implementation, this would call an API to generate custom assets
      toast.success('Custom asset generated with your branding!');
    } catch (error) {
      toast.error('Failed to generate custom asset');
    }
  };

  const filteredAssets = assets.find(cat => cat.id === selectedCategory)?.assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const currentCategory = assets.find(cat => cat.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Library</h1>
          <p className="text-gray-600 mt-1">Download and customize marketing materials for your campaigns</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={loadAssets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Request Custom Asset
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {assets.reduce((sum, cat) => 
                    sum + cat.assets.reduce((assetSum, asset) => assetSum + asset.downloadCount, 0), 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Image className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Assets</p>
                <p className="text-2xl font-bold">
                  {assets.reduce((sum, cat) => sum + cat.assets.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New This Week</p>
                <p className="text-2xl font-bold">
                  {assets.reduce((sum, cat) => 
                    sum + cat.assets.filter(asset => asset.isNew).length, 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Popular</p>
                <p className="text-xl font-bold">
                  {assets.reduce((sum, cat) => 
                    sum + cat.assets.filter(asset => asset.isPopular).length, 0
                  )} assets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {assets.map(category => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                      <Badge variant="secondary" className="ml-auto">
                        {category.assets.length}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom Asset Generator */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Custom Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Custom Text</label>
                <Input
                  placeholder="Your custom message..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColors.primary}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={customColors.primary}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button 
                onClick={generateCustomAsset}
                className="w-full"
                disabled={!customText.trim()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Asset
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Assets Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentCategory?.icon && <currentCategory.icon className="w-5 h-5" />}
                    {currentCategory?.name}
                  </CardTitle>
                  <CardDescription>{currentCategory?.description}</CardDescription>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assets found matching your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map(asset => (
                    <Card key={asset.id} className="group">
                      <div className="relative">
                        {/* Asset Preview */}
                        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                          {asset.previewUrl ? (
                            <img
                              src={asset.previewUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {asset.isNew && (
                            <Badge className="bg-blue-500 text-white">New</Badge>
                          )}
                          {asset.isPopular && (
                            <Badge className="bg-orange-500 text-white">Popular</Badge>
                          )}
                          {asset.customizable && (
                            <Badge variant="outline">Customizable</Badge>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button size="sm" variant="secondary">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                            {asset.dimensions && (
                              <p className="text-xs text-gray-500">{asset.dimensions}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{asset.downloadCount.toLocaleString()} downloads</span>
                            <span className="flex items-center gap-1">
                              {asset.type === 'video' && <Play className="w-3 h-3" />}
                              {asset.type === 'email' && <Mail className="w-3 h-3" />}
                              {asset.type === 'social' && <Share2 className="w-3 h-3" />}
                              {asset.type === 'banner' && <Image className="w-3 h-3" />}
                              {asset.type === 'button' && <Target className="w-3 h-3" />}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => downloadAsset(asset)}
                              className="flex-1"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyAssetCode(asset)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            {asset.customizable && (
                              <Button size="sm" variant="outline">
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Usage Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">✅ Allowed Usage</h4>
              <ul className="text-sm space-y-1 text-green-700">
                <li>• Use on your websites, blogs, and social media</li>
                <li>• Modify colors and text to match your brand</li>
                <li>• Include in email marketing campaigns</li>
                <li>• Share in relevant online communities</li>
                <li>• Use in paid advertising campaigns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-800 mb-2">❌ Prohibited Usage</h4>
              <ul className="text-sm space-y-1 text-red-700">
                <li>• Remove or modify affiliate tracking codes</li>
                <li>• Use assets to promote competing products</li>
                <li>• Claim ownership of the original designs</li>
                <li>• Use in misleading or deceptive content</li>
                <li>• Redistribute assets to other affiliates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateAssetLibrary;
