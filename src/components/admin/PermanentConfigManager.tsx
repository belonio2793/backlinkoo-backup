import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  CheckCircle2, 
  Save, 
  Download, 
  Upload,
  RefreshCw,
  Clock,
  Database,
  HardDrive,
  Cloud,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { permanentAPIConfig } from '@/services/permanentAPIConfigService';
import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { autoConfigSaver } from '@/services/autoConfigSaver';

export function PermanentConfigManager() {
  const { toast } = useToast();
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<{ [id: string]: boolean }>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<any>(null);

  useEffect(() => {
    loadHealthSummary();
    loadConfigurations();
    loadAutoSaveStatus();

    // Set up auto-save monitoring
    autoConfigSaver.onHealthChange((score) => {
      if (score === 100) {
        handlePerfectHealth();
      }
    });
  }, []);

  const loadAutoSaveStatus = () => {
    const status = autoConfigSaver.getLastSaveStatus();
    setAutoSaveStatus(status);
  };

  const loadHealthSummary = async () => {
    try {
      const summary = await permanentAPIConfig.getHealthSummary();
      setHealthSummary(summary);
    } catch (error) {
      console.error('Failed to load health summary:', error);
    }
  };

  const loadConfigurations = async () => {
    try {
      const configs = await permanentAPIConfig.getAllConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  };

  const handlePerfectHealth = async () => {
    console.log('🎉 Perfect health detected in UI!');
    toast({
      title: "🎉 Perfect Health Achieved!",
      description: "100% API health detected. Auto-saving configuration...",
    });

    const result = await autoConfigSaver.saveOnUserConfirmation();
    if (result.success) {
      setLastSaved(new Date().toISOString());
      loadAutoSaveStatus();
      await Promise.all([loadHealthSummary(), loadConfigurations()]);
    }
  };

  const saveCurrentConfiguration = async () => {
    setIsLoading(true);
    try {
      // Use auto-saver for consistent saving
      const result = await autoConfigSaver.forceSave();

      if (result.success) {
        toast({
          title: "✅ Configuration Saved Permanently!",
          description: "All API configurations have been saved with multiple backup layers",
        });
        setLastSaved(new Date().toISOString());
        loadAutoSaveStatus();
      } else {
        throw new Error(result.error || 'Save failed');
      }

      // Reload data
      await Promise.all([loadHealthSummary(), loadConfigurations()]);

    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportConfiguration = async () => {
    try {
      const exportData = await permanentAPIConfig.exportConfigurations();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-configuration-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Configuration Exported",
        description: "Configuration backup file has been downloaded",
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const validateConfigurations = async () => {
    setIsLoading(true);
    try {
      const results = await permanentAPIConfig.validateAllConfigurations();
      const validCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;

      toast({
        title: `✅ Validation Complete`,
        description: `${validCount}/${totalCount} configurations are valid`,
      });

      await loadHealthSummary();
    } catch (error) {
      toast({
        title: "❌ Validation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Permanent API Configuration Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Health Overview</TabsTrigger>
            <TabsTrigger value="configurations">Saved Configurations</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {healthSummary && (
              <>
                {/* Health Score Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card key="overall-health" className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overall Health</p>
                        <p className={`text-3xl font-bold ${getHealthColor(healthSummary.overallHealth)}`}>
                          {healthSummary.overallHealth}%
                        </p>
                      </div>
                      <Shield className={`h-8 w-8 ${getHealthColor(healthSummary.overallHealth)}`} />
                    </div>
                  </Card>

                  <Card key="configurations-count" className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Configurations</p>
                        <p className="text-3xl font-bold text-blue-600">{healthSummary.configurationCount}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-600" />
                    </div>
                  </Card>

                  <Card key="last-backup" className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Backup</p>
                        <p className="text-sm text-gray-700">
                          {healthSummary.lastBackup
                            ? new Date(healthSummary.lastBackup).toLocaleString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-600" />
                    </div>
                  </Card>
                </div>

                {/* Service Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Health Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(healthSummary.services).map(([service, score]) => (
                        <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className={`h-5 w-5 ${getHealthColor(score as number)}`} />
                            <span className="font-medium">{service}</span>
                          </div>
                          <Badge className={getHealthBadge(score as number)}>
                            {score}% Health
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={saveCurrentConfiguration} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Current Config
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={validateConfigurations}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Validate All
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={exportConfiguration}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Backup
                  </Button>
                </div>

                {/* Success Message for 100% Health */}
                {healthSummary.overallHealth === 100 && (
                  <Alert className="border-green-200 bg-green-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 opacity-50"></div>
                    <CheckCircle2 className="h-4 w-4 text-green-600 relative z-10" />
                    <AlertDescription className="text-green-800 relative z-10">
                      🎉 <strong>PERFECT HEALTH SCORE ACHIEVED!</strong>
                      <br />
                      🚀 All API configurations are working optimally at 100% health!
                      <br />
                      💾 Your settings have been automatically saved and backed up for permanent persistence.
                      <br />
                      🔒 Multiple backup layers ensure your configuration will never be lost.
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handlePerfectHealth}
                        >
                          🎯 Confirm & Save Perfect Config
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={exportConfiguration}
                        >
                          📥 Download Backup
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Auto-Save Status */}
                {autoSaveStatus && (
                  <Alert className={`border-${autoSaveStatus.success ? 'blue' : 'red'}-200 bg-${autoSaveStatus.success ? 'blue' : 'red'}-50`}>
                    <Database className={`h-4 w-4 text-${autoSaveStatus.success ? 'blue' : 'red'}-600`} />
                    <AlertDescription className={`text-${autoSaveStatus.success ? 'blue' : 'red'}-800`}>
                      {autoSaveStatus.success ? (
                        <>
                          ✅ <strong>Auto-Save Successful!</strong> Configuration saved at{' '}
                          {new Date(autoSaveStatus.timestamp).toLocaleString()}
                          {autoSaveStatus.healthScore && ` with ${autoSaveStatus.healthScore}% health`}
                        </>
                      ) : (
                        <>
                          ❌ <strong>Auto-Save Failed:</strong> {autoSaveStatus.error}
                          <br />
                          <Button size="sm" onClick={saveCurrentConfiguration} className="mt-2">
                            Retry Manual Save
                          </Button>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {lastSaved && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Database className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      ✅ Configuration permanently saved at {new Date(lastSaved).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="configurations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saved Configurations</h3>
              <Button size="sm" onClick={loadConfigurations}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {configurations.map((config) => (
              <Card key={config.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{config.service}</Badge>
                      <Badge className={getHealthBadge(config.healthScore)}>
                        {config.healthScore}% Health
                      </Badge>
                      {config.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys(prev => ({ ...prev, [config.id]: !prev[config.id] }))}
                      >
                        {showKeys[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(config.apiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>API Key: {showKeys[config.id] ? config.apiKey : '***' + config.apiKey.slice(-4)}</div>
                    <div>Last Tested: {new Date(config.lastTested).toLocaleString()}</div>
                    <div>Updated: {new Date(config.updatedAt).toLocaleString()}</div>
                  </div>

                  {config.metadata && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Metadata:</strong> {JSON.stringify(config.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card key="database-backup" className="p-4 text-center">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium">Database Backup</h4>
                <p className="text-sm text-gray-600">Supabase persistent storage</p>
              </Card>

              <Card key="local-storage" className="p-4 text-center">
                <HardDrive className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium">Local Storage</h4>
                <p className="text-sm text-gray-600">Browser localStorage backup</p>
              </Card>

              <Card key="environment-variables" className="p-4 text-center">
                <Cloud className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium">Environment Variables</h4>
                <p className="text-sm text-gray-600">Server environment persistence</p>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Backup Strategy:</strong> Your API configurations are automatically saved to multiple locations:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Supabase database for persistent cloud storage</li>
                  <li>Browser localStorage for immediate access</li>
                  <li>Environment variables for server-side persistence</li>
                  <li>Downloadable JSON backups for external storage</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
