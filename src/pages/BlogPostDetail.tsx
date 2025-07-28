/**
 * Blog Post Detail Page - Modern Interface
 * Displays individual AI-generated blog posts with claim functionality
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Zap, 
  Calendar,
  User,
  ExternalLink,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { blogPublishingService, type BlogPost } from '@/services/blogPublishingService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      try {
        const blogPost = await blogPublishingService.getBlogPostBySlug(slug);
        setPost(blogPost);
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Update countdown timer
  useEffect(() => {
    if (!post) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(post.expires_at);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [post]);

  const handleClaimPost = async () => {
    if (!post || !user) {
      toast.error('Please log in to claim this post');
      return;
    }

    setClaiming(true);
    try {
      await blogPublishingService.claimBlogPost(post.id!, user.id);
      setPost({ ...post, status: 'claimed', claimed_by: user.id });
      toast.success('Post claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim post');
      console.error('Error claiming post:', error);
    } finally {
      setClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: `Check out this AI-generated blog post: ${post?.title}`,
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">
            This blog post may have expired or been removed.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(post.expires_at) <= new Date();
  const canClaim = post.status === 'published' && !isExpired && user && post.claimed_by !== user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={sharePost}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(window.location.href)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alerts */}
        {isExpired && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Content Expired:</strong> This blog post has expired and is no longer available for claiming.
            </AlertDescription>
          </Alert>
        )}

        {post.status === 'claimed' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Content Claimed:</strong> This blog post has been claimed by a user and is permanently saved.
            </AlertDescription>
          </Alert>
        )}

        {canClaim && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Claim This Content:</strong> This post will be deleted in {timeRemaining}. 
              <Button 
                variant="link" 
                className="p-0 ml-2 text-blue-600 font-semibold"
                onClick={handleClaimPost}
                disabled={claiming}
              >
                {claiming ? 'Claiming...' : 'Claim it now'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white">
          {/* Article Header */}
          <CardContent className="p-8">
            <header className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge 
                  variant={post.status === 'published' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {post.status}
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>{post.provider.toUpperCase()}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{post.word_count} words</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{post.reading_time} min read</span>
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published {new Date(post.created_at || '').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>SEO Score: {post.seo_score}/100</span>
                </div>
                {post.claimed_by && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Claimed by user</span>
                  </div>
                )}
                {!isExpired && post.status === 'published' && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>Expires in {timeRemaining}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Article Content */}
            <article className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="leading-relaxed text-gray-800"
              />
            </article>

            {/* Footer Actions */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" onClick={sharePost}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>

                {canClaim && (
                  <Button 
                    onClick={handleClaimPost}
                    disabled={claiming}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {claiming ? 'Claiming...' : 'Claim This Post'}
                  </Button>
                )}
              </div>
            </footer>
          </CardContent>
        </Card>

        {/* Related Actions */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Want to Create Your Own?</h3>
            <p className="text-blue-100 mb-4">
              Generate professional blog content with AI in under 2 minutes
            </p>
            <Button 
              asChild 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link to="/ai-live">
                <Zap className="h-4 w-4 mr-2" />
                Create AI Content
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
