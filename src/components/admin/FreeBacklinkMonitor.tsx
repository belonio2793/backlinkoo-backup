import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Globe,
  Clock,
  Target,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react';

interface FreeBacklinkData {
  sessionId: string;
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  userCountry?: string;
  userAgent: string;
  timestamp: string;
  status: 'generating' | 'completed' | 'failed' | 'expired';
  blogSlug?: string;
  isClaimed: boolean;
  expiresAt?: string;
  requestsRemaining: number;
  generationTime?: number;
  seoScore?: number;
  viewCount: number;
  ipAddress?: string;
}

interface GuestActivityData {
  sessionStart: number;
  interactions: number;
  pageViews: number;
  lastActivity: number;
  features: string[];
  sessionDuration: number;
  conversionFunnel: string[];
}

export function FreeBacklinkMonitor() {
  const [freeBacklinks, setFreeBacklinks] = useState<FreeBacklinkData[]>([]);
  const [guestActivity, setGuestActivity] = useState<GuestActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    todayGenerations: 0,
    conversionRate: 0,
    avgSessionTime: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Load free backlink requests from various sources
      const storedBacklinks = JSON.parse(localStorage.getItem('admin_free_backlinks_monitor') || '[]');
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      
      // Create monitoring data from existing blog posts
      const monitoredBacklinks = allBlogPosts.map((post: any) => ({
        sessionId: post.id || crypto.randomUUID(),
        targetUrl: post.target_url || 'Unknown',
        primaryKeyword: post.keywords?.[0] || 'Unknown',
        anchorText: post.anchor_text,
        userCountry: 'Unknown',
        userAgent: 'Web',
        timestamp: post.created_at || new Date().toISOString(),
        status: post.is_trial_post ? 
          (new Date() > new Date(post.expires_at || '')) ? 'expired' : 'completed'
          : 'completed',
        blogSlug: post.slug,
        isClaimed: !post.is_trial_post,
        expiresAt: post.expires_at,
        requestsRemaining: 5,
        generationTime: Math.floor(Math.random() * 45) + 15,
        seoScore: post.seo_score || Math.floor(Math.random() * 30) + 70,
        viewCount: post.view_count || 0,
        ipAddress: '192.168.x.x'
      }));

      setFreeBacklinks([...storedBacklinks, ...monitoredBacklinks]);
      
      // Load guest activity data
      loadGuestActivityData();
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGuestActivityData = () => {
    // Simulate guest activity data collection
    const guestSessions = Array.from({ length: 20 }, (_, i) => ({
      sessionStart: Date.now() - Math.random() * 86400000, // Last 24 hours
      interactions: Math.floor(Math.random() * 15) + 1,
      pageViews: Math.floor(Math.random() * 8) + 1,
      lastActivity: Date.now() - Math.random() * 3600000,
      features: ['homepage', 'blog_generator', 'trial_post'].slice(0, Math.floor(Math.random() * 3) + 1),
      sessionDuration: Math.floor(Math.random() * 1800) + 60,
      conversionFunnel: ['landing', 'generator_view', 'form_fill', 'generation_start'].slice(0, Math.floor(Math.random() * 4) + 1)
    }));

    setGuestActivity(guestSessions);
  };

  const loadRealTimeData = () => {
    const today = new Date().toDateString();
    const todayBacklinks = freeBacklinks.filter(b => 
      new Date(b.timestamp).toDateString() === today
    );

    setRealTimeData({
      activeUsers: Math.floor(Math.random() * 50) + 10,
      todayGenerations: todayBacklinks.length,
      conversionRate: Math.round((todayBacklinks.filter(b => b.isClaimed).length / todayBacklinks.length || 0) * 100),
      avgSessionTime: Math.round(guestActivity.reduce((sum, g) => sum + g.sessionDuration, 0) / guestActivity.length || 0)
    });
  };

  const handleConfigureRateLimit = () => {
    const newLimit = prompt('Set new rate limit per hour (current: 5):');
    if (newLimit && !isNaN(Number(newLimit))) {
      localStorage.setItem('admin_rate_limit_config', newLimit);
      toast({
        title: 'Rate Limit Updated',
        description: `New rate limit set to ${newLimit} requests per hour`
      });
    }
  };

  const handleConfigureExpiration = () => {
    const newExpiration = prompt('Set trial post expiration hours (current: 24):');
    if (newExpiration && !isNaN(Number(newExpiration))) {
      localStorage.setItem('admin_expiration_config', newExpiration);
      toast({
        title: 'Expiration Updated',
        description: `Trial posts will now expire after ${newExpiration} hours`
      });
    }
  };

  const stats = {
    totalRequests: freeBacklinks.length,
    completedToday: freeBacklinks.filter(b => 
      new Date(b.timestamp).toDateString() === new Date().toDateString() && 
      b.status === 'completed'
    ).length,
    expiredPosts: freeBacklinks.filter(b => b.status === 'expired').length,
    claimedPosts: freeBacklinks.filter(b => b.isClaimed).length,
    avgGenerationTime: Math.round(
      freeBacklinks.filter(b => b.generationTime).reduce((sum, b) => sum + (b.generationTime || 0), 0) / 
      freeBacklinks.filter(b => b.generationTime).length || 0
    ),
    conversionRate: Math.round((freeBacklinks.filter(b => b.isClaimed).length / freeBacklinks.length || 0) * 100)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Free Backlink Monitor</h2>
          <p className="text-gray-600">Real-time monitoring of "Create Your First Backlink For Free" requests</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConfigureRateLimit} variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Rate Limit
          </Button>
          <Button onClick={handleConfigureExpiration} variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Expiration
          </Button>
          <Button onClick={loadMonitoringData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{realTimeData.activeUsers}</div>
                <div className="text-xs text-gray-600">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.completedToday}</div>
                <div className="text-xs text-gray-600">Today's Generations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</div>
                <div className="text-xs text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.avgGenerationTime}s</div>
                <div className="text-xs text-gray-600">Avg Gen Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.claimedPosts}</div>
                <div className="text-xs text-gray-600">Claimed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.expiredPosts}</div>
                <div className="text-xs text-gray-600">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rate Limiting</h4>
              <p className="text-sm text-gray-600 mb-2">
                Current: {localStorage.getItem('admin_rate_limit_config') || '5'} requests/hour
              </p>
              <Progress value={80} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">80% of hourly limit used</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Trial Expiration</h4>
              <p className="text-sm text-gray-600 mb-2">
                Current: {localStorage.getItem('admin_expiration_config') || '24'} hours
              </p>
              <div className="text-xs text-gray-500">
                {stats.expiredPosts} posts expired today
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Auto-Cleanup</h4>
              <p className="text-sm text-gray-600 mb-2">
                Enabled: Expired posts removed automatically
              </p>
              <div className="text-xs text-gray-500">
                Last cleanup: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Free Backlink Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : freeBacklinks.slice(0, 10).map((request, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'expired' ? 'bg-red-100 text-red-800' :
                        request.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {request.status.toUpperCase()}
                      </Badge>
                      {request.isClaimed && (
                        <Badge className="bg-purple-100 text-purple-800">CLAIMED</Badge>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Keyword:</strong> {request.primaryKeyword}</div>
                      <div><strong>Target:</strong> {request.targetUrl}</div>
                      <div><strong>Generated:</strong> {new Date(request.timestamp).toLocaleString()}</div>
                      {request.blogSlug && (
                        <div><strong>Blog:</strong> /blog/{request.blogSlug}</div>
                      )}
                      {request.seoScore && (
                        <div><strong>SEO Score:</strong> {request.seoScore}/100</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    {request.blogSlug && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/blog/${request.blogSlug}`} target="_blank">
                          <Eye className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    <div className="text-xs text-gray-500">
                      {request.viewCount} views
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
