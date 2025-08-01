import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { blogService } from '@/services/blogService';
import { useAuth } from '@/hooks/useAuth';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  ExternalLink,
  FileText,
  TrendingUp
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

interface UserPostListProps {
  userId?: string;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  limit?: number;
}

export function UserPostList({ 
  userId, 
  showEditButton = true, 
  showDeleteButton = true,
  limit 
}: UserPostListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const effectiveUserId = userId || user?.id;

  useEffect(() => {
    if (effectiveUserId) {
      loadUserPosts();
    }
  }, [effectiveUserId]);

  const loadUserPosts = async () => {
    if (!effectiveUserId) return;

    try {
      setLoading(true);
      
      // Get posts owned by the user (saved posts)
      const savedPosts = await UnifiedClaimService.getUserSavedPosts(effectiveUserId);
      
      // Get posts directly owned by the user (where user_id is set)
      const ownedPosts = await blogService.getUserBlogPosts(effectiveUserId);
      
      // Combine and deduplicate posts
      const allPosts = [...savedPosts, ...ownedPosts];
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );

      // Apply limit if specified
      const finalPosts = limit ? uniquePosts.slice(0, limit) : uniquePosts;
      
      setPosts(finalPosts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      toast({
        title: "Error",
        description: "Failed to load your posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!user || !effectiveUserId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingPostId(post.id);
    try {
      // If user owns the post directly, delete it
      if (post.user_id === user.id) {
        await blogService.deleteBlogPost(post.id);
        
        toast({
          title: "Post Deleted",
          description: "Your blog post has been permanently deleted.",
        });
      } else {
        // If it's a saved post, remove from saved posts
        const result = await UnifiedClaimService.removeSavedPost(user.id, post.id);
        
        if (result.success) {
          toast({
            title: "Post Removed",
            description: "The post has been removed from your dashboard.",
          });
        } else {
          throw new Error(result.message);
        }
      }

      // Reload posts
      await loadUserPosts();
      
    } catch (error: any) {
      console.error('Failed to delete/remove post:', error);
      toast({
        title: "Action Failed",
        description: error.message || "Failed to remove the post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPostType = (post: BlogPost) => {
    if (post.user_id === user?.id) {
      return { label: 'Owned', variant: 'default' as const, description: 'You own this post' };
    } else {
      return { label: 'Saved', variant: 'secondary' as const, description: 'Saved to your dashboard' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent className="space-y-4">
          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't claimed or saved any blog posts yet.
            </p>
            <Button onClick={() => navigate('/blog')} className="bg-blue-600 hover:bg-blue-700">
              Browse Available Posts
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const postType = getPostType(post);
        const canEdit = post.user_id === user?.id;
        const canDelete = showDeleteButton && (post.user_id === user?.id || true); // Can remove saved posts too
        
        return (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </CardTitle>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    
                    {post.reading_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.reading_time} min read</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count || 0} views</span>
                    </div>

                    {post.seo_score && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>SEO: {post.seo_score}/100</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={postType.variant} title={postType.description}>
                      {postType.label}
                    </Badge>
                    
                    {post.category && (
                      <Badge variant="outline">
                        {post.category}
                      </Badge>
                    )}
                    
                    {post.is_trial_post && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Trial Post
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {post.meta_description && (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {post.meta_description}
                </p>
              )}
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>

                  {showEditButton && canEdit && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/blog/${post.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}

                  {post.target_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <a href={post.target_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Target Link
                      </a>
                    </Button>
                  )}
                </div>

                {canDelete && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeletePost(post)}
                    disabled={deletingPostId === post.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingPostId === post.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {post.user_id === user?.id ? 'Delete' : 'Remove'}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {posts.length > 0 && limit && posts.length >= limit && (
        <Card className="text-center p-4">
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-posts')}
              className="w-full"
            >
              View All Your Posts ({posts.length}+ total)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
