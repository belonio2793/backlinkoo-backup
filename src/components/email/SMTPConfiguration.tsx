import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Server,
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  TestTube,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface SMTPConfigurationProps {
  onStatusChange: (status: 'pending' | 'configured' | 'verified') => void;
  currentStatus: string;
}

export function SMTPConfiguration({ onStatusChange, currentStatus }: SMTPConfigurationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    encryption: 'TLS'
  });
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  // Popular SMTP providers with pre-filled settings
  const smtpProviders = [
    {
      name: 'Amazon SES',
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: '587',
      icon: '📧'
    },
    {
      name: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: '587',
      icon: '📨'
    },
    {
      name: 'Mailgun',
      host: 'smtp.mailgun.org',
      port: '587',
      icon: '📩'
    },
    {
      name: 'Custom SMTP',
      host: '',
      port: '587',
      icon: '⚙️'
    }
  ];

  const handleProviderSelect = (provider: typeof smtpProviders[0]) => {
    setConfig(prev => ({
      ...prev,
      host: provider.host,
      port: provider.port
    }));
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to save SMTP configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store in localStorage for demo
      localStorage.setItem('smtp_config', JSON.stringify(config));
      
      onStatusChange('configured');
      toast({
        title: 'SMTP Configuration Saved',
        description: 'Your SMTP settings have been successfully configured.',
      });
    } catch (error) {
      toast({
        title: 'Configuration Failed',
        description: 'Failed to save SMTP configuration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      toast({
        title: 'Test Email Required',
        description: 'Please enter an email address to test the connection.',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    
    try {
      // Simulate SMTP test
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: 'Test Email Sent Successfully!',
        description: `Test email has been sent to ${testEmail}`,
      });
      
      onStatusChange('verified');
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to send test email. Please check your configuration.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'Configuration has been copied to clipboard.',
    });
  };

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('smtp_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMTP Configuration</h2>
          <p className="text-muted-foreground">
            Configure your SMTP server for email delivery
          </p>
        </div>
        
        <Badge 
          variant={currentStatus === 'verified' ? 'default' : 'secondary'}
          className="gap-1"
        >
          {currentStatus === 'verified' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {currentStatus === 'verified' ? 'Verified' : 'Not Configured'}
        </Badge>
      </div>

      {/* SMTP Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Choose SMTP Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {smtpProviders.map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => handleProviderSelect(provider)}
              >
                <span className="text-2xl">{provider.icon}</span>
                <span className="font-medium">{provider.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SMTP Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                placeholder="smtp.example.com"
                value={config.host}
                onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="587"
                value={config.port}
                onChange={(e) => setConfig(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="your-smtp-username"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="your-smtp-password"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={config.fromEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="Backlink ∞"
                value={config.fromName}
                onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSaveConfig}
              disabled={isLoading || !config.host || !config.username}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => copyToClipboard(JSON.stringify(config, null, 2))}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      {currentStatus === 'configured' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !testEmail}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Use App Passwords</p>
                <p className="text-sm text-muted-foreground">
                  Use app-specific passwords instead of your main account password
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Enable TLS/SSL</p>
                <p className="text-sm text-muted-foreground">
                  Always use encrypted connections (TLS on port 587 or SSL on port 465)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Monitor Sending Limits</p>
                <p className="text-sm text-muted-foreground">
                  Be aware of your SMTP provider's daily/hourly sending limits
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
