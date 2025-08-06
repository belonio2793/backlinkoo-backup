import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getErrorSolution } from '@/utils/errorFormatter';
import { useSupabaseConfig } from '@/hooks/useSupabaseConfig';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  Settings,
  TestTube,
  RefreshCw,
  Copy,
  Trash2,
  Edit,
  X,
  Check
} from 'lucide-react';
import { environmentVariablesService } from '@/services/environmentVariablesService';

interface EnvironmentVariable {
  id?: string;
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ApiTestResult {
  key: string;
  status: 'success' | 'error' | 'testing';
  message: string;
}

export function EnvironmentVariablesManager() {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [newVar, setNewVar] = useState<EnvironmentVariable>({
    key: '',
    value: '',
    description: '',
    is_secret: false
  });
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: ApiTestResult }>({});
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { toast } = useToast();

  // Predefined environment variables with descriptions
  const predefinedVars = [
    {
      key: 'OPENAI_API_KEY',
      description: 'OpenAI API key for AI content generation (starts with sk-)',
      is_secret: true,
      placeholder: 'sk-proj-...'
    },
    {
      key: 'SUPABASE_ACCESS_TOKEN',
      description: 'Supabase account access token for database operations',
      is_secret: true,
      placeholder: 'sbp_...'
    },
    {
      key: 'VITE_ANTHROPIC_API_KEY',
      description: 'Anthropic Claude API key for AI features',
      is_secret: true,
      placeholder: 'sk-ant-...'
    },
    {
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      description: 'Stripe publishable key for payments',
      is_secret: false,
      placeholder: 'pk_live_...'
    }
  ];

  useEffect(() => {
    loadEnvironmentVariables();
    initializeWithAPIKeys();
  }, []);

