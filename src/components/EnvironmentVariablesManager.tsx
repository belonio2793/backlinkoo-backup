import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Settings,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface EnvironmentVariable {
  key: string;
  value: string;
  required: boolean;
  description: string;
  configured: boolean;
  sensitive: boolean;
}

interface EnvironmentVariablesManagerProps {
  onConfigurationChange: (config: { [key: string]: string }) => void;
}

export const EnvironmentVariablesManager: React.FC<EnvironmentVariablesManagerProps> = ({
  onConfigurationChange
}) => {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([
    {
      key: 'VITE_NETLIFY_ACCESS_TOKEN',
      value: import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || '',
      required: true,
      description: 'Your Netlify personal access token for API access',
      configured: !!(import.meta.env.VITE_NETLIFY_ACCESS_TOKEN),
      sensitive: true
    },
    {
      key: 'VITE_NETLIFY_SITE_ID',
      value: import.meta.env.VITE_NETLIFY_SITE_ID || '',
      required: true,
      description: 'Your Netlify site ID where domains will be added',
      configured: !!(import.meta.env.VITE_NETLIFY_SITE_ID),
      sensitive: false
    },
    {
      key: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL || '',
      required: true,
      description: 'Your Supabase project URL',
      configured: !!(import.meta.env.VITE_SUPABASE_URL),
      sensitive: false
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      required: true,
      description: 'Your Supabase anonymous key',
      configured: !!(import.meta.env.VITE_SUPABASE_ANON_KEY),
      sensitive: true
    }
  ]);

  const [showSensitive, setShowSensitive] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Update configuration when variables change
  useEffect(() => {
    const config = variables.reduce((acc, variable) => {
      if (variable.value) {
        acc[variable.key] = variable.value;
      }
      return acc;
    }, {} as { [key: string]: string });
    
    onConfigurationChange(config);
  }, [variables, onConfigurationChange]);

  // Toggle visibility for sensitive fields
  const toggleVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Update variable value
  const updateVariable = (key: string, value: string) => {
    setVariables(prev => 
      prev.map(variable => 
        variable.key === key 
          ? { ...variable, value, configured: !!value }
          : variable
      )
    );
  };

  // Get configuration status
  const getConfigurationStatus = () => {
    const requiredVariables = variables.filter(v => v.required);
    const configuredRequired = requiredVariables.filter(v => v.configured);
    
    return {
      total: requiredVariables.length,
      configured: configuredRequired.length,
      isComplete: configuredRequired.length === requiredVariables.length,
      percentage: Math.round((configuredRequired.length / requiredVariables.length) * 100)
    };
  };

  const status = getConfigurationStatus();

  // Test configuration
  const testConfiguration = async () => {
    setTesting(true);
    try {
      toast.info('Testing environment configuration...');

      // Test Netlify API
      if (variables.find(v => v.key === 'VITE_NETLIFY_ACCESS_TOKEN')?.value) {
        try {
          const netlifyToken = variables.find(v => v.key === 'VITE_NETLIFY_ACCESS_TOKEN')?.value;
          const siteId = variables.find(v => v.key === 'VITE_NETLIFY_SITE_ID')?.value;
          
          const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
            headers: {
              'Authorization': `Bearer ${netlifyToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            toast.success('✅ Netlify API connection successful');
          } else {
            toast.warning('⚠️ Netlify API connection failed');
          }
        } catch (error) {
          toast.warning('⚠️ Netlify API test failed');
        }
      }

      // Test Supabase connection
      if (variables.find(v => v.key === 'VITE_SUPABASE_URL')?.value) {
        try {
          const supabaseUrl = variables.find(v => v.key === 'VITE_SUPABASE_URL')?.value;
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': variables.find(v => v.key === 'VITE_SUPABASE_ANON_KEY')?.value || '',
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 200 || response.status === 404) {
            toast.success('✅ Supabase connection successful');
          } else {
            toast.warning('⚠️ Supabase connection failed');
          }
        } catch (error) {
          toast.warning('⚠️ Supabase connection test failed');
        }
      }

      toast.success('Configuration test completed');
    } catch (error: any) {
      toast.error(`Configuration test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Save configuration
  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // In a real application, you would save to a secure backend
      // For now, we'll show instructions for manual setup
      
      const envContent = variables
        .filter(v => v.value)
        .map(v => `${v.key}=${v.value}`)
        .join('\n');

      // Create a downloadable .env file
      const blob = new Blob([envContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '.env.local';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('✅ Environment configuration downloaded as .env.local');
      toast.info('💡 Add this file to your project root and restart the development server');
    } catch (error: any) {
      toast.error(`Failed to save configuration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Export configuration
  const exportConfiguration = () => {
    const config = variables.reduce((acc, variable) => {
      if (variable.value) {
        acc[variable.key] = variable.sensitive ? '***REDACTED***' : variable.value;
      }
      return acc;
    }, {} as { [key: string]: string });

    const configJson = JSON.stringify(config, null, 2);
    
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'environment-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Configuration exported successfully');
  };

  // Import configuration
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let config: { [key: string]: string } = {};

        if (file.name.endsWith('.json')) {
          config = JSON.parse(content);
        } else {
          // Parse .env format
          const lines = content.split('\n');
          lines.forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              config[key.trim()] = valueParts.join('=').trim();
            }
          });
        }

        // Update variables
        setVariables(prev =>
          prev.map(variable => ({
            ...variable,
            value: config[variable.key] || variable.value,
            configured: !!(config[variable.key] || variable.value)
          }))
        );

        toast.success('Configuration imported successfully');
      } catch (error) {
        toast.error('Failed to import configuration');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          Environment Configuration
          <Badge variant={status.isComplete ? "default" : "secondary"}>
            {status.configured}/{status.total} Required
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure API credentials and environment variables for domain management
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            <div className="space-y-4">
              {variables.map((variable) => (
                <div key={variable.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={variable.key} className="text-sm font-medium">
                      {variable.key}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      {variable.configured && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Set
                        </Badge>
                      )}
                      {variable.sensitive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleVisibility(variable.key)}
                        >
                          {showSensitive[variable.key] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Input
                    id={variable.key}
                    type={variable.sensitive && !showSensitive[variable.key] ? "password" : "text"}
                    placeholder={`Enter ${variable.key}`}
                    value={variable.value}
                    onChange={(e) => updateVariable(variable.key, e.target.value)}
                  />
                  
                  <p className="text-xs text-gray-500">
                    {variable.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={testConfiguration}
                disabled={testing}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Test Configuration
              </Button>

              <Button
                onClick={saveConfiguration}
                disabled={saving || !status.isComplete}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save & Download
              </Button>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Configuration Progress</span>
                  <span className="text-sm text-gray-500">{status.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status.isComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {variables.filter(v => v.required).map((variable) => (
                  <div key={variable.key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium text-sm">{variable.key}</div>
                      <div className="text-xs text-gray-500">{variable.description}</div>
                    </div>
                    <div>
                      {variable.configured ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Missing
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {status.isComplete ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All required environment variables are configured!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    {status.total - status.configured} required environment variable{status.total - status.configured !== 1 ? 's' : ''} still need{status.total - status.configured === 1 ? 's' : ''} to be configured.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={exportConfiguration}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Config
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".json,.env,.txt"
                    onChange={importConfiguration}
                    className="hidden"
                    id="import-config"
                  />
                  <Button
                    onClick={() => document.getElementById('import-config')?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Config
                  </Button>
                </div>
              </div>

              <Alert>
                <Key className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Setup Instructions:</div>
                    <div className="space-y-1 text-sm">
                      <div>1. Get your Netlify access token from the dashboard</div>
                      <div>2. Find your site ID in Netlify site settings</div>
                      <div>3. Configure Supabase credentials if needed</div>
                      <div>4. Test the configuration before deploying</div>
                      <div>5. Download and add the .env.local file to your project</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://app.netlify.com/user/applications#personal-access-tokens', '_blank')}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Netlify Access Token
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open('https://app.netlify.com', '_blank')}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Netlify Dashboard
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnvironmentVariablesManager;
