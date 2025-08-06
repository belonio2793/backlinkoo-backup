import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Play, Mail, Settings, Database, TestTube } from 'lucide-react';
import { emailAuthDiagnostic } from '../utils/emailAuthDiagnostic';
import { testUserRegistrationEmail } from '../utils/testUserRegistrationEmail';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  recommendation?: string;
}

export const EmailAuthDiagnosticPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isTestingRegistration, setIsTestingRegistration] = useState(false);
  const [registrationResults, setRegistrationResults] = useState<any[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      const diagnosticResults = await emailAuthDiagnostic.runFullDiagnostic();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setResults([{
        test: 'Diagnostic Error',
        status: 'fail',
        message: 'Failed to run diagnostic',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recommendation: 'Check browser console for detailed error information'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runRegistrationTest = async () => {
    setIsTestingRegistration(true);
    try {
      const results = await testUserRegistrationEmail.testRegistrationFlow();
      setRegistrationResults(results);
    } catch (error) {
      console.error('Registration test failed:', error);
      toast({
        title: "Test failed",
        description: "Failed to run registration test",
        variant: "destructive",
      });
    } finally {
      setIsTestingRegistration(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default' as const,
      warning: 'secondary' as const,
      fail: 'destructive' as const
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getSummaryStats = () => {
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    return { passed, warnings, failed };
  };

  const { passed, warnings, failed } = getSummaryStats();
  const hasResults = results.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Authentication Diagnostic
          </CardTitle>
          <CardDescription>
            Comprehensive testing of email authentication system for user registrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Diagnostic...' : 'Run Email Auth Diagnostic'}
            </Button>

            <Button
              onClick={runRegistrationTest}
              disabled={isTestingRegistration}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isTestingRegistration ? 'Testing Registration...' : 'Test Registration Flow'}
            </Button>
            
            {hasResults && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {passed} Passed
                </span>
                {warnings > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {warnings} Warnings
                  </span>
                )}
                {failed > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {failed} Failed
                  </span>
                )}
              </div>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Running diagnostic tests... ({progress}%)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasResults && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {failed === 0 && warnings === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    🎉 All tests passed! Email authentication should be working properly.
                    Test user registration with a real email address to verify the complete flow.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant={failed > 0 ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {failed > 0 
                      ? `Found ${failed} critical issue(s) that need immediate attention.`
                      : `Found ${warnings} warning(s) that should be reviewed.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Individual Test Results */}
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.test}
                    </CardTitle>
                    {getStatusBadge(result.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  
                  {result.details && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-medium mb-2">Details:</p>
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.recommendation && (
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Recommendation:</strong> {result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Additional Configuration Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Supabase Configuration:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Go to Supabase Dashboard → Authentication → Email Templates</li>
                    <li>Configure "Confirm signup" template with custom styling</li>
                    <li>Set redirect URL to: <code className="bg-muted px-1 rounded">https://backlinkoo.com/auth/confirm</code></li>
                    <li>Add RESEND_API_KEY to Project Settings → Environment Variables</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Resend Configuration:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Verify domain "backlinkoo.com" in Resend dashboard</li>
                    <li>Check DNS records are properly configured</li>
                    <li>Test email delivery to different providers (Gmail, Outlook, etc.)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Testing:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Try registering with a real email address</li>
                    <li>Check spam/junk folders for confirmation emails</li>
                    <li>Monitor Supabase Auth logs for any errors</li>
                    <li>Verify email confirmation links work correctly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
