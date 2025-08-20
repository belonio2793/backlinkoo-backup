// GlobalBlogGenerator.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { openAIService } from '@/services/api/openai';
import { blogService, BlogPostGenerationData } from '@/services/blogService';

import { WordCountProgress } from './WordCountProgress';
import { contentModerationService } from '@/services/contentModerationService';
import { adminSyncService } from '@/services/adminSyncService';
import { useAuth } from '@/hooks/useAuth';

import { SlugPreview } from './SlugPreview';

import {
  Globe, Zap, Target, Clock, CheckCircle2, ExternalLink, Sparkles,
  BarChart3, Link2, Settings, RefreshCw, Eye, Terminal, Code
} from 'lucide-react';

interface GlobalBlogRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  sessionId: string;
  additionalContext?: {
    industry?: string;
    contentTone: 'professional' | 'casual' | 'technical' | 'friendly';
    contentLength: 'short' | 'medium' | 'long';
    seoFocus: 'high' | 'medium' | 'balanced';
  };
}

interface GlobalBlogGeneratorProps {
  onSuccess?: (blogPost: any) => void;
  variant?: 'homepage' | 'blog' | 'embedded';
  showAdvancedOptions?: boolean;
}

export function GlobalBlogGenerator({
  onSuccess,
  variant = 'homepage',
  showAdvancedOptions = false
}: GlobalBlogGeneratorProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');

  const [industry, setIndustry] = useState('');
  const [contentTone, setContentTone] = useState<'professional' | 'casual' | 'technical' | 'friendly'>('professional');
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [seoFocus, setSeoFocus] = useState<'high' | 'medium' | 'balanced'>('high');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [remainingRequests, setRemainingRequests] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'content' | 'seo' | 'links'>('content');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [promptIndex, setPromptIndex] = useState<number>(0);

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Define the exact prompt templates as requested
  const basePromptTemplates = [
    "Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
    "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
    "Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}"
  ];

  // Function to preview prompt with current inputs
  const getPromptPreview = () => {
    if (!primaryKeyword.trim() || !targetUrl.trim()) return '';

    const randomIndex = Math.floor(Math.random() * basePromptTemplates.length);
    const template = basePromptTemplates[randomIndex];
    return {
      template,
      index: randomIndex,
      formatted: template
        .replace('{{keyword}}', primaryKeyword.trim())
        .replace('{{anchor_text}}', anchorText.trim() || primaryKeyword.trim())
        .replace('{{url}}', targetUrl.trim())
    };
  };

  useEffect(() => {
    loadGlobalStats();
    updateRemainingRequests();

  }, []);

  const loadGlobalStats = () => {
    try {
      const allPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const today = new Date().toDateString();
      const postsToday = allPosts.filter((post: any) => new Date(post.created_at).toDateString() === today).length;
      setGlobalStats({ totalPosts: allPosts.length, postsToday });
    } catch {
      setGlobalStats({ totalPosts: 0, postsToday: 0 });
    }
  };

  const updateRemainingRequests = () => {
    setRemainingRequests(999); // Server-side API key management
  };

  const formatUrl = (url: string): string => {
    const trimmed = url.trim();
    if (/^https?:\/\//.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const validateForm = (): boolean => {
    if (!targetUrl.trim() || !primaryKeyword.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please provide both a target URL and a primary keyword.",
        variant: "destructive"
      });
      return false;
    }

    const formatted = formatUrl(targetUrl);
    try {
      new URL(formatted);
      if (formatted !== targetUrl) setTargetUrl(formatted);
    } catch {
      toast.error("Invalid URL - Please enter a valid URL.");
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    const moderation = await contentModerationService.moderateContent(
      `${targetUrl} ${primaryKeyword} ${anchorText || ''}`,
      targetUrl, primaryKeyword, anchorText, undefined, 'blog_request'
    );

    if (!moderation.allowed) {
      toast({
        title: moderation.requiresReview ? "Submitted for Review" : "Content Blocked",
        description: moderation.requiresReview
          ? "Your request is under review and will be published upon approval."
          : "Your input violates content policy. Please revise.",
        variant: "destructive"
      });
      return;
    }

    if (remainingRequests <= 0) {
      toast.error("API Not Available - Check API configuration.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationStage('Initializing...');

    const sessionId = crypto.randomUUID();
    const request: GlobalBlogRequest = {
      targetUrl: formatUrl(targetUrl),
      primaryKeyword: primaryKeyword.trim(),
      anchorText: anchorText.trim() || undefined,
      sessionId,
      additionalContext: showAdvancedOptions ? {
        industry: industry || undefined,
        contentTone,
        contentLength,
        seoFocus
      } : undefined
    };



    const promptTemplates = [
      `Generate a 1000 word blog post on ${request.primaryKeyword} including the ${request.anchorText || request.primaryKeyword} hyperlinked to ${request.targetUrl}`,
      `Write a 1000 word blog post about ${request.primaryKeyword} with a hyperlinked ${request.anchorText || request.primaryKeyword} linked to ${request.targetUrl}`,
      `Produce a 1000-word blog post on ${request.primaryKeyword} that links ${request.anchorText || request.primaryKeyword}`
    ];

    // Select and track prompt
    const selectedIndex = Math.floor(Math.random() * promptTemplates.length);
    const selectedTemplate = promptTemplates[selectedIndex];
    setPromptIndex(selectedIndex);
    setSelectedPrompt(selectedTemplate);

    console.log(`🎯 Selected Prompt Template ${selectedIndex + 1}:`, selectedTemplate);

    const prompt = `${selectedTemplate}

IMPORTANT REQUIREMENTS:
- Write exactly 1000 words or more of high-quality, original content
- Use ${contentTone} tone
- Include actionable advice, stats, examples
- Structure with H1, H2, H3, H4 headings
- Include relevant HTML and hyperlink naturally
- End with a helpful conclusion

Return clean HTML content optimized for SEO.`;

    let result;
    const systemPrompt = 'You are an expert SEO content writer.';
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      try {
        setGenerationStage(`Generating content... Attempt ${i + 1}`);
        const res = await openAIService.generateContent(prompt, {
          systemPrompt,
          maxTokens: 3000,
          temperature: 0.7
        });

        if (res.success && res.content) {
          const wordCount = res.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          if (wordCount >= 1000) {
            result = {
              id: crypto.randomUUID(),
              title: `Complete Guide to ${request.primaryKeyword}`,
              slug: request.primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              content: res.content,
              metaDescription: `Comprehensive ${request.primaryKeyword} guide.`,
              keywords: [request.primaryKeyword, `${request.primaryKeyword} guide`],
              targetUrl: request.targetUrl,
              anchorText: request.anchorText || request.primaryKeyword,
              wordCount,
              readingTime: Math.ceil(wordCount / 200),
              seoScore: wordCount >= 800 ? 95 : wordCount >= 600 ? 85 : 75,
              status: 'unclaimed' as const,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
              claimed: false,
              usage: res.usage,
              provider: res.provider || 'openai',
              fallbacksUsed: res.fallbacksUsed || false
            };
            break;
          }
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          toast.error("Generation Failed - Multiple attempts failed. Please try again later.");
          setIsGenerating(false);
          return;
        }
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }

    if (!result) return;

    setProgress(100);
    setGenerationStage('Complete!');

    // Save to Supabase using blog service
    try {
      const blogPostData: BlogPostGenerationData = {
        title: result.title,
        content: result.content,
        keywords: result.keywords,
        targetUrl: result.targetUrl,
        anchorText: result.anchorText,
        wordCount: result.wordCount,
        readingTime: result.readingTime,
        seoScore: result.seoScore,
        metaDescription: result.metaDescription,
        contextualLinks: []
      };

      const blogPost = await blogService.createBlogPost(
        blogPostData,
        user?.id, // Use current user ID if logged in
        !user?.id // Is trial post if user not logged in
      );

      // For backward compatibility, also store slug in localStorage
      localStorage.setItem(`latest_blog_slug`, blogPost.slug);



      setGeneratedPost(blogPost);
    } catch (error) {
      console.error('Failed to save blog post to database:', error);
      toast({
        title: "Save Warning",
        description: "Post generated but may not be permanently saved. Please try again.",
        variant: "destructive"
      });
      // Fallback to original behavior
      const uniqueSlug = `${result.slug}-${Date.now().toString(36)}`;
      const fallbackPost = {
        ...result,
        slug: uniqueSlug,
        published_url: `${window.location.origin}/blog/${uniqueSlug}`,
        is_trial_post: true
      };
      setGeneratedPost(fallbackPost);
    }
    updateRemainingRequests();

    toast({
      title: "Post Generated",
      description: `Your blog post is ready!`,
      action: (
        <Button
          size="sm"
          onClick={() => navigate(`/blog/${generatedPost?.slug}`)}
          className="bg-purple-600 text-white"
        >
          View Post
        </Button>
      )
    });

    adminSyncService.trackBlogGenerated({
      sessionId: request.sessionId,
      blogSlug: result.slug,
      targetUrl: request.targetUrl,
      primaryKeyword: request.primaryKeyword,
      seoScore: result.seoScore,
      generationTime: 45,
      isTrialPost: true,
      expiresAt: result.expiresAt
    });

    onSuccess?.(blogPost);
    if (variant === 'blog') navigate(`/blog/${uniqueSlug}`);
    setIsGenerating(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Global Blog Generator
          {globalStats && (
            <Badge variant="secondary">
              {globalStats.totalPosts} posts created
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target URL *</Label>
            <Input
              id="targetUrl"
              placeholder="https://yourwebsite.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
            <Input
              id="primaryKeyword"
              placeholder="e.g., digital marketing"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="anchorText">Anchor Text (Optional)</Label>
          <Input
            id="anchorText"
            placeholder="e.g., learn more about digital marketing"
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Prompt Preview */}
        {primaryKeyword.trim() && targetUrl.trim() && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                Prompt Preview (Random Selection)
              </span>
            </div>

            {(() => {
              const preview = getPromptPreview();
              if (!preview) return null;

              return (
                <div className="space-y-3">
                  {/* Template Selection */}
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Template {preview.index + 1} of {basePromptTemplates.length}:
                  </div>
                  <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                    {preview.template}
                  </div>

                  {/* User Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-600 mb-1">keyword:</div>
                      <div className="font-mono text-slate-800">"{primaryKeyword}"</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-purple-600 mb-1">anchor_text:</div>
                      <div className="font-mono text-slate-800">"{anchorText || primaryKeyword}"</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-green-600 mb-1">url:</div>
                      <div className="font-mono text-slate-800 truncate">"{targetUrl}"</div>
                    </div>
                  </div>

                  {/* Final Result */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      Final Prompt → ChatGPT:
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-400 text-sm">
                      <Code className="h-4 w-4 inline mr-2 text-blue-500" />
                      {preview.formatted}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <Select value={contentLength} onValueChange={(value: any) => setContentLength(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (500-800 words)</SelectItem>
                      <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                      <SelectItem value="long">Long (1200+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Industry (Optional)</Label>
                  <Input
                    placeholder="e.g., Technology, Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label>SEO Focus</Label>
                <Select value={seoFocus} onValueChange={(value: any) => setSeoFocus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High SEO Focus</SelectItem>
                    <SelectItem value="medium">Medium SEO Focus</SelectItem>
                    <SelectItem value="balanced">Balanced Approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-2">
                <Label>Content Tone</Label>
                <Select value={contentTone} onValueChange={(value: any) => setContentTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Progress Display */}
        {isGenerating && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium">{generationStage}</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || remainingRequests <= 0}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating Blog Post...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate Blog Post
            </>
          )}
        </Button>

        {/* Stats */}
        {globalStats && (
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>{globalStats.totalPosts} total posts</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{globalStats.postsToday} posts today</span>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && generatedPost && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Content Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Close Preview
              </Button>
            </div>

            <Tabs value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <div className="max-h-60 overflow-y-auto bg-white p-4 rounded border">
                  <h4 className="font-bold text-lg mb-2">{generatedPost.title}</h4>
                  <div className="prose prose-sm max-w-none">
                    {generatedPost.content?.slice(0, 500)}...
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div><strong>Word Count:</strong> {generatedPost.wordCount || 'N/A'}</div>
                    <div><strong>SEO Score:</strong> {generatedPost.seoScore || 'N/A'}</div>
                  </div>

                  <div className="pt-4 border-t">
                    <SlugPreview
                      title={generatedPost.title}
                      keywords={generatedPost.keywords || []}
                      slug={generatedPost.slug}
                      showActions={true}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Backlink URL:</strong> {generatedPost.targetUrl}</div>
                  <div><strong>Anchor Text:</strong> {generatedPost.anchorText}</div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
