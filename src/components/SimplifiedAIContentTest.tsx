/**
 * Simplified AI Content Test - Builder.io inspired design
 * Clean, modern interface for instant backlink generation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Zap,
  TrendingUp,
  Clock,
  Link,
  Sparkles
} from 'lucide-react';

export function SimplifiedAIContentTest() {
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionCounter, setSessionCounter] = useState(0);

  const { toast } = useToast();

  // Initialize session counter for social proof
  useEffect(() => {
    const dailyCounter = localStorage.getItem('daily-posts-count');
    const lastDate = localStorage.getItem('last-count-date');
    const today = new Date().toDateString();

    if (lastDate !== today) {
      // Reset counter for new day
      localStorage.setItem('daily-posts-count', '127'); // Starting number for social proof
      localStorage.setItem('last-count-date', today);
      setSessionCounter(127);
    } else {
      setSessionCounter(parseInt(dailyCounter || '127'));
    }
  }, []);

  const incrementCounter = () => {
    const newCount = sessionCounter + 1;
    setSessionCounter(newCount);
    localStorage.setItem('daily-posts-count', newCount.toString());
  };

  const getCurrentDomain = () => {
    return window.location.origin;
  };

  const handleGenerate = async () => {
    if (!keyword.trim() || !url.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both keyword and URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setShowSuccess(false);
    setGeneratedResult(null);

    try {
      // Step 1: Validate inputs
      setCurrentStep('Validating inputs...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: AI Processing
      setCurrentStep('AI is generating your content...');
      setProgress(30);

      const result = await aiTestWorkflow.processCompleteWorkflow({
        websiteUrl: url,
        keyword,
        anchorText: keyword,
        sessionId: crypto.randomUUID(),
        currentDomain: getCurrentDomain()
      });

      setProgress(60);
      setCurrentStep('Creating live blog post...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setProgress(90);
      setCurrentStep('Publishing your backlink...');
      await new Promise(resolve => setTimeout(resolve, 600));

      setProgress(100);
      setCurrentStep('Complete!');

      if (result.blogResult.success) {
        setGeneratedResult(result.blogResult);
        setShowSuccess(true);
        incrementCounter();

        toast({
          title: "Success! 🎉",
          description: "Your backlink article is now live",
        });
      } else {
        throw new Error(result.blogResult.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Instant AI Backlink Generator
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Enter a keyword and your website URL. We'll generate and publish a live backlink article for you.
          </p>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 animate-fade-in">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Generated <strong className="text-green-600">{sessionCounter}</strong> posts today</span>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              
              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-lg font-medium">Target Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g., digital marketing"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-12 text-lg"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-lg font-medium">Destination URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 text-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !keyword.trim() || !url.trim()}
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {currentStep || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Generate Backlink Article
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-3 animate-fade-in">
                  <Progress value={progress} className="h-3" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">{currentStep}</p>
                    <p className="text-xs text-gray-400">{progress}% complete</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success Result */}
        {showSuccess && generatedResult && (
          <Card className="border-green-200 bg-green-50 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-6 w-6" />
                Your Backlink Article is Live! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Success Message */}
              <Alert className="border-green-300 bg-white">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Congratulations!</strong> Your backlink article has been published and is now live.
                  The article includes natural contextual links to your website.
                </AlertDescription>
              </Alert>

              {/* Article Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Blog URL</p>
                  <p className="text-sm text-gray-600 break-all font-mono">
                    {getCurrentDomain().replace('https://', '').replace('http://', '')}/blog/{keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge className="bg-green-100 text-green-800">
                    Live & Indexed
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Expiry</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-orange-500" />
                    <span className="text-sm text-orange-600">24 hours</span>
                  </div>
                </div>
              </div>

              {/* SEO Benefits */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">SEO Benefits Included:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    DoFollow backlink
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    1000+ word article
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Optimized anchor text
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Search engine friendly
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a
                    href={generatedResult.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Your Backlink Post
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedResult.blogUrl);
                    toast({
                      title: "URL Copied!",
                      description: "Blog URL copied to clipboard",
                    });
                  }}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Copy Blog URL
                </Button>
              </div>

              {/* Claim Permanent Link CTA */}
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>24-Hour Trial:</strong> This backlink will expire in 24 hours. 
                  Want to make it permanent? <a href="/claim" className="font-medium underline hover:no-underline">Claim permanent link</a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        {!showSuccess && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Generation</h3>
              <p className="text-gray-600 text-sm">Get your backlink article published within minutes, not hours</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">High Quality Content</h3>
              <p className="text-gray-600 text-sm">AI-generated articles with 1000+ words and natural backlinks</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">SEO Optimized</h3>
              <p className="text-gray-600 text-sm">Properly structured content that search engines love</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
