/**
 * Streamlined Blog Generator
 * Single component that handles the entire blog generation workflow efficiently
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { formatErrorForUI } from '@/utils/errorUtils';
import { EnhancedBlogWorkflow, type BlogCreationRequest } from '@/services/enhancedBlogWorkflow';
import { blogService } from '@/services/blogService';
import { LoginModal } from './LoginModal';
import { 
  Sparkles, 
  Clock, 
  User, 
  Save, 
  Eye, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';

export function StreamlinedBlogGenerator() {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generation state
  const [request, setRequest] = useState<BlogCreationRequest>({
    targetUrl: '',
    keywords: [],
    primaryKeyword: '',
    contentType: 'blog',
    tone: 'professional',
    wordCount: 800
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string>('');
  
  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // User posts state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load user posts when authenticated
  useEffect(() => {
    if (user?.id) {
      loadUserPosts();
    }
  }, [user]);

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

  const handleGenerate = async (saveImmediately = false) => {
    if (!request.targetUrl || (!request.keywords.length && !request.primaryKeyword)) {
      setError('Target URL and at least one keyword are required');
      return;
    }

    // Ensure keywords array includes primary keyword
    const keywords = request.primaryKeyword ?
      [request.primaryKeyword, ...request.keywords.filter(k => k !== request.primaryKeyword)] :
      request.keywords;

    setIsGenerating(true);
    setError('');
    setGeneratedPost(null);

    try {
      const result = await EnhancedBlogWorkflow.createBlogPost(
        {
          ...request,
          keywords,
          primaryKeyword: request.primaryKeyword || keywords[0]
        },
        {
          saveToDatabase: true,
          generateSlug: true,
          requireAuth: saveImmediately,
          isTrialPost: !user?.id,
          userId: user?.id
        }
      );

      if (result.requiresAuth) {
        setShowLoginModal(true);
        return;
      }

      if (!result.success) {
        setError(result.error || 'Failed to generate blog post');
        return;
      }

      setGeneratedPost(result.blogPost!);
      setActiveTab('preview');

      if (saveImmediately && user) {
        await loadUserPosts(); // Refresh user posts
      }

    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const result = await BlogWorkflowManager.savePost(postId);
      
      if (result.requiresAuth) {
        setShowLoginModal(true);
        return;
      }

      if (!result.success) {
        setError(result.error || 'Failed to save post');
        return;
      }

      // Update the generated post and refresh user posts
      if (result.post) {
        setGeneratedPost(result.post);
      }
      await loadUserPosts();
      
    } catch (error: any) {
      setError(error.message || 'Failed to save post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const result = await BlogWorkflowManager.deletePost(postId);
      if (result.success) {
        await loadUserPosts(); // Refresh posts
        if (generatedPost?.id === postId) {
          setGeneratedPost(null);
        }
      } else {
        setError(result.error || 'Failed to delete post');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete post');
    }
  };

  const renderTimeRemaining = (post: BlogPost) => {
    if (post.status !== 'draft' || !post.expiresAt) return null;

    const now = new Date().getTime();
    const expiry = new Date(post.expiresAt).getTime();
    const remaining = expiry - now;

    if (remaining <= 0) return <Badge variant="destructive">Expired</Badge>;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <Badge variant="outline" className="text-orange-600">
        <Clock className="w-3 h-3 mr-1" />
        {hours}h {minutes}m left
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Blog Generator</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate SEO-optimized blog posts with AI. Sign in to save posts permanently, or generate drafts that expire in 24 hours.
        </p>
      </div>

      {/* Auth Status */}
      {user ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Signed in as {user.email}. You can save up to 5 posts permanently.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're browsing as a guest. Posts will expire in 24 hours unless saved.{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => setShowLoginModal(true)}
            >
              Sign in to save posts permanently
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formatErrorForUI(error)}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="manage">My Posts ({userPosts.length})</TabsTrigger>
        </TabsList>

        {/* Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Blog Post</CardTitle>
              <CardDescription>
                Enter your target URL and keywords to generate SEO-optimized content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL *</Label>
                <Input
                  id="targetUrl"
                  placeholder="https://example.com"
                  value={request.targetUrl}
                  onChange={(e) => setRequest(prev => ({ ...prev, targetUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords *</Label>
                <Textarea
                  id="keywords"
                  placeholder="SEO, backlinks, digital marketing"
                  value={request.keywords}
                  onChange={(e) => setRequest(prev => ({ ...prev, keywords: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={request.contentType} onValueChange={(value: any) => setRequest(prev => ({ ...prev, contentType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={request.tone} onValueChange={(value: any) => setRequest(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Word Count</Label>
                  <Select value={request.wordCount?.toString()} onValueChange={(value) => setRequest(prev => ({ ...prev, wordCount: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500 words</SelectItem>
                      <SelectItem value="800">800 words</SelectItem>
                      <SelectItem value="1200">1200 words</SelectItem>
                      <SelectItem value="1500">1500 words</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Generate Draft (24h)
                    </>
                  )}
                </Button>
                
                {user && (
                  <Button 
                    onClick={() => handleGenerate(true)}
                    disabled={isGenerating || userPosts.length >= 5}
                    variant="outline"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Generate & Save
                  </Button>
                )}
              </div>
              
              {userPosts.length >= 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Maximum of 5 saved posts reached. Delete some posts to create new ones.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {generatedPost ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{generatedPost.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {generatedPost.wordCount} words • {generatedPost.keywords}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderTimeRemaining(generatedPost)}
                    <Badge variant={generatedPost.status === 'saved' ? 'default' : 'secondary'}>
                      {generatedPost.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {generatedPost.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                
                {generatedPost.status === 'draft' && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-orange-800">Draft Post</h4>
                        <p className="text-sm text-orange-600">
                          This post will be automatically deleted in {renderTimeRemaining(generatedPost)?.props.children[1]} unless saved.
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleSavePost(generatedPost.id)}
                        disabled={!user || userPosts.length >= 5}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Permanently
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Content Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a blog post to see the preview here.
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  Start Generating
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          {user ? (
            loadingPosts ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading your posts...</p>
                </CardContent>
              </Card>
            ) : userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {post.wordCount} words • Created {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Target: {post.targetUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderTimeRemaining(post)}
                          <Badge variant={post.status === 'saved' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGeneratedPost(post);
                              setActiveTab('preview');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first blog post to get started.
                  </p>
                  <Button onClick={() => setActiveTab('generate')}>
                    Generate Post
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to view and manage your saved blog posts.
                </p>
                <Button onClick={() => setShowLoginModal(true)}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onAuthSuccess={(user) => {
            setShowLoginModal(false);
            // Navigate to dashboard after successful auth
            window.location.href = '/dashboard';
          }}
        />
      )}
    </div>
  );
}
