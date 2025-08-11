import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from './LoginModal';
import { 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  FileText,
  Save,
  ArrowRight,
  Timer,
  Crown
} from 'lucide-react';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  expires_at: string;
  word_count: number;
  seo_score: number;
  target_url: string;
}

export function GuestDashboard() {
  const [trialPosts, setTrialPosts] = useState<TrialPost[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load trial posts from localStorage
    const loadTrialPosts = () => {
      try {
        const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const validTrialPosts = allBlogs.filter((post: any) => {
          if (!post.is_trial_post) return false;
          
          // Check if expired
          if (post.expires_at) {
            const isExpired = new Date() > new Date(post.expires_at);
            if (isExpired) {
              // Remove expired post
              localStorage.removeItem(`blog_post_${post.slug}`);
              return false;
            }
          }
          return true;
        });
        
        setTrialPosts(validTrialPosts);
      } catch (error) {
        console.warn('Failed to load trial posts:', error);
      }
    };

    loadTrialPosts();
  }, []);

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleViewPost = (slug: string) => {
    window.open(`/blog/${slug}`, '_blank');
  };

  const handleSaveForever = () => {
    setShowLoginModal(true);
  };

  if (trialPosts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h1>
            <p className="text-xl text-gray-600 mb-8">
              You haven't created any backlinks yet. Get started with your first free trial!
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your First Backlink
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trial Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Manage your trial backlinks • Sign up to save them forever
              </p>
            </div>
            <Button
              onClick={handleSaveForever}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-pulse"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>

        {/* Trial Warning Banner */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Timer className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  ⚠️ Trial Mode - Limited Time Access
                </h3>
                <p className="text-amber-800 mb-4">
                  Your trial backlinks will be automatically deleted unless you create an account. 
                  Save them forever and unlock unlimited backlink creation!
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveForever}
                    className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save All Posts Forever
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Create More
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trialPosts.map((post) => (
            <Card key={post.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    <Clock className="mr-1 h-3 w-3" />
                    Unclaimed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Post Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>{post.word_count || 1200}+ words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>SEO: {post.seo_score || 85}/100</span>
                  </div>
                </div>

                {/* Expiry Timer */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Expires in: {formatTimeRemaining(post.expires_at)}
                    </span>
                  </div>
                </div>

                {/* Target URL */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Target:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs truncate">
                    {post.target_url}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewPost(post.slug)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Post
                  </Button>
                  <Button
                    onClick={handleSaveForever}
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Save className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Scale Your SEO?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Create unlimited professional backlinks, access advanced analytics, 
              and never lose your content again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleSaveForever}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <Crown className="mr-2 h-5 w-5" />
                Create Account & Save Posts
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
