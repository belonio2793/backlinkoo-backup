import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiContentGenerator } from '@/services/aiContentGenerator';
import { blogPublisher } from '@/services/blogPublisher';
import { 
  Sparkles, 
  Link2, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Star,
  Zap,
  Globe,
  Target,
  TrendingUp
} from 'lucide-react';

export function HomepageBlogGenerator() {
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setIsCompleted(false);

    try {
      // Generate the blog post
      const content = await aiContentGenerator.generateContent({
        targetUrl,
        primaryKeyword,
        secondaryKeywords: [],
        contentType: 'how-to',
        wordCount: 1200,
        tone: 'professional',
        customInstructions: 'Create a contextual blog post that naturally includes the target URL as a valuable resource'
      });

      setGeneratedPost(content);

      // Automatically publish the post
      const publishResult = await blogPublisher.publishPost({
        title: content.title,
        slug: content.slug,
        content: content.content,
        metaDescription: content.metaDescription,
        keywords: content.keywords,
        targetUrl: content.targetUrl,
        status: 'published',
        createdAt: content.createdAt
      });

      if (publishResult.success && publishResult.publishedUrl) {
        setPublishedUrl(publishResult.publishedUrl);
        setIsCompleted(true);
        
        toast({
          title: "Blog Post Generated & Published!",
          description: "Your contextual blog post is now live with your backlink",
        });
      } else {
        throw new Error(publishResult.error || 'Publishing failed');
      }

    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    setTargetUrl('');
    setPrimaryKeyword('');
    setIsCompleted(false);
    setGeneratedPost(null);
    setPublishedUrl('');
  };

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 font-mono text-xs">
            FREE AI BLOG GENERATOR
          </Badge>
          <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Get Your Free Contextual Backlink
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            Enter your URL and keyword to generate a high-quality blog post with a natural backlink. 
            Powered by advanced AI and published instantly on our high-authority domain.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!isCompleted ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">AI Blog Post Generator</CardTitle>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>High-Quality Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>Instant Publishing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Live Backlink</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="targetUrl" className="text-base font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-500" />
                      Your Website URL
                    </Label>
                    <Input
                      id="targetUrl"
                      placeholder="https://yourwebsite.com"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="text-base py-3 px-4 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                    <p className="text-sm text-gray-500">The URL you want to get a backlink to</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="primaryKeyword" className="text-base font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      Primary Keyword
                    </Label>
                    <Input
                      id="primaryKeyword"
                      placeholder="e.g., digital marketing, SEO tools"
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                      className="text-base py-3 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                    <p className="text-sm text-gray-500">The main topic for your blog post</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    What You'll Get:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>1,200+ word SEO-optimized blog post</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Contextual backlink to your website</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Published on backlinkoo.com (DA 85+)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Permanent dofollow backlink</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !targetUrl || !primaryKeyword}
                  size="lg"
                  className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Generating Your Blog Post...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Generate Free Blog Post & Backlink
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  ✨ Completely free • No signup required • Instant results
                </p>
              </CardContent>
            </Card>
          ) : (
            // Success state
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-12 px-8">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900">
                    Blog Post Published Successfully!
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Your contextual blog post about "{primaryKeyword}" has been published with a natural backlink to your website.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">📝 Blog Post Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Title: {generatedPost?.title}</li>
                        <li>• Word Count: {generatedPost?.wordCount}+ words</li>
                        <li>• Status: Published & Live</li>
                        <li>• Domain Authority: 85+</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">🔗 Backlink Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Target: {targetUrl}</li>
                        <li>• Type: Contextual, Dofollow</li>
                        <li>• Anchor: Natural keyword placement</li>
                        <li>• Status: Active & Indexed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={() => window.open(publishedUrl, '_blank')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    View Your Live Blog Post
                  </Button>
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    size="lg"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Generate Another Post
                  </Button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">
                    🎉 Love this free tool? Consider our premium backlink packages for even more powerful SEO results!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
