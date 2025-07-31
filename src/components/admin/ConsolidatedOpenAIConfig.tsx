/**
 * Consolidated OpenAI Configuration - Single Source of Truth
 * Replaces all duplicate OpenAI configurations in admin dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye,
  EyeOff,
  Save,
  TestTube,
  RefreshCw,
  Key,
  Globe,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { SecureConfig } from '@/lib/secure-config';
import { adminGlobalSync } from '@/services/adminGlobalConfigSync';
import { setupAdminTableAndAPIKey, checkAdminTableExists } from '@/utils/setupAdminTable';

interface OpenAIStatus {
  configured: boolean;
  connected: boolean;
  testing: boolean;
  apiKey: string;
  maskedKey: string;
  lastTested?: Date;
  responseTime?: number;
  error?: string;
  healthScore: number;
}

export function ConsolidatedOpenAIConfig() {
  const { toast } = useToast();
  const [status, setStatus] = useState<OpenAIStatus>({
    configured: false,
    connected: false,
    testing: false,
    apiKey: '',
    maskedKey: '',
    healthScore: 0
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('status');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    loadCurrentStatus();
    checkTableExists();
  }, []);

  const checkTableExists = async () => {
    const exists = await checkAdminTableExists();
    setTableExists(exists);
  };

  const loadCurrentStatus = () => {
    try {
      const currentKey = import.meta.env.VITE_OPENAI_API_KEY || SecureConfig.OPENAI_API_KEY || '';
      const configured = currentKey && currentKey.startsWith('sk-');
      
      setStatus(prev => ({
        ...prev,
        configured,
        apiKey: currentKey,
        maskedKey: configured ? currentKey.substring(0, 7) + '...' + currentKey.slice(-4) : '',
        healthScore: configured ? 85 : 0
      }));

      if (configured) {
        testConnection();
      }
    } catch (error) {
      console.error('Failed to load OpenAI status:', error);
    }
  };

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, testing: true, error: undefined }));
    const startTime = Date.now();

    try {
      const connected = await globalOpenAI.testConnection();
      const responseTime = Date.now() - startTime;

      setStatus(prev => ({
        ...prev,
        testing: false,
        connected,
        lastTested: new Date(),
        responseTime,
        healthScore: connected ? 100 : 50,
        error: connected ? undefined : 'API connection failed'
      }));

      toast({
        title: connected ? "✅ Connection Successful" : "❌ Connection Failed",
        description: connected 
          ? `OpenAI API responded in ${responseTime}ms`
          : "Please check your API key and try again",
        variant: connected ? "default" : "destructive"
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setStatus(prev => ({
        ...prev,
        testing: false,
        connected: false,
        lastTested: new Date(),
        responseTime,
        healthScore: 0,
        error: errorMessage
      }));

      toast({
        title: "❌ Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const saveApiKey = async () => {
    if (!tempApiKey || !tempApiKey.startsWith('sk-')) {
      toast({
        title: "Invalid API Key",
        description: "OpenAI API keys must start with 'sk-'",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save to global sync service
      await adminGlobalSync.saveAdminConfig('VITE_OPENAI_API_KEY', tempApiKey);
      
      setStatus(prev => ({
        ...prev,
        apiKey: tempApiKey,
        configured: true,
        maskedKey: tempApiKey.substring(0, 7) + '...' + tempApiKey.slice(-4)
      }));

      setEditingKey(false);
      setTempApiKey('');

      toast({
        title: "✅ API Key Saved",
        description: "OpenAI API key has been saved and synced globally",
      });

      // Test the new key
      testConnection();
    } catch (error) {
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    if (status.testing) return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    if (status.connected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status.configured) return <AlertCircle className="h-5 w-5 text-orange-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (status.testing) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Testing...</Badge>;
    }
    if (status.connected) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Connected</Badge>;
    }
    if (status.configured) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Configured</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 border-red-300">Not Configured</Badge>;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            OpenAI Configuration Hub
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status & Health</TabsTrigger>
            <TabsTrigger value="configuration">API Configuration</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            {/* Health Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    <p className={`text-2xl font-bold ${getHealthColor(status.healthScore)}`}>
                      {status.healthScore}%
                    </p>
                  </div>
                  <Shield className={`h-6 w-6 ${getHealthColor(status.healthScore)}`} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {status.responseTime ? `${status.responseTime}ms` : '--'}
                    </p>
                  </div>
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Global Access</p>
                    <p className="text-2xl font-bold text-green-600">
                      {status.connected ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
              </Card>
            </div>

            {/* Status Details */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Key Status</span>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className={status.configured ? 'text-green-600' : 'text-red-600'}>
                      {status.configured ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Connection Status</span>
                  <span className={status.connected ? 'text-green-600' : 'text-red-600'}>
                    {status.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {status.lastTested && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Tested</span>
                    <span className="text-gray-600">{status.lastTested.toLocaleString()}</span>
                  </div>
                )}

                {status.maskedKey && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">API Key</span>
                    <span className="font-mono text-sm">{status.maskedKey}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Test Button */}
            <Button 
              onClick={testConnection} 
              disabled={!status.configured || status.testing}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {status.testing ? 'Testing Connection...' : 'Test OpenAI Connection'}
            </Button>

            {/* Status Messages */}
            {status.connected && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ OpenAI API is connected and working perfectly! All features are available.
                </AlertDescription>
              </Alert>
            )}

            {status.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ {status.error}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                {editingKey ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type="password"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="sk-proj-... or sk-..."
                        className="pr-10"
                      />
                    </div>
                    <Button onClick={saveApiKey} size="sm">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setEditingKey(false);
                        setTempApiKey('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={showApiKey ? status.apiKey : status.maskedKey || 'Not configured'}
                        readOnly
                        className="pr-20"
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        {status.apiKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingKey(true);
                        setTempApiKey(status.apiKey);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>This is the global OpenAI API key used throughout the entire application.</p>
                <p>All content generation features depend on this configuration.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Follow these steps to configure OpenAI API access for your application.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    1
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Get your OpenAI API Key</h3>
                    <p className="text-sm text-gray-600">
                      Visit the OpenAI platform to create or retrieve your API key.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OpenAI Platform
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    2
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Configure the API Key</h3>
                    <p className="text-sm text-gray-600">
                      Use the Configuration tab to enter your API key. It will be automatically saved and synced.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    3
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Test the Connection</h3>
                    <p className="text-sm text-gray-600">
                      Use the test button to verify your API key is working correctly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-blue-900">Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• API key must start with "sk-"</li>
                  <li>• Billing must be set up in your OpenAI account</li>
                  <li>• Recommended: Set usage limits in OpenAI dashboard</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
