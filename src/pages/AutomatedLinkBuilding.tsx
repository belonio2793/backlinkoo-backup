import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain,
  Zap,
  Globe,
  BarChart3,
  Target,
  Link2,
  FileText,
  Play,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Copy,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SeamlessSignInModal } from '@/components/SeamlessSignInModal';
import { AutomationTableSetup } from '@/components/AutomationTableSetup';
import { checkAutomationPostsTable } from '@/utils/automationTableSetup';

interface GeneratedPost {
  id: string;
  keyword: string;
  anchor_text: string;
  target_url: string;
  prompt_template: string;
  generated_content: string;
  platform_url?: string;
  platform: string;
  status: 'generating' | 'completed' | 'failed' | 'published';
  created_at: string;
}

const PROMPT_TEMPLATES = [
  {
    id: 'blog_post',
    name: 'Blog Post',
    template: 'Generate a blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}',
    description: 'Creates a comprehensive blog post with natural link integration'
  },
  {
    id: 'article',
    name: 'Article',
    template: 'Write a article about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}',
    description: 'Writes an informative article with embedded links'
  },
  {
    id: 'comment',
    name: 'Comment',
    template: 'Produce a comment on {{keyword}} that links {{anchor_text}} to {{url}}',
    description: 'Creates engaging comments for community platforms'
  }
];

const SUPPORTED_PLATFORMS = [
  { id: 'telegra_ph', name: 'Telegraph', url: 'https://telegra.ph/', description: 'Anonymous publishing platform' },
  { id: 'medium', name: 'Medium', url: 'https://medium.com/', description: 'Professional writing platform' },
  { id: 'dev_to', name: 'Dev.to', url: 'https://dev.to/', description: 'Developer community' },
  { id: 'reddit', name: 'Reddit', url: 'https://reddit.com/', description: 'Community discussions' }
];

