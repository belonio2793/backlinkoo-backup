import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DirectOpenAIService } from '@/services/directOpenAI';
import { APIStatusIndicator } from '@/components/shared/APIStatusIndicator';
import { Loader2, Link, Target, Hash, Sparkles } from 'lucide-react';

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Blog Post with Backlink
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a 1000-word blog post on your topic with a natural backlink to your target URL.
          Posts are published immediately and can be claimed within 24 hours.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Keyword/Topic
            </Label>
            <Input
              id="keyword"
              placeholder="e.g., best SEO practices, digital marketing tips"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              The main topic or keyword your blog post will focus on
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Anchor Text
            </Label>
            <Input
              id="anchorText"
              placeholder="e.g., professional SEO services, learn more here"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              The clickable text that will link to your target URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Target URL
            </Label>
            <Input
              id="targetUrl"
              placeholder="your-website.com/landing-page"
              value={targetUrl}
              onChange={handleTargetUrlChange}
              onBlur={handleTargetUrlBlur}
              className="h-12"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              The destination URL where the anchor text will link to. Protocol (https://) will be added automatically if missing.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">API Status</span>
          <APIStatusIndicator />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI generates a 1000-word blog post on your keyword</li>
            <li>• Your anchor text is naturally integrated with a link to your URL</li>
            <li>• Post is published immediately on /blog with a unique URL</li>
            <li>• You have 24 hours to claim the post (limit: 3 claimed posts)</li>
            <li>• Unclaimed posts are automatically deleted after 24 hours</li>
          </ul>
        </div>

        <Button
          onClick={generateContent}
          disabled={isGenerating || !keyword || !anchorText || !targetUrl}
          size="lg"
          className="w-full h-12"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Blog Post...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Blog Post with Backlink
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
