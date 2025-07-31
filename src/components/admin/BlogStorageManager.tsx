import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Database, 
  Archive, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Clock
} from 'lucide-react';
import { blogPersistenceService } from '@/services/blogPersistenceService';
import { safeBlogAutoDeleteService } from '@/services/safeBlogAutoDeleteService';
import { toast } from 'sonner';

interface StorageStats {
  totalPosts: number;
  claimedPosts: number;
  protectedPosts: number;
  archiveRecords: number;
  integrityScore: number;
}

interface SafetyStats {
  totalPosts: number;
  trialPosts: number;
  claimedPosts: number;
  permanentPosts: number;
  expiredPosts: number;
  atRiskPosts: number;
  protectedPosts: number;
}

export const BlogStorageManager: React.FC = () => {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [safetyStats, setSafetyStats] = useState<SafetyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [storage, safety] = await Promise.all([
        blogPersistenceService.getStorageStats(),
        safeBlogAutoDeleteService.getSafetyStats()
      ]);
      setStorageStats(storage);
      setSafetyStats(safety);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      toast.error('Failed to load storage statistics');
    } finally {
      setLoading(false);
    }
  };

  const runEmergencyProtection = async () => {
    try {
      toast.info('Running emergency protection sweep...');
      const result = await safeBlogAutoDeleteService.emergencyProtectionSweep();
      
      if (result.errors.length > 0) {
        toast.warning(`Protected ${result.protectedCount} posts with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully protected ${result.protectedCount} posts`);
      }
      
      await loadStats();
    } catch (error) {
      toast.error('Emergency protection failed');
    }
  };

  const runSafeCleanup = async () => {
    try {
      toast.info('Running safe cleanup...');
      const result = await safeBlogAutoDeleteService.performSafeCleanup();
      
      toast.success(`Cleanup complete: ${result.deletedCount} deleted, ${result.protectedFromDeletion} protected`);
      await loadStats();
    } catch (error) {
      toast.error('Safe cleanup failed');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading storage statistics...
          </div>
        </CardContent>
      </Card>
    );
  }

  const integrityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog Storage Management</h2>
          <p className="text-gray-600">
            Manage blog post persistence, archives, and safety systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={runEmergencyProtection} variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-1" />
            Emergency Protection
          </Button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{storageStats?.totalPosts || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Protected Posts</p>
                <p className="text-2xl font-bold text-green-600">{safetyStats?.protectedPosts || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archive Records</p>
                <p className="text-2xl font-bold">{storageStats?.archiveRecords || 0}</p>
              </div>
              <Archive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Integrity Score</p>
                <p className={`text-2xl font-bold ${integrityColor(storageStats?.integrityScore || 0)}`}>
                  {storageStats?.integrityScore || 0}%
                </p>
              </div>
              <CheckCircle className={`h-8 w-8 ${integrityColor(storageStats?.integrityScore || 0)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Integrity Alert */}
      {storageStats && storageStats.integrityScore < 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Integrity Warning</AlertTitle>
          <AlertDescription>
            Your blog storage integrity score is {storageStats.integrityScore}%. 
            Consider running emergency protection to safeguard your content.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Distribution</CardTitle>
                <CardDescription>
                  How your blog posts are distributed across storage layers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Claimed Posts</span>
                    <Badge variant="secondary">{storageStats?.claimedPosts || 0}</Badge>
                  </div>
                  <Progress value={(storageStats?.claimedPosts || 0) / (storageStats?.totalPosts || 1) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trial Posts</span>
                    <Badge variant="outline">{safetyStats?.trialPosts || 0}</Badge>
                  </div>
                  <Progress value={(safetyStats?.trialPosts || 0) / (safetyStats?.totalPosts || 1) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Permanent Posts</span>
                    <Badge variant="default">{safetyStats?.permanentPosts || 0}</Badge>
                  </div>
                  <Progress value={(safetyStats?.permanentPosts || 0) / (safetyStats?.totalPosts || 1) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archive Coverage</CardTitle>
                <CardDescription>
                  Backup and archive status of your blog posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${integrityColor(storageStats?.integrityScore || 0)}`}>
                    {storageStats?.integrityScore || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Archive Coverage</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Archive Records</span>
                    <span>{storageStats?.archiveRecords || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Protected Posts</span>
                    <span>{storageStats?.protectedPosts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>At Risk Posts</span>
                    <span className="text-orange-600">{safetyStats?.atRiskPosts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Protection Systems</CardTitle>
              <CardDescription>
                Manage blog post protection and safety systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Emergency Protection</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Immediately protect all claimed posts from deletion
                  </p>
                  <Button onClick={runEmergencyProtection} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Run Emergency Protection
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Protection Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Protected Posts</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {safetyStats?.protectedPosts || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>At Risk Posts</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {safetyStats?.atRiskPosts || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Expired Posts</span>
                      <Badge variant="outline">
                        {safetyStats?.expiredPosts || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archive Management</CardTitle>
              <CardDescription>
                Manage blog post archives and backup systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Archive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">Total Archives</h4>
                  <p className="text-2xl font-bold">{storageStats?.archiveRecords || 0}</p>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Coverage Rate</h4>
                  <p className="text-2xl font-bold">{storageStats?.integrityScore || 0}%</p>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Protected</h4>
                  <p className="text-2xl font-bold">{storageStats?.protectedPosts || 0}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Archives
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Archives
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safe Cleanup Operations</CardTitle>
              <CardDescription>
                Safely clean up expired posts while protecting claimed content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Safety First</AlertTitle>
                <AlertDescription>
                  Our cleanup system uses multiple safety checks to ensure claimed posts are never deleted.
                  Only expired, unclaimed trial posts will be removed.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Safe Cleanup</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Remove expired trial posts with full safety verification
                  </p>
                  <Button onClick={runSafeCleanup} className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Run Safe Cleanup
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">At Risk Posts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Expiring Soon</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {safetyStats?.atRiskPosts || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Already Expired</span>
                      <Badge variant="outline">
                        {safetyStats?.expiredPosts || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
