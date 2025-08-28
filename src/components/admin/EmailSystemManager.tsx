import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { directEmailService } from '@/services/directEmailService';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Monitor,
  Shield,
  Server,
  Eye,
  EyeOff
} from 'lucide-react';

interface EmailData {
  to: string;
  subject: string;
  content: string;
}

interface EmailResponse {
  success: boolean;
  emailId?: string;
  provider?: string;
  error?: string;
}

export function EmailSystemManager() {
  const [testEmail, setTestEmail] = useState<EmailData>({
    to: 'support@backlinkoo.com',
    subject: 'Email System Test',
    content: 'This is a test email from the production email system.'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<EmailResponse | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>({
    resend: false,
    netlify: false,
    status: 'unknown'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const health = await directEmailService.healthCheck();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to check system health:', error);
      setSystemHealth({
        resend: false,
        netlify: false,
        status: 'error'
      });
    }
  };

  const runEmailTest = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Running email system test...');
      const result = await directEmailService.sendEmail(testEmail);
      setTestResults(result);
      
      if (result.success) {
        toast({
          title: "Email Test Successful",
          description: `Email sent successfully via ${result.provider}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Email test failed:', error);
      setTestResults({
        success: false,
        error: error.message || 'Email test failed'
      });
      toast({
        title: "Email Test Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickTest = async (testType: 'confirmation' | 'reset' | 'welcome') => {
    setIsLoading(true);
    try {
      let result: EmailResponse;
      const testData = {
        to: testEmail.to,
        subject: `Test: ${testType} email`,
        content: `This is a test ${testType} email.`
      };

      result = await directEmailService.sendEmail(testData);
      
      setTestResults(result);
      
      toast({
        title: result.success ? "Quick Test Successful" : "Quick Test Failed",
        description: result.success 
          ? `${testType} email sent successfully`
          : result.error || "Test failed",
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error(`Quick test (${testType}) failed:`, error);
      toast({
        title: "Quick Test Error",
        description: error.message || "Quick test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthBadge = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return (
        <Badge variant={status ? "default" : "destructive"}>
          {status ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      );
    }
    
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Monitor className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Production Email System Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Email Testing</TabsTrigger>
              <TabsTrigger value="health">System Health</TabsTrigger>
              <TabsTrigger value="logs">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail.to}
                    onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="test-subject">Subject</Label>
                  <Input
                    id="test-subject"
                    value={testEmail.subject}
                    onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="test-content">Content</Label>
                  <Textarea
                    id="test-content"
                    value={testEmail.content}
                    onChange={(e) => setTestEmail({ ...testEmail, content: e.target.value })}
                    placeholder="Email content"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={runEmailTest} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Test Email
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickTest('confirmation')}
                    disabled={isLoading}
                  >
                    Test Confirmation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickTest('reset')}
                    disabled={isLoading}
                  >
                    Test Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickTest('welcome')}
                    disabled={isLoading}
                  >
                    Test Welcome
                  </Button>
                </div>

                {testResults && (
                  <Card className={testResults.success ? "border-green-200" : "border-red-200"}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        {testResults.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {testResults.success ? 'Email Sent Successfully' : 'Email Failed'}
                        </span>
                      </div>
                      
                      {testResults.success && testResults.emailId && (
                        <p className="text-sm text-gray-600">
                          Email ID: {testResults.emailId}
                        </p>
                      )}
                      
                      {testResults.success && testResults.provider && (
                        <p className="text-sm text-gray-600">
                          Provider: {testResults.provider}
                        </p>
                      )}
                      
                      {!testResults.success && testResults.error && (
                        <p className="text-sm text-red-600">
                          Error: {testResults.error}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Overall Status
                        </span>
                        {getHealthBadge(systemHealth.status)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Service
                        </span>
                        {getHealthBadge(systemHealth.resend)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Netlify Functions
                        </span>
                        {getHealthBadge(systemHealth.netlify)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={checkSystemHealth}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Health Check
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Email Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Email activity logs are maintained by the email service provider.
                    Check your email service dashboard for detailed logs and analytics.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
