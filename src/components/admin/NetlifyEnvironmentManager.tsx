import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Brain,
  Server,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface NetlifyVariable {
  key: string;
  value?: string;
  configured: boolean;
  type: 'api_key' | 'config' | 'secret';
  description: string;
  testable: boolean;
}

interface TestResult {
  status: 'success' | 'error' | 'testing';
  message: string;
  responseTime?: number;
}

export function NetlifyEnvironmentManager() {
  const [variables, setVariables] = useState<NetlifyVariable[]>([
    {
      key: 'OPENAI_API_KEY',
      configured: false,
      type: 'api_key',
      description: 'OpenAI API key for AI content generation',
      testable: true
    },
    {
      key: 'RESEND_API_KEY',
      configured: false,
      type: 'api_key',
      description: 'Resend API key for email services',
      testable: true
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      configured: false,
      type: 'secret',
      description: 'Supabase service role key for server-side operations',
      testable: false
    },
    {
      key: 'STRIPE_SECRET_KEY',
      configured: false,
      type: 'secret',
      description: 'Stripe secret key for payment processing',
      testable: false
    }
  ]);

  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [testResults, setTestResults] = useState<{ [key: string]: TestResult }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newValues, setNewValues] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    checkNetlifyVariables();
  }, []);

  const checkNetlifyVariables = () => {
    setIsLoading(true);
    try {
      // Check which variables are configured by looking at import.meta.env
      const updatedVariables = variables.map(variable => {
        const value = import.meta.env[variable.key];
        return {
          ...variable,
          value: value || undefined,
          configured: Boolean(value && value.length > 0)
        };
      });
      
      setVariables(updatedVariables);
      
      // Focus specifically on OpenAI API key
      const openAIKey = import.meta.env.OPENAI_API_KEY;
      if (openAIKey) {
        toast({
          title: 'OpenAI API Key Detected',
          description: 'OpenAI API key is configured in Netlify environment',
          variant: 'default'
        });
      } else {
        toast({
          title: 'OpenAI API Key Missing',
          description: 'Please configure OPENAI_API_KEY in your Netlify environment variables',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking environment variables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIKey = async (variable: NetlifyVariable) => {
    if (!variable.testable || !variable.value) return;

    setTestResults(prev => ({
      ...prev,
      [variable.key]: { status: 'testing', message: 'Testing API key...' }
    }));

    const startTime = Date.now();
    
    try {
      if (variable.key === 'OPENAI_API_KEY') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${variable.value}`,
            'Content-Type': 'application/json'
          }
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          setTestResults(prev => ({
            ...prev,
            [variable.key]: {
              status: 'success',
              message: `API key valid - ${data.data?.length || 0} models available`,
              responseTime
            }
          }));
        } else {
          const errorData = await response.text();
          setTestResults(prev => ({
            ...prev,
            [variable.key]: {
              status: 'error',
              message: `API test failed: ${response.status}`,
              responseTime
            }
          }));
        }
      } else if (variable.key === 'RESEND_API_KEY') {
        // Test Resend API key
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${variable.value}`,
            'Content-Type': 'application/json'
          }
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          setTestResults(prev => ({
            ...prev,
            [variable.key]: {
              status: 'success',
              message: 'Resend API key is valid',
              responseTime
            }
          }));
        } else {
          setTestResults(prev => ({
            ...prev,
            [variable.key]: {
              status: 'error',
              message: `Resend API test failed: ${response.status}`,
              responseTime
            }
          }));
        }
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [variable.key]: {
          status: 'error',
          message: 'Network error during test'
        }
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Variable value has been copied'
    });
  };

  const toggleVisibility = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string, show: boolean) => {
    if (show) return value;
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.substring(0, 4) + '•'.repeat(Math.max(value.length - 8, 4)) + value.slice(-4);
  };

  const getStatusIcon = (variable: NetlifyVariable) => {
    if (variable.configured) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (variable: NetlifyVariable) => {
    if (variable.configured) {
      return <Badge className="bg-green-100 text-green-800">Configured</Badge>;
    }
    return <Badge variant="destructive">Not Set</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Server className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Netlify Environment Variables</h2>
            <p className="text-muted-foreground">
              Manage environment variables configured in Netlify
            </p>
          </div>
        </div>
        <Button onClick={checkNetlifyVariables} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* OpenAI API Key Priority Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="h-5 w-5" />
            OpenAI API Key Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variables.find(v => v.key === 'OPENAI_API_KEY')?.configured ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>OpenAI API key is configured and ready for use</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testAPIKey(variables.find(v => v.key === 'OPENAI_API_KEY')!)}
                    disabled={testResults['OPENAI_API_KEY']?.status === 'testing'}
                    className="border-green-300 text-green-700"
                  >
                    {testResults['OPENAI_API_KEY']?.status === 'testing' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div>
                  <strong>OpenAI API key is not configured.</strong>
                  <br />
                  Please set the OPENAI_API_KEY environment variable in your Netlify site settings.
                  <br />
                  <span className="text-sm mt-2 block">
                    Go to: Netlify Dashboard → Site Settings → Environment Variables → Add OPENAI_API_KEY
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {testResults['OPENAI_API_KEY'] && (
            <div className={`mt-3 p-3 rounded ${testResults['OPENAI_API_KEY'].status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center gap-2">
                {testResults['OPENAI_API_KEY'].status === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{testResults['OPENAI_API_KEY'].message}</span>
                {testResults['OPENAI_API_KEY'].responseTime && (
                  <span className="text-xs">({testResults['OPENAI_API_KEY'].responseTime}ms)</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Environment Variables Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variables.map((variable) => (
              <Card key={variable.key} className={`p-4 ${variable.configured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(variable)}
                    <div>
                      <h3 className="font-medium">{variable.key}</h3>
                      <p className="text-sm text-muted-foreground">{variable.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(variable)}
                    {variable.type === 'api_key' && (
                      <Badge variant="outline" className="text-xs">API Key</Badge>
                    )}
                  </div>
                </div>

                {variable.configured && variable.value && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm bg-white p-2 rounded border">
                        {maskValue(variable.value, showValues[variable.key] || false)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleVisibility(variable.key)}
                      >
                        {showValues[variable.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(variable.value!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {variable.testable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testAPIKey(variable)}
                          disabled={testResults[variable.key]?.status === 'testing'}
                        >
                          {testResults[variable.key]?.status === 'testing' ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                      )}
                    </div>

                    {testResults[variable.key] && (
                      <div className={`p-2 rounded text-sm ${testResults[variable.key].status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {testResults[variable.key].status === 'success' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{testResults[variable.key].message}</span>
                          {testResults[variable.key].responseTime && (
                            <span className="text-xs">({testResults[variable.key].responseTime}ms)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!variable.configured && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This variable is not configured in your Netlify environment. 
                      Please add it in your Netlify site settings under Environment Variables.
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Configure Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to your Netlify Dashboard</li>
            <li>Select your site</li>
            <li>Navigate to Site Settings → Environment Variables</li>
            <li>Click "Add variable"</li>
            <li>Enter the variable name (e.g., OPENAI_API_KEY) and value</li>
            <li>Click "Create variable"</li>
            <li>Redeploy your site for changes to take effect</li>
          </ol>
          
          <Alert className="mt-4">
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Environment variables are only available after redeployment. 
              Changes won't be reflected until you trigger a new build.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
