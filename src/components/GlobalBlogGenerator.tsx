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
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { directOpenAI } from '@/services/directOpenAI';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { WordCountProgress } from './WordCountProgress';
import { contentModerationService } from '@/services/contentModerationService';
import { adminSyncService } from '@/services/adminSyncService';
import { useAuthStatus } from '@/hooks/useAuth';
import { trackBlogGeneration } from '@/hooks/useGuestTracking';

import {
  Globe, Zap, Target, Clock, CheckCircle2, ExternalLink, Sparkles,
  BarChart3, Link2, Settings, RefreshCw, Eye
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

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStatus();

  useEffect(() => {
    loadGlobalStats();
    updateRemainingRequests();
    trackBlogGeneration();
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
    setRemainingRequests(directOpenAI.isConfigured() ? 999 : 0);
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
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
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
      toast({ title: "API Not Available", description: "Check API configuration.", variant: "destructive" });
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

    adminSyncService.trackFreeBacklinkRequest({ ...request });

    const promptTemplates = [
      `Generate a 1000 word article on ${request.primaryKeyword} including the ${request.anchorText || request.primaryKeyword} hyperlinked to ${request.targetUrl}`,
      `Write a 1000 word blog post about ${request.primaryKeyword} with a hyperlinked ${request.anchorText || request.primaryKeyword} linked to ${request.targetUrl}`,
      `Produce a 1000-word reader friendly post on ${request.primaryKeyword} that links ${request.anchorText || request.primaryKeyword} to ${request.targetUrl}`
    ];

    const prompt = `${promptTemplates[Math.floor(Math.random() * promptTemplates.length)]}

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
        const res = await directOpenAI.generateContentWithPrompt(prompt, {
          systemPrompt,
          maxTokens: 3000,
          temperature: 0.7,
          targetUrl: request.targetUrl,
          primaryKeyword: request.primaryKeyword,
          anchorText: request.anchorText
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
          toast({ title: "Generation Failed", description: "Multiple attempts failed. Please try again later.", variant: "destructive" });
          setIsGenerating(false);
          return;
        }
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }

    if (!result) return;

    setProgress(100);
    setGenerationStage('Complete!');

    const uniqueSlug = `${result.slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const blogPost = {
      ...result,
      slug: uniqueSlug,
      published_url: `${window.location.origin}/blog/${uniqueSlug}`,
      is_trial_post: true
    };

    localStorage.setItem(`blog_post_${uniqueSlug}`, JSON.stringify(blogPost));

    const existing = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    localStorage.setItem('all_blog_posts', JSON.stringify([{ ...blogPost }, ...existing]));

    freeBacklinkService.storeFreeBacklink(result);

    setGeneratedPost(blogPost);
    updateRemainingRequests();

    toast({
      title: "Post Generated",
      description: `Your blog post is ready!`,
      action: (
        <Button
          size="sm"
          onClick={() => navigate(`/blog/${uniqueSlug}`)}
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
    <div className="text-sm">
      {/* Insert your full UI code here (form inputs, progress bar, preview modal, etc.) */}
      {/* This drop-in file focuses on the core logic fix. Use your original form & UI code from earlier to plug in around it. */}
    </div>
  );
}
