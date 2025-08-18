import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllPlatforms, 
  getPlatformById, 
  getPlatformStats,
  getPlatformApiDocs,
  getPlatformSetupGuides
} from '@/services/platformConfigs';
import { WordPressService } from '@/services/platforms/WordPressService';
import { MediumService } from '@/services/platforms/MediumService';
import { DevToService } from '@/services/platforms/DevToService';
import { HashnodeService } from '@/services/platforms/HashnodeService';
import { GhostService } from '@/services/platforms/GhostService';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key, 
  Globe, 
  Zap,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PlatformCredentials {
  [key: string]: any;
}

interface PlatformStatus {
  [key: string]: {
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    lastTest?: Date;
  };
}

export function PlatformManager() {
  const { toast } = useToast();
  const [platforms] = useState(getAllPlatforms());
  const [platformStats] = useState(getPlatformStats());
  const [credentials, setCredentials] = useState<PlatformCredentials>({});
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  useEffect(() => {
    // Load saved credentials and status from localStorage
    const savedCredentials = localStorage.getItem('platform_credentials');
    const savedStatus = localStorage.getItem('platform_status');
    
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    }
    
    if (savedStatus) {
      setPlatformStatus(JSON.parse(savedStatus));
    } else {
      // Initialize status for all platforms
      const initialStatus: PlatformStatus = {};
      platforms.forEach(platform => {
        initialStatus[platform.id] = {
          enabled: platform.id === 'telegraph', // Telegraph enabled by default
          configured: platform.id === 'telegraph',
          connected: platform.id === 'telegraph'
        };
      });
      setPlatformStatus(initialStatus);
    }
  }, [platforms]);

  const saveCredentials = (platformId: string, creds: any) => {
    const newCredentials = { ...credentials, [platformId]: creds };
    setCredentials(newCredentials);
    localStorage.setItem('platform_credentials', JSON.stringify(newCredentials));
  };

  const updatePlatformStatus = (platformId: string, updates: Partial<PlatformStatus[string]>) => {
    const newStatus = { 
      ...platformStatus, 
      [platformId]: { 
        ...platformStatus[platformId], 
        ...updates 
      } 
    };
    setPlatformStatus(newStatus);
    localStorage.setItem('platform_status', JSON.stringify(newStatus));
  };

  const testPlatformConnection = async (platformId: string) => {
    setTesting(platformId);
    
    try {
      let service: any;
      const creds = credentials[platformId];
      
      switch (platformId) {
        case 'wordpress':
          service = new WordPressService(creds);
          break;
        case 'medium':
          service = new MediumService(creds);
          break;
        case 'devto':
          service = new DevToService(creds);
          break;
        case 'hashnode':
          service = new HashnodeService(creds);
          break;
        case 'ghost':
          service = new GhostService(creds);
          break;
        default:
          throw new Error('Platform not supported');
      }

      const isConnected = await service.testConnection();
      
      updatePlatformStatus(platformId, {
        connected: isConnected,
        lastTest: new Date()
      });

      toast({
        title: isConnected ? 'Connection Successful' : 'Connection Failed',
        description: isConnected 
          ? `Successfully connected to ${getPlatformById(platformId)?.name}`
          : `Failed to connect to ${getPlatformById(platformId)?.name}`,
        variant: isConnected ? 'default' : 'destructive'
      });

    } catch (error: any) {
      updatePlatformStatus(platformId, {
        connected: false,
        lastTest: new Date()
      });

      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to test connection',
        variant: 'destructive'
      });
    } finally {
      setTesting(null);
    }
  };

  const togglePlatform = (platformId: string, enabled: boolean) => {
    updatePlatformStatus(platformId, { enabled });
    
    toast({
      title: enabled ? 'Platform Enabled' : 'Platform Disabled',
      description: `${getPlatformById(platformId)?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const renderPlatformCard = (platform: any) => {
    const status = platformStatus[platform.id] || { enabled: false, configured: false, connected: false };
    const apiDocs = getPlatformApiDocs();
    const setupGuides = getPlatformSetupGuides();

    return (
      <Card key={platform.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <Badge variant={status.enabled ? 'default' : 'secondary'}>
                {status.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Switch
              checked={status.enabled}
              onCheckedChange={(enabled) => togglePlatform(platform.id, enabled)}
            />
          </div>
          <CardDescription className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              DA: {platform.domainAuthority}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${platform.costPerPost}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {platform.rateLimits.postsPerDay}/day
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="flex gap-2">
            <Badge variant={status.configured ? 'default' : 'secondary'} className="text-xs">
              {status.configured ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Configured</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Configured</>
              )}
            </Badge>
            
            {status.configured && (
              <Badge variant={status.connected ? 'default' : 'destructive'} className="text-xs">
                {status.connected ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Disconnected</>
                )}
              </Badge>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {platform.features.slice(0, 3).map((feature: string) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>

          {/* Requirements */}
          <div className="text-sm text-gray-600 space-y-1">
            <div>Min length: {platform.requirements.minContentLength} words</div>
            <div>Formats: {platform.requirements.supportedFormats.join(', ')}</div>
            {platform.requirements.requiresAuthentication && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Shield className="h-3 w-3" />
                Requires authentication
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPlatform(platform.id)}
              disabled={platform.id === 'telegraph'} // Telegraph doesn't need config
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
            
            {status.configured && platform.id !== 'telegraph' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testPlatformConnection(platform.id)}
                disabled={testing === platform.id}
              >
                <Zap className="h-3 w-3 mr-1" />
                {testing === platform.id ? 'Testing...' : 'Test'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(apiDocs[platform.id], '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              API Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderConfigurationDialog = () => {
    if (!selectedPlatform) return null;
    
    const platform = getPlatformById(selectedPlatform);
    if (!platform) return null;

    const setupGuides = getPlatformSetupGuides();
    const currentCreds = credentials[selectedPlatform] || {};

    return (
      <AlertDialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform('')}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Configure {platform.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Set up your {platform.name} API credentials to enable automated posting.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Setup Guide */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                Setup Instructions
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {setupGuides[selectedPlatform]?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Configuration Form */}
            {renderPlatformConfigForm(selectedPlatform, currentCreds)}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => savePlatformConfig(selectedPlatform)}>
              Save Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderPlatformConfigForm = (platformId: string, currentCreds: any) => {
    switch (platformId) {
      case 'wordpress':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="wp-url">WordPress Site URL</Label>
              <Input
                id="wp-url"
                placeholder="https://yoursite.com"
                defaultValue={currentCreds.baseUrl || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, baseUrl: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="wp-username">Username</Label>
              <Input
                id="wp-username"
                placeholder="your-username"
                defaultValue={currentCreds.username || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, username: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="wp-password">Application Password</Label>
              <Input
                id="wp-password"
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                defaultValue={currentCreds.applicationPassword || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, applicationPassword: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 'medium':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="medium-token">Access Token</Label>
              <Input
                id="medium-token"
                type="password"
                placeholder="2505144a385731..."
                defaultValue={currentCreds.accessToken || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, accessToken: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="medium-publication">Publication ID (Optional)</Label>
              <Input
                id="medium-publication"
                placeholder="Leave empty to post to your profile"
                defaultValue={currentCreds.publicationId || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, publicationId: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 'devto':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="devto-key">API Key</Label>
              <Input
                id="devto-key"
                type="password"
                placeholder="aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789"
                defaultValue={currentCreds.apiKey || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, apiKey: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 'hashnode':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="hashnode-token">Access Token</Label>
              <Input
                id="hashnode-token"
                type="password"
                placeholder="aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789"
                defaultValue={currentCreds.accessToken || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, accessToken: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="hashnode-publication">Publication ID (Optional)</Label>
              <Input
                id="hashnode-publication"
                placeholder="Leave empty to use first publication"
                defaultValue={currentCreds.publicationId || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, publicationId: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 'ghost':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="ghost-url">Ghost Site URL</Label>
              <Input
                id="ghost-url"
                placeholder="https://yoursite.ghost.io"
                defaultValue={currentCreds.apiUrl || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, apiUrl: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="ghost-key">Admin API Key</Label>
              <Input
                id="ghost-key"
                type="password"
                placeholder="1234567890abcdef:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                defaultValue={currentCreds.adminApiKey || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [platformId]: { ...currentCreds, adminApiKey: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      default:
        return <div>No configuration needed for this platform.</div>;
    }
  };

  const savePlatformConfig = (platformId: string) => {
    const creds = credentials[platformId];
    if (!creds) return;

    saveCredentials(platformId, creds);
    updatePlatformStatus(platformId, { configured: true });
    setSelectedPlatform('');

    toast({
      title: 'Configuration Saved',
      description: `${getPlatformById(platformId)?.name} has been configured successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Manager</h2>
        <p className="text-gray-600">
          Configure and manage publishing platforms for your backlink campaigns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{platformStats.totalPlatforms}</div>
                <div className="text-sm text-gray-600">Total Platforms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{platformStats.apiEnabled}</div>
                <div className="text-sm text-gray-600">API Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{platformStats.freeOptions}</div>
                <div className="text-sm text-gray-600">Free Options</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{platformStats.averageDA}</div>
                <div className="text-sm text-gray-600">Avg Domain Authority</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(renderPlatformCard)}
        </div>
      </div>

      {/* Configuration Dialog */}
      {renderConfigurationDialog()}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Telegraph</strong> is enabled by default and requires no configuration</p>
          <p>• API credentials are stored locally in your browser</p>
          <p>• Test connections before running campaigns to ensure proper setup</p>
          <p>• Each platform has different rate limits and content requirements</p>
          <p>• Always follow platform terms of service and community guidelines</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlatformManager;
