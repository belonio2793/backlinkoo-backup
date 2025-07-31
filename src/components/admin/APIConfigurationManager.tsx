/**
 * API Configuration Manager - Admin Dashboard Component
 * Manages all API keys and service configurations with instant testing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye,
  EyeOff,
  Key,
  Save,
  TestTube,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  Globe,
  Brain,
  Mail,
  Database,
  Cloud
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { openAIOnlyContentGenerator } from '@/services/openAIOnlyContentGenerator';
import { SecureConfig } from '@/lib/secure-config';

interface APIConfig {
  name: string;
  key: string;
  value: string;
  placeholder: string;
  description: string;
  icon: React.ComponentType<any>;
  testEndpoint?: string;
  status: 'unconfigured' | 'configured' | 'testing' | 'valid' | 'invalid';
  lastTested?: Date;
  responseTime?: number;
  errorMessage?: string;
}

export function APIConfigurationManager() {
  const [configs, setConfigs] = useState<APIConfig[]>([
    {
      name: 'OpenAI API',
      key: 'VITE_OPENAI_API_KEY',
      value: '',
      placeholder: 'sk-proj-...',
      description: 'OpenAI API key for content generation',
      icon: Brain,
      testEndpoint: 'https://api.openai.com/v1/models',
      status: 'unconfigured'
    },
    {
      name: 'Supabase URL',
      key: 'VITE_SUPABASE_URL',
      value: '',
      placeholder: 'https://your-project.supabase.co',
      description: 'Supabase project URL',
      icon: Database,
      status: 'unconfigured'
    },
    {
      name: 'Supabase Anon Key',
      key: 'VITE_SUPABASE_ANON_KEY',
      value: '',
      placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'Supabase anonymous key',
      icon: Database,
      status: 'unconfigured'
    },
    {
      name: 'Resend API Key',
      key: 'RESEND_API_KEY',
      value: '',
      placeholder: 're_...',
      description: 'Resend email service API key',
      icon: Mail,
      status: 'unconfigured'
    }
  ]);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Load current configurations
  useEffect(() => {
    loadCurrentConfigs();
  }, []);

  const loadCurrentConfigs = () => {
    setConfigs(prev => prev.map(config => {
      let currentValue = '';
      let status: APIConfig['status'] = 'unconfigured';

      switch (config.key) {
        case 'VITE_OPENAI_API_KEY':
          currentValue = import.meta.env.VITE_OPENAI_API_KEY || SecureConfig.OPENAI_API_KEY || '';
          status = currentValue && currentValue.startsWith('sk-') ? 'configured' : 'unconfigured';
          break;
        case 'VITE_SUPABASE_URL':
          currentValue = import.meta.env.VITE_SUPABASE_URL || SecureConfig.SUPABASE_URL || '';
          status = currentValue && currentValue.startsWith('https://') ? 'configured' : 'unconfigured';
          break;
        case 'VITE_SUPABASE_ANON_KEY':
          currentValue = import.meta.env.VITE_SUPABASE_ANON_KEY || SecureConfig.SUPABASE_ANON_KEY || '';
          status = currentValue && currentValue.startsWith('eyJ') ? 'configured' : 'unconfigured';
          break;
        case 'RESEND_API_KEY':
          currentValue = SecureConfig.RESEND_API_KEY || '';
          status = currentValue && currentValue.startsWith('re_') ? 'configured' : 'unconfigured';
          break;
      }

      return {
        ...config,
        value: currentValue,
        status
      };
    }));
  };

  const updateConfig = (key: string, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.key === key 
        ? { ...config, value, status: value ? 'configured' : 'unconfigured' }
        : config
    ));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskKey = (key: string, value: string) => {
    if (!value) return '';
    if (showKeys[key]) return value;
    
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  };

  const testOpenAI = async (apiKey: string): Promise<{ success: boolean; message: string; responseTime: number }> => {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { success: true, message: 'OpenAI API key valid and working', responseTime };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          message: `HTTP ${response.status}: ${errorData.error?.message || 'Invalid API key'}`,
          responseTime 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime 
      };
    }
  };

  const testSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; message: string; responseTime: number }> => {
    const startTime = Date.now();
    try {
      // Test basic Supabase connection
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(url, anonKey);
      
      const { data, error } = await testClient
        .from('profiles')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        const errorMessage = error?.message || error?.details || error?.hint || String(error) || 'Unknown database error';
        return { success: false, message: `Database error: ${errorMessage}`, responseTime };
      } else {
        return { success: true, message: 'Supabase connection successful', responseTime };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime 
      };
    }
  };

  const testResend = async (apiKey: string): Promise<{ success: boolean; message: string; responseTime: number }> => {
    const startTime = Date.now();
    try {
      // Test Resend API by checking domains endpoint
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { success: true, message: 'Resend API key valid', responseTime };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          message: `HTTP ${response.status}: ${errorData.message || 'Invalid API key'}`,
          responseTime 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime 
      };
    }
  };

  const testConfiguration = async (config: APIConfig) => {
    if (!config.value) return;

    setConfigs(prev => prev.map(c => 
      c.key === config.key ? { ...c, status: 'testing' } : c
    ));

    let result: { success: boolean; message: string; responseTime: number };

    try {
      switch (config.key) {
        case 'VITE_OPENAI_API_KEY':
          result = await testOpenAI(config.value);
          break;
        case 'VITE_SUPABASE_URL':
          const anonKey = configs.find(c => c.key === 'VITE_SUPABASE_ANON_KEY')?.value || '';
          result = await testSupabase(config.value, anonKey);
          break;
        case 'VITE_SUPABASE_ANON_KEY':
          const url = configs.find(c => c.key === 'VITE_SUPABASE_URL')?.value || '';
          result = await testSupabase(url, config.value);
          break;
        case 'RESEND_API_KEY':
          result = await testResend(config.value);
          break;
        default:
          result = { success: false, message: 'Test not implemented', responseTime: 0 };
      }
    } catch (error) {
      result = { 
        success: false, 
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: 0 
      };
    }

    setConfigs(prev => prev.map(c => 
      c.key === config.key 
        ? { 
            ...c, 
            status: result.success ? 'valid' : 'invalid',
            lastTested: new Date(),
            responseTime: result.responseTime,
            errorMessage: result.success ? undefined : result.message
          } 
        : c
    ));

    setTestResults(prev => ({
      ...prev,
      [config.key]: result
    }));
  };

  const testAllConfigurations = async () => {
    setIsLoading(true);
    const configsToTest = configs.filter(c => c.value);
    
    for (const config of configsToTest) {
      await testConfiguration(config);
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsLoading(false);
  };

  const getStatusIcon = (status: APIConfig['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'configured':
        return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: APIConfig['status']) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Valid</Badge>;
      case 'invalid':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Invalid</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Testing...</Badge>;
      case 'configured':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Configured</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Not Set</Badge>;
    }
  };

  const validConfigs = configs.filter(c => c.status === 'valid').length;
  const totalConfigs = configs.filter(c => c.value).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">API Configuration Manager</h2>
            <p className="text-muted-foreground">
              Manage and test all service API keys and configurations
            </p>
          </div>
        </div>
        <Button onClick={testAllConfigurations} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing All...' : 'Test All APIs'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configuration Status</span>
            <span className={`text-sm font-normal ${validConfigs === totalConfigs ? 'text-green-600' : 'text-orange-600'}`}>
              {validConfigs}/{totalConfigs} APIs Valid
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {configs.map((config) => {
              const IconComponent = config.icon;
              return (
                <div key={config.key} className="flex items-center gap-2 p-2 rounded border">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{config.name.split(' ')[0]}</span>
                  {getStatusIcon(config.status)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => {
          const IconComponent = config.icon;
          const result = testResults[config.key];
          
          return (
            <Card key={config.key} className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {config.name}
                  </div>
                  {getStatusIcon(config.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={config.key}>API Key / Configuration</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={config.key}
                        type={showKeys[config.key] ? 'text' : 'password'}
                        value={config.value}
                        onChange={(e) => updateConfig(config.key, e.target.value)}
                        placeholder={config.placeholder}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => toggleKeyVisibility(config.key)}
                      >
                        {showKeys[config.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button 
                      onClick={() => testConfiguration(config)}
                      disabled={!config.value || config.status === 'testing'}
                      variant="outline"
                      size="sm"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(config.status)}
                  {config.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {config.responseTime}ms
                    </span>
                  )}
                </div>

                {/* Test Results */}
                {result && (
                  <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.message}
                      {config.lastTested && (
                        <div className="text-xs mt-1 opacity-75">
                          Last tested: {config.lastTested.toLocaleTimeString()}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {config.errorMessage && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      {config.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuration Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">OpenAI API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Get key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">OpenAI Platform</a></li>
                <li>• Key should start with "sk-proj-" or "sk-"</li>
                <li>• Requires billing setup for production use</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Supabase</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• URL: Your project URL from Supabase dashboard</li>
                <li>• Anon Key: Public anonymous key (safe for frontend)</li>
                <li>• Both required for database operations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resend Email</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Get key from <a href="https://resend.com/api-keys" target="_blank" className="text-blue-600 hover:underline">Resend Dashboard</a></li>
                <li>• Key should start with "re_"</li>
                <li>• Required for email functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
