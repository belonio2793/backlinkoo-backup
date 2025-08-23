/**
 * Netlify Deployment Checker
 * 
 * Helps users diagnose and fix Netlify function deployment issues
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import NetlifyFunctionDiagnostic, { type FunctionDiagnosticResult } from '@/utils/netlifyFunctionDiagnostic';

export function NetlifyDeploymentChecker() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FunctionDiagnosticResult[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'healthy' | 'partial' | 'critical';
    message: string;
    availableFunctions: string[];
    missingFunctions: string[];
    recommendations: string[];
  } | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      toast.info('🔍 Running Netlify function diagnostic...');
      
      const diagnostic = await NetlifyFunctionDiagnostic.runDomainManagementDiagnostic();
      const status = await NetlifyFunctionDiagnostic.getDeploymentStatus();
      
      setResults(diagnostic.results);
      setDeploymentStatus(status);
      
      // Log to console for debugging
      await NetlifyFunctionDiagnostic.logDiagnostic();
      
      if (status.status === 'healthy') {
        toast.success('✅ All functions are deployed and working!');
      } else if (status.status === 'partial') {
        toast.warning('⚠️ Some functions are missing. Check results below.');
      } else {
        toast.error('❌ Critical: No functions are deployed.');
      }
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
      toast.error('❌ Diagnostic failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'partial' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'partial' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-800 bg-green-50 border-green-200';
      case 'partial': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-800 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Netlify Function Deployment Status</span>
            <Button
              onClick={runDiagnostic}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Diagnostic
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This diagnostic checks if all required Netlify functions are deployed and accessible.
            If functions are missing, domain management features may not work properly.
          </p>
          
          {deploymentStatus && (
            <Alert className={getStatusColor(deploymentStatus.status)}>
              <div className="flex items-center gap-2">
                {getStatusIcon(deploymentStatus.status)}
                <AlertDescription>
                  <strong>{deploymentStatus.status.toUpperCase()}:</strong> {deploymentStatus.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Function Status Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Function Status Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.isAvailable ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.functionName}</p>
                      <p className="text-sm text-gray-600">{result.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.isAvailable ? 'default' : 'destructive'}>
                      HTTP {result.status}
                    </Badge>
                    {result.responseTime && (
                      <span className="text-xs text-gray-500">
                        {result.responseTime}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {deploymentStatus?.recommendations && deploymentStatus.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deploymentStatus.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                If functions are missing, you may need to:
              </p>
              <div className="space-y-2 text-sm">
                <p>1. Push your code to trigger a new Netlify deployment</p>
                <p>2. Check your Netlify build logs for errors</p>
                <p>3. Verify your netlify.toml configuration</p>
                <p>4. Ensure function dependencies are properly installed</p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://app.netlify.com/sites/backlinkoo/deploys', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Netlify Deploys
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://app.netlify.com/sites/backlinkoo/functions', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Netlify Functions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NetlifyDeploymentChecker;
