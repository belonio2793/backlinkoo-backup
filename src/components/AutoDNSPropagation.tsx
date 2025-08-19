import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Loader2,
  Zap,
  Shield,
  Eye,
  Settings,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Wand2,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import RegistrarDetectionService, { RegistrarInfo } from '@/services/registrarDetectionService';
import RegistrarAPIService, { RegistrarCredentials, DNSRecord } from '@/services/registrarAPIService';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status: string;
  verification_token?: string;
  blog_enabled: boolean;
}

interface AutoDNSPropagationProps {
  domain: Domain;
  hostingConfig: {
    ip: string;
    cname: string;
  };
  onSuccess?: (domain: Domain) => void;
  onError?: (error: string) => void;
}

export function AutoDNSPropagation({
  domain,
  hostingConfig,
  onSuccess,
  onError
}: AutoDNSPropagationProps) {
  const [registrarInfo, setRegistrarInfo] = useState<RegistrarInfo | null>(null);
  const [credentials, setCredentials] = useState<RegistrarCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [updatePreview, setUpdatePreview] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Form state for credentials
  const [tempCredentials, setTempCredentials] = useState<RegistrarCredentials>({
    registrarCode: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    zone: '',
    userId: ''
  });

  useEffect(() => {
    detectRegistrar();
    loadSavedCredentials();
  }, [domain.id]);

  const detectRegistrar = async () => {
    setDetecting(true);
    try {
      const info = await RegistrarDetectionService.detectRegistrar(domain.domain);
      setRegistrarInfo(info);
      
      if (info.autoUpdateAvailable) {
        toast.success(`✅ Auto-propagation supported for ${info.registrar}`);
      } else {
        toast.info(`ℹ️ Manual setup required for ${info.registrar}`);
      }
    } catch (error) {
      console.error('Registrar detection failed:', error);
      toast.error('Failed to detect registrar');
      onError?.('Failed to detect registrar');
    } finally {
      setDetecting(false);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const saved = await RegistrarAPIService.getCredentials(domain.id);
      if (saved) {
        setCredentials(saved);
        setTempCredentials(saved);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const testCredentials = async () => {
    if (!tempCredentials.apiKey && !tempCredentials.accessToken) {
      toast.error('Please enter API credentials');
      return;
    }

    setTesting(true);
    try {
      const result = await RegistrarAPIService.testCredentials(tempCredentials);
      
      if (result.success) {
        toast.success('✅ Credentials verified successfully!');
        
        // Save credentials
        const saved = await RegistrarAPIService.saveCredentials(domain.id, tempCredentials);
        if (saved) {
          setCredentials(tempCredentials);
          toast.success('Credentials saved securely');
        }
      } else {
        toast.error(`❌ Credential test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Credential test failed:', error);
      toast.error('Failed to test credentials');
    } finally {
      setTesting(false);
    }
  };

  const generateUpdatePreview = async () => {
    if (!credentials || !registrarInfo) {
      toast.error('Missing credentials or registrar info');
      return;
    }

    setLoading(true);
    try {
      const requiredRecords = RegistrarAPIService.generateRequiredRecords(
        domain.domain,
        domain.verification_token || 'missing-token',
        hostingConfig
      );

      const preview = await RegistrarAPIService.getUpdatePreview(
        domain.domain,
        credentials,
        requiredRecords
      );

      if (preview.success) {
        setUpdatePreview(preview.preview);
        setShowConfirmation(true);
      } else {
        toast.error(`Failed to generate preview: ${preview.error}`);
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate update preview');
    } finally {
      setLoading(false);
    }
  };

  const performAutoPropagation = async () => {
    if (!credentials || !domain.verification_token) {
      toast.error('Missing credentials or verification token');
      return;
    }

    setLoading(true);
    try {
      const result = await RegistrarAPIService.performAutoPropagation(
        domain.id,
        domain.domain,
        domain.verification_token,
        hostingConfig,
        credentials
      );

      if (result.success) {
        toast.success(`✅ DNS propagation completed! Updated ${result.recordsCreated + result.recordsUpdated} records.`);
        onSuccess?.(domain);
        setShowConfirmation(false);
      } else {
        const errorMsg = result.errors.join(', ');
        toast.error(`❌ Auto-propagation failed: ${errorMsg}`);
        onError?.(errorMsg);
      }
    } catch (error) {
      console.error('Auto-propagation failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Auto-propagation failed: ${errorMsg}`);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getRegistrarConfig = () => {
    if (!registrarInfo) return null;
    return RegistrarDetectionService.getRegistrarConfig(registrarInfo.registrarCode);
  };

  const renderCredentialsForm = () => {
    const config = getRegistrarConfig();
    if (!config) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Registrar</Label>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{config.name}</Badge>
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              API Docs
            </a>
          </div>
        </div>

        {config.authType === 'api_key' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                value={tempCredentials.apiKey || ''}
                onChange={(e) => setTempCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
              />
            </div>
            
            {config.code === 'godaddy' && (
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret *</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={tempCredentials.apiSecret || ''}
                  onChange={(e) => setTempCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="Enter your API secret"
                />
              </div>
            )}
          </>
        )}

        {config.authType === 'oauth' && (
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token *</Label>
            <Input
              id="accessToken"
              type="password"
              value={tempCredentials.accessToken || ''}
              onChange={(e) => setTempCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
              placeholder="Enter your access token"
            />
          </div>
        )}

        {config.code === 'cloudflare' && (
          <div className="space-y-2">
            <Label htmlFor="zone">Zone ID (Optional)</Label>
            <Input
              id="zone"
              value={tempCredentials.zone || ''}
              onChange={(e) => setTempCredentials(prev => ({ ...prev, zone: e.target.value }))}
              placeholder="Auto-detected if not provided"
            />
          </div>
        )}

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {config.setupInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={testCredentials}
            disabled={testing || (!tempCredentials.apiKey && !tempCredentials.accessToken)}
            variant="outline"
            className="flex-1"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Test Credentials
          </Button>
        </div>
      </div>
    );
  };

  const renderUpdatePreview = () => {
    if (!updatePreview) return null;

    const { toCreate, toUpdate, toKeep } = updatePreview;
    const totalChanges = toCreate.length + toUpdate.length;
    const propagationTime = registrarInfo?.registrarCode === 'cloudflare' ? '1-5 minutes' :
                           registrarInfo?.registrarCode === 'namecheap' ? '30 minutes - 2 hours' :
                           registrarInfo?.registrarCode === 'godaddy' ? '1-8 hours' :
                           '1-48 hours';

    return (
      <div className="space-y-6">
        {/* Header with summary */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">DNS Update Preview</h3>
            <p className="text-sm text-blue-700 mt-1">
              Changes will be applied to your {registrarInfo?.registrar} account
            </p>
          </div>
          <div className="text-right">
            <Badge variant={totalChanges > 0 ? 'default' : 'secondary'} className="mb-2">
              {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            </Badge>
            <div className="text-xs text-blue-600">
              Est. propagation: {propagationTime}
            </div>
          </div>
        </div>

        {/* Impact warning for sensitive changes */}
        {(toUpdate.length > 0 || toCreate.some(r => r.type === 'A')) && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">Important: This will modify your live DNS settings</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {toCreate.some(r => r.type === 'A') && (
                    <li>A record changes will redirect your domain traffic to our hosting</li>
                  )}
                  {toUpdate.some(c => c.from.type === 'A') && (
                    <li>Existing A record will be updated - your site may be temporarily unreachable</li>
                  )}
                  <li>Changes may take {propagationTime} to fully propagate worldwide</li>
                  <li>We recommend making changes during low-traffic periods</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Records to Create */}
        {toCreate.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Records to Create ({toCreate.length})
            </h4>
            <div className="space-y-2">
              {toCreate.map((record, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800">{record.type}</Badge>
                    <div className="text-xs text-green-600">TTL: {record.ttl}s</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-900">Name:</span>
                      <code className="ml-2 bg-green-100 px-2 py-1 rounded text-xs">
                        {record.name === '@' ? domain.domain : `${record.name}.${domain.domain}`}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-green-900">Value:</span>
                      <code className="ml-2 bg-green-100 px-2 py-1 rounded text-xs break-all">
                        {record.content}
                      </code>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-700">
                    {record.type === 'A' && 'Points your domain to our hosting servers'}
                    {record.type === 'CNAME' && 'Creates an alias for the www subdomain'}
                    {record.type === 'TXT' && 'Verifies domain ownership for our platform'}
                    {record.type === 'MX' && 'Configures email routing for your domain'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Records to Update */}
        {toUpdate.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-blue-700 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Records to Update ({toUpdate.length})
            </h4>
            <div className="space-y-2">
              {toUpdate.map((change, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-100 text-blue-800">{change.from.type}</Badge>
                    <div className="text-xs text-blue-600">TTL: {change.to.ttl}s</div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm text-red-700 font-medium mb-1">Current Value:</div>
                      <code className="text-xs bg-red-100 px-2 py-1 rounded break-all">
                        {change.from.content}
                      </code>
                    </div>
                    <div className="flex justify-center">
                      <RefreshCw className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-sm text-green-700 font-medium mb-1">New Value:</div>
                      <code className="text-xs bg-green-100 px-2 py-1 rounded break-all">
                        {change.to.content}
                      </code>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    This will update your existing {change.from.type} record to point to our hosting
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Records to Keep */}
        {toKeep.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Records to Keep ({toKeep.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {toKeep.slice(0, 4).map((record, index) => (
                <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{record.type}</Badge>
                    <span className="text-xs text-gray-600 truncate">
                      {record.name} → {record.content.substring(0, 20)}{record.content.length > 20 ? '...' : ''}
                    </span>
                  </div>
                </div>
              ))}
              {toKeep.length > 4 && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm flex items-center justify-center text-gray-500">
                  +{toKeep.length - 4} more records
                </div>
              )}
            </div>
          </div>
        )}

        {/* No changes needed */}
        {totalChanges === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">Perfect! Your DNS is already configured correctly.</p>
                <p className="text-sm">
                  All required DNS records are properly set up. No changes are needed.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Rollback information */}
        {totalChanges > 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Rollback Information
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              If you need to revert these changes, you can restore your original DNS settings:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              {toUpdate.map((change, index) => (
                <div key={index} className="font-mono">
                  {change.from.type} {change.from.name} → {change.from.content}
                </div>
              ))}
              {toCreate.map((record, index) => (
                <div key={index} className="font-mono">
                  Remove {record.type} {record.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (detecting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Detecting registrar for {domain.domain}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto DNS Propagation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registrar Info */}
        {registrarInfo && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Detected Registrar</h3>
              <Button variant="ghost" size="sm" onClick={detectRegistrar}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={registrarInfo.autoUpdateAvailable ? 'default' : 'secondary'}>
                  {registrarInfo.registrar}
                </Badge>
                {registrarInfo.autoUpdateAvailable ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Update Supported
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Manual Setup Required
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Nameservers: {registrarInfo.nameservers.join(', ') || 'Not detected'}
              </div>
            </div>
          </div>
        )}

        {/* API Configuration */}
        {registrarInfo?.autoUpdateAvailable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">API Configuration</h3>
              <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    {credentials ? 'Update' : 'Configure'} Credentials
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configure API Credentials</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {renderCredentialsForm()}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {credentials ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  API credentials configured for {registrarInfo.registrar}. Ready for auto-propagation.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure API credentials to enable automatic DNS record updates.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Auto-Propagation Controls */}
        {registrarInfo?.autoUpdateAvailable && credentials && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Automatic DNS Propagation</h3>
              
              <div className="flex gap-2">
                <Button
                  onClick={generateUpdatePreview}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Preview Changes
                </Button>
                
                <Button
                  onClick={generateUpdatePreview}
                  disabled={loading || !domain.verification_token}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Auto-Propagate DNS
                </Button>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This will automatically update your DNS records at {registrarInfo.registrar} to point to our hosting. 
                  You'll be asked to confirm before any changes are made.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Manual Instructions */}
        {!registrarInfo?.autoUpdateAvailable && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Manual DNS Setup Required</h3>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {registrarInfo?.registrar || 'Your registrar'} doesn't support automatic DNS updates. 
                  Please add the DNS records manually in your registrar's control panel.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  {RegistrarDetectionService.getSetupInstructions(registrarInfo?.registrarCode || 'unknown').map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Confirm DNS Auto-Propagation
              </DialogTitle>
              <div className="text-sm text-gray-600">
                Review the changes below before applying them to your {registrarInfo?.registrar} account
              </div>
            </DialogHeader>

            <div className="py-4">
              {renderUpdatePreview()}
            </div>

            {/* Safety checklist */}
            {updatePreview && (updatePreview.toCreate.length > 0 || updatePreview.toUpdate.length > 0) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Checklist - Please Confirm
                </h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5" required />
                    <span>I understand this will modify my live DNS settings</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5" required />
                    <span>I have noted the rollback information above</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5" required />
                    <span>I'm aware changes may take time to propagate globally</span>
                  </label>
                  {updatePreview.toUpdate.some(c => c.from.type === 'A') && (
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5" required />
                      <span>I understand my site may be temporarily unreachable during A record changes</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="h-4 w-4" />
                <span>Secure API connection to {registrarInfo?.registrar}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={performAutoPropagation}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {loading ? 'Applying Changes...' : 'Confirm & Update DNS'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default AutoDNSPropagation;
