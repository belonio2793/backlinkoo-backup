import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Play, Pause, Download, Share2, Video, Palette, Type, Music,
  Sparkles, Zap, Target, BarChart3, Eye, Clock, Volume2,
  Image as ImageIcon, Film, Settings, Wand2, Twitter,
  Smartphone, Monitor, Tablet, Upload, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ToolsHeader from '@/components/shared/ToolsHeader';

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  aspectRatio: string;
  category: string;
  preview: string;
  features: string[];
}

interface AdConfig {
  headline: string;
  description: string;
  callToAction: string;
  targetUrl: string;
  brandName: string;
  brandColor: string;
  template: string;
  duration: number;
  aspectRatio: string;
  voiceOver: boolean;
  backgroundMusic: boolean;
  animations: string;
  textStyle: string;
}

export default function TwitterAdGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('templates');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  const [adConfig, setAdConfig] = useState<AdConfig>({
    headline: '',
    description: '',
    callToAction: 'Learn More',
    targetUrl: '',
    brandName: '',
    brandColor: '#1DA1F2',
    template: '',
    duration: 15,
    aspectRatio: '9:16',
    voiceOver: false,
    backgroundMusic: true,
    animations: 'smooth',
    textStyle: 'modern'
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Video templates
  const videoTemplates: VideoTemplate[] = [
    {
      id: 'tech-launch',
      name: 'Tech Product Launch',
      description: 'Dynamic animated template perfect for showcasing new tech products',
      duration: 15,
      aspectRatio: '9:16',
      category: 'Product',
      preview: '/placeholder.svg',
      features: ['Smooth animations', 'Tech-focused design', 'Call-to-action overlay']
    },
    {
      id: 'service-promo',
      name: 'Service Promotion',
      description: 'Professional template for promoting services and business offerings',
      duration: 20,
      aspectRatio: '16:9',
      category: 'Service',
      preview: '/placeholder.svg',
      features: ['Professional look', 'Statistics display', 'Brand integration']
    },
    {
      id: 'social-proof',
      name: 'Social Proof',
      description: 'Testimonial-focused template with customer reviews and ratings',
      duration: 25,
      aspectRatio: '1:1',
      category: 'Testimonial',
      preview: '/placeholder.svg',
      features: ['Customer testimonials', 'Rating displays', 'Trust indicators']
    },
    {
      id: 'app-demo',
      name: 'App Demo',
      description: 'Mobile app showcase with screen recordings and feature highlights',
      duration: 30,
      aspectRatio: '9:16',
      category: 'App',
      preview: '/placeholder.svg',
      features: ['Screen mockups', 'Feature highlights', 'App store integration']
    },
    {
      id: 'brand-story',
      name: 'Brand Story',
      description: 'Narrative template for telling your brand story and mission',
      duration: 45,
      aspectRatio: '16:9',
      category: 'Brand',
      preview: '/placeholder.svg',
      features: ['Storytelling format', 'Emotional appeal', 'Brand values']
    },
    {
      id: 'event-promo',
      name: 'Event Promotion',
      description: 'High-energy template for promoting events, webinars, and launches',
      duration: 20,
      aspectRatio: '1:1',
      category: 'Event',
      preview: '/placeholder.svg',
      features: ['Countdown timer', 'Event details', 'Registration CTA']
    }
  ];

  const generateVideo = async () => {
    if (!selectedTemplate || !adConfig.headline || !adConfig.description) {
      toast({
        title: "Missing Information",
        description: "Please select a template and fill in headline and description",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate video generation with progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 8000));

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Simulate generated video URL
      setGeneratedVideoUrl('/placeholder.svg');
      setSelectedTab('preview');

      toast({
        title: "Video Generated Successfully!",
        description: "Your Twitter video ad is ready for preview and download",
      });

    } catch (error) {
      console.error('Video generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    toast({
      title: "Download Started",
      description: "Your video ad is being prepared for download",
    });
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out my new video ad created with our AI generator! ${adConfig.targetUrl}`
    )}`;
    window.open(twitterUrl, '_blank');
  };

  const getDevicePreviewClass = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-80 h-[600px]';
      case 'tablet':
        return 'w-96 h-[500px]';
      case 'desktop':
        return 'w-full h-[400px]';
      default:
        return 'w-80 h-[600px]';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
      {/* Header */}
      <ToolsHeader user={user} currentTool="ad-generator" />

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Twitter className="h-10 w-10 text-blue-500" />
                <Video className="h-5 w-5 text-purple-500 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Twitter Video Ad Generator
              </h1>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Create stunning, high-converting video ads for Twitter in minutes. Choose from professional templates,
              customize with your brand, and generate videos optimized for maximum engagement.
            </p>
            
            <div className="flex justify-center gap-6 text-sm bg-white rounded-lg p-4 shadow-sm border max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-600" />
                <span className="font-medium">HD Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium">Twitter Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium">60 Second Generation</span>
              </div>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="preview">Preview & Export</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Choose Your Video Template
                  </CardTitle>
                  <CardDescription>
                    Select from our collection of high-converting video ad templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setAdConfig(prev => ({
                            ...prev,
                            template: template.id,
                            duration: template.duration,
                            aspectRatio: template.aspectRatio
                          }));
                        }}
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{template.duration}s</span>
                            <span>{template.aspectRatio}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              {/* Customization Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Content & Copy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="headline">Headline *</Label>
                      <Input
                        id="headline"
                        value={adConfig.headline}
                        onChange={(e) => setAdConfig(prev => ({ ...prev, headline: e.target.value }))}
                        placeholder="Revolutionary AI-Powered Solution"
                        maxLength={60}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {adConfig.headline.length}/60 characters
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={adConfig.description}
                        onChange={(e) => setAdConfig(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Transform your business with cutting-edge AI technology. Get started today!"
                        maxLength={200}
                        rows={3}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {adConfig.description.length}/200 characters
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cta">Call to Action</Label>
                      <Select
                        value={adConfig.callToAction}
                        onValueChange={(value) => setAdConfig(prev => ({ ...prev, callToAction: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Learn More">Learn More</SelectItem>
                          <SelectItem value="Sign Up">Sign Up</SelectItem>
                          <SelectItem value="Get Started">Get Started</SelectItem>
                          <SelectItem value="Try Free">Try Free</SelectItem>
                          <SelectItem value="Shop Now">Shop Now</SelectItem>
                          <SelectItem value="Download">Download</SelectItem>
                          <SelectItem value="Watch Demo">Watch Demo</SelectItem>
                          <SelectItem value="Contact Us">Contact Us</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetUrl">Target URL</Label>
                      <Input
                        id="targetUrl"
                        value={adConfig.targetUrl}
                        onChange={(e) => setAdConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Brand & Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="brandName">Brand Name</Label>
                      <Input
                        id="brandName"
                        value={adConfig.brandName}
                        onChange={(e) => setAdConfig(prev => ({ ...prev, brandName: e.target.value }))}
                        placeholder="Your Brand"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brandColor">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="brandColor"
                          type="color"
                          value={adConfig.brandColor}
                          onChange={(e) => setAdConfig(prev => ({ ...prev, brandColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={adConfig.brandColor}
                          onChange={(e) => setAdConfig(prev => ({ ...prev, brandColor: e.target.value }))}
                          placeholder="#1DA1F2"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Text Style</Label>
                      <Select
                        value={adConfig.textStyle}
                        onValueChange={(value) => setAdConfig(prev => ({ ...prev, textStyle: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="elegant">Elegant</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Animation Style</Label>
                      <Select
                        value={adConfig.animations}
                        onValueChange={(value) => setAdConfig(prev => ({ ...prev, animations: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smooth">Smooth</SelectItem>
                          <SelectItem value="dynamic">Dynamic</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="energetic">Energetic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Background Music</Label>
                        <Switch
                          checked={adConfig.backgroundMusic}
                          onCheckedChange={(checked) => setAdConfig(prev => ({ ...prev, backgroundMusic: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Voice Over</Label>
                        <Switch
                          checked={adConfig.voiceOver}
                          onCheckedChange={(checked) => setAdConfig(prev => ({ ...prev, voiceOver: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              {/* Generation Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Generate Your Video Ad
                  </CardTitle>
                  <CardDescription>
                    Review your settings and generate your Twitter video ad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configuration Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Content Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Template:</strong> {selectedTemplate?.name || 'None selected'}</div>
                        <div><strong>Headline:</strong> {adConfig.headline || 'Not set'}</div>
                        <div><strong>Description:</strong> {adConfig.description || 'Not set'}</div>
                        <div><strong>Call to Action:</strong> {adConfig.callToAction}</div>
                        <div><strong>Duration:</strong> {adConfig.duration} seconds</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Style & Brand</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Brand:</strong> {adConfig.brandName || 'Not set'}</div>
                        <div className="flex items-center gap-2">
                          <strong>Brand Color:</strong>
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: adConfig.brandColor }}
                          />
                          {adConfig.brandColor}
                        </div>
                        <div><strong>Text Style:</strong> {adConfig.textStyle}</div>
                        <div><strong>Animations:</strong> {adConfig.animations}</div>
                        <div><strong>Background Music:</strong> {adConfig.backgroundMusic ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Generation Controls */}
                  <div className="text-center space-y-4">
                    {isGenerating ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span className="text-lg font-medium">Generating your video ad...</span>
                        </div>
                        <Progress value={generationProgress} className="w-full max-w-md mx-auto" />
                        <div className="text-sm text-gray-600">
                          {generationProgress < 30 && "Analyzing content and template..."}
                          {generationProgress >= 30 && generationProgress < 60 && "Rendering video frames..."}
                          {generationProgress >= 60 && generationProgress < 90 && "Adding animations and effects..."}
                          {generationProgress >= 90 && "Finalizing video..."}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={generateVideo}
                        disabled={!selectedTemplate || !adConfig.headline || !adConfig.description}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 px-8"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Video Ad
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {/* Preview Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Video Preview
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDevice('mobile')}
                            className={previewDevice === 'mobile' ? 'bg-blue-50 border-blue-200' : ''}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDevice('tablet')}
                            className={previewDevice === 'tablet' ? 'bg-blue-50 border-blue-200' : ''}
                          >
                            <Tablet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDevice('desktop')}
                            className={previewDevice === 'desktop' ? 'bg-blue-50 border-blue-200' : ''}
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <div className={`bg-gray-100 rounded-lg p-4 transition-all ${getDevicePreviewClass()}`}>
                          {generatedVideoUrl ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <Video className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                <p className="text-lg font-semibold text-gray-800">{adConfig.headline}</p>
                                <p className="text-sm text-gray-600 mt-2">{adConfig.description}</p>
                                <Button className="mt-4" size="sm">
                                  {adConfig.callToAction}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Generate a video to see preview</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">94%</div>
                        <div className="text-sm text-gray-600">Predicted Engagement</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">8.7/10</div>
                        <div className="text-sm text-gray-600">Quality Score</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">2.3%</div>
                        <div className="text-sm text-gray-600">Est. Click Rate</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export & Share</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={downloadVideo}
                        disabled={!generatedVideoUrl}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Video
                      </Button>
                      <Button
                        onClick={shareToTwitter}
                        disabled={!generatedVideoUrl}
                        variant="outline"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Twitter className="h-4 w-4 mr-2" />
                        Share to Twitter
                      </Button>
                      <Button
                        disabled={!generatedVideoUrl}
                        variant="outline"
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
