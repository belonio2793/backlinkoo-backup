import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Sparkles,
  Infinity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { blogService } from '@/services/blogService';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function SimpleBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      
      // Try database first, fallback to localStorage
      let post = null;
      try {
        post = await blogService.getBlogPostBySlug(slug);
      } catch (dbError) {
        console.warn('Database lookup failed, trying localStorage fallback:', dbError);
        const localStoragePost = localStorage.getItem(`blog_post_${slug}`);
        if (localStoragePost) {
          post = JSON.parse(localStoragePost);
        }
      }

      setBlogPost(post);
      
      if (!post) {
        toast({
          title: "Blog Post Not Found",
          description: "This blog post may have expired or been removed.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load blog post. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean title function
  const cleanTitle = (title: string): string => {
    if (!title) return '';
    
    return title
      .replace(/^(?:H[1-6]|Title|Heading|Header):\s*/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/^#+\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^(?:Blog post|Article|Post):\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Clean content function with simple processing
  const cleanContent = (content: string): string => {
    if (!content) return '';

    // Remove problematic section headers and format properly
    let cleaned = content
      // Remove section markers
      .replace(/^(Introduction|Section \d+|Conclusion|Call-to-Action):\s*/gim, '')
      .replace(/^(Hook Introduction|Summary|Overview):\s*/gim, '')
      
      // Remove HTML artifacts
      .replace(/\bH[1-6]:\s*/gi, '')
      .replace(/Title:\s*/gi, '')
      .replace(/Hook Introduction:\s*/gi, '')
      
      // Clean up formatting
      .replace(/["=]{2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Convert to simple HTML with proper paragraph structure
    const paragraphs = cleaned.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
      // Handle bold text
      let processed = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      
      // Handle links
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 font-medium">$1</a>');
      
      // Handle headings (convert ### to h3, ## to h2, # to h1)
      if (processed.startsWith('### ')) {
        return `<h3 class="text-xl font-semibold text-gray-900 mb-3 mt-6">${processed.slice(4)}</h3>`;
      } else if (processed.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-8">${processed.slice(3)}</h2>`;
      } else if (processed.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold text-gray-900 mb-6 mt-10">${processed.slice(2)}</h1>`;
      }
      
      // Regular paragraph
      return `<p class="text-gray-700 leading-relaxed mb-6">${processed}</p>`;
    }).join('');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Post Not Found</h1>
            <p className="text-gray-600">This blog post may have expired or been removed.</p>
            <Button onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />

      {/* Blog Post Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/blog')}
            className="group hover:bg-blue-50 border-blue-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Button>
        </div>

        {/* Article Header */}
        <header className="mb-12 text-center">
          <div className="space-y-6">
            {/* Category Badge */}
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium">
              {blogPost.category || 'Expert Content'}
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {cleanTitle(blogPost.title)}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blogPost.published_at || blogPost.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>5 min read</span>
              </div>
              {blogPost.view_count && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{blogPost.view_count} views</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div 
              className="max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: cleanContent(blogPost.content || '') 
              }}
            />
          </CardContent>
        </Card>

        {/* Keywords Section */}
        {blogPost.keywords && blogPost.keywords.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Keywords & Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {blogPost.keywords.map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="px-3 py-1 bg-white/80 border-gray-300 text-gray-700"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Boost Your SEO?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of users creating high-quality backlinks with expert content generation
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Infinity className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      </article>

      <Footer />
    </div>
  );
}
