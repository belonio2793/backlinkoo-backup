/**
 * Claim System Debug Component
 * Shows the status of the claim system and allows debugging
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebugClaimSystem, type DebugResult } from '@/utils/debugClaimSystem';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bug, 
  Database,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react';

export function ClaimSystemDebug() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const [claimableCount, setClaimableCount] = useState<number>(0);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    // Load initial data
    loadQuickStats();
  }, [user]);

  const loadQuickStats = async () => {
    try {
      // Get claimable posts count
      const posts = await UnifiedClaimService.getClaimablePosts(100);
      setClaimableCount(posts.length);

      // Get user stats if logged in
      if (user) {
        const stats = await UnifiedClaimService.getUserClaimStats(user.id);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    }
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await DebugClaimSystem.runFullDiagnostic();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (success: boolean) => 
    success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Claim System Debug
          </h1>
          <p className="text-gray-600">Debug and test the blog post claiming functionality</p>
        </div>
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run Diagnostic'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Claimable Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimableCount}</div>
            <p className="text-xs text-gray-600">Available for claiming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div>
                <div className="text-2xl font-bold">
                  {userStats ? `${userStats.claimedCount}/${userStats.maxClaims}` : '...'}
                </div>
                <p className="text-xs text-gray-600">Posts claimed</p>
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium text-gray-500">Not logged in</div>
                <p className="text-xs text-gray-600">Sign in to see stats</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-xs text-gray-600">{passed} passed, {failed} failed</p>
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium text-gray-500">Unknown</div>
                <p className="text-xs text-gray-600">Run diagnostic</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
            <div className="flex gap-2">
              <Badge variant={passed > failed ? 'default' : 'destructive'}>
                {passed} Passed
              </Badge>
              {failed > 0 && (
                <Badge variant="destructive">
                  {failed} Failed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={getStatusColor(result.success)}>
                        {getStatusIcon(result.success)}
                      </span>
                      <div>
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm text-gray-600">{result.message}</div>
                      </div>
                    </div>
                    {!result.success && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {results.map((result, index) => (
                  <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                    <div className={getStatusColor(result.success)}>
                      {getStatusIcon(result.success)}
                    </div>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold">{result.test}</div>
                        <div>{result.message}</div>
                        {result.error && (
                          <div className="text-red-600 text-sm">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                        {result.data && (
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium">Data</summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                              {typeof result.data === 'object' 
                                ? JSON.stringify(result.data, null, 2)
                                : result.data
                              }
                            </pre>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </TabsContent>

              <TabsContent value="report">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {DebugClaimSystem.generateReport(results)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Debug Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Console Commands</h4>
            <p className="text-sm text-gray-600 mb-2">Open browser console and try these commands:</p>
            <div className="bg-gray-100 p-2 rounded text-sm font-mono space-y-1">
              <div>// Run full diagnostic</div>
              <div>await window.debugClaimSystem.runFullDiagnostic()</div>
              <div></div>
              <div>// Get claimable posts</div>
              <div>await window.debugClaimSystem.testGetClaimablePosts()</div>
              <div></div>
              <div>// Test claim validation</div>
              <div>await window.debugClaimSystem.testClaimValidation()</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold">Common Issues</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Database connectivity issues</li>
              <li>• Missing or expired trial posts</li>
              <li>• Authentication state problems</li>
              <li>• User claim limits exceeded</li>
              <li>• Post already claimed by another user</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
