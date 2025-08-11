import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Database, Wrench } from 'lucide-react';
import { EmergencyDatabaseFix } from '@/utils/emergencyDatabaseFix';
import { toast } from 'sonner';

export function QuickDatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'issues' | 'error'>('checking');
  const [issues, setIssues] = useState<string[]>([]);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    checkDatabaseQuickly();
  }, []);

  const checkDatabaseQuickly = async () => {
    try {
      const health = await EmergencyDatabaseFix.checkDatabaseHealth();
      
      if (health.needsFix) {
        setStatus('issues');
        setIssues(health.issues);
      } else {
        setStatus('healthy');
        setIssues([]);
      }
    } catch (error) {
      console.error('Quick database check failed:', error);
      setStatus('error');
      setIssues(['Unable to check database status']);
    }
  };

  const attemptQuickFix = async () => {
    setIsFixing(true);
    try {
      console.log('🔧 Starting quick database fix...');

      // Try the dedicated Netlify function first
      try {
        const response = await fetch('/.netlify/functions/fix-database-schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'fix_schema' })
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            toast.success('Database Schema Fixed!', {
              description: 'exec_sql function and missing columns have been added'
            });
            await checkDatabaseQuickly(); // Re-check
            return;
          } else {
            console.warn('Netlify function fix failed:', result);
          }
        }
      } catch (fetchError) {
        console.warn('Netlify function not available:', fetchError);
      }

      // Fallback to the emergency fix utility
      const result = await EmergencyDatabaseFix.attemptDatabaseFix();

      if (result.success) {
        toast.success('Database Fixed!', {
          description: result.message
        });
        await checkDatabaseQuickly(); // Re-check
      } else {
        toast.error('Auto-fix failed', {
          description: result.message,
          action: {
            label: 'Manual Fix',
            onClick: () => {
              window.open('/test-database-fix.html', '_blank');
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Quick fix failed:', error);
      toast.error('Fix failed', {
        description: error.message,
        action: {
          label: 'Manual Fix',
          onClick: () => {
            window.open('/test-database-fix.html', '_blank');
          }
        }
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Database className="h-4 w-4 animate-pulse" />
        Checking database...
      </div>
    );
  }

  if (status === 'healthy') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <Badge variant="default" className="bg-green-100 text-green-700">
          Database OK
        </Badge>
      </div>
    );
  }

  if (status === 'issues' || status === 'error') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <div className="font-medium text-amber-800">Database Schema Issue</div>
              <div className="text-sm text-amber-700 mt-1">
                The automation system can't access required database columns. This prevents campaign creation and management from working properly.
              </div>
            </div>

            <div className="text-xs text-amber-600 space-y-1">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  {issue}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
              <Button
                size="sm"
                variant="outline"
                onClick={attemptQuickFix}
                disabled={isFixing}
                className="bg-white hover:bg-amber-50 text-amber-800 border-amber-300"
              >
                {isFixing ? (
                  <>
                    <Wrench className="h-3 w-3 mr-1 animate-spin" />
                    Attempting Fix...
                  </>
                ) : (
                  <>
                    <Wrench className="h-3 w-3 mr-1" />
                    Try Auto Fix
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open('/test-database-fix.html', '_blank')}
                className="text-amber-800 hover:bg-amber-100"
              >
                Manual Fix Guide
              </Button>
            </div>

            <div className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
              <strong>What this means:</strong> Your database is missing some required columns for the automation features.
              This is a one-time setup issue that needs to be resolved by a database administrator.
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
