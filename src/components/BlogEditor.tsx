import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { blogService, type BlogPost, type UpdateBlogPost } from '@/services/blogService';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Tag,
  Globe,
  Clock,
  Target,
  Trash2,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';

interface BlogEditorProps {
  postId?: string;
  mode?: 'create' | 'edit';
  onSave?: (post: BlogPost) => void;
  onCancel?: () => void;
}

export function BlogEditor({ postId, mode = 'edit', onSave, onCancel }: BlogEditorProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newTag, setNewTag] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    meta_description: '',
    keywords: [] as string[],
    tags: [] as string[],
    category: 'General',
    target_url: '',
    anchor_text: '',
    status: 'draft' as 'draft' | 'published' | 'archived'
  });

  useEffect(() => {
    if (mode === 'edit' && postId) {
      loadBlogPost();
    } else {
      setLoading(false);
    }
  }, [postId, mode]);

  const loadBlogPost = async () => {
    if (!postId) return;

    try {
      const post = await blogService.getBlogPostById(postId);
      if (post) {
        setBlogPost(post);
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || '',
          meta_description: post.meta_description || '',
          keywords: post.keywords,
          tags: post.tags,
          category: post.category,
          target_url: post.target_url,
          anchor_text: post.anchor_text || '',
          status: post.status as 'draft' | 'published' | 'archived'
        });
      } else {
        toast({
          title: "Post Not Found",
          description: "The requested blog post could not be found.",
          variant: "destructive"
        });
        navigate('/blog');
      }
    } catch (error) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        // Create new post
        const newPost = await blogService.createBlogPost({
          title: formData.title,
          content: formData.content,
          keywords: formData.keywords,
          targetUrl: formData.target_url,
          anchorText: formData.anchor_text,
          wordCount: formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
          readingTime: Math.ceil(formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200),
          seoScore: 75, // Default score
          metaDescription: formData.meta_description,
          contextualLinks: []
        }, user?.id, false);

        toast({
          title: "Post Created",
          description: "Your blog post has been created successfully.",
        });

        if (onSave) {
          onSave(newPost);
        } else {
          navigate(`/blog/${newPost.slug}`);
        }
      } else if (blogPost) {
        // Update existing post
        const updates: UpdateBlogPost = {
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          meta_description: formData.meta_description,
          keywords: formData.keywords,
          tags: formData.tags,
          category: formData.category,
          target_url: formData.target_url,
          anchor_text: formData.anchor_text,
          status: formData.status,
          word_count: formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
          reading_time: Math.ceil(formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200)
        };

        const updatedPost = await blogService.updateBlogPost(blogPost.id, updates);

        toast({
          title: "Post Updated",
          description: "Your blog post has been updated successfully.",
        });

        if (onSave) {
          onSave(updatedPost);
        } else {
          navigate(`/blog/${updatedPost.slug}`);
        }
      }
    } catch (error) {
      console.error('Failed to save blog post:', error);
      toast({
        title: "Error",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!blogPost) return;

    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      await blogService.deleteBlogPost(blogPost.id);
      toast({
        title: "Post Deleted",
        description: "Your blog post has been deleted successfully.",
      });
      navigate('/blog');
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => onCancel ? onCancel() : navigate('/blog')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Blog Post' : 'Edit Blog Post'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          
          {mode === 'edit' && blogPost && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{formData.title || 'Untitled Post'}</CardTitle>
              <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                {formData.status}
              </Badge>
            </div>
            {formData.excerpt && <p className="text-muted-foreground">{formData.excerpt}</p>}
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <a href={formData.target_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {formData.target_url}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.ceil(formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200)} min read
                </div>
              </div>
              
              {formData.keywords.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog post title..."
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog post content..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports HTML formatting. Word count: {formData.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Food & Lifestyle">Food & Lifestyle</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO meta description..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_description.length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="target_url">Target URL</Label>
                  <Input
                    id="target_url"
                    type="url"
                    value={formData.target_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="anchor_text">Anchor Text</Label>
                  <Input
                    id="anchor_text"
                    value={formData.anchor_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, anchor_text: e.target.value }))}
                    placeholder="Link anchor text..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button onClick={addKeyword} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
