import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import type { Tables } from '@/integrations/supabase/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Icons
import { ArrowLeft, Calendar, Clock, Share2, Copy } from 'lucide-react';

// Other Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

type BlogPost = Tables<'blog_posts'>;

const SimpleBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const cleanTitle = useMemo(() => {
    if (!blogPost?.title) return '';
    
    return blogPost.title
      .replace(/^h\d+[-\s]*/, '') // Remove h1-, h2-, etc. prefixes
      .replace(/[-\s]*[a-z0-9]{8}$/, '') // Remove random suffixes
      .replace(/\s+/g, ' ')
      .trim();
  }, [blogPost?.title]);

  const readingTime = useMemo(() => {
    return blogPost?.reading_time || Math.ceil((blogPost?.content?.length || 0) / 1000);
  }, [blogPost?.content, blogPost?.reading_time]);

  const formattedDate = useMemo(() => {
    if (!blogPost?.created_at) return 'Date unknown';
    try {
      return format(new Date(blogPost.created_at), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  }, [blogPost?.created_at]);

  // Load blog post
  useEffect(() => {
    const loadBlogPost = async () => {
      if (!slug) {
        setError('No blog post slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const post = await blogService.getBlogPostBySlug(slug);
        
        if (!post) {
          setError(`Blog post not found: ${slug}`);
          return;
        }

        setBlogPost(post);
      } catch (error: any) {
        console.error('Failed to load blog post:', error);
        setError(error.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [slug]);

  // Process content for display
  const processedContent = useMemo(() => {
    if (!blogPost?.content) return '';
    
    let content = blogPost.content;
    
    // Remove metadata prefixes
    content = content
      .replace(/Natural Link Integration:\s*/gi, '')
      .replace(/Link Placement:\s*/gi, '')
      .replace(/Anchor Text:\s*/gi, '');
    
    // Remove title duplication if present
    if (cleanTitle) {
      const titleRegex = new RegExp(cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      content = content.replace(titleRegex, '').trim();
    }
    
    // Basic cleanup
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return content;
  }, [blogPost?.content, cleanTitle]);

  const handleShare = async () => {
    if (navigator.share && blogPost) {
      try {
        await navigator.share({
          title: cleanTitle,
          text: blogPost.meta_description || blogPost.excerpt,
          url: window.location.href,
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Blog post URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-lg font-medium text-gray-600">Loading blog post...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Blog Post Not Found</h2>
            <p className="text-gray-600">{error || 'The requested blog post could not be found.'}</p>
            <Button onClick={() => navigate('/blog')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {cleanTitle}
          </h1>

          {blogPost.meta_description && (
            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
              {blogPost.meta_description}
            </p>
          )}

          {/* Meta information */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 border-t border-b border-gray-200 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={blogPost.created_at}>
                {formattedDate}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mb-16">
          <Card className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              {processedContent.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                // Handle numbered lists
                if (/^\d+\.\s/.test(trimmed)) {
                  const items = trimmed.split('\n').filter(item => item.trim());
                  return (
                    <ol key={index} className="my-6 ml-6 space-y-2">
                      {items.map((item, idx) => (
                        <li key={idx} className="text-gray-700">
                          {item.replace(/^\d+\.\s*/, '')}
                        </li>
                      ))}
                    </ol>
                  );
                }

                // Handle bullet lists
                if (/^[-•*]\s/.test(trimmed)) {
                  const items = trimmed.split('\n').filter(item => item.trim());
                  return (
                    <ul key={index} className="my-6 ml-6 space-y-2">
                      {items.map((item, idx) => (
                        <li key={idx} className="text-gray-700">
                          {item.replace(/^[-•*]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Handle headings
                if (/^#{1,6}\s/.test(trimmed)) {
                  const level = (trimmed.match(/^#+/) || [''])[0].length;
                  const text = trimmed.replace(/^#+\s*/, '');
                  const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements;
                  
                  return (
                    <HeadingTag key={index} className="font-bold text-gray-900 mt-8 mb-4">
                      {text}
                    </HeadingTag>
                  );
                }

                // Regular paragraphs
                return (
                  <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </Card>
        </main>

        {/* Keywords */}
        {blogPost.keywords && blogPost.keywords.length > 0 && (
          <Card className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Keywords & Topics</h3>
            <div className="flex flex-wrap gap-2">
              {blogPost.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </Card>
        )}

      </article>

      <Footer />
    </div>
  );
};

export default SimpleBlogPost;
