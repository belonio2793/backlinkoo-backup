/**
 * Emergency Database Fixer Component
 * Allows users to fix missing database columns that cause campaign creation errors
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';
import { EmergencyDatabaseFix } from '@/utils/emergencyDatabaseFix';
import { toast } from 'sonner';

export function EmergencyDatabaseFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    missing: string[];
    existing: string[];
  } | null>(null);
  const [fixResult, setFixResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleVerifyColumns = async () => {
    setIsVerifying(true);
    try {
      const result = await EmergencyDatabaseFix.verifyColumns();
      setVerificationResult(result);
      
      if (result.success) {
        toast.success('All database columns are properly configured');
      } else {
        toast.warning(`Missing ${result.missing.length} required columns`);
      }
    } catch (error) {
      toast.error('Failed to verify database columns');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunFix = async () => {
    setIsFixing(true);
    try {
      const result = await EmergencyDatabaseFix.runCompleteFix();
      setFixResult(result);
      
      if (result.success) {
        toast.success('Database fix completed successfully!');
        // Re-verify after fix
        await handleVerifyColumns();
      } else {
        toast.error(`Database fix failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to run database fix');
      console.error('Fix error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-500" />
          Emergency Database Fixer
        </CardTitle>
        <CardDescription>
          Fix missing database columns that prevent campaign creation. If you're getting "Unknown error" when creating campaigns, this tool can help.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Verification Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Database Column Status</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyColumns}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verify Columns
                </>
              )}
            </Button>
          </div>

          {verificationResult && (
            <Alert className={verificationResult.success ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {verificationResult.success ? 'All columns exist' : `${verificationResult.missing.length} columns missing`}
                    </span>
                    <Badge variant={verificationResult.success ? 'default' : 'destructive'}>
                      {verificationResult.success ? 'OK' : 'NEEDS FIX'}
                    </Badge>
                  </div>
                  
                  {verificationResult.existing.length > 0 && (
                    <div>
                      <span className="text-xs text-green-600">Existing: </span>
                      <span className="text-xs">{verificationResult.existing.join(', ')}</span>
                    </div>
                  )}
                  
                  {verificationResult.missing.length > 0 && (
                    <div>
                      <span className="text-xs text-red-600">Missing: </span>
                      <span className="text-xs">{verificationResult.missing.join(', ')}</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Fix Section */}
        {verificationResult && !verificationResult.success && (
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <strong>Database Issue Detected:</strong> Missing columns are preventing campaign creation. 
                Click the button below to automatically fix this issue.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRunFix}
              disabled={isFixing}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing Database...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix Database Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* Fix Result */}
        {fixResult && (
          <Alert className={fixResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">{fixResult.message}</div>
                {fixResult.details && (
                  <div className="text-xs text-gray-600">
                    Method: {fixResult.details.fix_result?.details?.method || 'unknown'}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Click "Verify Columns" to check your database status</li>
            <li>2. If columns are missing, click "Fix Database Now"</li>
            <li>3. Wait for the fix to complete</li>
            <li>4. Try creating a campaign again</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmergencyDatabaseFixer;
