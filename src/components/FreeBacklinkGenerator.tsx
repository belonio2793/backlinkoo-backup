import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { FreeBacklinkRequest, FreeBacklinkResult } from '@/services/simpleAIContentEngine';
import { 
  Loader2, 
  Sparkles, 
  Link, 
  Target, 
  Hash, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Gift,
  Zap
} from 'lucide-react';

interface FreeBacklinkGeneratorProps {
  onContentGenerated: (content: FreeBacklinkResult) => void;
}

export function FreeBacklinkGenerator({ onContentGenerated }: FreeBacklinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [contentType, setContentType] = useState<'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion'>('how-to');
  const [wordCount, setWordCount] = useState<number>(1500);
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical' | 'friendly' | 'convincing'>('professional');
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useState(() => {
    // Check if service is ready
    const checkReady = async () => {
      const ready = freeBacklinkService.isReady();
      setIsReady(ready);
      
      if (ready) {
        try {
          await freeBacklinkService.testConnection();
        } catch (error) {
          console.warn('OpenAI connection test failed:', error);
        }
      }
    };
    
    checkReady();
  });

  const generateContent = async () => {
    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    if (!isReady) {
      toast({
        title: "Service Not Ready",
        description: "OpenAI is not configured. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const request: FreeBacklinkRequest = {
        targetUrl,
        primaryKeyword,
        anchorText: anchorText || primaryKeyword,
        wordCount,
        tone,
        contentType
      };

      const result = await freeBacklinkService.generateFreeBacklink(request);

      if (result.error) {
        throw new Error(result.error);
      }

      onContentGenerated(result);

      toast({
        title: "Free Backlink Generated! 🎉",
        description: "Your blog post is ready! Remember, it will auto-delete in 24 hours unless you register an account.",
      });

      // Reset form
      setTargetUrl('');
      setPrimaryKeyword('');
      setAnchorText('');

    } catch (error) {
      console.error('Content generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold tracking-tight">Create Free Backlink</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            FREE
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate a high-quality SEO blog post with a backlink to your website. 
          <strong className="text-purple-600"> Completely free, no signup required!</strong>
        </p>
      </div>

      {/* Service Status Alert */}
      {!isReady && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Service Temporarily Unavailable:</strong> The AI content generation service is currently not configured. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Free Service Notice */}
      <Alert className="border-purple-200 bg-purple-50">
        <Clock className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Free Service Notice:</strong> Your generated blog post will be available for 24 hours. 
          To save it permanently and access advanced features, 
          <Button variant="link" className="p-0 h-auto text-purple-600 font-semibold">
            register a free account
          </Button> after generation.
        </AlertDescription>
      </Alert>

      {/* Generation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-purple-600" />
              Target & Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                placeholder="https://your-website.com/target-page"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                The URL you want to create a backlink to
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
              <Input
                id="primaryKeyword"
                placeholder="e.g., best SEO practices"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Main topic for your blog post
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text (Optional)</Label>
              <Input
                id="anchorText"
                placeholder="Link text (defaults to primary keyword)"
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Text that will link to your URL
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="how-to">How-To Guide</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="news">News Article</SelectItem>
                  <SelectItem value="opinion">Opinion Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Word Count</Label>
              <Select value={wordCount.toString()} onValueChange={(value) => setWordCount(parseInt(value))}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="800">800 words</SelectItem>
                  <SelectItem value="1200">1,200 words</SelectItem>
                  <SelectItem value="1500">1,500 words (Recommended)</SelectItem>
                  <SelectItem value="2000">2,000 words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="convincing">Convincing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Highlight */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            What You'll Get (100% Free!)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">AI-Generated Content</p>
                <p className="text-sm text-green-700">High-quality, SEO-optimized blog post</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Link className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">Natural Backlink</p>
                <p className="text-sm text-green-700">Contextually relevant link to your site</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">SEO Optimized</p>
                <p className="text-sm text-green-700">Structured for search engine ranking</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={generateContent}
        disabled={isGenerating || !isReady}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Your Free Backlink...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Free Backlink Blog Post
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground">
        By using this service, you agree that the generated content is for legitimate SEO purposes. 
        The blog post will automatically delete after 24 hours unless you save it by registering an account.
      </p>
    </div>
  );
}
