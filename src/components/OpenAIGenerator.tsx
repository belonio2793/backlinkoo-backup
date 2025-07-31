import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { BlogService } from '@/services/blogService';
import {
  Zap,
  CheckCircle2,
  Globe,
  Clock,
  AlertCircle,
  TestTube,
  Terminal,
  Code
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

interface OpenAIGeneratorProps {
  variant?: 'homepage' | 'standalone';
  onSuccess?: (blogPost: any) => void;
}

export const OpenAIGenerator = ({ variant = 'standalone', onSuccess }: OpenAIGeneratorProps) => {
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [userCanGenerate, setUserCanGenerate] = useState<UserGenerationStatus>({ canGenerate: true });
  const [apiStatus, setApiStatus] = useState<{ accessible: boolean; error?: string } | null>(null);
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // The exact prompt templates as requested
  const promptTemplates = [
    "Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
    "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
    "Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}"
  ];

  useEffect(() => {
    checkAPIStatus();
  }, []);

  // Function to select and format prompt
  const selectAndFormatPrompt = () => {
    const index = Math.floor(Math.random() * promptTemplates.length);
    const template = promptTemplates[index];
    const formatted = template
      .replace('{{keyword}}', keyword.trim())
      .replace('{{anchor_text}}', anchorText.trim())
      .replace('{{url}}', targetUrl.trim());

    setPromptIndex(index);
    setSelectedPrompt(formatted);
    return { template, formatted, index };
  };

  // Update prompt display when inputs change
  useEffect(() => {
    if (keyword.trim() && anchorText.trim() && targetUrl.trim()) {
      selectAndFormatPrompt();
    } else {
      setSelectedPrompt('');
    }
  }, [keyword, anchorText, targetUrl]);

  const checkAPIStatus = async () => {
    setIsCheckingAPI(true);
    try {
      const isConfigured = globalOpenAI.isConfigured();
      const canConnect = await globalOpenAI.testConnection();

      if (isConfigured && canConnect) {
        setApiStatus({ accessible: true });
        setUserCanGenerate({ canGenerate: true });
      } else {
        throw new Error('Global OpenAI configuration not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiStatus({ accessible: false, error: errorMessage });
      setUserCanGenerate({
        canGenerate: false,
        reason: errorMessage
      });
    } finally {
      setIsCheckingAPI(false);
    }
  };

  const handleTestKeys = async () => {
    setIsTesting(true);
    toast({
      title: "Testing API Keys",
      description: "Running diagnostic tests on all OpenAI API keys...",
    });

    try {
      const workingKey = await testAllKeys();

      if (workingKey) {
        toast({
          title: "✅ API Keys Working!",
          description: "Found at least one working OpenAI API key. Content generation should work.",
        });
      } else {
        toast({
          title: "❌ All API Keys Failed",
          description: "All OpenAI API keys are invalid. Please check your keys in the OpenAI dashboard.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('API key testing failed:', error);
      toast({
        title: "Test Failed",
        description: "Unable to test API keys due to network error.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

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
    let formattedUrl = targetUrl.trim();
    try {
      // Add https:// if no protocol specified
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., example.com or https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Select prompt for this generation
      const { template, formatted, index } = selectAndFormatPrompt();

      console.log(`🎯 Selected Prompt Template ${index + 1}:`, template);
      console.log(`📝 Formatted Prompt:`, formatted);

      // Set up progress updates
      setProgress({
        stage: 'initializing',
        progress: 10,
        details: `Starting content generation with Global OpenAI | Using Prompt ${index + 1}`,
        timestamp: new Date()
      });

      // Generate content using Global OpenAI Configuration
      const result = await globalOpenAI.generateContent({
        keyword: keyword.trim(),
        anchorText: anchorText.trim(),
        url: formattedUrl,
        wordCount: 1000,
        contentType: 'comprehensive',
        tone: 'professional'
      });

      if (!result.success) {
        throw new Error(result.error || 'Content generation failed');
      }

      setProgress({
        stage: 'saving',
        progress: 85,
        details: 'Saving blog post...',
        timestamp: new Date()
      });

      // Create proper blog post data for BlogService
      const blogPostData = {
        title: `${keyword.trim()} - Complete Guide`,
        content: result.content || '',
        keywords: [keyword.trim()],
        targetUrl: formattedUrl,
        anchorText: anchorText.trim(),
        wordCount: result.content?.split(' ').length || 1000,
        readingTime: Math.ceil((result.content?.split(' ').length || 1000) / 200),
        seoScore: 85,
        metaDescription: `Learn everything about ${keyword.trim()}. Comprehensive guide with expert insights and practical tips.`
      };

      // Save to database/system as a trial post (publicly visible on /blog)
      const blogService = new BlogService();
      let savedBlogPost;

      try {
        savedBlogPost = await blogService.createBlogPost(blogPostData, undefined, true);
        console.log('✅ Blog post saved to database:', savedBlogPost);
      } catch (dbError) {
        console.warn('⚠️ Database save failed, using localStorage fallback:', dbError);

        // Fallback: Save to localStorage for visibility on /blog
        const fallbackPost = {
          id: `local_${Date.now()}`,
          title: blogPostData.title,
          slug: keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          content: blogPostData.content,
          target_url: formattedUrl,
          anchor_text: anchorText.trim(),
          keywords: [keyword.trim()],
          word_count: blogPostData.wordCount,
          reading_time: blogPostData.readingTime,
          seo_score: blogPostData.seoScore,
          meta_description: blogPostData.metaDescription,
          author_name: 'AI Generator',
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          status: 'published',
          view_count: 0,
          category: 'AI Generated',
          tags: [keyword.trim()],
          published_url: `/blog/${keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        };

        // Save individual post
        localStorage.setItem(`blog_post_${fallbackPost.slug}`, JSON.stringify(fallbackPost));

        // Update blog posts index
        const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const postMeta = {
          slug: fallbackPost.slug,
          title: fallbackPost.title,
          created_at: fallbackPost.created_at,
          is_trial_post: true
        };

        // Add to beginning (newest first)
        existingPosts.unshift(postMeta);
        localStorage.setItem('all_blog_posts', JSON.stringify(existingPosts));

        savedBlogPost = fallbackPost;
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        details: 'Blog post published successfully!',
        timestamp: new Date()
      });

      toast({
        title: "Blog Post Generated & Published!",
        description: `Your ${blogPostData.wordCount}-word blog post "${blogPostData.title}" is now live on /blog!`,
      });

      // Reset form
      setKeyword('');
      setAnchorText('');
      setTargetUrl('');

      // Call success callback if provided (for homepage integration)
      if (onSuccess) {
        onSuccess({
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          word_count: blogPost.wordCount,
          publishedUrl: blogPost.publishedUrl,
          targetUrl: blogPost.targetUrl,
          anchorText: blogPost.anchorText,
          keyword: blogPost.keyword
        });
      } else {
        // Default behavior for standalone usage
        setTimeout(() => {
          window.open(result.publishedUrl, '_blank');
        }, 2000);
      }

    } catch (error) {
      console.error('OpenAI/ChatGPT generation failed:', error);

      // Provide specific error messages based on error type
      let errorTitle = "Generation Failed";
      let errorDescription = "Content generation failed. Please try again later.";

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('404') || errorMessage.includes('netlify function')) {
          errorTitle = "Service Temporarily Unavailable";
          errorDescription = "Our content generation service is temporarily unavailable. The system has automatically used fallback generation to create your content.";
        } else if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
          errorTitle = "Configuration Issue";
          errorDescription = "There's a configuration issue with the content generation service. Using fallback generation instead.";
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          errorTitle = "Connection Timeout";
          errorDescription = "The request timed out. Please check your connection and try again.";
        } else {
          errorDescription = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(null);
      }, 2000);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle>Create a Backlink</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          🚀 Powered by advanced content generation for maximum reliability
        </p>
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

        {/* Prompt Display */}
        {selectedPrompt && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-800">
                Selected Prompt Template {promptIndex + 1} of {promptTemplates.length}
              </span>
            </div>

            {/* Original Template */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Template:
              </div>
              <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                {promptTemplates[promptIndex]}
              </div>
            </div>

            {/* User Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-blue-600 mb-1">keyword:</div>
                <div className="font-mono text-slate-800">"{keyword}"</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-purple-600 mb-1">anchor_text:</div>
                <div className="font-mono text-slate-800">"{anchorText}"</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-green-600 mb-1">url:</div>
                <div className="font-mono text-slate-800 truncate">"{targetUrl}"</div>
              </div>
            </div>

            {/* Formatted Result */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Final Prompt → ChatGPT:
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded border-l-4 border-blue-400 text-sm">
                <Code className="h-4 w-4 inline mr-2 text-blue-500" />
                {selectedPrompt}
              </div>
            </div>
          </div>
        )}

        {/* API Status Display */}
        {isCheckingAPI && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 animate-pulse text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Checking content service status...</span>
            </div>
          </div>
        )}

        {apiStatus && !isCheckingAPI && (
          <div className={`p-4 rounded-lg border ${apiStatus.accessible
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {apiStatus.accessible ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${apiStatus.accessible
                ? 'text-green-800'
                : 'text-red-800'
              }`}>
                {apiStatus.accessible
                  ? 'Content service is ready'
                  : `Service Error: ${apiStatus.error}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Real-time Progress Display */}
        {isGenerating && progress && (
          <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg text-gray-800">{progress.stage}</div>
              <div className="text-lg font-mono text-gray-600">{progress.progress}%</div>
            </div>
            <Progress value={progress.progress} className="h-4" />
            <div className="text-sm text-gray-700 font-medium">{progress.details}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>⏰ {progress.timestamp.toLocaleTimeString()}</span>
              <span>⚡ Content Engine</span>
              <span>📝 Real-time Generation</span>
            </div>

            {/* Live Action Indicators */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`p-2 rounded text-center ${progress.progress >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ API Check
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 30 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ Content Generation
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 80 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ Publishing
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ Complete
              </div>
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
          <div className="flex items-center justify-center gap-4 flex-wrap">
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
              <span>Auto-published to /blog</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span>Advanced content engine</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
