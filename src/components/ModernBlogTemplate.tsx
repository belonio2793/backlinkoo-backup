import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Copy,
  BookOpen,
  Heart,
  Bookmark,
  Twitter,
  Linkedin,
  Facebook,
  ChevronUp,
  Hash,
  Download,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function ModernBlogTemplate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const response = await blogService.getBlogPostBySlug(slug);
        if (response?.success && response.data) {
          setBlogPost(response.data);
          // Calculate reading time (average 200 words per minute)
          const wordCount = response.data.content ? response.data.content.split(' ').length : 0;
          setReadingTime(Math.ceil(wordCount / 200));
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        toast({
          title: "Error",
          description: "Failed to load blog post",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug, toast]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(scrollPercent, 100));
      setShowScrollTop(scrollTop > 400);

      // Update active section based on scroll position
      const headings = document.querySelectorAll('h2[id], h3[id]');
      let current = '';
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 0) {
          current = heading.id;
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const generateTableOfContents = (content: string) => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ level, text, id });
    }

    return headings;
  };

  const processContentWithAnchors = (content: string) => {
    return content.replace(/^(#{2,3})\s+(.+)$/gm, (match, hashes, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const HeadingTag = hashes.length === 2 ? 'h2' : 'h3';
      return `<${HeadingTag} id="${id}" class="scroll-mt-24 group relative">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-blue-500 hover:text-blue-600">#</a></${HeadingTag}>`;
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blogPost?.title || 'Check out this blog post';
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "The blog post URL has been copied to your clipboard."
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Post removed from your favorites" : "Post added to your favorites"
    });
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Bookmark saved",
      description: isBookmarked ? "Post removed from bookmarks" : "Post saved to bookmarks"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/blog')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tableOfContents = generateTableOfContents(blogPost.content || '');
  const processedContent = processContentWithAnchors(blogPost.content || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                {blogPost.title}
              </h1>

              {blogPost.excerpt && (
                <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
                  {blogPost.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${blogPost.author || 'Author'}`} />
                    <AvatarFallback>{(blogPost.author || 'A')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{blogPost.author || 'Anonymous'}</p>
                    <p className="text-sm text-gray-600">Content Creator</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(blogPost.created_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {readingTime} min read
                  </div>
                  {blogPost.views && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {blogPost.views} views
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={toggleLike}
                  className={isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>

                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={toggleBookmark}
                  className={isBookmarked ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>

                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                    <Facebook className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Table of Contents - Sidebar */}
            {tableOfContents.length > 0 && (
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <div className="sticky top-24">
                  <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Table of Contents
                      </h3>
                      <nav className="space-y-2">
                        {tableOfContents.map((heading, index) => (
                          <a
                            key={index}
                            href={`#${heading.id}`}
                            className={`block text-sm transition-colors py-1 border-l-2 pl-3 ${
                              activeSection === heading.id
                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            } ${heading.level === 3 ? 'ml-4' : ''}`}
                          >
                            {heading.text}
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className={`${tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'} order-1 lg:order-2`}>
              <div className="prose prose-lg prose-blue max-w-none modern-blog-content">
                <div
                  dangerouslySetInnerHTML={{
                    __html: processedContent
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => line)
                      .join('\n\n')
                  }}
                />
              </div>
            </div>
          </div>

          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Share this article:</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </footer>
        </article>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}

      <Footer />
    </div>
  );
}
