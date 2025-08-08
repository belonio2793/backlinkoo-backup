import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DirectOpenAIService } from '@/services/directOpenAI';
import { APIStatusIndicator } from '@/components/shared/APIStatusIndicator';
import { AnimatedBlogHeadline } from '@/components/AnimatedBlogHeadline';
import { 
  Loader2, 
  Link, 
  Target, 
  Hash, 
  Sparkles, 
  Zap, 
  Star, 
  Rocket,
  Lightbulb,
  FileText,
  Globe,
  TrendingUp,
  Users,
  Brain,
  Magic,
  Eye,
  Search,
  Wand2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shuffle
} from 'lucide-react';

interface EnhancedBlogFormProps {
  onContentGenerated: (content: any) => void;
}

// Sample suggestions for better UX
const keywordSuggestions = [
  'best SEO practices 2024',
  'digital marketing strategies',
  'content marketing tips',
  'social media automation',
  'email marketing optimization',
  'conversion rate optimization',
  'affiliate marketing guide',
  'e-commerce growth hacks',
  'SaaS customer retention',
  'local SEO techniques'
];

const anchorTextSuggestions = [
  'learn more here',
  'get started today',
  'professional services',
  'expert solutions',
  'read our guide',
  'discover how',
  'see the results',
  'try it free',
  'book a consultation',
  'download now'
];

const industryTemplates = [
  { value: 'tech', label: 'Technology & Software', keywords: ['AI tools', 'software development', 'cloud computing'], anchors: ['cutting-edge solutions', 'innovative platform', 'advanced technology'] },
  { value: 'marketing', label: 'Digital Marketing', keywords: ['SEO strategies', 'content marketing', 'social media growth'], anchors: ['marketing experts', 'growth strategies', 'proven techniques'] },
  { value: 'ecommerce', label: 'E-commerce & Retail', keywords: ['online sales', 'customer experience', 'conversion optimization'], anchors: ['boost your sales', 'shopping solutions', 'retail success'] },
  { value: 'health', label: 'Health & Wellness', keywords: ['wellness tips', 'healthy lifestyle', 'fitness routines'], anchors: ['health experts', 'wellness guide', 'fitness solutions'] },
  { value: 'finance', label: 'Finance & Investment', keywords: ['investment strategies', 'financial planning', 'wealth building'], anchors: ['financial advisors', 'investment platform', 'wealth management'] },
  { value: 'education', label: 'Education & Training', keywords: ['online learning', 'skill development', 'career growth'], anchors: ['learning platform', 'expert courses', 'skill training'] }
];

