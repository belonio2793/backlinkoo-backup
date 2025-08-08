import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  User,
  ExternalLink,
  Share2,
  BookOpen,
  TrendingUp,
  Calendar,
  Tag,
  Globe,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContentFormatter } from '@/utils/contentFormatter';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  excerpt: string;
  keywords: string[];
  target_url: string;
  published_url: string;
  status: string;
  is_trial_post: boolean;
  expires_at: string | null;
  view_count: number;
  seo_score: number;
  contextual_links: Array<{ anchor: string; url: string }>;
  reading_time: number;
  word_count: number;
  featured_image: string;
  author_name: string;
  author_avatar: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  user_id: string | null;
}

export function BlogPostViewer() {
  const [searchParams] = useSearchParams();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const slug = searchParams.get('slug');

  useEffect(() => {
    if (!slug) {
      setError('No blog post slug provided');
      setLoading(false);
      return;
    }

    loadBlogPost(slug);
  }, [slug]);

  const loadBlogPost = (slug: string) => {
    try {
      // Try to load from localStorage first
      const blogStorageKey = `blog_post_${slug}`;
      const storedBlogData = localStorage.getItem(blogStorageKey);
      
      if (storedBlogData) {
        const blogData = JSON.parse(storedBlogData);
        setBlogPost(blogData);
        
        // Increment view count
        blogData.view_count = (blogData.view_count || 0) + 1;
        localStorage.setItem(blogStorageKey, JSON.stringify(blogData));
        
        setLoading(false);
        return;
      }

      // If not found in localStorage, show error
      setError('Blog post not found');
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Failed to load blog post');
      setLoading(false);
    }
  };

  const sharePost = async () => {
    if (!blogPost) return;
    
    const shareData = {
      title: blogPost.title,
      text: blogPost.excerpt,
      url: blogPost.published_url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(blogPost.published_url);
        toast({
          title: "✅ Link Copied!",
          description: "Blog post URL copied to clipboard"
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast({
        title: "Share Failed",
        description: "Failed to share the blog post",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog Post Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The blog post you\'re looking for doesn\'t exist or has expired.'}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = blogPost.is_trial_post && blogPost.expires_at && 
                   new Date() > new Date(blogPost.expires_at);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Post Expired</h2>
            <p className="text-gray-600 mb-6">
              This trial blog post has expired. Create an account to keep your posts forever!
            </p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Create New Post
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Generator
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={sharePost}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" onClick={() => window.open(blogPost.target_url, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Target Site
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Blog Post */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {blogPost.is_trial_post && (
          <div className={`mb-6 p-4 rounded-lg ${
            blogPost.user_id ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className={`flex items-center gap-2 ${
              blogPost.user_id ? 'text-green-800' : 'text-amber-800'
            }`}>
              {blogPost.user_id ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium">
                {blogPost.user_id ? 'Claimed' : 'Unclaimed'}
              </span>
              {blogPost.expires_at && !blogPost.user_id && (
                <span className="text-sm">
                  • Expires {new Date(blogPost.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        <article className="bg-white rounded-lg shadow-sm">
          {/* Featured Image */}
          <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-16 w-16 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-medium">SEO-Optimized Content</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {blogPost.author_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(blogPost.published_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {blogPost.reading_time} min read
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {blogPost.word_count} words
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {blogPost.title}
            </h1>

            {/* Meta Description */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {blogPost.meta_description}
            </p>

            <Separator className="mb-8" />

            {/* Blog Content */}
            <div
              className="prose prose-lg max-w-none blog-content
                prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:font-bold prose-strong:text-foreground prose-headings:font-bold
                [&_a]:text-blue-600 [&_a]:opacity-100 [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline
                [&_strong]:font-bold [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{
                __html: ContentFormatter.fixDisplayedHtmlAsText(
                  ContentFormatter.formatBlogContent(
                    ContentFormatter.sanitizeContent(blogPost.content || ''),
                    blogPost.title
                  )
                )
              }}
            />

            <Separator className="my-8" />

            {/* SEO Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">SEO Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {blogPost.seo_score}/100
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Backlinks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {blogPost.contextual_links?.length || 0}
                  </div>
                  <p className="text-sm text-gray-500">Strategic placements</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {blogPost.view_count || 0}
                  </div>
                  <p className="text-sm text-gray-500">Total views</p>
                </CardContent>
              </Card>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Tag className="h-4 w-4 text-gray-400 mr-2" />
              {blogPost.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Backlink Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">🎯 Active Backlinks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 mb-4">
                  This post contains strategic backlinks to your target website:
                </p>
                <div className="space-y-2">
                  {blogPost.contextual_links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <span className="font-medium text-blue-600">"{link.anchor}"</span>
                        <span className="text-gray-500 ml-2">→</span>
                      </div>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium truncate max-w-xs"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </article>
      </main>
    </div>
  );
}
