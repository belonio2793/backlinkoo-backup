import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Settings,
  Zap,
  Info
} from 'lucide-react';
import { SupabaseConnectionFixer } from '@/utils/supabaseConnectionFixer';

interface ConnectionFixerProps {
  onConnectionRestored?: () => void;
  className?: string;
}

export const SupabaseConnectionFixerComponent: React.FC<ConnectionFixerProps> = ({
  onConnectionRestored,
  className = ""
}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [lastFixResult, setLastFixResult] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    const blocked = SupabaseConnectionFixer.isConnectionBlocked();
    const diag = SupabaseConnectionFixer.getDiagnostics();
    
    setIsBlocked(blocked);
    setDiagnostics(diag);
    
    console.log('Connection diagnostics:', diag);
  };

  const handleEmergencyFix = async () => {
    setIsFixing(true);
    setLastFixResult(null);
    
    try {
      const result = await SupabaseConnectionFixer.emergencyFix();
      setLastFixResult(result);
      
      if (result.success) {
        setIsBlocked(false);
        if (onConnectionRestored) {
          onConnectionRestored();
        }
      }
      
      // Refresh diagnostics
      checkConnectionStatus();
      
    } catch (error: any) {
      setLastFixResult({
        success: false,
        message: `Fix failed: ${error.message}`,
        actions: []
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      const result = await SupabaseConnectionFixer.testConnection();
      setLastFixResult(result);
      
      if (result.success) {
        setIsBlocked(false);
      }
      
      checkConnectionStatus();
      
    } catch (error: any) {
      setLastFixResult({
        success: false,
        message: `Test failed: ${error.message}`,
        actions: []
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearFlag = () => {
    SupabaseConnectionFixer.clearConnectionFailureFlag();
    checkConnectionStatus();
    setLastFixResult({
      success: true,
      message: 'Connection failure flag cleared',
      actions: ['Cleared localStorage flag']
    });
  };

  // Don't show if connection is not blocked and no issues
  if (!isBlocked && diagnostics?.configValid && !showDiagnostics) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <WifiOff className="h-5 w-5" />
            Supabase Connection Issue Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              {isBlocked ? (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Blocked
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Not Blocked
                </Badge>
              )}
              <span className="text-sm text-gray-600">Connection Status</span>
            </div>
            
            <div className="flex items-center gap-2">
              {diagnostics?.configValid ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Invalid
                </Badge>
              )}
              <span className="text-sm text-gray-600">Configuration</span>
            </div>
            
            <div className="flex items-center gap-2">
              {diagnostics?.environmentVariables?.hasUrl && diagnostics?.environmentVariables?.hasKey ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Present
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Missing
                </Badge>
              )}
              <span className="text-sm text-gray-600">Environment Variables</span>
            </div>
          </div>

          {/* Error Message */}
          {isBlocked && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supabase requests are currently blocked due to previous connection failures. 
                This prevents the blog service from working properly.
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration Issues */}
          {!diagnostics?.configValid && diagnostics?.configIssues?.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuration Issues:</strong>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  {diagnostics.configIssues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEmergencyFix}
              disabled={isFixing}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Emergency Fix
                </>
              )}
            </Button>

            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="outline"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {isBlocked && (
              <Button
                onClick={handleClearFlag}
                variant="outline"
                size="sm"
              >
                Clear Block Flag
              </Button>
            )}

            <Button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              variant="ghost"
              size="sm"
            >
              <Info className="h-4 w-4 mr-2" />
              {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
            </Button>
          </div>

          {/* Fix Result */}
          {lastFixResult && (
            <Alert className={lastFixResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {lastFixResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>{lastFixResult.success ? 'Success:' : 'Error:'}</strong> {lastFixResult.message}
                {lastFixResult.actions && lastFixResult.actions.length > 0 && (
                  <div className="mt-2">
                    <strong>Actions taken:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      {lastFixResult.actions.map((action: string, index: number) => (
                        <li key={index} className="text-sm">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Diagnostics Details */}
          {showDiagnostics && diagnostics && (
            <Card className="bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Connection Diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConnectionFixerComponent;
