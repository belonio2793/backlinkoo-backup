/**
 * Modern Environment Variables Manager
 * Real-time Supabase synchronization with global service integration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseConfig, useAPIKey } from '@/hooks/useSupabaseConfig';
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
  Check,
  Cloud,
  Database,
  Wifi,
  WifiOff,
  Sync,
  Globe
} from 'lucide-react';

interface PredefinedVar {
  key: string;
  description: string;
  is_secret: boolean;
  placeholder: string;
  category: 'ai' | 'database' | 'payment' | 'email' | 'analytics';
}

export function ModernEnvironmentVariablesManager() {
  const { 
    configs, 
    loading, 
    error: syncError, 
    saveConfig, 
    syncStatus, 
    isOnline 
  } = useSupabaseConfig();

  const [newVar, setNewVar] = useState({
    key: '',
    value: '',
    description: '',
    is_secret: true
  });
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // Predefined environment variables
  const predefinedVars: PredefinedVar[] = [
    {
      key: 'VITE_OPENAI_API_KEY',
      description: 'OpenAI API key for AI content generation',
      is_secret: true,
      placeholder: 'sk-proj-...',
      category: 'ai'
    },
    {
      key: 'VITE_ANTHROPIC_API_KEY',
      description: 'Anthropic Claude API key for AI features',
      is_secret: true,
      placeholder: 'sk-ant-...',
      category: 'ai'
    },
    {
      key: 'VITE_SUPABASE_URL',
      description: 'Supabase project URL',
      is_secret: false,
      placeholder: 'https://your-project.supabase.co',
      category: 'database'
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous key',
      is_secret: true,
      placeholder: 'eyJhbGciOiJIUzI1NiIs...',
      category: 'database'
    },
    {
      key: 'RESEND_API_KEY',
      description: 'Resend email service API key',
      is_secret: true,
      placeholder: 're_...',
      category: 'email'
    },
    {
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      description: 'Stripe publishable key for payments',
      is_secret: false,
      placeholder: 'pk_live_...',
      category: 'payment'
    }
  ];

  // Filter configs by category
  const filteredConfigs = selectedCategory === 'all' 
    ? configs 
    : configs.filter(config => {
        const predefined = predefinedVars.find(p => p.key === config.key);
        return predefined?.category === selectedCategory;
      });

  // Handle sync errors
  useEffect(() => {
    if (syncError) {
      toast({
        title: 'Sync Error',
        description: syncError,
        variant: 'destructive'
      });
    }
  }, [syncError, toast]);

  // Show connectivity status
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: 'Working Offline',
        description: 'Changes will sync when connection is restored.',
      });
    }
  }, [isOnline, toast]);

  const handleSaveNew = async () => {
    if (!newVar.key.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Variable key is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const isAPIKey = newVar.key.includes('API_KEY') || newVar.key.includes('_KEY');
      
      const result = await saveConfig(
        newVar.key.trim(),
        newVar.value.trim(),
        {
          description: newVar.description.trim() || undefined,
          isSecret: newVar.is_secret,
          testConnection: isAPIKey
        }
      );

      if (result.success) {
        toast({
          title: 'Variable Saved',
          description: `${newVar.key} saved and synced to global services`
        });
        setNewVar({ key: '', value: '', description: '', is_secret: true });
      } else {
        toast({
          title: 'Save Failed',
          description: result.error || 'Failed to save variable',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (key: string, currentValue: string) => {
    setEditingVar(key);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async (key: string) => {
    try {
      const existingConfig = configs.find(c => c.key === key);
      const isAPIKey = key.includes('API_KEY') || key.includes('_KEY');
      
      const result = await saveConfig(
        key,
        editValue.trim(),
        {
          description: existingConfig?.description,
          isSecret: existingConfig?.is_secret,
          testConnection: isAPIKey
        }
      );

      if (result.success) {
        toast({
          title: 'Variable Updated',
          description: `${key} updated and synced`
        });
        setEditingVar(null);
        setEditValue('');
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update variable',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleTest = async (key: string, value: string) => {
    setTestResults(prev => ({ ...prev, [key]: { status: 'testing', message: 'Testing...' } }));

    try {
      // Test based on key type
      let result = { success: false, message: 'Test not implemented' };
      
      if (key === 'VITE_OPENAI_API_KEY') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${value}`,
            'Content-Type': 'application/json'
          }
        });
        result = {
          success: response.ok,
          message: response.ok ? 'OpenAI API key is valid' : 'OpenAI API key is invalid'
        };
      } else if (key.includes('SUPABASE')) {
        result = { success: true, message: 'Supabase configuration updated' };
      } else {
        result = { success: true, message: 'Configuration saved' };
      }

      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: result.success ? 'success' : 'error',
          message: result.message
        }
      }));

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Test failed'
        }
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Value copied to clipboard'
    });
  };

  const toggleValueVisibility = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusBadge = (config: any) => {
    const sync = syncStatus.find(s => s.key === config.key);
    
    if (sync?.syncStatus === 'synced' && sync.inGlobalServices) {
      return <Badge className="bg-green-100 text-green-800">Synced</Badge>;
    } else if (sync?.syncStatus === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    } else if (sync?.syncStatus === 'error') {
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Local</Badge>;
  };

  const getSyncIcon = (config: any) => {
    const sync = syncStatus.find(s => s.key === config.key);
    
    if (sync?.inGlobalServices) {
      return <Cloud className="h-3 w-3 text-green-500" title="Synced to global services" />;
    } else if (sync?.inDatabase) {
      return <Database className="h-3 w-3 text-blue-500" title="In database" />;
    }
    return <Sync className="h-3 w-3 text-gray-400" title="Local only" />;
  };

  const categories = [
    { id: 'all', label: 'All Variables', icon: Settings },
    { id: 'ai', label: 'AI Services', icon: Globe },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'email', label: 'Email', icon: Key },
    { id: 'payment', label: 'Payments', icon: Key },
    { id: 'analytics', label: 'Analytics', icon: Key }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <Key className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Environment Variables</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Real-time Supabase sync with global service integration
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Badge variant="outline">
            {configs.length} Variables
          </Badge>
        </div>
      </div>

      {/* Sync Status Overview */}
      {syncStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sync className="h-5 w-5" />
              Synchronization Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span>Database: {syncStatus.filter(s => s.inDatabase).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-green-500" />
                <span>Global: {syncStatus.filter(s => s.inGlobalServices).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Synced: {syncStatus.filter(s => s.syncStatus === 'synced').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Pending: {syncStatus.filter(s => s.syncStatus === 'pending').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            
            {/* Add New Variable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Add New Variable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newKey">Variable Key</Label>
                    <Input
                      id="newKey"
                      value={newVar.key}
                      onChange={(e) => setNewVar(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="VITE_API_KEY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newValue">Value</Label>
                    <Input
                      id="newValue"
                      type={newVar.is_secret ? 'password' : 'text'}
                      value={newVar.value}
                      onChange={(e) => setNewVar(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter value..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDescription">Description (Optional)</Label>
                  <Textarea
                    id="newDescription"
                    value={newVar.description}
                    onChange={(e) => setNewVar(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this variable is used for..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newVar.is_secret}
                      onChange={(e) => setNewVar(prev => ({ ...prev, is_secret: e.target.checked }))}
                    />
                    <span className="text-sm">Secret value</span>
                  </label>
                  <Button onClick={handleSaveNew} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Sync
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Variables */}
            <div className="space-y-3">
              {filteredConfigs.map((config) => {
                const isEditing = editingVar === config.key;
                const testResult = testResults[config.key];
                const predefined = predefinedVars.find(p => p.key === config.key);

                return (
                  <Card key={config.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{config.key}</span>
                          {getStatusBadge(config)}
                          {getSyncIcon(config)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(config.key, config.value)}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(config.value)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(config.key, config.value)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {config.description && (
                        <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                      )}

                      <div className="space-y-2">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              type={config.is_secret ? 'password' : 'text'}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(config.key)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingVar(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={showValues[config.key] ? config.value : '••••••••••••••••'}
                              readOnly
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleValueVisibility(config.key)}
                            >
                              {showValues[config.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        )}

                        {testResult && (
                          <Alert className={testResult.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                            <AlertDescription className={testResult.status === 'success' ? 'text-green-800' : 'text-red-800'}>
                              {testResult.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredConfigs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Variables Found</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? 'Add your first environment variable above'
                      : `No variables found in the ${category.label} category`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
