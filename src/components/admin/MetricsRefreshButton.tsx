import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { unifiedAdminMetrics } from "@/services/unifiedAdminMetrics";

export function MetricsRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    metrics?: any;
  } | null>(null);

  const refreshMetrics = async () => {
    setRefreshing(true);
    setResult(null);

    try {
      // Clear cache and fetch fresh metrics
      unifiedAdminMetrics.clearCache();
      const metrics = await unifiedAdminMetrics.getAllMetrics(true);
      
      setResult({
        success: true,
        message: `Metrics refreshed successfully! Found ${metrics.totalUsers} users, ${metrics.totalBlogPosts} blog posts`,
        metrics: {
          totalUsers: metrics.totalUsers,
          activeUsers: metrics.activeUsers,
          totalBlogPosts: metrics.totalBlogPosts,
          databaseConnected: metrics.databaseConnected,
          tablesAccessible: metrics.tablesAccessible
        }
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: `Refresh failed: ${error.message}`
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={refreshMetrics}
        disabled={refreshing}
        variant="outline"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
      </Button>

      {result && (
        <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
            <div className="font-medium">{result.message}</div>
            {result.metrics && (
              <pre className="text-xs mt-2 font-mono">
                {JSON.stringify(result.metrics, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
