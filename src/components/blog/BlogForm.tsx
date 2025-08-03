import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DirectOpenAIService } from '@/services/directOpenAI';
import { APIStatusIndicator } from '@/components/shared/APIStatusIndicator';
import { AnimatedBlogHeadline } from '@/components/AnimatedBlogHeadline';
import { BlogGenerationStatus } from '@/components/blog/BlogGenerationStatus';
import { Loader2, Link, Target, Hash, Sparkles, Zap, Star, Rocket } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Beautiful gradient background card */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        <CardContent className="relative z-10 p-8 space-y-8">
          {/* Animated headline */}
          <AnimatedBlogHeadline />
          {/* Top row: Keyword and Anchor Text side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Field */}
            <div className="space-y-3">
              <Label htmlFor="keyword" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                Keyword
              </Label>
              <div className="relative group">
                <Input
                  id="keyword"
                  placeholder="e.g., best SEO practices, digital marketing tips"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                The main topic your blog post will focus on
              </p>
            </div>

            {/* Anchor Text Field */}
            <div className="space-y-3">
              <Label htmlFor="anchorText" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                Anchor Text
              </Label>
              <div className="relative group">
                <Input
                  id="anchorText"
                  placeholder="e.g., professional SEO services, learn more here"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Target className="h-3 w-3 text-purple-500" />
                The clickable text that will link to your URL
              </p>
            </div>
          </div>



          {/* Bottom row: Target URL (full width for better UX) */}
          <div className="space-y-3">
            <Label htmlFor="targetUrl" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <Link className="h-4 w-4 text-white" />
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
                className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg"
                type="url"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Link className="h-3 w-3 text-green-500" />
              The destination URL where the anchor text will link to.
            </p>
          </div>

          {/* API Status with enhanced styling */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-inner">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              API Status
            </span>
            <APIStatusIndicator />
          </div>

          {/* Beautiful CTA Button */}
          <div className="pt-4">
            <Button
              onClick={generateContent}
              disabled={isGenerating || !keyword || !anchorText || !targetUrl}
              size="lg"
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 border-0 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Generating Your Backlink...</span>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6" />
                  <span>Claim Now For Free</span>
                  <Zap className="h-5 w-5" />
                </div>
              )}
            </Button>
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
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Generation Status Tracker */}
      <BlogGenerationStatus
        isVisible={isGenerating}
        onStepUpdate={(step, status, details) => {
          console.log(`Blog generation step: ${step} - ${status}`, details);
        }}
      />
    </div>
  );
}
