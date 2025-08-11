import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ClaimStatusService, type BlogPost } from '@/services/claimStatusService';
import { useNavigate } from 'react-router-dom';
import { 
  ExternalLink, 
  Calendar, 
  Eye, 
  Target, 
  TrendingUp,
  FileText,
  Crown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export function UserClaimedPosts() {
  const [claimedPosts, setClaimedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadClaimedPosts();
    }
  }, [user, isAuthenticated]);

  const loadClaimedPosts = async () => {
    if (!user) return;
    
    setError(null);
    
    try {
      const posts = await ClaimStatusService.getUserClaimedPosts(user.id);
      setClaimedPosts(posts);
    } catch (err) {
      console.error('Error loading claimed posts:', err);
      setError('Failed to load claimed posts');
    } finally {
      // No loading state needed
    }
  };

  const calculateReadingTime = (wordCount: number): number => {
    return Math.ceil(wordCount / 200);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground mb-4">
            Please log in to view your claimed blog posts.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }



  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadClaimedPosts} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Your Claimed Posts ({claimedPosts.length}/3)
          </CardTitle>
          <Badge variant={claimedPosts.length >= 3 ? 'destructive' : 'secondary'}>
            {claimedPosts.length >= 3 ? 'Limit Reached' : `${3 - claimedPosts.length} remaining`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {claimedPosts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Claimed Posts Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't claimed any blog posts yet. You can claim up to 3 posts to make them permanently yours.
            </p>
            <Button onClick={() => navigate('/blog')} variant="outline">
              Browse Available Posts
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {claimedPosts.map((post) => (
              <div 
                key={post.id} 
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col space-y-3">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold hover:text-primary cursor-pointer"
                          onClick={() => navigate(`/preview/${post.slug}`)}>
                        {post.title}
                      </h4>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Claimed
                    </Badge>
                  </div>

                  {/* Post Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.view_count}&nbsp;views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{post.word_count} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>SEO: {post.seo_score}/100</span>
                    </div>
                  </div>

                  {/* Target URL */}
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-blue-600" />
                      <span className="text-muted-foreground">Target:</span>
                      <a 
                        href={post.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        {post.target_url}
                        <ExternalLink className="h-2 w-2 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1">
                    {post.keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {post.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/preview/${post.slug}`)}
                    >
                      View Post
                    </Button>
                    {post.published_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(post.published_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Published
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            About Claimed Posts
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Claimed posts are permanently yours and won't expire</li>
            <li>• You can claim up to 3 blog posts total</li>
            <li>• Claimed posts are removed from the trial system</li>
            <li>• You can always view and share your claimed posts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
