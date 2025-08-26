import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { paymentConfigService } from '@/services/paymentConfigService';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Server,
  Database,
  CreditCard,
  Mail,
  Settings,
  Zap,
  Cloud,
  RefreshCw,
  Globe,
  Key
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'checking';
  message: string;
  details?: string;
  icon: React.ReactNode;
}

export default function DevEnvironmentStatus() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const checks: HealthCheck[] = [];

    // 1. Supabase Connection
    checks.push({
      name: 'Supabase Database',
      status: 'checking',
      message: 'Testing connection...',
      icon: <Database className="h-4 w-4" />
    });

    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
      checks[checks.length - 1] = {
        ...checks[checks.length - 1],
        status: 'success',
        message: 'Connected successfully',
        details: 'Database queries working'
      };
    } catch (error) {
      checks[checks.length - 1] = {
        ...checks[checks.length - 1],
        status: 'error',
        message: 'Connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 2. Authentication Service
    checks.push({
      name: 'Authentication',
      status: user ? 'success' : 'warning',
      message: user ? `Signed in as ${user.email}` : 'No user signed in',
      details: user ? 'Auth service working' : 'Test by signing in',
      icon: <Key className="h-4 w-4" />
    });

    // 3. Environment Variables
    const envVars = [
      'VITE_SUPABASE_URL',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_ENVIRONMENT'
    ];
    
    const missingEnvVars = envVars.filter(envVar => !import.meta.env[envVar]);
    checks.push({
      name: 'Environment Variables',
      status: missingEnvVars.length === 0 ? 'success' : 'warning',
      message: missingEnvVars.length === 0 ? 'All required variables set' : `${missingEnvVars.length} variables missing`,
      details: missingEnvVars.length > 0 ? `Missing: ${missingEnvVars.join(', ')}` : 'Frontend env vars configured',
      icon: <Settings className="h-4 w-4" />
    });

    // 4. Payment Integration
    const paymentConfig = paymentConfigService.validateConfiguration();
    const paymentIntegration = paymentIntegrationService.getConfigurationStatus();
    
    checks.push({
      name: 'Payment System',
      status: paymentConfig.success && paymentIntegration.isConfigured ? 'success' : 'warning',
      message: paymentConfig.success ? 'Stripe configured' : 'Payment setup incomplete',
      details: `Available methods: ${paymentIntegration.availableMethods.join(', ') || 'None'}`,
      icon: <CreditCard className="h-4 w-4" />
    });

    // 5. Netlify Functions
    checks.push({
      name: 'Netlify Functions',
      status: 'checking',
      message: 'Testing API endpoints...',
      icon: <Cloud className="h-4 w-4" />
    });

    try {
      const response = await fetch('/.netlify/functions/api-status');
      if (response.ok) {
        checks[checks.length - 1] = {
          ...checks[checks.length - 1],
          status: 'success',
          message: 'Functions responding',
          details: 'API endpoints accessible'
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      checks[checks.length - 1] = {
        ...checks[checks.length - 1],
        status: 'warning',
        message: 'Functions not responding',
        details: 'Check Netlify dev or function deployment'
      };
    }

    // 6. Development Server
    checks.push({
      name: 'Development Server',
      status: 'success',
      message: 'Vite dev server running',
      details: `Port: ${window.location.port || '3001'}`,
      icon: <Server className="h-4 w-4" />
    });

    // 7. HMR (Hot Module Replacement)
    checks.push({
      name: 'Hot Module Replacement',
      status: import.meta.hot ? 'success' : 'warning',
      message: import.meta.hot ? 'HMR enabled' : 'HMR not available',
      details: import.meta.hot ? 'Live reloading active' : 'Restart dev server if needed',
      icon: <Zap className="h-4 w-4" />
    });

    // 8. External APIs Test
    checks.push({
      name: 'External APIs',
      status: 'checking',
      message: 'Testing external connections...',
      icon: <Globe className="h-4 w-4" />
    });

    try {
      // Test a simple external API call
      const response = await fetch('https://api.github.com/zen');
      if (response.ok) {
        checks[checks.length - 1] = {
          ...checks[checks.length - 1],
          status: 'success',
          message: 'External APIs reachable',
          details: 'Network connectivity working'
        };
      } else {
        throw new Error('External API test failed');
      }
    } catch (error) {
      checks[checks.length - 1] = {
        ...checks[checks.length - 1],
        status: 'warning',
        message: 'External API test failed',
        details: 'Check network connectivity'
      };
    }

    setHealthChecks(checks);
    setIsRunning(false);

    // Show summary toast
    const successCount = checks.filter(c => c.status === 'success').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const errorCount = checks.filter(c => c.status === 'error').length;

    toast({
      title: "Health Check Complete",
      description: `✅ ${successCount} OK, ⚠️ ${warningCount} Warnings, ❌ ${errorCount} Errors`,
      duration: 5000
    });
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      checking: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.checking}>
        {status === 'checking' ? 'Checking...' : status.toUpperCase()}
      </Badge>
    );
  };

  const overallStatus = () => {
    if (healthChecks.length === 0) return 'checking';
    if (healthChecks.some(c => c.status === 'error')) return 'error';
    if (healthChecks.some(c => c.status === 'warning')) return 'warning';
    return 'success';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Server className="h-8 w-8 text-blue-600" />
            Development Environment Status
          </h1>
          <p className="text-muted-foreground">
            Comprehensive health check for your development environment
          </p>
          
          {/* Overall Status */}
          <div className="flex items-center justify-center gap-4">
            {getStatusIcon(overallStatus())}
            {getStatusBadge(overallStatus())}
            <Button 
              onClick={runHealthChecks} 
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Health Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthChecks.map((check, index) => (
            <Card key={index} className={`border-2 ${
              check.status === 'success' ? 'border-green-200 bg-green-50' :
              check.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              check.status === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-3">
                  {check.icon}
                  {check.name}
                  <div className="ml-auto">
                    {getStatusIcon(check.status)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{check.message}</p>
                  {check.details && (
                    <p className="text-sm text-muted-foreground">{check.details}</p>
                  )}
                  {getStatusBadge(check.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Development URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Development URLs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Application URLs:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Frontend:</strong> {window.location.origin}</li>
                  <li>• <strong>Dashboard:</strong> {window.location.origin}/dashboard</li>
                  <li>• <strong>Blog:</strong> {window.location.origin}/blog</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">API Endpoints:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Netlify Functions:</strong> /.netlify/functions/</li>
                  <li>• <strong>API Status:</strong> /.netlify/functions/api-status</li>
                  <li>• <strong>Payment:</strong> /.netlify/functions/create-payment</li>
                  <li>• <strong>Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => window.open('/dashboard', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Server className="h-4 w-4" />
                Open Dashboard
              </Button>
              <Button 
                onClick={() => window.open('/blog', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                View Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
