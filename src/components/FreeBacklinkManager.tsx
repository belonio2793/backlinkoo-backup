import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { FreeBacklinkResult } from '@/services/simpleAIContentEngine';
import { RegistrationModal } from './RegistrationModal';
import { 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  RotateCcw,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Link,
  Timer,
  Loader2,
  Gift,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Globe,
  ExternalLink
} from 'lucide-react';

interface FreeBacklinkManagerProps {
  onViewPost?: (post: FreeBacklinkResult) => void;
}

export function FreeBacklinkManager({ onViewPost }: FreeBacklinkManagerProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [timeRemainingMap, setTimeRemainingMap] = useState<Map<string, any>>(new Map());
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    
    // Set up timer to update remaining times and auto-refresh
    const interval = setInterval(() => {
      updateTimeRemaining();
      loadPosts(); // Refresh to remove expired posts
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPosts = () => {
    const unclaimedPosts = freeBacklinkService.getUnclaimedPosts();
    setPosts(unclaimedPosts);
  };

  const updateTimeRemaining = () => {
    const newTimeMap = new Map();
    posts.forEach(post => {
      const remaining = freeBacklinkService.getTimeRemaining(post);
      newTimeMap.set(post.id, remaining);
    });
    setTimeRemainingMap(newTimeMap);
  };

  const handleRegenerate = async (post: any) => {
    setRegeneratingIds(prev => new Set(prev).add(post.id));
    
    try {
      const newPost = await freeBacklinkService.regeneratePost(post.id);
      if (newPost) {
        loadPosts();
        toast({
          title: "Content Regenerated! ✨",
          description: "The blog post has been regenerated with fresh content.",
        });
        
        if (onViewPost) {
          onViewPost(newPost);
        }
      }
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate content",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const handleDelete = (postId: string) => {
    if (freeBacklinkService.deletePost(postId)) {
      loadPosts();
      toast({
        title: "Post Deleted",
        description: "The blog post has been deleted successfully.",
      });
    }
  };

  const handleView = (post: any) => {
    if (onViewPost) {
      onViewPost(post);
    }
  };

  const formatTimeRemaining = (remaining: any) => {
    if (remaining.expired) return "Expired";
    return `${String(remaining.hours).padStart(2, '0')}:${String(remaining.minutes).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')}`;
  };

  const getTimeProgress = (post: any) => {
    const totalMs = 24 * 60 * 60 * 1000;
    const elapsed = new Date().getTime() - new Date(post.createdAt).getTime();
    return Math.min((elapsed / totalMs) * 100, 100);
  };

  const getStatusBadge = (post: any) => {
    const remaining = timeRemainingMap.get(post.id);
    if (remaining?.expired) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (remaining?.hours < 1) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700">Expires Soon</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  const statistics = freeBacklinkService.getStatistics();

  if (posts.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Gift className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">No Free Backlinks Generated</h3>
          <p className="text-muted-foreground mb-4">
            You haven't generated any free backlink posts yet.
          </p>
          <Button variant="outline">
            <Link className="h-4 w-4 mr-2" />
            Generate Your First Free Backlink
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Free Posts</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unclaimed</p>
                <p className="text-2xl font-bold">{statistics.unclaimed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{statistics.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Words</p>
                <p className="text-2xl font-bold">{statistics.averageWordCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <Timer className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>⏰ Auto-Delete Notice:</strong> Free backlink posts automatically delete after 24 hours. 
          Register an account to save posts permanently and access advanced features.
        </AlertDescription>
      </Alert>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Free Backlink Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Keywords</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead className="text-center">Words</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const remaining = timeRemainingMap.get(post.id);
                  const progress = getTimeProgress(post);
                  
                  return (
                    <TableRow key={post.id} className={remaining?.expired ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{post.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.keywords.slice(0, 2).map((keyword: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {post.keywords.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.keywords.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>{getStatusBadge(post)}</TableCell>
                      
                      <TableCell>
                        <a 
                          href={post.targetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate block max-w-[200px] flex items-center gap-1"
                        >
                          {post.targetUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge variant="outline">{post.wordCount}</Badge>
                      </TableCell>
                      
                      <TableCell className="text-center">{post.viewCount}</TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {remaining ? formatTimeRemaining(remaining) : 'Loading...'}
                            </span>
                          </div>
                          <Progress 
                            value={Math.max(0, 100 - progress)} 
                            className="h-1"
                          />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(post)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Post
                            </DropdownMenuItem>
                            
                            {!remaining?.expired && (
                              <DropdownMenuItem 
                                onClick={() => handleRegenerate(post)}
                                disabled={regeneratingIds.has(post.id)}
                              >
                                {regeneratingIds.has(post.id) ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Regenerating...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Regenerate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Now
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Registration CTA */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">
                  Love the free backlinks? Unlock more features!
                </h3>
                <p className="text-sm text-green-700">
                  Register a free account to save posts permanently, access advanced features, and track analytics.
                </p>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setRegistrationModalOpen(true)}
            >
              Register Free Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
