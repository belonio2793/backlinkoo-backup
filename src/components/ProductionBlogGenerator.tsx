import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStatus } from '@/hooks/useAuth';
import { productionBlogGenerator } from '@/services/productionBlogGenerator';
import { MinimalisticSuccessSection } from './MinimalisticSuccessSection';
import {
  Sparkles,
  Link2,
  Loader2,
  CheckCircle2,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  FileText
} from 'lucide-react';

export function ProductionBlogGenerator() {
  // Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [publishedUrl, setPublishedUrl] = useState('');

  const { toast } = useToast();
  const { currentUser, isCheckingAuth, isLoggedIn } = useAuthStatus();

  const handleGenerate = async () => {
    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🚀 Starting production blog generation...');
      
      const result = await productionBlogGenerator.generateAndPublishBlog({
        destinationURL: targetUrl,
        targetKeyword: primaryKeyword,
        anchorText: anchorText || undefined
      }, currentUser?.id);

      if (result.success && result.blogPost) {
        setGeneratedPost(result.blogPost);
        setPublishedUrl(result.livePostURL);
        setIsCompleted(true);
        
        toast({
          title: "✅ Blog Post Generated!",
          description: "Your content has been created and published successfully"
        });
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setTargetUrl('');
    setPrimaryKeyword('');
    setAnchorText('');
    setIsCompleted(false);
    setGeneratedPost(null);
    setPublishedUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!isCompleted ? (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create Your First Backlink For Free (Basic)
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Zero external dependencies • Instant generation • Production ready
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  <Shield className="h-4 w-4" />
                  <span>Self-Contained</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  <Zap className="h-4 w-4" />
                  <span>Instant</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  <Globe className="h-4 w-4" />
                  <span>Production Ready</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="targetUrl" className="text-base font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-blue-500" />
                    Target Website URL
                  </Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://yourwebsite.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="text-base py-3"
                  />
                  <p className="text-sm text-gray-500">URL you want to get backlinks to</p>
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
                    className="text-base py-3"
                  />
                  <p className="text-sm text-gray-500">Main keyword to target</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="anchorText" className="text-base font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-green-500" />
                  Anchor Text (Optional)
                </Label>
                <Input
                  id="anchorText"
                  placeholder="Custom anchor text for backlinks"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  className="text-base py-3"
                />
                <p className="text-sm text-gray-500">
                  Will use "{anchorText || primaryKeyword || 'your keyword'}" as anchor text
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  What You Get (Generated Instantly):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>1,200+ word SEO-optimized article</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span>Natural link integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>Professional content structure</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <span>Instant publication</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !targetUrl || !primaryKeyword || isCheckingAuth}
                size="lg"
                className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    <span>Generating Content...</span>
                  </>
                ) : (
                  <>
                    <FileText className="mr-3 h-5 w-5" />
                    <span>Generate Blog Post Instantly</span>
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                {currentUser ? (
                  <div className="text-green-600 font-medium">
                    ✅ Logged in - Your content will be saved permanently
                  </div>
                ) : (
                  <div className="text-amber-600 font-medium">
                    ⚠️ Guest mode - 24-hour trial content
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h5 className="font-semibold text-gray-900 mb-2">🚀 Zero Dependencies</h5>
                <p className="text-sm text-gray-600">
                  This generator works completely offline with no external API calls. 
                  Perfect for production environments with reliability and speed requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <MinimalisticSuccessSection
            publishedUrl={publishedUrl}
            generatedPost={generatedPost}
            primaryKeyword={primaryKeyword}
            targetUrl={targetUrl}
            currentUser={currentUser}
            onCreateAnother={resetForm}
          />
        )}
      </div>
    </div>
  );
}
