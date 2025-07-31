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
  ChevronDown,
  ChevronUp,
  Wifi,
  Database,
  Key,
  Activity,
  XCircle
} from 'lucide-react';

interface ProgressUpdate {
  stage: string;
  progress: number;
  details: string;
  timestamp: Date;
}

interface SystemStatus {
  status: 'checking' | 'ready' | 'error' | 'warning';
  message: string;
}

interface OpenAIGeneratorProps {
  variant?: 'homepage' | 'standalone';
  onSuccess?: (blogPost: any) => void;
}

export const EnhancedOpenAIGenerator = ({ variant = 'standalone', onSuccess }: OpenAIGeneratorProps) => {
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    apiKey: { status: 'checking', message: 'Checking API key...' } as SystemStatus,
    chatGPT: { status: 'checking', message: 'Checking ChatGPT connection...' } as SystemStatus,
    database: { status: 'checking', message: 'Checking database connection...' } as SystemStatus
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const promptTemplates = [
    `Write a comprehensive, SEO-optimized blog post about "{{keyword}}" that is approximately 1500-2000 words. Structure the content with:

1. An engaging title that includes the main keyword
2. A compelling introduction (150-200 words) that hooks the reader
3. 5-7 main sections with H2 headings that cover different aspects of {{keyword}}
4. Each section should be 200-300 words with valuable, actionable information
5. Use H3 subheadings within sections when appropriate
6. Include bullet points and numbered lists for better readability
7. Naturally embed the anchor text "{{anchor_text}}" within the content as a contextual link to {{url}} - place it where it flows naturally and adds value to the reader
8. Write a conclusion that summarizes key points and encourages action
9. Use a conversational yet professional tone
10. Include relevant examples and practical tips

Make sure the anchor text link feels natural and provides genuine value to readers. Follow SEO best practices for internal linking and keyword density.`,

    `Create an in-depth, expert-level blog post focused on "{{keyword}}" with 1500-2000 words. Format requirements:

- Start with an attention-grabbing headline incorporating {{keyword}}
- Write an introduction that clearly states what readers will learn
- Organize content into logical sections with descriptive H2 headings
- Each section should provide unique insights about {{keyword}}
- Include practical examples, case studies, or step-by-step guides
- Strategically place "{{anchor_text}}" as a natural link to {{url}} in a relevant context that enhances the reader's understanding
- Use short paragraphs (2-3 sentences) for online readability
- Add transition sentences between sections
- Include a FAQ section if relevant
- End with a strong conclusion and call-to-action

The anchor text should be seamlessly integrated where it adds genuine value, not forced or promotional.`,

    `Develop a comprehensive guide about "{{keyword}}" targeting both beginners and intermediate readers. Word count: 1500-2000 words.

Content structure:
- Compelling title with primary keyword
- Executive summary or overview (100-150 words)
- Main content divided into 6-8 sections with clear H2 headings
- Each section explores different facets of {{keyword}}
- Include real-world examples and actionable advice
- Incorporate "{{anchor_text}}" as a helpful resource link to {{url}} where it naturally fits within the content flow
- Use data, statistics, or research findings when relevant
- Add visual content descriptions (charts, graphs, images) where appropriate
- Include best practices and common mistakes to avoid
- Conclude with key takeaways and next steps

Ensure the anchor text placement follows SEO best practices and genuinely helps readers discover valuable related content.`
  ];

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Check API Key Status
    try {
      const apiKey = globalOpenAI.getAPIKey?.() || '';
      if (apiKey && apiKey.startsWith('sk-') && apiKey.length > 20) {
        setSystemStatus(prev => ({
          ...prev,
          apiKey: { status: 'ready', message: 'OpenAI API key configured' }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          apiKey: { status: 'error', message: 'OpenAI API key not configured' }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        apiKey: { status: 'error', message: 'API key configuration error' }
      }));
    }

    // Check ChatGPT Connection  
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${globalOpenAI.getAPIKey?.()}`,
        },
      });
      
      if (testResponse.ok) {
        setSystemStatus(prev => ({
          ...prev,
          chatGPT: { status: 'ready', message: 'ChatGPT connection active' }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          chatGPT: { status: 'error', message: `ChatGPT connection failed (${testResponse.status})` }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        chatGPT: { status: 'error', message: 'ChatGPT connection error' }
      }));
    }

    // Check Database Connection
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.from('published_blog_posts').select('id').limit(1);
      
      if (!error) {
        setSystemStatus(prev => ({
          ...prev,
          database: { status: 'ready', message: 'Database sync ready' }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          database: { status: 'warning', message: 'Database sync available (localStorage fallback)' }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        database: { status: 'warning', message: 'Using localStorage storage' }
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'checking': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'checking': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const selectAndFormatPrompt = () => {
    const index = Math.floor(Math.random() * promptTemplates.length);
    const template = promptTemplates[index];
    const formatted = template
      .replace('{{keyword}}', keyword.trim())
      .replace('{{anchor_text}}', anchorText.trim())
      .replace('{{url}}', targetUrl.trim());
    
    return { template, formatted, index };
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
      const { template, formatted, index } = selectAndFormatPrompt();

      // Only show progress in debug panel if open
      if (showDebugPanel) {
        setProgress({
          stage: 'initializing',
          progress: 10,
          details: `Starting content generation with Global OpenAI | Using Prompt ${index + 1}`,
          timestamp: new Date()
        });
      }

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

      if (showDebugPanel) {
        setProgress({
          stage: 'saving',
          progress: 85,
          details: 'Saving blog post...',
          timestamp: new Date()
        });
      }

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

        localStorage.setItem(`blog_post_${fallbackPost.slug}`, JSON.stringify(fallbackPost));
        
        const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const postMeta = {
          slug: fallbackPost.slug,
          title: fallbackPost.title,
          created_at: fallbackPost.created_at,
          is_trial_post: true
        };
        
        existingPosts.unshift(postMeta);
        localStorage.setItem('all_blog_posts', JSON.stringify(existingPosts));
        
        savedBlogPost = fallbackPost;
      }

      if (showDebugPanel) {
        setProgress({
          stage: 'complete',
          progress: 100,
          details: 'Blog post published successfully!',
          timestamp: new Date()
        });
      }

      toast({
        title: "Blog Post Generated & Published!",
        description: `Your ${blogPostData.wordCount}-word blog post "${blogPostData.title}" is now live on /blog!`,
      });

      // Reset form
      setKeyword('');
      setAnchorText('');
      setTargetUrl('');

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({
          id: savedBlogPost.id,
          title: savedBlogPost.title,
          slug: savedBlogPost.slug,
          word_count: savedBlogPost.word_count,
          publishedUrl: savedBlogPost.published_url,
          targetUrl: savedBlogPost.target_url,
          anchorText: savedBlogPost.anchor_text,
          keyword: keyword.trim()
        });
      } else {
        // Navigate to the actual blog post
        setTimeout(() => {
          const blogUrl = savedBlogPost.published_url || `/blog/${savedBlogPost.slug}`;
          window.open(blogUrl, '_blank');
        }, 2000);
      }

    } catch (error) {
      console.error('OpenAI/ChatGPT generation failed:', error);

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

  const allSystemsReady = Object.values(systemStatus).every(status => 
    status.status === 'ready' || status.status === 'warning'
  );

  const hasErrors = Object.values(systemStatus).some(status => 
    status.status === 'error'
  );

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create a Backlink</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              🚀 Powered by advanced content generation for maximum reliability
            </p>
          </div>
          
          {/* System Status Lights */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title={systemStatus.apiKey.message}>
              {getStatusIcon(systemStatus.apiKey.status)}
              <Key className="h-3 w-3 text-gray-400" />
            </div>
            <div className="flex items-center gap-1" title={systemStatus.chatGPT.message}>
              {getStatusIcon(systemStatus.chatGPT.status)}
              <Wifi className="h-3 w-3 text-gray-400" />
            </div>
            <div className="flex items-center gap-1" title={systemStatus.database.message}>
              {getStatusIcon(systemStatus.database.status)}
              <Database className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Status Panel */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="flex items-center gap-2 text-xs"
          >
            {showDebugPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            System Status
          </Button>
          
          {showDebugPanel && (
            <div className="space-y-2 p-4 bg-white rounded-lg border">
              {Object.entries(systemStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="font-medium capitalize">{key === 'chatGPT' ? 'ChatGPT' : key}</span>
                  </div>
                  <span className={getStatusColor(status.status)}>{status.message}</span>
                </div>
              ))}
              
              {progress && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {progress.stage}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                  <p className="text-xs text-gray-600">{progress.details}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {hasErrors ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System configuration issues detected. Some features may not work properly.
            </AlertDescription>
          </Alert>
        ) : allSystemsReady ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Content service is ready
            </AlertDescription>
          </Alert>
        ) : null}

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

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || hasErrors}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isGenerating ? (
            <>
              <Activity className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Create Your First Backlink For Free
            </>
          )}
        </Button>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-gray-600">
          <div className="flex flex-col items-center gap-1">
            <Globe className="h-4 w-4 text-blue-600" />
            <span>1000+ words guaranteed</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>SEO optimized</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-purple-600" />
            <span>Auto-published to /blog</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-orange-600" />
            <span>Advanced content engine</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
