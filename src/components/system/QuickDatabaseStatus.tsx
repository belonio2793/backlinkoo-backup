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
      const result = await EmergencyDatabaseFix.attemptDatabaseFix();
      
      if (result.success) {
        toast.success('Database Fixed!');
        await checkDatabaseQuickly(); // Re-check
      } else {
        toast.error('Auto-fix failed', {
          description: result.message
        });
      }
    } catch (error: any) {
      toast.error('Fix failed', {
        description: error.message
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
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-medium text-amber-800">Database Issues Detected</div>
              <div className="text-sm text-amber-700">
                {issues.slice(0, 2).map((issue, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                    {issue}
                  </div>
                ))}
                {issues.length > 2 && (
                  <div className="text-xs">+ {issues.length - 2} more issues</div>
                )}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={attemptQuickFix}
              disabled={isFixing}
              className="ml-3 flex-shrink-0"
            >
              {isFixing ? (
                <>
                  <Wrench className="h-3 w-3 mr-1 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="h-3 w-3 mr-1" />
                  Quick Fix
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
