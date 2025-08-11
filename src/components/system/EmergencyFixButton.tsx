import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, CheckCircle, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function EmergencyFixButton() {
  const [isFixing, setIsFixing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const executeEmergencyFix = async () => {
    setIsFixing(true);
    setLastResult(null);

    try {
      console.log('🚨 Executing emergency database fix...');
      
      const response = await fetch('/.netlify/functions/fix-database-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'fix_schema',
          emergency: true 
        })
      });

      const result = await response.json();
      setLastResult(result);

      if (response.ok && result.success) {
        toast.success('Emergency Fix Successful!', {
          description: 'Database schema has been repaired. Page will refresh in 3 seconds.',
          duration: 3000
        });

        // Reload the page after a short delay to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        toast.error('Emergency Fix Failed', {
          description: result.error || result.message || 'Unknown error occurred',
          action: {
            label: 'Try Manual Fix',
            onClick: () => {
              window.open('/test-database-fix.html', '_blank');
            }
          }
        });
      }

    } catch (error: any) {
      console.error('Emergency fix request failed:', error);
      setLastResult({ error: error.message });
      
      toast.error('Emergency Fix Request Failed', {
        description: 'Could not connect to fix service. Try manual fix.',
        action: {
          label: 'Manual Fix Page',
          onClick: () => {
            window.open('/test-database-fix.html', '_blank');
          }
        }
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <div className="font-medium text-red-800 mb-1">Critical Database Issues Detected</div>
              <div className="text-sm text-red-700 space-y-1">
                <div>• Missing exec_sql function</div>
                <div>• Missing columns: started_at, completed_at, auto_start</div>
                <div>• Campaign functionality is not working</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={executeEmergencyFix}
                disabled={isFixing}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                {isFixing ? (
                  <>
                    <Wrench className="h-4 w-4 animate-spin" />
                    Fixing Database...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Emergency Fix Now
                  </>
                )}
              </Button>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open('/test-database-fix.html', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manual Fix
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Show last result */}
      {lastResult && (
        <Alert className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {lastResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <div className={lastResult.success ? 'text-green-800' : 'text-red-800'}>
              <div className="font-medium mb-1">
                {lastResult.success ? 'Fix Successful' : 'Fix Failed'}
              </div>
              <div className="text-sm">
                {lastResult.message || lastResult.error}
              </div>
              {lastResult.summary && (
                <div className="text-xs mt-2">
                  Executed {lastResult.summary.totalStatements} statements with {lastResult.summary.successRate} success rate
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
