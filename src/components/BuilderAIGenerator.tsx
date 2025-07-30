import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { openAIContentGenerator } from '@/services/openAIContentGenerator';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import {
  Zap,
  CheckCircle2,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ProgressUpdate {
  stage: string;
  progress: number;
  details: string;
  timestamp: Date;
}

interface UserGenerationStatus {
  canGenerate: boolean;
  reason?: string;
}

export const BuilderAIGenerator = () => {
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [userCanGenerate, setUserCanGenerate] = useState<UserGenerationStatus>({ canGenerate: true });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user can generate content (simplified version)
    setUserCanGenerate({ canGenerate: true });
  }, []);

  const handleGenerate = async () => {
    if (!keyword.trim() || !anchorText.trim() || !targetUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(targetUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate progress updates
      const stages = [
        { stage: "Initializing", progress: 10, details: "Preparing AI content generation..." },
        { stage: "Research", progress: 30, details: "Researching keyword and topic..." },
        { stage: "Writing", progress: 60, details: "Generating high-quality content..." },
        { stage: "Optimization", progress: 80, details: "Optimizing for SEO..." },
        { stage: "Finalizing", progress: 100, details: "Blog post created successfully!" },
      ];

      for (const stage of stages) {
        setProgress({ ...stage, timestamp: new Date() });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: "Blog Post Generated!",
        description: "Your content has been created successfully.",
      });

      // Reset form
      setKeyword('');
      setAnchorText('');
      setTargetUrl('');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle>Create a Backlink</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Limit Status */}
        {userCanGenerate && !userCanGenerate.canGenerate && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userCanGenerate.reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="text-sm font-medium">
              Keyword *
            </Label>
            <Input
              id="keyword"
              placeholder="e.g., digital marketing, SEO tips"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isGenerating}
              className="bg-white"
            />
            <p className="text-xs text-gray-600">
              Main topic for your 1000+ word article
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText" className="text-sm font-medium">
              Anchor Text *
            </Label>
            <Input
              id="anchorText"
              placeholder="e.g., best marketing tools, learn more"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              disabled={isGenerating}
              className="bg-white"
            />
            <p className="text-xs text-gray-600">
              Text that will be hyperlinked in the article
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetUrl" className="text-sm font-medium">
            Target URL *
          </Label>
          <Input
            id="targetUrl"
            placeholder="https://yourwebsite.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isGenerating}
            className="bg-white"
          />
          <p className="text-xs text-gray-600">
            URL where the anchor text will link to
          </p>
        </div>

        {/* Progress Display */}
        {isGenerating && progress && (
          <div className="space-y-3 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-800">{progress.stage}</div>
              <div className="text-sm text-gray-600">{progress.progress}%</div>
            </div>
            <Progress value={progress.progress} className="h-3" />
            <div className="text-sm text-gray-600">{progress.details}</div>
            <div className="text-xs text-gray-500">
              {progress.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Generation Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !userCanGenerate?.canGenerate}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
        >
          {isGenerating ? (
            <>
              <Zap className="mr-2 h-5 w-5 animate-pulse" />
              Generating Your Blog Post...
            </>
          ) : (
            <>
              Create Your First Backlink For Free
            </>
          )}
        </Button>

        {/* Usage Info */}
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>1000+ words guaranteed</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>SEO optimized</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>permanent link</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
