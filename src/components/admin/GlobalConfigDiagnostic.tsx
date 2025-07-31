/**
 * Global Configuration Diagnostic Component
 * Helps diagnose and fix configuration sync issues between admin dashboard and global services
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Zap,
  Settings,
  Cloud,
  Database,
  Eye,
  Wrench
} from 'lucide-react';
import { globalConfigTest, GlobalConfigTestResult } from '@/utils/globalConfigTest';
import { adminGlobalSync } from '@/services/adminGlobalConfigSync';

interface DiagnosticResult {
  issues: string[];
  solutions: string[];
  adminConfigured: boolean;
  globalAccessible: boolean;
}

export function GlobalConfigDiagnostic() {
  const [testResults, setTestResults] = useState<GlobalConfigTestResult[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: 'healthy' | 'degraded' | 'critical';
    summary: string;
  } | null>(null);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      // Run comprehensive tests
      const [results, issues, health] = await Promise.all([
        globalConfigTest.testAllGlobalConfigs(),
        globalConfigTest.diagnoseIssues(),
        globalConfigTest.quickHealthCheck()
      ]);

      setTestResults(results);
      setDiagnostic(issues);
      setHealthStatus({ status: health.status, summary: health.summary });

    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceSyncConfigs = async () => {
    setIsSyncing(true);
    try {
      const result = await globalConfigTest.forceSyncAdminToGlobal();
      
      if (result.success) {
        console.log(`✅ Synced ${result.synced} configurations`);
        // Re-run diagnostic after sync
        await runDiagnostic();
      } else {
        console.error('❌ Sync failed:', result.errors);
      }

    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (working: boolean, configured: boolean) => {
    if (working) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (configured) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (working: boolean, configured: boolean) => {
    if (working) return <Badge className="bg-green-100 text-green-800">Working</Badge>;
    if (configured) return <Badge className="bg-yellow-100 text-yellow-800">Configured</Badge>;
    return <Badge className="bg-red-100 text-red-800">Not Working</Badge>;
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Global Configuration Diagnostic</h2>
            <p className="text-muted-foreground">
              Diagnose and fix configuration sync issues
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Refresh'}
          </Button>
          <Button onClick={forceSyncConfigs} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-700">
            <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Force Sync'}
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              {getHealthBadge(healthStatus.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{healthStatus.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Service Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Global Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 && !isLoading ? (
            <p className="text-muted-foreground">No test results available. Click "Refresh" to run diagnostic.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => (
                <div key={result.service} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">{result.service}</span>
                      {getStatusIcon(result.working, result.configured)}
                    </div>
                    {getStatusBadge(result.working, result.configured)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Source:</span>
                      <p>{result.details.source}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Key:</span>
                      <p className="font-mono">{result.details.keyMasked}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Health:</span>
                      <p>{result.details.healthScore || 0}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Last Sync:</span>
                      <p>{result.details.lastSync ? new Date(result.details.lastSync).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>

                  {result.error && (
                    <Alert className="mt-3 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Issues & Solutions */}
      {diagnostic && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues */}
          {diagnostic.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Issues Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnostic.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Solutions */}
          {diagnostic.solutions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Settings className="h-5 w-5" />
                  Recommended Solutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnostic.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Success Message */}
      {diagnostic && diagnostic.issues.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            🎉 All configurations are working properly! Global services can access admin configurations successfully.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
