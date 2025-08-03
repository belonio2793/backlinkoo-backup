import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  Share2,
  Copy,
  BookOpen,
  Target,
  TrendingUp,
  User,
  CheckCircle2,
  Heart,
  MessageCircle,
  Bookmark,
  Twitter,
  Linkedin,
  Facebook,
  ChevronUp,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function BeautifulBlogTemplate() {
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
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      // Reading progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));

      // Show back to top button
      setShowBackToTop(scrollTop > 500);

      // Active section tracking
      const sections = document.querySelectorAll('h2[id], h3[id]');
      let current = '';
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          current = section.id;
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      const post = await blogService.getBlogPostBySlug(slug);
      setBlogPost(post);
    } catch (error: any) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "URL Copied!",
        description: "Blog post URL copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const sharePost = async (platform?: string) => {
    const url = window.location.href;
    const title = blogPost?.title || '';
    const text = blogPost?.meta_description || '';

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Post removed from your favorites" : "Post added to your favorites",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Bookmarked",
      description: isBookmarked ? "Post removed from bookmarks" : "Post saved to bookmarks",
    });
  };

  // Extract table of contents from content
  const generateTableOfContents = (content: string) => {
    const headingRegex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>([^<]+)<\/h[2-3]>/g;
    const toc: Array<{ level: number; id: string; text: string }> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      toc.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3]
      });
    }

    return toc;
  };

  // Process content to add IDs to headings
  const processContent = (content: string) => {
    return content.replace(/<h([2-6])([^>]*)>([^<]+)<\/h[2-6]>/g, (match, level, attrs, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Loading article...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The requested article could not be found.
              </p>
              <Button onClick={() => navigate('/blog')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const processedContent = processContent(blogPost.content);
  const tableOfContents = generateTableOfContents(processedContent);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Blog Navigation */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                Like
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBookmark}
                className={`${isBookmarked ? 'text-blue-500 hover:text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`} />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => sharePost()}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Desktop Sidebar */}
          {tableOfContents.length > 0 && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card className="p-4 bg-gray-50/50 border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {tableOfContents.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        className={`block text-sm py-1 px-2 rounded transition-colors duration-200 ${
                          item.level === 2 ? 'font-medium' : 'ml-4 text-gray-600'
                        } ${
                          activeSection === item.id 
                            ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-500' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </Card>
              </div>
            </div>
          )}

          {/* Main Content */}
          <article className={`${tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-8`}>
            {/* Article Header */}
            <header className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {blogPost.category || 'Article'}
                </Badge>
                {blogPost.claimed && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified Content
                  </Badge>
                )}
                {(blogPost.seo_score || 0) > 80 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    High Quality SEO
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {blogPost.title}
              </h1>
              
              {blogPost.meta_description && (
                <p className="text-xl text-gray-600 leading-relaxed font-light">
                  {blogPost.meta_description}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 border-y border-gray-100 py-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Backlink ∞</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(blogPost.created_at), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{blogPost.reading_time || 5} min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{blogPost.view_count || 0} views</span>
                </div>
              </div>

              {/* Target URL Card */}
              {blogPost.target_url && (
                <Card className="p-4 bg-blue-50/50 border-blue-100">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">Reference URL</p>
                      <a
                        href={blogPost.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-sm"
                      >
                        {blogPost.target_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </Card>
              )}
            </header>

            {/* Article Content */}
            <div className="article-content">
              <div
                className="prose prose-lg max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12
                prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
                prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
                prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6
                prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-em:text-gray-800 prose-em:italic
                prose-ul:my-6 prose-ol:my-6 prose-li:mb-2 prose-li:text-gray-700
                prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50/50 
                prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-gray-800
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </div>

            {/* Keywords Section */}
            {blogPost.keywords && blogPost.keywords.length > 0 && (
              <Card className="p-6 bg-gray-50/50 border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blogPost.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-100">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Social Share Section */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-gray-900">Share this article</h3>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => sharePost('twitter')} className="bg-white hover:bg-gray-50">
                    <Twitter className="h-4 w-4 mr-2 text-blue-500" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => sharePost('linkedin')} className="bg-white hover:bg-gray-50">
                    <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => sharePost('facebook')} className="bg-white hover:bg-gray-50">
                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="bg-white hover:bg-gray-50">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </Card>
          </article>
        </div>
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}

      <Footer />
    </div>
  );
}
