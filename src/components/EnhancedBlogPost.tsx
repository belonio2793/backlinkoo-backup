import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Eye,
  TrendingUp,
  Target,
  Share2,
  Copy,
  Clock,
  Crown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Timer,
  User,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContentFormatter } from '@/utils/contentFormatter';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { blogService } from '@/services/blogService';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function EnhancedBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [unclaiming, setUnclaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  // Process any pending claim intent after user login
  useEffect(() => {
    if (user) {
      processClaimIntent();
    }
  }, [user]);

  const processClaimIntent = async () => {
    // Only process claim intents for authenticated users
    if (!user || !user.id) {
      // Clear any claim intents if user is not authenticated
      localStorage.removeItem('claim_intent');
      return;
    }

    const result = await EnhancedBlogClaimService.processPendingClaimIntent(user);
    if (result) {
      if (result.success) {
        toast({
          title: "Post Claimed! 🎉",
          description: result.message,
        });
        // Reload the post to show updated status
        if (slug) loadBlogPost(slug);
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    }
  };

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

  const handleClaimPost = async () => {
    if (!user) {
      // Save claim intent and redirect to login
      EnhancedBlogClaimService.handleClaimIntent(slug!, blogPost?.title || '');
      toast({
        title: "Login Required",
        description: "Please log in to claim this post. We'll bring you back to complete the claim.",
      });
      navigate('/login');
      return;
    }

    setClaiming(true);
    try {
      const result = await EnhancedBlogClaimService.claimPost(slug!, user);
      
      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Success! 🎉",
          description: result.message,
        });
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaimPost = async () => {
    setUnclaiming(true);
    try {
      const result = await EnhancedBlogClaimService.unclaimPost(slug!, user);

      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Post Unclaimed",
          description: result.message,
        });
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while unclaiming the post",
        variant: "destructive"
      });
    } finally {
      setUnclaiming(false);
      setShowUnclaimDialog(false);
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const result = await EnhancedBlogClaimService.deletePost(slug!, user);
      
      if (result.success) {
        toast({
          title: "Post Deleted",
          description: result.message,
        });
        navigate('/blog');
      } else {
        toast({
          title: "Delete Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the post",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogPost?.title,
          text: blogPost?.meta_description || blogPost?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const canClaimPost = blogPost ? EnhancedBlogClaimService.canClaimPost(blogPost) : false;
  const unclaimPermissions = blogPost ? EnhancedBlogClaimService.canUnclaimPost(blogPost, user) : { canUnclaim: false };
  const deletePermissions = blogPost ? EnhancedBlogClaimService.canDeletePost(blogPost, user) : { canDelete: false };
  const isOwnPost = blogPost?.user_id === user?.id;
  const isExpiringSoon = blogPost?.expires_at && new Date(blogPost.expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000; // 2 hours

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Loading blog post...</p>
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
              <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The requested blog post could not be found or may have expired.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />

      {/* Blog Navigation */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
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
              <Button variant="outline" size="sm" onClick={sharePost}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <main className="container mx-auto px-6 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={blogPost.claimed ? "default" : "secondary"} className="mb-2">
                {blogPost.claimed ? (
                  <>
                    <Crown className="mr-1 h-3 w-3" />
                    Claimed
                  </>
                ) : (
                  <>
                    <Timer className="mr-1 h-3 w-3" />
                    Unclaimed
                  </>
                )}
              </Badge>
              
              {blogPost.claimed && isOwnPost && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <User className="mr-1 h-3 w-3" />
                  Your Post
                </Badge>
              )}
              
              {!blogPost.claimed && blogPost.expires_at && isExpiringSoon && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Expiring Soon
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4">{blogPost.title}</h1>
            
            {blogPost.meta_description && (
              <p className="text-xl text-muted-foreground mb-6">{blogPost.meta_description}</p>
            )}

            {/* Post Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published {format(new Date(blogPost.created_at), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{blogPost.reading_time} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{blogPost.view_count} views</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>SEO Score: {blogPost.seo_score}/100</span>
              </div>
            </div>

            {/* Expiration Warning */}
            {!blogPost.claimed && blogPost.expires_at && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-amber-800">
                  <Timer className="h-4 w-4" />
                  <span className="font-medium">
                    ⏰ {getTimeRemaining(blogPost.expires_at)}
                  </span>
                </div>
                <p className="text-amber-700 text-sm mt-1">
                  This post will be automatically deleted when the timer expires. Claim it to save permanently!
                </p>
              </div>
            )}

            {/* Target URL */}
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">Target URL:</span>
              <a
                href={blogPost.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                {blogPost.target_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </header>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {/* Claim Button */}
            {canClaimPost && (
              <Button
                onClick={handleClaimPost}
                disabled={claiming}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {claiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    {user ? 'Claim This Post' : 'Login to Claim'}
                  </>
                )}
              </Button>
            )}

            {/* Unclaim Button - Only visible to post owner */}
            {unclaimPermissions.canUnclaim && (
              <Button
                onClick={() => setShowUnclaimDialog(true)}
                variant="outline"
                size="lg"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Unclaim Post
              </Button>
            )}

            {/* Delete Button */}
            {deletePermissions.canDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                size="lg"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </Button>
            )}

            {/* Claimed Status */}
            {blogPost.claimed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  {isOwnPost ? 'You own this post' : 'This post has been claimed'}
                </span>
              </div>
            )}
          </div>

          {/* Post Content - SEO Optimized Display */}
          <div className="seo-optimized-content">
            <div
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-blue-600 prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-8 prose-h1:mt-12 prose-h2:text-3xl prose-h2:font-semibold prose-h2:mb-6 prose-h2:mt-10 prose-h3:text-2xl prose-h3:font-semibold prose-h3:mb-4 prose-h3:mt-8 prose-h4:text-xl prose-h4:font-medium prose-h4:mb-3 prose-h4:mt-6 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-ol:my-6 prose-li:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-xl prose-strong:font-bold prose-strong:text-gray-900 prose-em:italic prose-em:text-gray-800 prose-u:underline prose-u:decoration-blue-500"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />
          </div>

          {/* Keywords */}
          {blogPost.keywords && blogPost.keywords.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Keywords:</h3>
              <div className="flex flex-wrap gap-2">
                {blogPost.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">Are you sure you want to delete "{blogPost.title}"? This action cannot be undone.</p>
                {blogPost.claimed && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <ShieldCheck className="h-4 w-4 inline mr-1" />
                    Note: This is a claimed post. Deletion should be carefully considered.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unclaim Confirmation Dialog */}
      <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Unclaim Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">Are you sure you want to unclaim "{blogPost.title}"?</p>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                  <div className="font-medium mb-1">⚠️ Important:</div>
                  <ul className="text-xs space-y-1">
                    <li>• This post will return to the claimable pool for 24 hours</li>
                    <li>• Other users will be able to claim it during this time</li>
                    <li>• If not reclaimed, it will be automatically deleted</li>
                    <li>• You can reclaim it yourself if it's still available</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Claimed</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimPost}
              disabled={unclaiming}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {unclaiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Unclaiming...
                </>
              ) : (
                'Unclaim Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