export default function AutomatedLinkBuilding() {
  const { user, isAuthenticated } = useAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    target_url: '',
    keyword: '',
    anchor_text: '',
    prompt_template: 'blog_post',
    platform: 'telegra_ph'
  });

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Database table status
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  // Check table status and load generated posts
  useEffect(() => {
    const checkTableAndLoadPosts = async () => {
      // Check if table exists
      const tableCheck = await checkAutomationPostsTable();
      setTableExists(tableCheck.exists);

      // Load posts only if authenticated and table exists
      if (isAuthenticated && user && tableCheck.exists) {
        loadGeneratedPosts();
      }
    };

    checkTableAndLoadPosts();
  }, [user, isAuthenticated]);

  const loadGeneratedPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('automation_posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Handle specific database errors gracefully
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.info('automation_posts table does not exist yet - this is normal on first run');
          setGeneratedPosts([]);
          return;
        }

        // Handle other errors with proper error message extraction
        const errorMessage = error.message || error.details || JSON.stringify(error);
        console.error('Error loading posts:', errorMessage);
        toast.error(`Failed to load posts: ${errorMessage}`);
        return;
      }

      setGeneratedPosts(data || []);
    } catch (error) {
      // Handle unexpected errors with better error message extraction
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);
      console.error('Unexpected error loading posts:', errorMessage);
      toast.error(`Failed to load posts: ${errorMessage}`);
      setGeneratedPosts([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.target_url || !formData.keyword || !formData.anchor_text) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isValidUrl(formData.target_url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Check authentication for content generation
    if (!isAuthenticated) {
      setShowSignInModal(true);
      return;
    }

    // Get the selected template first (outside try block for fallback access)
    const template = PROMPT_TEMPLATES.find(t => t.id === formData.prompt_template);
    if (!template) {
      toast.error('Invalid template selected');
      return;
    }

    try {
      setIsGenerating(true);

      // Create the prompt by replacing placeholders
      const prompt = template.template
        .replace('{{keyword}}', formData.keyword)
        .replace('{{anchor_text}}', formData.anchor_text)
        .replace('{{url}}', formData.target_url);

      console.log('Generated prompt:', prompt);

      // Call our content generation function
      console.log('Calling AI content generator with:', {
        action: 'generate_content',
        user_id: user?.id,
        content_type: formData.prompt_template,
        platform: formData.platform,
        target_url: formData.target_url,
        anchor_text: formData.anchor_text,
        keywords: [formData.keyword]
      });

      const response = await fetch('/.netlify/functions/simple-ai-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generate_content',
          user_id: user?.id,
          content_type: formData.prompt_template,
          platform: formData.platform,
          target_url: formData.target_url,
          anchor_text: formData.anchor_text,
          keywords: [formData.keyword],
          tone: 'professional',
          style: 'educational',
          word_count: 'medium'
        })
      });

      console.log('Response status:', response.status, response.statusText);

      let result;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        // Read response body only once
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
          // Try to parse error response as JSON
          try {
            const errorJson = JSON.parse(responseText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            // If not JSON, use the text response
            if (responseText) {
              errorMessage = responseText.substring(0, 200); // Limit length
            }
          }
          throw new Error(`Content generation failed: ${errorMessage}`);
        }

        // Parse successful response
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error('Invalid JSON response from content generator');
        }
      } catch (readError) {
        if (readError.message.includes('Content generation failed')) {
          throw readError; // Re-throw our custom errors
        }
        throw new Error(`Failed to read response: ${readError.message}`);
      }
      console.log('Content generation result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Content generation failed - no success flag');
      }

      // Create a new post record
      const newPost: GeneratedPost = {
        id: result.content.id,
        keyword: formData.keyword,
        anchor_text: formData.anchor_text,
        target_url: formData.target_url,
        prompt_template: template.name,
        generated_content: result.content.content,
        platform: formData.platform,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      // Save to database
      const { error: saveError } = await supabase
        .from('automation_posts')
        .insert({
          id: newPost.id,
          user_id: user?.id,
          keyword: newPost.keyword,
          anchor_text: newPost.anchor_text,
          target_url: newPost.target_url,
          prompt_template: newPost.prompt_template,
          generated_content: newPost.generated_content,
          platform: newPost.platform,
          status: newPost.status
        });

      if (saveError) {
        // Handle database save errors gracefully
        if (saveError.message?.includes('relation') && saveError.message?.includes('does not exist')) {
          console.warn('automation_posts table does not exist - content generated but not saved to database');
          toast.warning('Content generated successfully! Note: Database table needs to be created to save posts.');
        } else {
          const errorMessage = saveError.message || saveError.details || JSON.stringify(saveError);
          console.error('Error saving post:', errorMessage);
          toast.warning(`Content generated but failed to save: ${errorMessage}`);
        }
      }

      // Attempt to publish to platform
      if (formData.platform === 'telegra_ph') {
        await publishToTelegraph(newPost);
      }

      // Update local state
      setGeneratedPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setFormData({
        target_url: '',
        keyword: '',
        anchor_text: '',
        prompt_template: 'blog_post',
        platform: 'telegra_ph'
      });

      toast.success('Content generated successfully!');

    } catch (error) {
      console.error('Generation error:', error);

      // Fallback: Generate content locally if API fails (including 404, network errors, etc.)
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Content generation failed') ||
        error.message.includes('404') ||
        error.message.includes('500') ||
        error.message.includes('Network Error')
      )) {
        console.log('API failed, generating content locally...');
        try {
          const fallbackContent = generateFallbackContent(formData.keyword, formData.anchor_text, formData.target_url, template.name);

          const newPost: GeneratedPost = {
            id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            keyword: formData.keyword,
            anchor_text: formData.anchor_text,
            target_url: formData.target_url,
            prompt_template: template.name,
            generated_content: fallbackContent,
            platform: formData.platform,
            status: 'completed',
            created_at: new Date().toISOString()
          };

          setGeneratedPosts(prev => [newPost, ...prev]);

          // Reset form
          setFormData({
            target_url: '',
            keyword: '',
            anchor_text: '',
            prompt_template: 'blog_post',
            platform: 'telegra_ph'
          });

          toast.success('Content generated using fallback method!');
          return;
        } catch (fallbackError) {
          console.error('Fallback generation failed:', fallbackError);
        }
      }

      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToTelegraph = async (post: GeneratedPost) => {
    try {
      // Call Telegraph API to publish content
      const response = await fetch('/.netlify/functions/telegraph-publisher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${post.keyword} - Complete Guide`,
          content: post.generated_content,
          author_name: 'Content Automation',
          return_content: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.url) {
          // Update the post with the published URL
          await supabase
            .from('automation_posts')
            .update({ 
              platform_url: result.url,
              status: 'published'
            })
            .eq('id', post.id);

          // Update local state
          setGeneratedPosts(prev => 
            prev.map(p => 
              p.id === post.id 
                ? { ...p, platform_url: result.url, status: 'published' }
                : p
            )
          );

          toast.success('Content published to Telegraph!');
        }
      }
    } catch (error) {
      console.error('Telegraph publishing error:', error);
      // Don't show error to user as this is a bonus feature
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generateFallbackContent = (keyword: string, anchorText: string, targetUrl: string, templateName: string): string => {
    const templates = {
      'Blog Post': `# The Complete Guide to ${keyword}

${keyword} has become increasingly important in today's digital landscape. Understanding the fundamentals and best practices can significantly impact your success.

## Key Benefits

When implementing effective ${keyword} strategies, businesses typically see:

- Improved performance metrics
- Better audience engagement
- Enhanced brand visibility
- Stronger competitive positioning

## Getting Started

The first step in mastering ${keyword} is to understand your target audience. Research their needs, preferences, and pain points to create more targeted approaches.

For comprehensive insights and advanced strategies, you can explore [${anchorText}](${targetUrl}) which provides detailed guidance on implementation.

## Best Practices

Here are some proven strategies for ${keyword}:

1. **Focus on Quality**: Always prioritize quality over quantity in your efforts.
2. **Stay Consistent**: Regular, consistent efforts yield better long-term results.
3. **Monitor Performance**: Track key metrics to understand what's working.
4. **Adapt and Improve**: Be ready to adjust your approach based on data.

## Conclusion

Success with ${keyword} requires patience, consistency, and continuous learning. By following these guidelines and staying up-to-date with industry trends, you'll be well-positioned to achieve your goals.`,

      'Article': `# Understanding ${keyword}: Key Insights

${keyword} is essential for anyone looking to improve their results in this area. This article explores the key concepts and practical applications.

## Overview

${keyword} encompasses various strategies and techniques that can drive meaningful outcomes. The key is to approach it systematically and with clear objectives.

## Implementation Strategy

To get started with ${keyword}, consider these steps:

- Research current trends and best practices
- Define your specific goals and metrics
- Develop a structured plan of action
- Execute consistently and monitor results

For additional resources and expert guidance, check out [${anchorText}](${targetUrl}).

## Expected Outcomes

When done correctly, ${keyword} can lead to significant improvements in performance and results. Many professionals report positive changes within the first few months of implementation.`,

      'Comment': `Great insights on ${keyword}! I've been working in this space for a while and can definitely confirm that the strategies mentioned here are effective.

One thing I'd add is the importance of staying consistent with your efforts. ${keyword} isn't something where you see results overnight, but with patience and the right approach, the results can be impressive.

For those looking for more detailed guidance, I've found [${anchorText}](${targetUrl}) to be a valuable resource with practical tips and strategies.

Has anyone else here tried implementing these techniques? I'd love to hear about your experiences!`
    };

    return templates[templateName as keyof typeof templates] || templates['Blog Post'];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Content Automation</h1>
          <p className="text-gray-600 text-lg">Generate and publish content with ChatGPT 3.5 Turbo</p>

          {/* User State Info */}
          {!isAuthenticated && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Limited Access Mode</span>
              </div>
              <p className="text-sm text-yellow-700">
                You can explore all features, but content generation requires sign-in.
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="font-medium underline hover:text-yellow-800 transition-colors"
                >
                  Sign in to generate unlimited content and save your posts.
                </button>
              </p>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Full Access Active</span>
              </div>
              <p className="text-sm text-green-700">
                Welcome back! You have access to all automation features including content generation,
                publishing, and post management.
              </p>
            </div>
          )}
        </div>

        {/* Database Table Setup - Show if authenticated but table doesn't exist */}
        {isAuthenticated && tableExists === false && (
          <div className="max-w-4xl mx-auto mb-6">
            <AutomationTableSetup
              onTableReady={() => {
                setTableExists(true);
                loadGeneratedPosts();
              }}
            />
          </div>
        )}

        <Tabs defaultValue="generator" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generator">Content Generator</TabsTrigger>
            <TabsTrigger value="reporting">Generated Posts</TabsTrigger>
          </TabsList>

          {/* Content Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Content Generation Setup
                  </CardTitle>
                  <CardDescription>Configure your automated content generation</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="target-url">Target Destination URL *</Label>
                      <Input
                        id="target-url"
                        type="url"
                        value={formData.target_url}
                        onChange={(e) => {
                          let url = e.target.value;
                          // Auto-format URL if it doesn't start with http:// or https://
                          if (url && !url.match(/^https?:\/\//)) {
                            url = `https://${url}`;
                          }
                          setFormData({ ...formData, target_url: url });
                        }}
                        placeholder="https://yourwebsite.com/page"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="keyword">Keyword *</Label>
                      <Input
                        id="keyword"
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        placeholder="digital marketing"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="anchor-text">Anchor Text *</Label>
                      <Input
                        id="anchor-text"
                        value={formData.anchor_text}
                        onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
                        placeholder="best SEO tools"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="prompt-template">Content Type</Label>
                      <Select 
                        value={formData.prompt_template} 
                        onValueChange={(value) => setFormData({ ...formData, prompt_template: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROMPT_TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} - {template.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="platform">Target Platform</Label>
                      <Select 
                        value={formData.platform} 
                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.name} - {platform.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type={isAuthenticated ? "submit" : "button"}
                      onClick={!isAuthenticated ? () => setShowSignInModal(true) : undefined}
                      className="w-full"
                      disabled={isGenerating}
                      variant={!isAuthenticated ? "outline" : "default"}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Content...
                        </>
                      ) : !isAuthenticated ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Sign In to Generate Content
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Prompt Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Generated Prompt:</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700">
                          {formData.keyword && formData.anchor_text && formData.target_url
                            ? PROMPT_TEMPLATES
                                .find(t => t.id === formData.prompt_template)
                                ?.template
                                .replace('{{keyword}}', formData.keyword)
                                .replace('{{anchor_text}}', formData.anchor_text)
                                .replace('{{url}}', formData.target_url)
                            : 'Fill in the form to see the generated prompt'
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Platform Info:</Label>
                      <div className="mt-2">
                        {SUPPORTED_PLATFORMS
                          .filter(p => p.id === formData.platform)
                          .map(platform => (
                            <div key={platform.id} className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">{platform.name}</span>
                              <a 
                                href={platform.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Template Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Available Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PROMPT_TEMPLATES.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <h3 className="font-medium mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        {template.template}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporting Tab */}
          <TabsContent value="reporting" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Total Generated</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {!isAuthenticated ? '-' : generatedPosts.length}
                  </p>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500">Sign in to view</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Published</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {!isAuthenticated ? '-' : generatedPosts.filter(p => p.status === 'published').length}
                  </p>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500">Sign in to view</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Active Links</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {!isAuthenticated ? '-' : generatedPosts.filter(p => p.platform_url).length}
                  </p>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500">Sign in to view</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {!isAuthenticated ? '-' : generatedPosts.filter(p =>
                      new Date(p.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500">Sign in to view</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generated Posts List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Posts</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadGeneratedPosts}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading posts...</span>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center p-8">
                    <div className="mb-4">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In to View Your Posts</h3>
                      <p className="text-gray-600 mb-4">
                        Your generated content and post history will appear here after you sign in.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                      <h4 className="font-medium mb-3">Features Available After Sign In:</h4>
                      <ul className="text-sm text-gray-600 space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Generate unlimited content with ChatGPT 3.5 Turbo
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Automatic publishing to Telegraph and other platforms
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Track all your generated posts and URLs
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Copy content and URLs with one click
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Performance analytics and reporting
                        </li>
                      </ul>
                      <Button
                        onClick={() => setShowSignInModal(true)}
                        className="w-full mt-4"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Sign In to Get Started
                      </Button>
                    </div>
                  </div>
                ) : generatedPosts.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No posts generated yet. Use the Content Generator to create your first post.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedPosts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-1">{post.keyword}</h3>
                            <p className="text-sm text-gray-600">
                              <strong>Anchor:</strong> {post.anchor_text} → {post.target_url}
                            </p>
                            <p className="text-sm text-gray-500">
                              <strong>Template:</strong> {post.prompt_template} | 
                              <strong> Platform:</strong> {post.platform}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            {post.platform_url && (
                              <a 
                                href={post.platform_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {post.generated_content.substring(0, 200)}...
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {new Date(post.created_at).toLocaleDateString()} at{' '}
                            {new Date(post.created_at).toLocaleTimeString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.generated_content)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Content
                            </Button>
                            {post.platform_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(post.platform_url!)}
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                Copy URL
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />

      {/* Seamless Sign-In Modal */}
      <SeamlessSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onAuthSuccess={(user) => {
          console.log('Authentication successful:', user);
          toast.success('Welcome! You can now generate content.');
          // The auth context will automatically update, so we don't need to manually refresh
          setTimeout(() => {
            // Small delay to let the auth context update
            setShowSignInModal(false);
          }, 500);
        }}
        preservedAction="generate content with your settings"
        title="Continue Your Workflow"
        description="Sign in to generate content"
      />
    </div>
  );
}
