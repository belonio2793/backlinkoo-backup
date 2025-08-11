import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Wrench, Database, Loader2 } from 'lucide-react';
import { EmergencyDatabaseFix } from '@/utils/emergencyDatabaseFix';
import { toast } from 'sonner';

interface DatabaseHealthStatus {
  needsFix: boolean;
  issues: string[];
  hasExecSql: boolean;
  hasColumns: boolean;
}

export function DatabaseHealthChecker() {
  const [healthStatus, setHealthStatus] = useState<DatabaseHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const status = await EmergencyDatabaseFix.checkDatabaseHealth();
      setHealthStatus(status);
      setLastCheck(new Date());
      
      if (status.needsFix) {
        toast.warning('Database Issues Detected', {
          description: `Found ${status.issues.length} issues that need attention`
        });
      } else {
        toast.success('Database Health Check Passed', {
          description: 'All database functions and schema are working correctly'
        });
      }
    } catch (error: any) {
      toast.error('Health Check Failed', {
        description: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const attemptAutoFix = async () => {
    setIsFixing(true);
    try {
      const result = await EmergencyDatabaseFix.attemptDatabaseFix();
      
      if (result.success) {
        toast.success('Database Fixed', {
          description: result.message
        });
        // Re-run health check to verify
        await runHealthCheck();
      } else {
        toast.error('Fix Failed', {
          description: result.message
        });
      }
    } catch (error: any) {
      toast.error('Fix Attempt Failed', {
        description: error.message
      });
    } finally {
      setIsFixing(false);
    }
  };

  const createFallbackSupport = async () => {
    try {
      const success = await EmergencyDatabaseFix.createFallbackSupport();
      if (success) {
        toast.success('Fallback Support Created', {
          description: 'Basic functionality will work while database issues are resolved'
        });
      } else {
        toast.error('Failed to create fallback support');
      }
    } catch (error: any) {
      toast.error('Fallback creation failed', {
        description: error.message
      });
    }
  };

  // Auto-run health check on mount
  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className={status ? 'bg-green-100 text-green-700' : ''}>
        {status ? 'OK' : 'ISSUE'}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Health Status
          {healthStatus?.needsFix && <AlertTriangle className="h-5 w-5 text-amber-500" />}
        </CardTitle>
        <CardDescription>
          Monitor and fix critical database schema issues
          {lastCheck && (
            <span className="block text-xs text-gray-500 mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Status */}
        {healthStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(!healthStatus.needsFix)}
                <span className="font-medium">Overall Status</span>
              </div>
              {getStatusBadge(!healthStatus.needsFix)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthStatus.hasExecSql)}
                  <span className="text-sm">exec_sql Function</span>
                </div>
                {getStatusBadge(healthStatus.hasExecSql)}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthStatus.hasColumns)}
                  <span className="text-sm">Required Columns</span>
                </div>
                {getStatusBadge(healthStatus.hasColumns)}
              </div>
            </div>

            {/* Issues List */}
            {healthStatus.issues.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Issues Found:</div>
                  <ul className="text-sm space-y-1">
                    {healthStatus.issues.map((issue, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={runHealthCheck}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isChecking ? 'Checking...' : 'Check Health'}
          </Button>

          {healthStatus?.needsFix && (
            <>
              <Button 
                onClick={attemptAutoFix}
                disabled={isFixing}
                className="flex items-center gap-2"
              >
                {isFixing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                {isFixing ? 'Fixing...' : 'Auto Fix'}
              </Button>

              <Button 
                variant="secondary"
                onClick={createFallbackSupport}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Enable Fallback
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        {healthStatus?.needsFix && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Database Migration Required</div>
              <div className="text-sm space-y-2">
                <p>The database is missing critical schema elements. To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Try the "Auto Fix" button above (requires appropriate permissions)</li>
                  <li>If auto-fix fails, use "Enable Fallback" for basic functionality</li>
                  <li>Contact your database administrator to run the migration manually</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!healthStatus && !isChecking && (
          <div className="text-center py-4 text-gray-500">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Check Health" to verify database status</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
