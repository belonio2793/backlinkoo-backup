/**
 * Enhanced Blog Creation Form
 * Complete form that handles blog creation workflow with database persistence and user management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedBlogWorkflow, type BlogCreationRequest } from '@/services/enhancedBlogWorkflow';
import { InlineSlugEditor } from './InlineSlugEditor';
import { LoginModal } from './LoginModal';
import {
  Sparkles,
  Globe,
  Target,
  Clock,
  User,
  Save,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  RefreshCw,
  Link,
  Hash,
  FileText,
  Star
} from 'lucide-react';

interface EnhancedBlogCreationFormProps {
  onBlogCreated?: (blog: any) => void;
  initialData?: Partial<BlogCreationRequest>;
  variant?: 'full' | 'compact';
  showUserPosts?: boolean;
}

export function EnhancedBlogCreationForm({
  onBlogCreated,
  initialData,
  variant = 'full',
  showUserPosts = true
}: EnhancedBlogCreationFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<BlogCreationRequest>({
    targetUrl: initialData?.targetUrl || '',
    keywords: initialData?.keywords || [],
    primaryKeyword: initialData?.primaryKeyword || '',
    contentType: initialData?.contentType || 'blog',
    tone: initialData?.tone || 'professional',
    wordCount: initialData?.wordCount || 800,
    customSlug: initialData?.customSlug || '',
    title: initialData?.title || '',
    metaDescription: initialData?.metaDescription || '',
    category: initialData?.category || 'General',
    anchorText: initialData?.anchorText || '',
    includeBacklink: initialData?.includeBacklink ?? true,
    autoPublish: initialData?.autoPublish ?? false
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [createdBlog, setCreatedBlog] = useState<any>(null);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // User posts state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // New keyword input
  const [newKeyword, setNewKeyword] = useState('');

  const steps = [
    'Validating Request',
    'Generating AI Content',
    'Processing Content',
    'Creating Permalink',
    'Saving to Database',
    'Finalizing'
  ];

  useEffect(() => {
    if (user && showUserPosts) {
      loadUserPosts();
    }
  }, [user, showUserPosts]);

  const loadUserPosts = async () => {
    if (!user?.id) return;
    
    setLoadingPosts(true);
    try {
      const posts = await EnhancedBlogWorkflow.getUserBlogPosts(user.id);
      setUserPosts(posts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const addKeyword = () => {
    const keyword = newKeyword.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
        primaryKeyword: prev.primaryKeyword || keyword
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
      primaryKeyword: prev.primaryKeyword === keyword ? prev.keywords.find(k => k !== keyword) || '' : prev.primaryKeyword
    }));
  };

  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!formData.targetUrl) {
      return { isValid: false, error: 'Target URL is required' };
    }

    if (formData.keywords.length === 0) {
      return { isValid: false, error: 'At least one keyword is required' };
    }

    try {
      new URL(formData.targetUrl);
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }

    return { isValid: true };
  };

  const simulateProgress = () => {
    let step = 0;
    const interval = setInterval(() => {
      if (step < steps.length) {
        setCurrentStep(step);
        setCurrentStage(steps[step]);
        setProgress(((step + 1) / steps.length) * 100);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return interval;
  };

  const handleSubmit = async (saveImmediately = false) => {
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setIsCreating(true);
    setError('');
    setCreatedBlog(null);
    setProgress(0);
    setCurrentStep(0);

    // Start progress simulation
    const progressInterval = simulateProgress();

    try {
      // Create blog post using enhanced workflow
      const result = await EnhancedBlogWorkflow.createBlogPost(formData, {
        saveToDatabase: true,
        generateSlug: true,
        requireAuth: saveImmediately,
        isTrialPost: !user?.id,
        userId: user?.id
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStage('Complete!');

      if (result.requiresAuth) {
        setShowLoginModal(true);
        setIsCreating(false);
        return;
      }

      if (!result.success) {
        setError(result.error || 'Failed to create blog post');
        setIsCreating(false);
        return;
      }

      // Success!
      setCreatedBlog(result.blogPost);
      
      // Reload user posts if user is authenticated
      if (user?.id) {
        await loadUserPosts();
      }

      // Call callback if provided
      if (onBlogCreated) {
        onBlogCreated(result.blogPost);
      }

      // Show success toast with action buttons
      toast({
        title: "Blog Post Created!",
        description: "Your blog post has been created successfully.",
        action: (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => window.open(result.previewUrl, '_blank')}
              className="bg-blue-600 text-white"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            {result.editUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(result.editUrl!)}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )
      });

    } catch (error) {
      console.error('Blog creation failed:', error);
      setError(`Creation failed: ${error.message}`);
      clearInterval(progressInterval);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUserPostAction = async (action: string, postId: string) => {
    try {
      switch (action) {
        case 'edit':
          navigate(`/blog/${postId}/edit`);
          break;
        case 'view':
          const post = await EnhancedBlogWorkflow.getBlogPost(postId);
          if (post) {
            window.open(`/blog/${post.slug}`, '_blank');
          }
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this blog post?')) {
            await EnhancedBlogWorkflow.deleteBlogPost(postId);
            await loadUserPosts();
            toast({
              title: "Post Deleted",
              description: "Blog post has been deleted successfully."
            });
          }
          break;
        case 'publish':
          await EnhancedBlogWorkflow.publishBlogPost(postId);
          await loadUserPosts();
          toast({
            title: "Post Published",
            description: "Blog post has been published successfully."
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} post:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} post. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const copyBlogUrl = async (blog: any) => {
    const url = `${window.location.origin}/blog/${blog.slug}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Blog URL copied to clipboard."
    });
  };

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Quick Blog Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compact form content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="primaryKeyword">Primary Keyword</Label>
              <Input
                id="primaryKeyword"
                value={formData.primaryKeyword}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                placeholder="Enter main keyword"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => handleSubmit(false)} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Blog Post
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create New Post</TabsTrigger>
          {showUserPosts && user && (
            <TabsTrigger value="manage">My Posts ({userPosts.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Create Blog Post
              </CardTitle>
              <CardDescription>
                Generate a high-quality blog post with AI and save it to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL *</Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                    placeholder="https://example.com"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The website URL you want to link to in your blog post
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
                  <Input
                    id="primaryKeyword"
                    value={formData.primaryKeyword}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                    placeholder="Enter main keyword"
                  />
                  <p className="text-xs text-muted-foreground">
                    Main keyword to focus the content around
                  </p>
                </div>
              </div>

              {/* Keywords Management */}
              <div className="space-y-2">
                <Label>Additional Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button onClick={addKeyword} variant="outline">
                    Add
                  </Button>
                </div>
                
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select 
                    value={formData.contentType} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select 
                    value={formData.tone} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, tone: value }))}
                  >
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

                <div>
                  <Label htmlFor="wordCount">Word Count</Label>
                  <Select 
                    value={formData.wordCount?.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, wordCount: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500 words</SelectItem>
                      <SelectItem value="800">800 words</SelectItem>
                      <SelectItem value="1200">1200 words</SelectItem>
                      <SelectItem value="1500">1500 words</SelectItem>
                      <SelectItem value="2000">2000 words</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Advanced Options</Label>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Custom Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Leave blank for AI generation"
                        />
                      </div>

                      <div>
                        <Label htmlFor="anchorText">Anchor Text</Label>
                        <Input
                          id="anchorText"
                          value={formData.anchorText}
                          onChange={(e) => setFormData(prev => ({ ...prev, anchorText: e.target.value }))}
                          placeholder="Custom link text"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                        placeholder="SEO meta description (leave blank for AI generation)"
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.metaDescription.length}/160 characters
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="includeBacklink">Include Backlink</Label>
                        <p className="text-xs text-muted-foreground">
                          Add a contextual link to your target URL
                        </p>
                      </div>
                      <Switch
                        id="includeBacklink"
                        checked={formData.includeBacklink}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeBacklink: checked }))}
                      />
                    </div>

                    {user && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="autoPublish">Auto Publish</Label>
                          <p className="text-xs text-muted-foreground">
                            Publish immediately after creation
                          </p>
                        </div>
                        <Switch
                          id="autoPublish"
                          checked={formData.autoPublish}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoPublish: checked }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
                </Alert>
              )}

              {/* Progress Display */}
              {isCreating && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="font-medium">Creating your blog post...</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{currentStage}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
                  </div>
                </div>
              )}

              {/* Success Display */}
              {createdBlog && (
                <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Blog post created successfully!</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {createdBlog.title}</div>
                    <div><strong>Word Count:</strong> {createdBlog.word_count}</div>
                    <div><strong>Status:</strong> {createdBlog.status}</div>
                    <div className="flex items-center gap-2">
                      <strong>URL:</strong>
                      <code className="bg-white px-2 py-1 rounded text-xs">
                        /blog/{createdBlog.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyBlogUrl(createdBlog)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(`/blog/${createdBlog.slug}`, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/blog/${createdBlog.id}/edit`)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyBlogUrl(createdBlog)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleSubmit(false)} 
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Blog Post
                    </>
                  )}
                </Button>

                {user && (
                  <Button 
                    variant="outline"
                    onClick={() => handleSubmit(true)} 
                    disabled={isCreating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Permanently
                  </Button>
                )}
              </div>

              {!user && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Guest Mode:</strong> Your blog post will be saved for 24 hours. 
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="ml-1 underline hover:no-underline"
                    >
                      Sign in to save permanently
                    </button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Posts Tab */}
        {showUserPosts && user && (
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    My Blog Posts
                  </span>
                  <Button
                    variant="outline"
                    onClick={loadUserPosts}
                    disabled={loadingPosts}
                  >
                    {loadingPosts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                    <p>Create your first blog post using the form above!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{post.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Status: {post.status}</span>
                            <span>Words: {post.word_count}</span>
                            <span>Views: {post.view_count}</span>
                            <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPostAction('view', post.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPostAction('edit', post.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          {post.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserPostAction('publish', post.id)}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPostAction('delete', post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            // Retry the operation after login
            handleSubmit(true);
          }}
        />
      )}
    </div>
  );
}
