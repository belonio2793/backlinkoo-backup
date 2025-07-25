import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { emailService, EmailData, EmailResult } from '@/services/emailService';
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
  TrendingUp,
  Clock,
  Server,
  Database,
  Globe
} from 'lucide-react';

export function EmailSystemManager() {
  const [testEmail, setTestEmail] = useState<EmailData>({
    to: 'support@backlinkoo.com',
    subject: 'Multi-Provider Email System Test - ' + new Date().toLocaleString(),
    message: `Hello Support Team,

This is a comprehensive test of our multi-provider email delivery system.

🔧 Test Details:
- Timestamp: ${new Date().toISOString()}
- Source: Admin Email System Manager
- Providers: Resend → Supabase → Netlify → Admin Config

📊 This test validates:
✅ Primary delivery via Resend
✅ Fallback to Supabase Auth
✅ Netlify Functions backup
✅ Admin panel SMTP failsafe

If you receive this email, our email system is working correctly!

Best regards,
Email System Manager`
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<EmailResult | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [failureLog, setFailureLog] = useState<any[]>([]);
  const [adminConfig, setAdminConfig] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    enabled: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSystemHealth();
    loadFailureLog();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const health = await emailService.healthCheck();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadFailureLog = () => {
    const failures = emailService.getFailureLog();
    setFailureLog(failures);
  };

  const runEmailTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      console.log('🚀 Running comprehensive email system test...');
      const result = await emailService.sendEmail(testEmail);
      setTestResults(result);

      toast({
        title: result.success ? 'Email Test Successful' : 'Email Test Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });

      // Refresh logs and health after test
      loadSystemHealth();
      loadFailureLog();
    } catch (error: any) {
      console.error('Email test failed:', error);
      setTestResults({
        success: false,
        provider: 'mock',
        message: error.message,
        error
      });

      toast({
        title: 'Email Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificProvider = async (provider: 'resend' | 'netlify' | 'supabase' | 'admin') => {
    setIsLoading(true);
    
    try {
      const testData = {
        ...testEmail,
        subject: `${provider.toUpperCase()} Provider Test - ${new Date().toLocaleString()}`,
        message: `This is a direct test of the ${provider} email provider.\n\nTimestamp: ${new Date().toISOString()}`
      };

      // This would call specific provider methods
      console.log(`Testing ${provider} provider directly...`);
      
      // For demonstration, we'll use the main service
      const result = await emailService.sendEmail(testData);
      
      toast({
        title: `${provider.toUpperCase()} Test`,
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });

      loadSystemHealth();
      loadFailureLog();
    } catch (error: any) {
      toast({
        title: `${provider.toUpperCase()} Test Failed`,
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAdminConfig = () => {
    // In a real app, this would save to database/local storage
    localStorage.setItem('admin_smtp_config', JSON.stringify(adminConfig));
    toast({
      title: 'Configuration Saved',
      description: 'Admin SMTP configuration has been saved as failsafe backup.'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'resend': return <Mail className="h-4 w-4" />;
      case 'supabase': return <Database className="h-4 w-4" />;
      case 'netlify': return <Globe className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email System Manager</h2>
          <p className="text-muted-foreground">
            Multi-provider email delivery with automatic failsafe
          </p>
        </div>
        <Button onClick={loadSystemHealth} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="config">Admin Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(systemHealth.status)}>
                      {systemHealth.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth.recentFailures} failures in last hour
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {systemHealth.providers.map((provider: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${getStatusColor(provider.status)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {getProviderIcon(provider.name)}
                          <span className="font-medium capitalize">{provider.name}</span>
                        </div>
                        <div className="text-xs opacity-70">
                          Last tested: {provider.lastTested.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Loading system health...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Quick System Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Email Address</Label>
                  <Input
                    value={testEmail.to}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={testEmail.subject}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={runEmailTest} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing All Providers...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Run Complete System Test
                  </>
                )}
              </Button>

              {testResults && (
                <div className={`p-4 rounded-lg border ${
                  testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResults.success ? 'Test Successful' : 'Test Failed'}
                    </span>
                    <Badge variant="outline">{testResults.provider}</Badge>
                  </div>
                  <p className="text-sm">{testResults.message}</p>
                  {testResults.retryCount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tried {testResults.retryCount} provider(s)
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Provider Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['resend', 'supabase', 'netlify', 'admin'].map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => testSpecificProvider(provider as any)}
                    disabled={isLoading}
                  >
                    {getProviderIcon(provider)}
                    <span className="capitalize">{provider}</span>
                    <span className="text-xs text-muted-foreground">Test Provider</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Test Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea
                  value={testEmail.message}
                  onChange={(e) => setTestEmail(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Resend (Primary)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• High-deliverability email API</p>
                  <p>• Fast delivery & analytics</p>
                  <p>• Primary choice for all emails</p>
                  <p>• Configured via Supabase & Netlify</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Supabase (Secondary)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Uses auth system for email delivery</p>
                  <p>• Automatic fallback mechanism</p>
                  <p>• Integrated with user management</p>
                  <p>• Edge Functions for custom emails</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Netlify (Tertiary)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Serverless function delivery</p>
                  <p>• Independent infrastructure</p>
                  <p>• Backup for system reliability</p>
                  <p>• Functions deployed at edge</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Config (Failsafe)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Custom SMTP configuration</p>
                  <p>• Last resort delivery method</p>
                  <p>• Admin-controlled settings</p>
                  <p>• Emergency backup system</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Failure Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {failureLog.length > 0 ? (
                <div className="space-y-2">
                  {failureLog.map((failure, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div className="flex-1">
                        <div className="font-medium">{failure.provider}</div>
                        <div className="text-sm text-muted-foreground">{failure.error}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(failure.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-muted-foreground">No recent failures</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin SMTP Configuration (Failsafe)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={adminConfig.smtp_host}
                    onChange={(e) => setAdminConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    value={adminConfig.smtp_port}
                    onChange={(e) => setAdminConfig(prev => ({ ...prev, smtp_port: e.target.value }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input
                    value={adminConfig.smtp_user}
                    onChange={(e) => setAdminConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                    placeholder="admin@backlinkoo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <Input
                    type="password"
                    value={adminConfig.smtp_pass}
                    onChange={(e) => setAdminConfig(prev => ({ ...prev, smtp_pass: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button onClick={saveAdminConfig} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Failsafe Configuration
              </Button>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">Failsafe Information:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• This configuration is used only when all other providers fail</li>
                  <li>• Settings are stored locally for emergency use</li>
                  <li>• Recommended to use a dedicated SMTP service</li>
                  <li>• Test regularly to ensure failsafe reliability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
