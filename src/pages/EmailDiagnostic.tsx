import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EnhancedEmailService } from '@/services/enhancedEmailService';
import { EmailService } from '@/services/emailService';
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Send,
  RefreshCw,
  Loader2,
  Network,
  Database,
  Shield,
  Clock,
  Terminal
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timing?: number;
}

export default function EmailDiagnostic() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testSubject, setTestSubject] = useState('Email System Test');
  const [testMessage, setTestMessage] = useState('This is a test email from the diagnostic system.');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [connectivityResults, setConnectivityResults] = useState<any>(null);
  const { toast } = useToast();

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test 1: Netlify Function Availability
      await runTest('Netlify Function Availability', async () => {
        const response = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        
        if (response.status === 404) {
          throw new Error('Netlify function not found (404). Function may not be deployed.');
        }
        
        if (!response.ok) {
          throw new Error(`Function returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return `Function is available. Has Resend key: ${data.hasResendKey ? 'Yes' : 'No'}`;
      });

      // Test 2: Supabase Edge Function
      await runTest('Supabase Edge Function', async () => {
        try {
          const { supabase } = await import('../integrations/supabase/client');
          const { data, error } = await supabase.functions.invoke('send-email-resend', {
            body: { test: true }
          });
          
          if (error) {
            throw new Error(`Supabase function error: ${error.message}`);
          }
          
          return 'Supabase Edge function is available';
        } catch (error) {
          throw new Error(`Supabase not available: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      // Test 3: Environment Configuration
      await runTest('Environment Configuration', async () => {
        const checks = [];
        
        // Check Supabase config
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl) checks.push('✓ Supabase URL');
        else checks.push('✗ Supabase URL missing');
        
        if (supabaseKey) checks.push('✓ Supabase Key');
        else checks.push('✗ Supabase Key missing');
        
        return checks.join(', ');
      });

      // Test 4: Email Service Connectivity
      await runTest('Email Service Connectivity', async () => {
        const connectivity = await EnhancedEmailService.testEmailConnectivity(testEmail);
        setConnectivityResults(connectivity);
        
        if (connectivity.overall.working) {
          return `Working via ${connectivity.overall.recommendedProvider}`;
        } else {
          const errors = [];
          if (connectivity.netlify.error) errors.push(`Netlify: ${connectivity.netlify.error}`);
          if (connectivity.supabase.error) errors.push(`Supabase: ${connectivity.supabase.error}`);
          throw new Error(errors.join('; '));
        }
      });

      // Test 5: Original Email Service
      await runTest('Original Email Service', async () => {
        const healthCheck = await EmailService.healthCheck();
        return `Status: ${healthCheck.status}, Netlify: ${healthCheck.netlify ? 'OK' : 'Failed'}`;
      });

      // Test 6: Enhanced Email Service
      await runTest('Enhanced Email Service', async () => {
        const result = await EnhancedEmailService.sendEmailRobust({
          to: testEmail,
          subject: testSubject,
          message: testMessage
        });
        
        if (result.success) {
          return `Email sent successfully via ${result.provider}. ID: ${result.emailId}`;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      });

      toast({
        title: "Diagnostics Complete",
        description: "All email system tests have been executed.",
      });

    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runTest = async (name: string, testFn: () => Promise<string>) => {
    const startTime = Date.now();
    
    try {
      const message = await testFn();
      const timing = Date.now() - startTime;
      
      addResult({
        name,
        status: 'success',
        message,
        timing
      });
    } catch (error) {
      const timing = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      addResult({
        name,
        status: 'error',
        message: 'Test failed',
        details: errorMessage,
        timing
      });
    }
  };

  const sendTestEmail = async () => {
    setIsRunning(true);
    
    try {
      const result = await EnhancedEmailService.sendEmailRobust({
        to: testEmail,
        subject: testSubject,
        message: testMessage
      });
      
      if (result.success) {
        toast({
          title: "Test Email Sent",
          description: `Email sent successfully via ${result.provider}`,
        });
      } else {
        toast({
          title: "Test Email Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Email Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Settings className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'outline',
      info: 'secondary'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Mail className="h-10 w-10 text-primary" />
            Email System Diagnostic
          </h1>
          <p className="text-xl text-muted-foreground">
            Debug and test email delivery functionality
          </p>
        </div>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="testSubject">Test Subject</Label>
                <Input
                  id="testSubject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Email System Test"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={runDiagnostics}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="This is a test email..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendTestEmail}
                disabled={isRunning}
                variant="outline"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connectivity Results */}
        {connectivityResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Connectivity Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {connectivityResults.netlify.available ? (
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600 mx-auto" />
                    )}
                  </div>
                  <div className="font-medium">Netlify Function</div>
                  <div className="text-sm text-muted-foreground">
                    {connectivityResults.netlify.available ? 'Available' : 'Unavailable'}
                  </div>
                  {connectivityResults.netlify.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {connectivityResults.netlify.error}
                    </div>
                  )}
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {connectivityResults.supabase.available ? (
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600 mx-auto" />
                    )}
                  </div>
                  <div className="font-medium">Supabase Edge</div>
                  <div className="text-sm text-muted-foreground">
                    {connectivityResults.supabase.available ? 'Available' : 'Unavailable'}
                  </div>
                  {connectivityResults.supabase.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {connectivityResults.supabase.error}
                    </div>
                  )}
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {connectivityResults.overall.working ? (
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600 mx-auto" />
                    )}
                  </div>
                  <div className="font-medium">Overall Status</div>
                  <div className="text-sm text-muted-foreground">
                    {connectivityResults.overall.working ? 'Working' : 'Failed'}
                  </div>
                  {connectivityResults.overall.recommendedProvider !== 'none' && (
                    <div className="text-xs text-green-600 mt-1">
                      Via: {connectivityResults.overall.recommendedProvider}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Diagnostic Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-muted-foreground">{result.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.timing && (
                          <span className="text-xs text-muted-foreground">
                            {result.timing}ms
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    
                    {result.details && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <strong>Details:</strong> {result.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Fixes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Common Issues & Solutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-l-red-500 pl-4">
                <div className="font-medium text-red-800">404 Error - Netlify Function Not Found</div>
                <div className="text-sm text-red-600">
                  The Netlify function isn't deployed or the path is incorrect.
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Solution: Ensure the function is in netlify/functions/send-email.js and redeploy.
                </div>
              </div>
              
              <div className="border-l-4 border-l-orange-500 pl-4">
                <div className="font-medium text-orange-800">Missing Environment Variables</div>
                <div className="text-sm text-orange-600">
                  RESEND_API_KEY or Supabase credentials not configured.
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Solution: Add required environment variables to your deployment platform.
                </div>
              </div>
              
              <div className="border-l-4 border-l-blue-500 pl-4">
                <div className="font-medium text-blue-800">CORS Issues</div>
                <div className="text-sm text-blue-600">
                  Cross-origin requests being blocked.
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Solution: Ensure CORS headers are properly set in the function.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
