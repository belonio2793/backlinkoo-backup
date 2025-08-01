import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Trash2, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BlogClaimMigration } from '@/utils/blogClaimMigration';
import { BlogCleanupService } from '@/services/blogCleanupService';
import { RLSPolicyFix } from '@/utils/fixRLSPolicies';

export function BlogSystemAdmin() {
  const { toast } = useToast();
  const [migrating, setMigrating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [fixingRLS, setFixingRLS] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any[]>([]);
  const [cleanupStats, setCleanupStats] = useState<{ count: number; deletedCount?: number } | null>(null);
  const [rlsStats, setRlsStats] = useState<any>(null);

  const runMigrations = async () => {
    setMigrating(true);
    try {
      const result = await BlogClaimMigration.runAllMigrations();
      setMigrationResults(result.results);
      
      if (result.success) {
        toast({
          title: "Migrations Completed ✅",
          description: "All blog system migrations have been applied successfully",
        });
      } else {
        toast({
          title: "Migration Issues",
          description: "Some migrations failed. Check the results below.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Migration Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  const fixRLSPolicies = async () => {
    setFixingRLS(true);
    try {
      const result = await RLSPolicyFix.fixBlogPostsPolicies();

      if (result.success) {
        toast({
          title: "RLS Policies Fixed ✅",
          description: "Blog post security policies have been updated",
        });
      } else {
        toast({
          title: "RLS Fix Failed",
          description: result.error || "Failed to update security policies",
          variant: "destructive"
        });
      }

      // Test the policies after fixing
      const testResult = await RLSPolicyFix.testPolicyFix();
      setRlsStats(testResult);

    } catch (error: any) {
      toast({
        title: "RLS Fix Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFixingRLS(false);
    }
  };

  const runCleanup = async () => {
    setCleaning(true);
    try {
      // First get count of expired posts
      const expiredCount = await BlogCleanupService.getExpiredPostsCount();
      
      // Then perform cleanup
      const result = await BlogCleanupService.manualCleanup();
      
      setCleanupStats({
        count: expiredCount.count,
        deletedCount: result.deletedCount
      });

      if (result.success) {
        toast({
          title: "Cleanup Completed ✅",
          description: `${result.deletedCount} expired posts have been deleted`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Cleanup Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  const cleanupServiceStatus = BlogCleanupService.getStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Blog System Administration</h2>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Auto-cleanup Service:</span>
              <Badge variant={cleanupServiceStatus.isRunning ? "default" : "secondary"}>
                {cleanupServiceStatus.isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>
            {cleanupServiceStatus.nextCleanup && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Next cleanup:</span>
                <span>{cleanupServiceStatus.nextCleanup.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Migrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Apply database schema updates for the enhanced blog claiming system.
          </p>
          
          <Button
            onClick={runMigrations}
            disabled={migrating}
            className="w-full"
          >
            {migrating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Migrations...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run Blog System Migrations
              </>
            )}
          </Button>

          {migrationResults.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-medium">Migration Results:</h4>
              {migrationResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">{result.step}</span>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RLS Policy Fix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Row Level Security (RLS) Policy Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fix restrictive RLS policies that may be blocking blog post creation.
          </p>

          <Button
            onClick={fixRLSPolicies}
            disabled={fixingRLS}
            variant="outline"
            className="w-full"
          >
            {fixingRLS ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Fixing RLS Policies...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Fix RLS Policies
              </>
            )}
          </Button>

          {rlsStats && (
            <div className="space-y-2 mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium">RLS Policy Test Results:</h4>
              <div className="text-sm space-y-1">
                <div>Can Read Posts: {rlsStats.canRead ? '✅' : '❌'}</div>
                <div>Can Create Posts: {rlsStats.canCreate ? '✅' : '❌'}</div>
                {rlsStats.error && (
                  <div className="text-red-600">Error: {rlsStats.error}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Expired Posts Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manually trigger cleanup of expired unclaimed blog posts.
          </p>
          
          <Button
            onClick={runCleanup}
            disabled={cleaning}
            variant="destructive"
            className="w-full"
          >
            {cleaning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Cleanup...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clean Up Expired Posts
              </>
            )}
          </Button>

          {cleanupStats && (
            <div className="space-y-2 mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium">Cleanup Results:</h4>
              <div className="text-sm space-y-1">
                <div>Expired posts found: {cleanupStats.count}</div>
                {cleanupStats.deletedCount !== undefined && (
                  <div>Posts deleted: {cleanupStats.deletedCount}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Blog System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic post claiming with user authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>24-hour expiration for unclaimed posts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic cleanup of expired posts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Deletion controls based on claim status</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Login intent persistence for seamless claiming</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Row-level security policies for data protection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
