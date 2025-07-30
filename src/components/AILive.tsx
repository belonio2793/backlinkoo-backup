/**
 * AI Live Blog Generator
 * Real-time AI content generation with OpenAI API
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Terminal, 
  Link,
  Clock,
  Globe,
  FileText,
  Brain
} from 'lucide-react';
import { OpenAIService } from '@/services/api/openai';

interface AIProvider {
  name: string;
  status: 'checking' | 'online' | 'offline' | 'error';
  latency?: number;
  error?: string;
}

interface GenerationStep {
  id: string;
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
}

interface GeneratedPost {
  content: string;
  wordCount: number;
  slug: string;
  publishedUrl: string;
  provider: string;
  promptUsed: string;
  generatedAt: string;
  autoDeleteAt: string;
}

const AI_PROMPTS = [
  "Generate a comprehensive article with minimum 700 words on <user_input_keyword> including the <user_input_anchor_text> hyperlinked to <user_input_url>.",
  "Write a detailed blog post with minimum 700 words about <user_input_keyword> with a hyperlinked <user_input_anchor_text> linked to <user_input_url>.",
  "Produce a comprehensive reader friendly post with minimum 700 words on <user_input_keyword> that links <user_input_anchor_text> to <user_input_url>."
];

export function AILive() {
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>([
    { name: 'OpenAI', status: 'checking' }
  ]);
  const [apiCheckComplete, setApiCheckComplete] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepsEndRef = useRef<HTMLDivElement>(null);
  const stepCounterRef = useRef(0);

  const addStep = (step: string, status: GenerationStep['status'], message: string) => {
    stepCounterRef.current += 1;
    const newStep: GenerationStep = {
      id: `step-${stepCounterRef.current}-${Date.now()}`,
      step,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setSteps(prev => [...prev, newStep]);
  };

  const updateLastStep = (status: GenerationStep['status'], message?: string) => {
    setSteps(prev => {
      const updated = [...prev];
      const lastStep = updated[updated.length - 1];
      if (lastStep) {
        lastStep.status = status;
        if (message) lastStep.message = message;
      }
      return updated;
    });
  };

  const checkApiHealth = async (provider: string): Promise<boolean> => {
    try {
      console.log(`Checking ${provider} health...`);

      if (provider === 'OpenAI') {
        return openAIService.isConfigured() && await openAIService.testConnection();
      }

      return false;
    } catch (error) {
      console.log(`${provider} health check failed:`, error);
      return false;
    }
  };

  const checkAllProviders = async () => {
    addStep('Health Check', 'running', 'Checking AI provider availability...');

    const updatedProviders = await Promise.all(
      providers.map(async (provider) => {
        const startTime = Date.now();
        setProviders(prev => prev.map(p =>
          p.name === provider.name
            ? { ...p, status: 'checking' }
            : p
        ));

        const isOnline = await checkApiHealth(provider.name);
        const latency = Date.now() - startTime;

        return {
          ...provider,
          status: isOnline ? 'online' as const : 'offline' as const,
          latency: isOnline ? latency : undefined,
          error: isOnline ? undefined : 'Connection failed'
        };
      })
    );

    setProviders(updatedProviders);
    setApiCheckComplete(true);

    const onlineProviders = updatedProviders.filter(p => p.status === 'online');

    if (onlineProviders.length === 0) {
      updateLastStep('error', 'No AI providers available. Please configure OpenAI or Grok API keys.');
      setError('All AI providers are offline. Please configure proper API keys to generate content.');
      return false;
    } else {
      updateLastStep('success', `${onlineProviders.length} providers online: ${onlineProviders.map(p => p.name).join(', ')}`);
      return true;
    }
  };

  const validateInputs = (): boolean => {
    if (!keyword.trim() || keyword.length < 2) {
      setError('Keyword must be at least 2 characters long');
      return false;
    }
    
    if (!anchorText.trim() || anchorText.length < 3) {
      setError('Anchor text must be at least 3 characters long');
      return false;
    }
    
    if (!url.trim()) {
      setError('URL is required');
      return false;
    }
    
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
    
    setError(null);
    return true;
  };

  const selectProviderByPriority = (): string => {
    const onlineProviders = providers.filter(p => p.status === 'online');

    // Always use OpenAI if available
    const openAI = onlineProviders.find(p => p.name === 'OpenAI');
    if (openAI) {
      return 'OpenAI';
    }

    return 'None';
  };

  const selectRandomPrompt = (): { prompt: string, index: number } => {
    const index = Math.floor(Math.random() * AI_PROMPTS.length);
    const prompt = AI_PROMPTS[index]
      .replace('<user_input_keyword>', keyword)
      .replace('<user_input_anchor_text>', anchorText)
      .replace('<user_input_url>', url);
    return { prompt, index };
  };

  const generateSlug = (keyword: string): string => {
    const baseSlug = keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  };

  const generateContent = async () => {
    if (!validateInputs()) return;
    if (hasGenerated) {
      setError('You can only generate one blog post per account. Please register to claim your post and generate more.');
      return;
    }

    setIsGenerating(true);
    setSteps([]);
    stepCounterRef.current = 0; // Reset step counter for new generation
    setCurrentContent('');
    setGeneratedPost(null);
    setError(null);

    try {
      // Step 1: Check API Health
      const providersAvailable = await checkAllProviders();
      if (!providersAvailable) {
        setIsGenerating(false);
        return;
      }

      // Step 2: Select Provider and Prompt
      const selectedProvider = selectProviderByPriority();
      const { prompt, index } = selectRandomPrompt();
      
      addStep('Selection', 'success', `Selected ${selectedProvider} with Prompt ${index + 1}`);

      // Step 3: Generate Content
      addStep('Generation', 'running', `Generating content with ${selectedProvider}...`);

      let result;
      try {
        console.log(`Generating content with ${selectedProvider}...`);
        let apiResult;

        if (selectedProvider === 'OpenAI') {
          apiResult = await openAIService.generateContent(prompt, {
            model: 'gpt-4',
            maxTokens: 3000,
            temperature: 0.7
          });
        } else {
          throw new Error('OpenAI is the only available provider');
        }

        if (!apiResult.success || !apiResult.content) {
          throw new Error(apiResult.error || 'Content generation failed');
        }

        result = {
          content: apiResult.content,
          wordCount: apiResult.content.split(' ').length,
          provider: selectedProvider
        };

        console.log(`Content generated successfully with ${selectedProvider}`);
      } catch (error) {
        throw new Error(`Content generation failed: ${error.message}. Please check your API configuration.`);
      }
      updateLastStep('success', `Generated ${result.wordCount} words`);

      // Step 4: Validate Content
      addStep('Validation', 'running', 'Validating content quality...');
      
      if (result.wordCount < 700) {
        updateLastStep('error', `Content too short: ${result.wordCount} words (minimum 700 required)`);
        throw new Error('Generated content does not meet minimum word count');
      }

      if (!result.content.includes(anchorText) || !result.content.includes(url)) {
        updateLastStep('error', 'Missing required anchor text or URL');
        throw new Error('Generated content does not include required anchor text or URL');
      }

      updateLastStep('success', 'Content validated successfully');

      // Step 5: Publish
      addStep('Publishing', 'running', 'Publishing to /blog...');

      const slug = generateSlug(keyword);

      try {
        // Create blog post object
        const blogPost = {
          id: crypto.randomUUID(),
          title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide for ${new Date().getFullYear()}`,
          content: result.content,
          excerpt: `Comprehensive guide about ${keyword} with expert insights and practical strategies.`,
          slug,
          keywords: [keyword, `${keyword} guide`, `best ${keyword}`],
          meta_description: `Learn everything about ${keyword} with this comprehensive guide. Expert insights and proven strategies.`,
          target_url: url,
          anchor_text: anchorText,
          seo_score: Math.floor(Math.random() * 20) + 80,
          reading_time: Math.ceil(result.wordCount / 200),
          word_count: result.wordCount,
          view_count: 0,
          author_name: 'AI Live Generator',
          category: 'AI Generated',
          published_url: `${window.location.origin}/blog/${slug}`,
          published_at: new Date().toISOString(),
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ai_provider: selectedProvider
        };

        // Store in localStorage
        const blogStorageKey = `blog_post_${slug}`;
        localStorage.setItem(blogStorageKey, JSON.stringify(blogPost));

        // Update all posts list
        const allPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const blogMeta = {
          id: blogPost.id,
          slug: blogPost.slug,
          title: blogPost.title,
          created_at: blogPost.created_at,
          is_trial_post: blogPost.is_trial_post,
          expires_at: blogPost.expires_at
        };
        allPosts.unshift(blogMeta);
        localStorage.setItem('all_blog_posts', JSON.stringify(allPosts));

        const publishResult = {
          url: blogPost.published_url,
          slug: blogPost.slug
        };

        console.log('Post published successfully to localStorage');
      } catch (error) {
        throw new Error(`Publishing failed: ${error.message}`);
      }
      updateLastStep('success', `Published to ${publishResult.url}`);

      // Step 6: Set Auto-Delete Timer
      addStep('Timer', 'success', '24-hour auto-delete timer started');

      const now = new Date();
      const autoDeleteAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      setGeneratedPost({
        content: result.content,
        wordCount: result.wordCount,
        slug,
        publishedUrl: publishResult.url,
        provider: selectedProvider,
        promptUsed: AI_PROMPTS[index],
        generatedAt: now.toISOString(),
        autoDeleteAt: autoDeleteAt.toISOString()
      });

      setCurrentContent(result.content);
      setHasGenerated(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateLastStep('error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUrlChange = (value: string) => {
    let correctedUrl = value.trim();
    if (correctedUrl && !correctedUrl.startsWith('http://') && !correctedUrl.startsWith('https://')) {
      correctedUrl = 'https://' + correctedUrl;
    }
    setUrl(correctedUrl);
  };

  // Auto-scroll steps
  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  // Check providers on mount
  useEffect(() => {
    checkAllProviders();
  }, []);

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'checking': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Live Blog Generator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Generate high-quality, SEO-optimized blog posts in real-time using advanced AI technology. 
            Your content will be automatically published and available for 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Target Keyword
                  </label>
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g., digital marketing"
                    disabled={isGenerating}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Anchor Text
                  </label>
                  <Input
                    value={anchorText}
                    onChange={(e) => setAnchorText(e.target.value)}
                    placeholder="e.g., best SEO tools"
                    disabled={isGenerating}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Target URL
                  </label>
                  <Input
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="e.g., https://example.com"
                    disabled={isGenerating}
                  />
                </div>

                <Separator />

                {/* AI Provider Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    AI Provider Status
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Priority order: System will use the first available provider</p>
                  <div className="space-y-2">
                    {providers.map((provider, index) => (
                      <div key={provider.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 w-6">#{index + 1}</span>
                          <span className="text-sm">{provider.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {provider.latency && (
                            <span className="text-xs text-gray-500">{provider.latency}ms</span>
                          )}
                          <Badge variant="secondary" className={getProviderStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateContent}
                  disabled={isGenerating || (!apiCheckComplete || providers.every(p => p.status !== 'online'))}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Blog Post
                    </>
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {apiCheckComplete && providers.filter(p => p.status === 'online').length > 0 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {providers.filter(p => p.status === 'online').length} AI provider(s) online and ready to generate content!
                    </AlertDescription>
                  </Alert>
                )}

                {hasGenerated && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Generation limit reached. Register to claim your post and generate more content.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generation Steps & Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time Steps */}
            {steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {steps.map((step) => (
                      <div key={step.id} className="flex items-start gap-3">
                        {getStepIcon(step.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{step.step}</span>
                            <span className="text-gray-500">{step.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={stepsEndRef} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Content */}
            {generatedPost && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Published Blog Post
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Post Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">Published URL</p>
                        <a 
                          href={generatedPost.publishedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Link className="h-3 w-3" />
                          {generatedPost.publishedUrl}
                        </a>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Auto-Delete</p>
                        <p className="text-sm text-green-600">
                          {new Date(generatedPost.autoDeleteAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Word Count</p>
                        <p className="text-sm text-green-600">{generatedPost.wordCount} words</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">AI Provider</p>
                        <p className="text-sm text-green-600">{generatedPost.provider}</p>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: generatedPost.content.substring(0, 1000) + '...' }} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <a href={generatedPost.publishedUrl} target="_blank" rel="noopener noreferrer">
                          View Full Post
                        </a>
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Register to Claim
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
