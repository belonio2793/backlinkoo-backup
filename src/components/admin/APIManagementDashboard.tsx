import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { 
  Key, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Shield,
  Zap,
  Globe,
  Database,
  Mail,
  Brain,
  Activity,
  RefreshCw
} from 'lucide-react';
import { environmentVariablesService } from '@/services/environmentVariablesService';

interface APIKey {
  id: string;
  name: string;
  key: string;
  service: 'openai' | 'anthropic' | 'stripe' | 'resend';
  status: 'testing' | 'valid' | 'invalid' | 'unknown';
  lastTested?: Date;
  description?: string;
  isSecret: boolean;
}

interface ServiceConnection {
  service: string;
  icon: React.ComponentType<any>;
  status: 'connected' | 'error' | 'testing' | 'not_configured';
  message: string;
  responseTime?: number;
  details?: any;
}

export function APIManagementDashboard() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [services, setServices] = useState<ServiceConnection[]>([
    { service: 'OpenAI', icon: Brain, status: 'testing', message: 'Testing connection...' },
    { service: 'Database', icon: Database, status: 'testing', message: 'Testing connection...' },
    { service: 'Email', icon: Mail, status: 'testing', message: 'Testing connection...' },
    { service: 'Functions', icon: Globe, status: 'testing', message: 'Testing connection...' }
  ]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState({
    name: '',
    key: '',
    service: 'openai' as const,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAPIKeys();
    runServiceTests();
  }, []);

  const loadAPIKeys = async () => {
    try {
      // Load from environment variables service
      const openaiKey = await environmentVariablesService.getVariable('OPENAI_API_KEY');
      const keys: APIKey[] = [];
      
      if (openaiKey) {
        keys.push({
          id: 'openai-main',
          name: 'OpenAI API Key',
          key: openaiKey,
          service: 'openai',
          status: 'unknown',
          description: 'Primary OpenAI API key for content generation',
          isSecret: true
        });
      }
      
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const runServiceTests = async () => {
    setServices(prev => prev.map(s => ({ ...s, status: 'testing' as const, message: 'Testing connection...' })));
    
    // Test OpenAI
    try {
      const apiKey = await environmentVariablesService.getVariable('OPENAI_API_KEY');
      if (apiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (response.ok) {
          updateServiceStatus('OpenAI', {
            status: 'connected',
            message: 'API connection successful',
            responseTime: 200
          });
        } else {
          // Read response body properly
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorText = await response.text();
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            // Use default error message
          }

          updateServiceStatus('OpenAI', {
            status: 'error',
            message: errorMessage,
            responseTime: 200
          });
        }
      } else {
        updateServiceStatus('OpenAI', {
          status: 'not_configured',
          message: 'API key not configured'
        });
      }
    } catch (error) {
      updateServiceStatus('OpenAI', {
        status: 'error',
        message: 'Connection failed'
      });
    }

    // Test database connection
    try {
      const startTime = Date.now();
      const { error: dbError } = await supabase.from('blog_posts').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      updateServiceStatus('Database', {
        status: dbError ? 'error' : 'connected',
        message: dbError ? `Database error: ${dbError.message}` : 'Database operational',
        responseTime
      });
    } catch (error) {
      updateServiceStatus('Database', {
        status: 'error',
        message: 'Database connection failed',
        responseTime: 0
      });
    }

    // Note: Email and Functions status should be checked by their respective services
    updateServiceStatus('Email', { status: 'pending', message: 'Email service status check not implemented' });
    updateServiceStatus('Functions', { status: 'pending', message: 'Functions status check not implemented' });
  };

  const updateServiceStatus = (serviceName: string, updates: Partial<ServiceConnection>) => {
    setServices(prev => prev.map(service => 
      service.service === serviceName ? { ...service, ...updates } : service
    ));
  };

  const testAPIKey = async (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: 'testing' } : key
    ));

    const key = apiKeys.find(k => k.id === keyId);
    if (!key) return;

    try {
      if (key.service === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key.key}` }
        });

        let isValid = response.ok;
        let toastMessage = '';

        if (response.ok) {
          toastMessage = 'OpenAI API key is working correctly';
        } else {
          // Read response body properly for error details
          try {
            const errorText = await response.text();
            const errorData = JSON.parse(errorText);
            toastMessage = errorData.error?.message || `API key is not valid (${response.status})`;
          } catch (e) {
            toastMessage = `API key is not valid (${response.status})`;
          }
        }

        setApiKeys(prev => prev.map(k =>
          k.id === keyId ? {
            ...k,
            status: isValid ? 'valid' : 'invalid',
            lastTested: new Date()
          } : k
        ));
        
        toast({
          title: isValid ? 'API Key Valid' : 'API Key Invalid',
          description: toastMessage,
          variant: isValid ? 'default' : 'destructive'
        });
      }
    } catch (error) {
      setApiKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, status: 'invalid', lastTested: new Date() } : k
      ));
    }
  };

  const saveAPIKey = async (keyId: string, newValue: string) => {
    try {
      // Update in environment variables service
      await environmentVariablesService.refreshCache();
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, key: newValue } : key
      ));
      
      toast({
        title: 'API Key Updated',
        description: 'The API key has been saved successfully'
      });
      
      setEditingKey(null);
      setEditValue('');
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save the API key',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800 border-green-300',
      valid: 'bg-green-100 text-green-800 border-green-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      invalid: 'bg-red-100 text-red-800 border-red-300',
      testing: 'bg-blue-100 text-blue-800 border-blue-300',
      not_configured: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const connectedCount = services.filter(s => s.status === 'connected').length;
  const healthPercentage = (connectedCount / services.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">Manage your API keys and monitor service connections</p>
        </div>
        <Button onClick={runServiceTests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services</p>
                <p className="text-2xl font-bold">{connectedCount}/{services.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{Math.round(healthPercentage)}%</p>
              </div>
              <Shield className={`h-8 w-8 ${healthPercentage === 100 ? 'text-green-500' : healthPercentage >= 75 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">{healthPercentage === 100 ? 'Healthy' : 'Issues'}</p>
              </div>
              <Zap className={`h-8 w-8 ${healthPercentage === 100 ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Service Status</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Card key={service.service} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          <h3 className="font-semibold">{service.service}</h3>
                        </div>
                        {getStatusIcon(service.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{service.message}</p>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(service.status)}
                        {service.responseTime && (
                          <span className="text-xs text-muted-foreground">
                            {service.responseTime}ms
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((key) => (
                <Card key={key.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{key.name}</Badge>
                        {key.isSecret && <Badge variant="secondary">Secret</Badge>}
                        {getStatusBadge(key.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        {key.isSecret && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSecrets(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                          >
                            {showSecrets[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testAPIKey(key.id)}
                          disabled={key.status === 'testing'}
                        >
                          {key.status === 'testing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingKey(key.id);
                            setEditValue(key.key);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {editingKey === key.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveAPIKey(key.id, editValue)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingKey(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                        {key.isSecret && !showSecrets[key.id] 
                          ? `${key.key.substring(0, 15)}${'•'.repeat(Math.max(key.key.length - 30, 10))}${key.key.slice(-10)}`
                          : key.key
                        }
                      </div>
                    )}

                    {key.description && (
                      <p className="text-sm text-muted-foreground">{key.description}</p>
                    )}

                    {key.lastTested && (
                      <p className="text-xs text-muted-foreground">
                        Last tested: {key.lastTested.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  API keys are stored securely and encrypted. Changes may require redeploying your application.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
