import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { blogService } from '@/services/blogService';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Eye, User, Calendar, ExternalLink } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!slug) {
      navigate('/blog');
      return;
    }

    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      const blogPost = await blogService.getBlogPostBySlug(slug!);
      if (!blogPost) {
        toast({
          title: "Post Not Found",
          description: "The requested blog post could not be found.",
          variant: "destructive"
        });
        navigate('/blog');
        return;
      }
      setPost(blogPost);
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

  const claimPost = async () => {
    if (!user || !post) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim this post.",
        variant: "destructive"
      });
      return;
    }

    setClaiming(true);
    try {
      await blogService.updateBlogPost(post.id, {
        user_id: user.id,
        is_trial_post: false,
        expires_at: null // Remove expiration
      });

      toast({
        title: "Post Claimed!",
        description: "This blog post has been claimed and added to your dashboard.",
      });

      // Reload the post to show updated ownership
      await loadPost();
    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim this post. You may have reached the limit of 3 claimed posts.",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 2; // Less than 2 hours
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Calendar className="h-4 w-4" />
              {formatDate(post.created_at)}
              {post.reading_time && (
                <>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4" />
                  {post.reading_time} min read
                </>
              )}
              <span className="mx-2">•</span>
              <Eye className="h-4 w-4" />
              {post.view_count || 0} views
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-600">{post.author_name}</span>
                </div>
                
                {post.category && (
                  <Badge variant="secondary">{post.category}</Badge>
                )}

                {post.is_trial_post && (
                  <Badge variant="outline" className={isExpiringSoon(post.expires_at) ? 'border-red-500 text-red-600' : ''}>
                    Trial Post {post.expires_at && `• Expires ${formatDate(post.expires_at)}`}
                  </Badge>
                )}
              </div>

              {post.target_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={post.target_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Link
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Claiming Section */}
          {post.is_trial_post && !post.user_id && user && (
            <Card className="mb-8 border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Claim This Post</h3>
                    <p className="text-sm text-blue-700">
                      This is an unclaimed trial post. Claim it to make it permanently yours!
                    </p>
                  </div>
                  <Button 
                    onClick={claimPost} 
                    disabled={claiming}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {claiming ? 'Claiming...' : 'Claim Post'}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardContent className="pt-6">
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {post.word_count && (
                <div className="mt-6 text-sm text-gray-600">
                  <strong>Word Count:</strong> {post.word_count} words
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to Blog */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              ← Back to All Posts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
