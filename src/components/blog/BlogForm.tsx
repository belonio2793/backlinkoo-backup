import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DirectOpenAIService } from '@/services/directOpenAI';
import { AnimatedBlogHeadline } from '@/components/AnimatedBlogHeadline';
import { RealTimeBlogStatus } from '@/components/blog/RealTimeBlogStatus';
import { Loader2, Link, Target, Hash, Sparkles, Zap, Star, Rocket, Search, MousePointer, ExternalLink, Key, Crosshair, Globe } from 'lucide-react';

interface BlogFormProps {
  onContentGenerated: (content: any) => void;
}

export function BlogForm({ onContentGenerated }: BlogFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const { toast } = useToast();

  // Auto-format URL to add protocol if missing
  const formatUrl = (url: string): string => {
    if (!url) return url;

    // Trim whitespace
    const trimmedUrl = url.trim();

    // If already has protocol, return as is
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    // If starts with www or looks like a domain, try https first (more common)
    if (trimmedUrl.startsWith('www.') || /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(trimmedUrl)) {
      return `https://${trimmedUrl}`;
    }

    // Default to https for other cases
    return `https://${trimmedUrl}`;
  };

  const handleTargetUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetUrl(value);
  };

  const handleTargetUrlBlur = () => {
    if (targetUrl) {
      const formattedUrl = formatUrl(targetUrl);
      if (formattedUrl !== targetUrl) {
        setTargetUrl(formattedUrl);
      }
    }
  };

  const generateContent = async () => {
    if (!keyword || !anchorText || !targetUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide keyword, anchor text, and target URL",
        variant: "destructive"
      });
      return;
    }

    // Auto-format the URL before validation
    const formattedUrl = formatUrl(targetUrl);
    if (formattedUrl !== targetUrl) {
      setTargetUrl(formattedUrl);
    }

    // Validate URL format
    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid target URL",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await DirectOpenAIService.generateBlogPost({
        keyword,
        anchorText,
        targetUrl: formattedUrl
      });

      if (result.success) {
        onContentGenerated(result);

        toast({
          title: "Blog Post Generated!",
          description: `Your blog post "${result.title}" is now live at ${result.blogUrl}`,
        });

        // Reset form
        setKeyword('');
        setAnchorText('');
        setTargetUrl('');
      } else {
        throw new Error(result.error || 'Blog generation failed');
      }

    } catch (error) {
      console.error('Blog generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full px-6 space-y-8">
      {/* Animated headline */}
      <AnimatedBlogHeadline />
          {/* Top row: Keyword and Anchor Text side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Field */}
            <div className="space-y-3">
              <Label htmlFor="keyword" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-200">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                Keyword
              </Label>
              <div className="relative group">
                <Input
                  id="keyword"
                  placeholder="e.g., best SEO practices, digital marketing tips"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center">
                  <Target className="h-2.5 w-2.5 text-emerald-600" />
                </div>
                The main topic your blog post will focus on
              </p>
            </div>

            {/* Anchor Text Field */}
            <div className="space-y-3">
              <Label htmlFor="anchorText" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden">
                  <img src="https://images.pexels.com/photos/2381712/pexels-photo-2381712.jpeg" alt="Link Building" className="h-6 w-6 object-cover rounded-sm" />
                </div>
                Anchor Text
              </Label>
              <div className="relative group">
                <Input
                  id="anchorText"
                  placeholder="e.g., professional SEO services, learn more here"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <div className="h-4 w-4 rounded-full overflow-hidden border border-amber-300">
                  <img src="https://images.pexels.com/photos/2381712/pexels-photo-2381712.jpeg" alt="Link Building" className="h-4 w-4 object-cover" />
                </div>
                The clickable text that will link to your URL
              </p>
            </div>
          </div>



          {/* Bottom row: Target URL (full width for better UX) */}
          <div className="space-y-3">
            <Label htmlFor="targetUrl" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
                <img src="https://images.pexels.com/photos/7793740/pexels-photo-7793740.jpeg" alt="SEO Technology" className="h-6 w-6 object-cover rounded-sm" />
              </div>
              Target URL
            </Label>
            <div className="relative group">
              <Input
                id="targetUrl"
                placeholder="your-website.com/landing-page"
                value={targetUrl}
                onChange={handleTargetUrlChange}
                onBlur={handleTargetUrlBlur}
                className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                type="url"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <div className="h-4 w-4 rounded-full overflow-hidden border border-blue-300">
                <img src="https://images.pexels.com/photos/7793740/pexels-photo-7793740.jpeg" alt="SEO Technology" className="h-4 w-4 object-cover" />
              </div>
              The destination URL where the anchor text will link to.
            </p>
          </div>

          {/* Beautiful CTA Button */}
          <div className="pt-4">
            <Button
              onClick={generateContent}
              disabled={isGenerating || !keyword || !anchorText || !targetUrl}
              size="lg"
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-0 rounded-lg text-white"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Generating Your Backlink...</span>
                </div>
              ) : (
                <span>Claim Now</span>
              )}
            </Button>
          </div>

          {/* Estimated Time and Account Prompt - Moved below button */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-inner">
            <div className="text-center">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                ⏱️ Estimated time: 30-60 seconds
              </p>
              <p className="text-xs text-amber-700">
                You will be redirected to your blog post. Create an account to claim it before it gets deleted.
              </p>
            </div>
          </div>

      {/* Bottom decorative elements */}
      <div className="flex justify-center pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          <span>Instant Generation</span>
          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
          <span>100% Free</span>
          <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
          <span>No Credit Card</span>
        </div>
      </div>

      {/* Real-time Blog Generation Status Tracker */}
      <RealTimeBlogStatus
        isVisible={isGenerating}
        isGenerating={isGenerating}
      />
    </div>
  );
}
