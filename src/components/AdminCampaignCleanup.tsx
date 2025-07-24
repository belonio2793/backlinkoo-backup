import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Calendar,
  TrendingDown,
  Shield,
  Users,
  FileText,
  BarChart3,
  Zap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { campaignCleanupService, type CleanupStats } from '@/services/campaignCleanupService';
import { format, formatDistanceToNow } from 'date-fns';

export function AdminCampaignCleanup() {
  const [cleanupStats, setCleanupStats] = useState<any>(null);
  const [nearExpiryCampaigns, setNearExpiryCampaigns] = useState<any[]>([]);
  const [cleanupPreview, setCleanupPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [stats, nearExpiry, preview] = await Promise.all([
        campaignCleanupService.getCleanupStats(),
        campaignCleanupService.getCampaignsNearExpiry(),
        campaignCleanupService.previewCleanup()
      ]);

      setCleanupStats(stats);
      setNearExpiryCampaigns(nearExpiry);
      setCleanupPreview(preview);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cleanup dashboard data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runManualCleanup = async () => {
    setIsRunningCleanup(true);
    try {
      const result = await campaignCleanupService.performCleanup();
      
      toast({
        title: 'Cleanup Completed',
        description: `Deleted ${result.campaignsDeleted} expired campaigns`,
      });

      // Reload data
      await loadDashboardData();
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast({
        title: 'Cleanup Failed',
        description: 'There was an error during the cleanup process',
        variant: 'destructive'
      });
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const sendExpiryNotifications = async () => {
    try {
      await campaignCleanupService.notifyUsersOfExpiringCampaigns();
      toast({
        title: 'Notifications Sent',
        description: 'Expiry notifications have been sent to users',
      });
    } catch (error) {
      console.error('Failed to send notifications:', error);
      toast({
        title: 'Notification Failed',
        description: 'Failed to send expiry notifications',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading cleanup dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Cleanup Management</h2>
          <p className="text-muted-foreground">Monitor and manage automatic campaign cleanup</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={runManualCleanup} 
            variant="destructive" 
            size="sm"
            disabled={isRunningCleanup}
          >
            {isRunningCleanup ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cleaning...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Run Cleanup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{cleanupStats?.totalActiveCampaigns || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guest Campaigns</p>
                <p className="text-2xl font-bold">{cleanupStats?.guestCampaigns || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Near Expiry</p>
                <p className="text-2xl font-bold">{nearExpiryCampaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered Users</p>
                <p className="text-2xl font-bold">{cleanupStats?.registeredCampaigns || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="preview">Cleanup Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cleanup Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Cleanup Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Last Cleanup</span>
                  <span className="text-sm text-muted-foreground">
                    {cleanupStats?.lastCleanupTime 
                      ? formatDistanceToNow(new Date(cleanupStats.lastCleanupTime), { addSuffix: true })
                      : 'Never'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Next Cleanup</span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Automatic (1h interval)
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Auto-Delete Threshold</span>
                  <Badge variant="secondary">24 hours</Badge>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={sendExpiryNotifications}
                    variant="outline" 
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Send Expiry Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Registered Users</span>
                      <span>{cleanupStats?.registeredCampaigns || 0}</span>
                    </div>
                    <Progress 
                      value={cleanupStats?.totalActiveCampaigns ? 
                        (cleanupStats.registeredCampaigns / cleanupStats.totalActiveCampaigns) * 100 : 0
                      } 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Guest Users</span>
                      <span>{cleanupStats?.guestCampaigns || 0}</span>
                    </div>
                    <Progress 
                      value={cleanupStats?.totalActiveCampaigns ? 
                        (cleanupStats.guestCampaigns / cleanupStats.totalActiveCampaigns) * 100 : 0
                      } 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {cleanupStats?.guestCampaigns > 0 && (
                      <>
                        {Math.round((cleanupStats.guestCampaigns / cleanupStats.totalActiveCampaigns) * 100)}% 
                        of campaigns are from guest users
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Campaigns Expiring Soon
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Guest campaigns that will be deleted within the next 6 hours
              </p>
            </CardHeader>
            <CardContent>
              {nearExpiryCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Campaigns Expiring Soon</h3>
                  <p className="text-muted-foreground">All guest campaigns are still within safe timeframe</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearExpiryCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {campaign.id}</p>
                        </div>
                        <Badge 
                          variant={campaign.hoursRemaining < 2 ? 'destructive' : 'secondary'}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {campaign.hoursRemaining.toFixed(1)}h remaining
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Created:</span>{' '}
                          {format(new Date(campaign.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Expires:</span>{' '}
                          {format(new Date(campaign.expiresAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Cleanup Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview what would be deleted in the next cleanup run
              </p>
            </CardHeader>
            <CardContent>
              {cleanupPreview?.totalToDelete === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Campaigns to Delete</h3>
                  <p className="text-muted-foreground">All campaigns are within the retention period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-semibold">
                        {cleanupPreview?.totalToDelete} campaigns will be deleted
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These campaigns have exceeded the 24-hour retention period
                    </p>
                  </div>

                  <div className="space-y-3">
                    {cleanupPreview?.eligibleForDeletion.map((campaign: any) => (
                      <div key={campaign.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{campaign.name}</h4>
                            <p className="text-sm text-muted-foreground">ID: {campaign.id}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={campaign.isGuest ? 'secondary' : 'outline'}>
                              {campaign.isGuest ? 'Guest' : 'Registered'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {campaign.hoursOld.toFixed(1)} hours old
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cleanup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Configuration</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Auto-Delete Threshold</span>
                      <Badge variant="outline">24 hours</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Cleanup Interval</span>
                      <Badge variant="outline">1 hour</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Notification Window</span>
                      <Badge variant="outline">6 hours before expiry</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Quick Actions</h4>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={runManualCleanup}
                      variant="destructive" 
                      className="w-full"
                      disabled={isRunningCleanup}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Run Manual Cleanup
                    </Button>
                    
                    <Button 
                      onClick={sendExpiryNotifications}
                      variant="outline" 
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Send Expiry Notifications
                    </Button>
                    
                    <Button 
                      onClick={loadDashboardData}
                      variant="outline" 
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h5 className="font-semibold mb-2">Important Notes</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Guest campaigns are automatically deleted after 24 hours</li>
                  <li>• Registered user campaigns are preserved permanently</li>
                  <li>• Users receive notifications 6 hours before campaign expiry</li>
                  <li>• Cleanup runs automatically every hour</li>
                  <li>• All cleanup activities are logged in the security audit log</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
