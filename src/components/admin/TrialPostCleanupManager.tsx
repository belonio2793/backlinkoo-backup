import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { trialPostCleanupService, type TrialPostStatus } from '@/services/trialPostCleanupService';
import { ExcerptCleaner } from '@/utils/excerptCleaner';
import {
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export function TrialPostCleanupManager() {
  const [trialPosts, setTrialPosts] = useState<TrialPostStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTrial: 0,
    active: 0,
    warning: 0,
    critical: 0,
    expired: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTrialPosts();
    
    // Auto-refresh every minute
    const interval = setInterval(loadTrialPosts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadTrialPosts = async () => {
    try {
      const [posts, statsData] = await Promise.all([
        trialPostCleanupService.getActiveTrialPosts(),
        trialPostCleanupService.getCleanupStats()
      ]);
      
      setTrialPosts(posts);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load trial posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trial posts data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setCleanupLoading(true);
    try {
      const result = await trialPostCleanupService.forceCleanupAll();
      
      if (result.deletedCount > 0) {
        toast({
          title: 'Cleanup Completed',
          description: `Successfully deleted ${result.deletedCount} expired trial posts`
        });
      } else {
        toast({
          title: 'No Action Needed',
          description: 'No expired trial posts found to clean up'
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: 'Cleanup Warnings',
          description: `${result.errors.length} errors occurred during cleanup`,
          variant: 'destructive'
        });
      }

      // Reload data
      await loadTrialPosts();
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to run trial post cleanup',
        variant: 'destructive'
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const getStatusColor = (status: TrialPostStatus['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TrialPostStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) return 'Expired';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trial Post Cleanup Manager</h2>
          <p className="text-gray-600">Monitor and manage trial blog post expiration</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTrialPosts} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={runCleanup} variant="destructive" size="sm" disabled={cleanupLoading}>
            <Trash2 className={`mr-2 h-4 w-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
            {cleanupLoading ? 'Cleaning...' : 'Force Cleanup'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTrial}</div>
            <div className="text-sm text-gray-600">Total Trial</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-sm text-gray-600">Warning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Posts Status ({trialPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trial posts...</p>
            </div>
          ) : trialPosts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">No trial posts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trialPosts.map((post) => (
                <div 
                  key={post.id} 
                  className={`border rounded-lg p-4 ${
                    post.status === 'expired' ? 'bg-red-50 border-red-200' :
                    post.status === 'critical' ? 'bg-orange-50 border-orange-200' :
                    post.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(post.status)}
                        <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Target:</strong> {post.target_url}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Expires: {new Date(post.expires_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className={`font-medium ${
                            post.status === 'expired' ? 'text-red-600' :
                            post.status === 'critical' ? 'text-orange-600' :
                            post.status === 'warning' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {formatTimeRemaining(post.hoursRemaining)} remaining
                          </span>
                        </div>
                        {post.user_id && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>User: {post.user_id.substring(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Info */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Cleanup Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>Cleanup Schedule:</strong> Runs automatically every hour</p>
            <p><strong>Warning Threshold:</strong> 4 hours before expiration</p>
            <p><strong>Critical Threshold:</strong> 1 hour before expiration</p>
            <p><strong>Deletion:</strong> Posts are permanently deleted when expired</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <strong>Note:</strong> Trial posts in "Warning" or "Critical" status will trigger 
                user notifications to encourage claiming before expiration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
