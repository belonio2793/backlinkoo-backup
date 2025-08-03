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
  Mail,
  TrendingUp,
  Users,
  MessageCircle,
  ExternalLink,
  Star,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function EliteBlogTemplate() {
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
  const [engagementScore, setEngagementScore] = useState(92);

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
      return `<${HeadingTag} id="${id}" class="scroll-mt-32 group relative">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-100 transition-all duration-300 ml-3 text-blue-500 hover:text-blue-600 hover:scale-110">#</a></${HeadingTag}>`;
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
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-4/5"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-3/5"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
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
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg">The blog post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/blog')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl">
              <ArrowLeft className="h-5 w-5 mr-2" />
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
      
      {/* Enhanced Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-2 bg-gray-100/80 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
          style={{ width: `${readingProgress}%` }}
        >
          <div className="absolute right-0 top-0 h-full w-2 bg-white/50 rounded-full"></div>
        </div>
      </div>

      {/* Floating Engagement Metrics */}
      <div className="fixed right-6 top-24 z-40 space-y-3 hidden lg:block">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold">Quality Score</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{engagementScore}%</div>
              <div className="text-xs text-gray-500">Expert Content</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <main className="container mx-auto px-6 py-12">
        <article className="max-w-5xl mx-auto">
          {/* Enhanced Article Header */}
          <header className="mb-16 relative">
            <div className="flex items-center gap-3 mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Blog
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            </div>

            <div className="space-y-8">
              {/* Premium Title Design */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 blur-3xl"></div>
                <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    {blogPost.title}
                  </span>
                </h1>
              </div>

              {/* Premium Excerpt */}
              {blogPost.excerpt && (
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <p className="text-2xl text-gray-700 leading-relaxed max-w-4xl font-light pl-8">
                    {blogPost.excerpt}
                  </p>
                </div>
              )}

              {/* Enhanced Author & Meta Section */}
              <div className="flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${blogPost.author || 'Author'}`} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold">
                      {(blogPost.author || 'A')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{blogPost.author || 'Expert Author'}</p>
                    <p className="text-gray-600">Senior Content Strategist</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">Verified Expert</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{format(new Date(blogPost.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{readingTime} min read</span>
                  </div>
                  {blogPost.views && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      <span className="font-medium">{blogPost.views.toLocaleString()} views</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-6">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="lg"
                  onClick={toggleLike}
                  className={`${isLiked ? "bg-red-500 hover:bg-red-600 text-white" : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"} transition-all duration-300`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Loved' : 'Love'}
                </Button>

                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="lg"
                  onClick={toggleBookmark}
                  className={`${isBookmarked ? "bg-blue-500 hover:bg-blue-600 text-white" : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"} transition-all duration-300`}
                >
                  <Bookmark className={`h-5 w-5 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>

                <Button variant="outline" size="lg" onClick={copyToClipboard} className="hover:bg-gray-50">
                  <Copy className="h-5 w-5 mr-2" />
                  Share Link
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="lg" onClick={() => handleShare('twitter')} className="hover:bg-blue-50 hover:text-blue-600">
                    <Twitter className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => handleShare('linkedin')} className="hover:bg-blue-50 hover:text-blue-600">
                    <Linkedin className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => handleShare('facebook')} className="hover:bg-blue-50 hover:text-blue-600">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Enhanced Table of Contents - Sticky Sidebar */}
            {tableOfContents.length > 0 && (
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <div className="sticky top-32">
                  <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        Table of Contents
                      </h3>
                      <nav className="space-y-3">
                        {tableOfContents.map((heading, index) => (
                          <a
                            key={index}
                            href={`#${heading.id}`}
                            className={`block text-sm transition-all duration-300 py-3 px-4 border-l-4 rounded-r-lg ${
                              activeSection === heading.id
                                ? 'border-blue-500 text-blue-600 bg-blue-50 font-semibold transform translate-x-2'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 hover:translate-x-1'
                            } ${heading.level === 3 ? 'ml-6' : ''}`}
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

            {/* Enhanced Main Content */}
            <div className={`${tableOfContents.length > 0 ? 'lg:col-span-4' : 'lg:col-span-5'} order-1 lg:order-2`}>
              <div className="prose prose-xl prose-blue max-w-none elite-blog-content">
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

          {/* Enhanced Article Footer */}
          <footer className="mt-24 pt-12 border-t-2 border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-12 mb-12">
              <div className="text-center space-y-6">
                <h3 className="text-3xl font-bold text-gray-900">Found this valuable?</h3>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">Share this expert insight with your network and help others discover this premium content.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button onClick={() => handleShare('twitter')} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl">
                    <Twitter className="h-5 w-5 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button onClick={() => handleShare('linkedin')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl">
                    <Linkedin className="h-5 w-5 mr-2" />
                    Share on LinkedIn
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" className="border-2 px-8 py-3 rounded-xl">
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </article>
      </main>

      {/* Enhanced Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 rounded-full w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
          size="icon"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}

      <Footer />
    </div>
  );
}
