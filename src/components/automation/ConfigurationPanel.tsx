import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';

export function ConfigurationPanel() {
  const [config, setConfig] = useState({
    global: {
      processingInterval: 5000,
      maxConcurrentTasks: 10,
      retryAttempts: 3,
      enableLogging: true,
      logLevel: 'info'
    },
    blogCommenting: {
      enabled: true,
      batchSize: 5,
      commentDelay: { min: 30000, max: 120000 },
      maxCommentsPerSite: 3,
      commentLength: { min: 50, max: 200 },
      enableSpinning: true
    },
    blogPosting: {
      enabled: true,
      batchSize: 3,
      postDelay: { min: 300000, max: 900000 },
      maxPostsPerSite: 1,
      articleLength: { min: 500, max: 2000 }
    },
    socialMedia: {
      enabled: true,
      batchSize: 8,
      postDelay: { min: 180000, max: 600000 },
      platforms: {
        twitter: { enabled: true, maxPosts: 10 },
        facebook: { enabled: true, maxPosts: 5 },
        linkedin: { enabled: true, maxPosts: 3 }
      }
    },
    database: {
      connectionString: '',
      maxConnections: 20,
      queryTimeout: 30000
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedConfig = (section: string, subsection: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    // Save configuration logic
    console.log('Saving configuration:', config);
    setHasChanges(false);
  };

  const resetConfig = () => {
    // Reset to defaults
    setHasChanges(false);
  };

  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automation-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          setConfig(importedConfig);
          setHasChanges(true);
        } catch (error) {
          console.error('Failed to import config:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Configuration
          </h2>
          <p className="text-gray-600">Configure automation system settings and engine parameters</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={importConfig}
            className="hidden"
            id="import-config"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-config')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply your configuration updates.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="blog-commenting">Blog Comments</TabsTrigger>
          <TabsTrigger value="blog-posting">Blog Posts</TabsTrigger>
          <TabsTrigger value="social-media">Social Media</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>System-wide configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="processing-interval">Processing Interval (ms)</Label>
                  <Input
                    id="processing-interval"
                    type="number"
                    value={config.global.processingInterval}
                    onChange={(e) => updateConfig('global', 'processingInterval', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-concurrent">Max Concurrent Tasks</Label>
                  <Input
                    id="max-concurrent"
                    type="number"
                    value={config.global.maxConcurrentTasks}
                    onChange={(e) => updateConfig('global', 'maxConcurrentTasks', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={config.global.retryAttempts}
                    onChange={(e) => updateConfig('global', 'retryAttempts', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <Select 
                    value={config.global.logLevel} 
                    onValueChange={(value) => updateConfig('global', 'logLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Logging</Label>
                  <p className="text-sm text-gray-600">Log system activities and errors</p>
                </div>
                <Switch
                  checked={config.global.enableLogging}
                  onCheckedChange={(checked) => updateConfig('global', 'enableLogging', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog-commenting">
          <Card>
            <CardHeader>
              <CardTitle>Blog Commenting Engine</CardTitle>
              <CardDescription>Configure automated blog comment posting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Blog Commenting</Label>
                  <p className="text-sm text-gray-600">Automatically post contextual comments on blogs</p>
                </div>
                <Switch
                  checked={config.blogCommenting.enabled}
                  onCheckedChange={(checked) => updateConfig('blogCommenting', 'enabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="comment-batch-size">Batch Size</Label>
                  <Input
                    id="comment-batch-size"
                    type="number"
                    value={config.blogCommenting.batchSize}
                    onChange={(e) => updateConfig('blogCommenting', 'batchSize', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-comments-site">Max Comments per Site</Label>
                  <Input
                    id="max-comments-site"
                    type="number"
                    value={config.blogCommenting.maxCommentsPerSite}
                    onChange={(e) => updateConfig('blogCommenting', 'maxCommentsPerSite', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment-delay-min">Comment Delay Min (ms)</Label>
                  <Input
                    id="comment-delay-min"
                    type="number"
                    value={config.blogCommenting.commentDelay.min}
                    onChange={(e) => updateNestedConfig('blogCommenting', 'commentDelay', 'min', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment-delay-max">Comment Delay Max (ms)</Label>
                  <Input
                    id="comment-delay-max"
                    type="number"
                    value={config.blogCommenting.commentDelay.max}
                    onChange={(e) => updateNestedConfig('blogCommenting', 'commentDelay', 'max', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment-length-min">Comment Length Min</Label>
                  <Input
                    id="comment-length-min"
                    type="number"
                    value={config.blogCommenting.commentLength.min}
                    onChange={(e) => updateNestedConfig('blogCommenting', 'commentLength', 'min', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment-length-max">Comment Length Max</Label>
                  <Input
                    id="comment-length-max"
                    type="number"
                    value={config.blogCommenting.commentLength.max}
                    onChange={(e) => updateNestedConfig('blogCommenting', 'commentLength', 'max', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Content Spinning</Label>
                  <p className="text-sm text-gray-600">Use content variation to create unique comments</p>
                </div>
                <Switch
                  checked={config.blogCommenting.enableSpinning}
                  onCheckedChange={(checked) => updateConfig('blogCommenting', 'enableSpinning', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social-media">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Engine</CardTitle>
              <CardDescription>Configure social media posting automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Social Media Posting</Label>
                  <p className="text-sm text-gray-600">Automatically post content to social platforms</p>
                </div>
                <Switch
                  checked={config.socialMedia.enabled}
                  onCheckedChange={(checked) => updateConfig('socialMedia', 'enabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="social-batch-size">Batch Size</Label>
                  <Input
                    id="social-batch-size"
                    type="number"
                    value={config.socialMedia.batchSize}
                    onChange={(e) => updateConfig('socialMedia', 'batchSize', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-delay-min">Post Delay Min (ms)</Label>
                  <Input
                    id="social-delay-min"
                    type="number"
                    value={config.socialMedia.postDelay.min}
                    onChange={(e) => updateNestedConfig('socialMedia', 'postDelay', 'min', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Platform Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Platform Settings</h4>
                {Object.entries(config.socialMedia.platforms).map(([platform, settings]) => (
                  <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium capitalize">{platform}</Label>
                      <p className="text-sm text-gray-600">Max posts: {settings.maxPosts}</p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => 
                        updateNestedConfig('socialMedia', 'platforms', platform, { ...settings, enabled: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>Configure database connection and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="connection-string">Connection String</Label>
                <Input
                  id="connection-string"
                  type="password"
                  placeholder="postgresql://user:password@localhost:5432/automation"
                  value={config.database.connectionString}
                  onChange={(e) => updateConfig('database', 'connectionString', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max-connections">Max Connections</Label>
                  <Input
                    id="max-connections"
                    type="number"
                    value={config.database.maxConnections}
                    onChange={(e) => updateConfig('database', 'maxConnections', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="query-timeout">Query Timeout (ms)</Label>
                  <Input
                    id="query-timeout"
                    type="number"
                    value={config.database.queryTimeout}
                    onChange={(e) => updateConfig('database', 'queryTimeout', Number(e.target.value))}
                  />
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced configuration options for power users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-config">Custom Configuration (JSON)</Label>
                <Textarea
                  id="custom-config"
                  placeholder="Enter custom JSON configuration..."
                  className="h-40 font-mono text-sm"
                  value={JSON.stringify(config, null, 2)}
                  onChange={(e) => {
                    try {
                      const newConfig = JSON.parse(e.target.value);
                      setConfig(newConfig);
                      setHasChanges(true);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Modifying advanced settings directly may cause system instability. Only edit if you understand the configuration format.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