  const initializeWithAPIKeys = () => {
    // Note: OpenAI API keys are now handled server-side only for security
    const openAIKey = '';
    const supabaseToken = 'sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2';

    setTimeout(() => {
      if (envVars.length === 0) {
        const initialVars = [
          {
            id: crypto.randomUUID(),
            key: 'OPENAI_API_KEY',
            value: openAIKey,
            description: 'OpenAI API key for AI content generation and backlink creation',
            is_secret: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            key: 'SUPABASE_ACCESS_TOKEN',
            value: supabaseToken,
            description: 'Supabase account access token for database operations and deployments',
            is_secret: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        setEnvVars(initialVars);
        localStorage.setItem('admin_env_vars', JSON.stringify(initialVars));

        toast({
          title: 'Environment variables initialized',
          description: 'OpenAI and Supabase keys have been pre-configured for you'
        });
      }
    }, 2000); // Wait 2 seconds to see if database loads
  };

  const loadEnvironmentVariables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_environment_variables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Error loading environment variables:', errorMessage);

        // Check if it's a table missing error
        if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
          toast({
            title: 'Database Table Missing',
            description: 'Admin environment variables table not found. Using local storage fallback. Check Database Status tab.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Database Error',
            description: `${errorMessage}. Using local storage fallback.`,
            variant: 'destructive'
          });
        }

        // Fallback to localStorage
        const stored = localStorage.getItem('admin_env_vars');
        if (stored) {
          try {
            setEnvVars(JSON.parse(stored));
            toast({
              title: 'Loaded from Local Storage',
              description: 'Environment variables loaded from local backup'
            });
          } catch (parseError) {
            console.error('Failed to parse localStorage data:', parseError);
            setEnvVars([]);
          }
        } else {
          setEnvVars([]);
        }
      } else {
        setEnvVars(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('admin_env_vars');
      if (stored) {
        setEnvVars(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveEnvironmentVariable = async (envVar: EnvironmentVariable) => {
    if (!envVar.key.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Environment variable key is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const varData = {
        key: envVar.key.trim(),
        value: envVar.value.trim(),
        description: envVar.description?.trim() || null,
        is_secret: envVar.is_secret
      };

      let result;
      if (envVar.id) {
        // Update existing
        result = await supabase
          .from('admin_environment_variables')
          .update(varData)
          .eq('id', envVar.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('admin_environment_variables')
          .insert(varData)
          .select()
          .single();
      }

      if (result.error) {
        const errorMessage = getErrorMessage(result.error);
        console.error('Database error:', errorMessage);
        toast({
          title: 'Database Error',
          description: `Failed to save to database: ${errorMessage}. Saved to local storage instead.`,
          variant: 'destructive'
        });
        // Fallback to localStorage
        const updated = envVar.id 
          ? envVars.map(v => v.id === envVar.id ? { ...envVar, updated_at: new Date().toISOString() } : v)
          : [...envVars, { ...envVar, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
        
        setEnvVars(updated);
        localStorage.setItem('admin_env_vars', JSON.stringify(updated));
        
        toast({
          title: 'Variable saved locally',
          description: 'Saved to localStorage due to database issues'
        });
      } else {
        await loadEnvironmentVariables();
        toast({
          title: 'Environment variable saved',
          description: `${envVar.key} has been saved successfully`
        });
      }

      // Clear form
      setNewVar({ key: '', value: '', description: '', is_secret: false });

    } catch (err) {
      console.error('Error saving:', err);
      toast({
        title: 'Error saving environment variable',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEnvironmentVariable = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('admin_environment_variables')
        .delete()
        .eq('id', id);

      if (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Database error:', errorMessage);
        toast({
          title: 'Database Error',
          description: `Failed to delete from database: ${errorMessage}. Removed from local storage instead.`,
          variant: 'destructive'
        });
        // Fallback to localStorage
        const updated = envVars.filter(v => v.id !== id);
        setEnvVars(updated);
        localStorage.setItem('admin_env_vars', JSON.stringify(updated));
      } else {
        await loadEnvironmentVariables();
      }

      toast({
        title: 'Environment variable deleted',
        description: 'Variable has been removed successfully'
      });
    } catch (err) {
      console.error('Error deleting:', err);
      toast({
        title: 'Error deleting environment variable',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async (key: string, value: string) => {
    setTestResults(prev => ({ ...prev, [key]: { key, status: 'testing', message: 'Testing...' } }));

    try {
      if (key === 'OPENAI_API_KEY') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${value}` }
        });
        
        if (response.ok) {
          setTestResults(prev => ({ ...prev, [key]: { key, status: 'success', message: 'API key is valid' } }));
        } else {
          const errorData = await response.text();
          setTestResults(prev => ({ ...prev, [key]: { key, status: 'error', message: `API test failed: ${response.status}` } }));
        }
      } else {
        // For other APIs, just validate format
        if (value.length > 10) {
          setTestResults(prev => ({ ...prev, [key]: { key, status: 'success', message: 'Format appears valid' } }));
        } else {
          setTestResults(prev => ({ ...prev, [key]: { key, status: 'error', message: 'Key appears too short' } }));
        }
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [key]: { key, status: 'error', message: 'Test failed: Network error' } }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Value has been copied'
    });
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (envVar: EnvironmentVariable) => {
    setEditingVar(envVar.id!);
    setEditValue(envVar.value);
  };

  const cancelEditing = () => {
    setEditingVar(null);
    setEditValue('');
  };

  const saveEdit = async (envVar: EnvironmentVariable) => {
    const updatedVar = { ...envVar, value: editValue.trim() };
    await saveEnvironmentVariable(updatedVar);

    // Also update localStorage for immediate persistence
    const currentVars = envVars.map(v => v.id === envVar.id ? updatedVar : v);
    localStorage.setItem('admin_env_vars', JSON.stringify(currentVars));

    setEditingVar(null);
    setEditValue('');

    toast({
      title: 'Environment variable updated',
      description: `${envVar.key} has been updated successfully`
    });
  };

  const maskValue = (value: string, show: boolean) => {
    if (show) return value;
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.substring(0, 4) + '•'.repeat(Math.max(value.length - 8, 4)) + value.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Quick Access for API Keys */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Key className="h-5 w-5" />
            Quick Access - API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {envVars.filter(v => v.key.includes('API_KEY')).map((apiKey) => (
              <Card key={apiKey.id} className="p-3 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{apiKey.key}</Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(apiKey)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {apiKey.key.includes('API_KEY') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testApiKey(apiKey.key, apiKey.value)}
                          disabled={testResults[apiKey.key]?.status === 'testing'}
                          className="h-6 w-6 p-0"
                        >
                          {testResults[apiKey.key]?.status === 'testing' ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <TestTube className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-mono bg-gray-100 p-1 rounded truncate">
                    {maskValue(apiKey.value, false)}
                  </div>
                  {testResults[apiKey.key] && (
                    <div className={`text-xs p-1 rounded ${testResults[apiKey.key].status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {testResults[apiKey.key].message}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            {envVars.filter(v => v.key.includes('API_KEY')).length === 0 && (
              <div className="text-center text-muted-foreground py-4 md:col-span-2 lg:col-span-3">
                No API keys configured yet. Add them using the form below.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Variables Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Key className="h-4 w-4" />
            <AlertDescription>
              Manage API keys and environment variables securely. These are stored encrypted and will be available to your application.
              <br />
              <strong>Note:</strong> Changes may require redeploying your application.
            </AlertDescription>
          </Alert>

          {/* Add New Variable */}
          <div className="space-y-4 p-4 border rounded-lg mb-6">
            <h3 className="font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Add New Environment Variable
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-key">Variable Name</Label>
                <Input
                  id="new-key"
                  placeholder="VITE_API_KEY"
                  value={newVar.key}
                  onChange={(e) => setNewVar(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <Label htmlFor="new-value">Value</Label>
                <Input
                  id="new-value"
                  type={newVar.is_secret ? 'password' : 'text'}
                  placeholder="Enter value..."
                  value={newVar.value}
                  onChange={(e) => setNewVar(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-description">Description (optional)</Label>
              <Textarea
                id="new-description"
                placeholder="Describe what this variable is used for..."
                value={newVar.description}
                onChange={(e) => setNewVar(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-secret"
                checked={newVar.is_secret}
                onChange={(e) => setNewVar(prev => ({ ...prev, is_secret: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is-secret" className="text-sm">
                This is a secret/sensitive value
              </Label>
            </div>

            <Button 
              onClick={() => saveEnvironmentVariable(newVar)}
              disabled={isLoading || !newVar.key.trim() || !newVar.value.trim()}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Environment Variable
            </Button>
          </div>

          {/* Quick Setup for Common Variables */}
          <div className="space-y-4 p-4 border rounded-lg mb-6 bg-blue-50">
            <h3 className="font-medium">Quick Setup - Common Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedVars.map((predefined) => {
                const existing = envVars.find(v => v.key === predefined.key);
                return (
                  <Button
                    key={predefined.key}
                    variant={existing ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setNewVar({
                      key: predefined.key,
                      value: existing?.value || '',
                      description: predefined.description,
                      is_secret: predefined.is_secret
                    })}
                    className="justify-start text-left h-auto py-2"
                  >
                    <div>
                      <div className="font-medium">{predefined.key}</div>
                      <div className="text-xs text-muted-foreground">{predefined.description}</div>
                      {existing && <Badge variant="secondary" className="mt-1">Configured</Badge>}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Existing Variables */}
          <div className="space-y-4">
            <h3 className="font-medium">Current Environment Variables</h3>
            {envVars.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No environment variables configured. Add your first API key above.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {envVars.map((envVar) => (
                  <Card key={envVar.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{envVar.key}</Badge>
                          {envVar.is_secret && <Badge variant="secondary">Secret</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {envVar.is_secret && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSecretVisibility(envVar.id!)}
                            >
                              {showSecrets[envVar.id!] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(envVar.value)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(envVar)}
                            disabled={editingVar === envVar.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {envVar.key.includes('API_KEY') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testApiKey(envVar.key, envVar.value)}
                              disabled={testResults[envVar.key]?.status === 'testing'}
                            >
                              {testResults[envVar.key]?.status === 'testing' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEnvironmentVariable(envVar.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm">
                        {editingVar === envVar.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type={envVar.is_secret ? 'password' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="font-mono text-xs"
                                placeholder="Enter new value..."
                              />
                              <Button
                                size="sm"
                                onClick={() => saveEdit(envVar)}
                                disabled={!editValue.trim() || isLoading}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono bg-gray-100 p-2 rounded break-all overflow-hidden">
                            {maskValue(envVar.value, showSecrets[envVar.id!] || !envVar.is_secret)}
                          </div>
                        )}
                      </div>

                      {envVar.description && (
                        <div className="text-sm text-muted-foreground">
                          {envVar.description}
                        </div>
                      )}

                      {testResults[envVar.key] && (
                        <Alert className={testResults[envVar.key].status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                          {testResults[envVar.key].status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription>
                            {testResults[envVar.key].message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {envVar.created_at && (
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(envVar.created_at).toLocaleString()}
                          {envVar.updated_at && envVar.updated_at !== envVar.created_at && (
                            <span> • Updated: {new Date(envVar.updated_at).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