export function EnhancedBlogForm({ onContentGenerated }: EnhancedBlogFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Smart suggestions based on input
  const getSmartSuggestions = () => {
    if (selectedIndustry) {
      const template = industryTemplates.find(t => t.value === selectedIndustry);
      return template || industryTemplates[0];
    }
    return null;
  };

  // Auto-format URL to add protocol if missing
  const formatUrl = (url: string): string => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    if (trimmedUrl.startsWith('www.') || /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(trimmedUrl)) {
      return `https://${trimmedUrl}`;
    }
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

  const fillRandomExample = () => {
    const randomKeyword = keywordSuggestions[Math.floor(Math.random() * keywordSuggestions.length)];
    const randomAnchor = anchorTextSuggestions[Math.floor(Math.random() * anchorTextSuggestions.length)];
    const randomIndustry = industryTemplates[Math.floor(Math.random() * industryTemplates.length)];
    
    setKeyword(randomKeyword);
    setAnchorText(randomAnchor);
    setTargetUrl('example.com/landing-page');
    setSelectedIndustry(randomIndustry.value);
    
    toast({
      title: "Example Generated! ✨",
      description: "Feel free to customize these values or generate your blog post right away.",
    });
  };

  const applyIndustryTemplate = (industryValue: string) => {
    const template = industryTemplates.find(t => t.value === industryValue);
    if (template && !keyword) {
      setKeyword(template.keywords[0]);
    }
    if (template && !anchorText) {
      setAnchorText(template.anchors[0]);
    }
  };

  const generateContent = async () => {
    if (!keyword || !anchorText || !targetUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide keyword, anchor text, and target URL to generate your blog post",
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
        description: "Please provide a valid target URL (e.g., https://your-website.com)",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Enhanced prompt with additional context
      const enhancedPrompt = {
        keyword,
        anchorText,
        targetUrl: formattedUrl,
        tone,
        length,
        industry: selectedIndustry,
        additionalInstructions: additionalInstructions || undefined
      };

      const result = await DirectOpenAIService.generateBlogPost(enhancedPrompt);

      if (result.success) {
        onContentGenerated(result);

        toast({
          title: "Blog Post Generated! 🎉",
          description: `Your ${length} blog post "${result.title}" has been created successfully!`,
        });

        // Reset form
        setKeyword('');
        setAnchorText('');
        setTargetUrl('');
        setAdditionalInstructions('');
        setSelectedIndustry('');
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

  const smartSuggestions = getSmartSuggestions();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Beautiful gradient background card */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        <CardContent className="relative z-10 p-8 space-y-8">
          {/* Enhanced animated headline */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-20 animate-pulse"></div>
              <h2 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                AI Blog Generator
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create high-quality, SEO-optimized blog posts with contextual backlinks in seconds
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={fillRandomExample}
                className="bg-white/80 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Try Example
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="bg-white/80 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
          </div>

          {/* Industry Template Selector */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              Industry Template (Optional)
            </Label>
            <Select value={selectedIndustry} onValueChange={(value) => {
              setSelectedIndustry(value);
              applyIndustryTemplate(value);
            }}>
              <SelectTrigger className="h-14 text-lg border-2 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-xl bg-white/80">
                <SelectValue placeholder="Choose an industry for smart suggestions..." />
              </SelectTrigger>
              <SelectContent>
                {industryTemplates.map(template => (
                  <SelectItem key={template.value} value={template.value} className="text-lg py-3">
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {smartSuggestions && (
              <div className="text-xs text-gray-500 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-1 mb-1">
                  <Lightbulb className="h-3 w-3 text-indigo-500" />
                  <span className="font-semibold">Smart Suggestions for {smartSuggestions.label}:</span>
                </div>
                <div className="space-y-1">
                  <div><strong>Keywords:</strong> {smartSuggestions.keywords.join(', ')}</div>
                  <div><strong>Anchor texts:</strong> {smartSuggestions.anchors.join(', ')}</div>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Main Input Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Field with enhanced UX */}
            <div className="space-y-3">
              <Label htmlFor="keyword" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                Target Keyword
                <HelpCircle className="h-3 w-3 text-gray-400" />
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
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg flex items-start gap-2">
                <Search className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">What makes a good keyword:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Specific and relevant to your business</li>
                    <li>• 2-5 words for better targeting</li>
                    <li>• Something your audience searches for</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Anchor Text Field with enhanced UX */}
            <div className="space-y-3">
              <Label htmlFor="anchorText" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                Anchor Text
                <HelpCircle className="h-3 w-3 text-gray-400" />
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
              <div className="text-xs text-gray-500 bg-purple-50 p-2 rounded-lg flex items-start gap-2">
                <Target className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Effective anchor text tips:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Natural and descriptive</li>
                    <li>• Includes your target keyword when relevant</li>
                    <li>• Clear call-to-action</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Target URL Field */}
          <div className="space-y-3">
            <Label htmlFor="targetUrl" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <Link className="h-4 w-4 text-white" />
              </div>
              Target URL
              <HelpCircle className="h-3 w-3 text-gray-400" />
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
            <div className="text-xs text-gray-500 bg-green-50 p-2 rounded-lg flex items-start gap-2">
              <Globe className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">The destination for your backlink:</div>
                <div>This is where readers will land when they click your anchor text. Use your most relevant page!</div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Magic className="h-5 w-5 text-purple-600" />
                Advanced Options
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tone Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Writing Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Authoritative</SelectItem>
                      <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                      <SelectItem value="technical">Technical & Detailed</SelectItem>
                      <SelectItem value="casual">Casual & Engaging</SelectItem>
                      <SelectItem value="persuasive">Persuasive & Action-Oriented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Length Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Article Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (500-800 words)</SelectItem>
                      <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                      <SelectItem value="long">Long (1200-1800 words)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (1800+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Additional Instructions (Optional)</Label>
                <Textarea
                  placeholder="e.g., Include statistics, focus on beginner-friendly tips, mention specific tools..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="min-h-[100px] border-2 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-lg bg-white/80"
                />
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  This helps our AI understand exactly what you want in your blog post
                </div>
              </div>
            </div>
          )}

          {/* API Status with enhanced styling */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-inner">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              AI Generation Status
            </span>
            <APIStatusIndicator />
          </div>

          {/* Enhanced CTA Button */}
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
                  <span>Creating Your Blog Post...</span>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6" />
                  <span>Generate Blog Post</span>
                  <Zap className="h-5 w-5" />
                </div>
              )}
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/60 p-3 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>SEO Optimized</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/60 p-3 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <span>Instant Generation</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/60 p-3 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-purple-500" />
              <span>Natural Backlinks</span>
            </div>
          </div>

          {/* Bottom decorative elements */}
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              <span>Powered by Advanced AI</span>
              <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
              <span>100% Original Content</span>
              <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
              <span>Ready to Publish</span>
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
