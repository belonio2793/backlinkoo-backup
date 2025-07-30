import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DashboardAccessDiagnostic } from '@/utils/dashboardAccessDiagnostic';
import { Bug, Key, Shield, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function DashboardAccessHelper() {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const runDiagnostic = async () => {
    setIsChecking(true);
    try {
      const result = await DashboardAccessDiagnostic.checkDashboardAccess();
      setDiagnosticResult(result);
      
      if (result.canAccess) {
        toast({
          title: "Dashboard Access Available",
          description: "You should be able to access the dashboard now.",
        });
      } else {
        toast({
          title: "Dashboard Access Issues Found",
          description: `Found ${result.issues.length} issues preventing access.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Diagnostic Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const fixAccess = async () => {
    setIsChecking(true);
    try {
      const result = await DashboardAccessDiagnostic.fixDashboardAccess();
      
      toast({
        title: result.success ? "Fix Applied" : "Fix Needed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      
      if (result.success) {
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error: any) {
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const forceAccess = () => {
    DashboardAccessDiagnostic.forceAllowDashboardAccess();
    toast({
      title: "Forced Access Enabled",
      description: "Dashboard access has been enabled. Redirecting...",
    });
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Dashboard Access Helper
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={runDiagnostic}
            disabled={isChecking}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            {isChecking ? 'Checking...' : 'Run Diagnostic'}
          </Button>
          
          <Button 
            onClick={fixAccess}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Auto Fix
          </Button>
          
          <Button 
            onClick={forceAccess}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Force Access
          </Button>
        </div>

        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {diagnosticResult.canAccess ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {diagnosticResult.canAccess ? 'Dashboard Access Available' : 'Dashboard Access Blocked'}
              </span>
            </div>

            {/* Auth State */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Authentication Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {diagnosticResult.authState.hasSession ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Session: {diagnosticResult.authState.hasSession ? 'Active' : 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {diagnosticResult.authState.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Email: {diagnosticResult.authState.emailVerified ? 'Verified' : 'Not Verified'}</span>
                </div>
                {diagnosticResult.authState.userEmail && (
                  <div className="text-gray-600">
                    User: {diagnosticResult.authState.userEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Issues */}
            {diagnosticResult.issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Issues Found
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {diagnosticResult.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnosticResult.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {diagnosticResult.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Direct Dashboard Link */}
        <div className="pt-4 border-t">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full"
            size="lg"
          >
            Try Dashboard Access
          </Button>
        </div>

        {/* Console Commands */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Console Commands:</strong></p>
          <p>• <code>window.dashboardDiagnostic.checkDashboardAccess()</code></p>
          <p>• <code>window.dashboardDiagnostic.fixDashboardAccess()</code></p>
          <p>• <code>window.dashboardDiagnostic.forceAllowDashboardAccess()</code></p>
        </div>
      </CardContent>
    </Card>
  );
}
