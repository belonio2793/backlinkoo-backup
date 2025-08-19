import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Steps,
  StepsContent,
  StepsItem,
  StepsList,
  StepsTrigger
} from '@/components/ui/steps';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Zap,
  Shield,
  Globe,
  Settings,
  RefreshCw,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  Clock,
  Wifi,
  Lock
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

interface HostingConfig {
  ip: string;
  cname: string;
}

interface AutoPropagationWizardProps {
  domain: Domain;
  hostingConfig: HostingConfig;
  onSuccess?: (domain: Domain) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

type WizardStep = 'detect' | 'configure' | 'preview' | 'execute' | 'complete';

interface StepData {
  registrarInfo?: RegistrarInfo;
  credentials?: RegistrarCredentials;
  preview?: {
    toCreate: DNSRecord[];
    toUpdate: Array<{ from: DNSRecord; to: DNSRecord }>;
    toKeep: DNSRecord[];
  };
  result?: {
    success: boolean;
    recordsUpdated: number;
    recordsCreated: number;
    recordsFailed: number;
    errors: string[];
  };
}

export function AutoPropagationWizard({
  domain,
  hostingConfig,
  onSuccess,
  onError,
  onClose
}: AutoPropagationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('detect');
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    // Start with registrar detection
    if (currentStep === 'detect') {
      detectRegistrar();
    }
  }, [currentStep]);

  const detectRegistrar = async () => {
    setLoading(true);
    setProgress(20);
    
    try {
      const info = await RegistrarDetectionService.detectRegistrar(domain.domain);
      setStepData(prev => ({ ...prev, registrarInfo: info }));
      
      // Auto-advance if registrar supports auto-propagation
      if (info.autoUpdateAvailable) {
        setProgress(40);
        setTimeout(() => {
          setCurrentStep('configure');
          setTempCredentials(prev => ({ ...prev, registrarCode: info.registrarCode }));
        }, 1000);
      } else {
        setProgress(100);
        toast.info(`Manual setup required for ${info.registrar}`);
      }
    } catch (error) {
      console.error('Registrar detection failed:', error);
      toast.error('Failed to detect registrar');
      onError?.('Failed to detect registrar');
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = async () => {
    if (!tempCredentials.apiKey && !tempCredentials.accessToken) {
      toast.error('Please enter API credentials');
      return false;
    }

    setLoading(true);
    setProgress(60);
    
    try {
      const result = await RegistrarAPIService.testCredentials(tempCredentials);
      
      if (result.success) {
        toast.success('✅ Credentials verified successfully!');
        
        // Save credentials
        const saved = await RegistrarAPIService.saveCredentials(domain.id, tempCredentials);
        if (saved) {
          setStepData(prev => ({ ...prev, credentials: tempCredentials }));
          setProgress(80);
          return true;
        }
      } else {
        toast.error(`❌ Credential test failed: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Credential test failed:', error);
      toast.error('Failed to test credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!stepData.credentials || !stepData.registrarInfo) {
      toast.error('Missing credentials or registrar info');
      return;
    }

    setLoading(true);
    setProgress(90);
    
    try {
      const requiredRecords = RegistrarAPIService.generateRequiredRecords(
        domain.domain,
        domain.verification_token || 'missing-token',
        hostingConfig
      );

      const preview = await RegistrarAPIService.getUpdatePreview(
        domain.domain,
        stepData.credentials,
        requiredRecords
      );

      if (preview.success) {
        setStepData(prev => ({ ...prev, preview: preview.preview }));
        setProgress(100);
        return true;
      } else {
        toast.error(`Failed to generate preview: ${preview.error}`);
        return false;
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate update preview');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const executeAutoPropagation = async () => {
    if (!stepData.credentials || !domain.verification_token) {
      toast.error('Missing credentials or verification token');
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await RegistrarAPIService.performAutoPropagation(
        domain.id,
        domain.domain,
        domain.verification_token,
        hostingConfig,
        stepData.credentials
      );

      clearInterval(progressInterval);
      setProgress(100);

      setStepData(prev => ({ ...prev, result }));

      if (result.success) {
        toast.success(`✅ DNS propagation completed! Updated ${result.recordsCreated + result.recordsUpdated} records.`);
        setTimeout(() => {
          setCurrentStep('complete');
        }, 1000);
        onSuccess?.(domain);
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

  const nextStep = async () => {
    switch (currentStep) {
      case 'detect':
        if (stepData.registrarInfo?.autoUpdateAvailable) {
          setCurrentStep('configure');
        }
        break;
      case 'configure':
        const credentialsValid = await testCredentials();
        if (credentialsValid) {
          setCurrentStep('preview');
        }
        break;
      case 'preview':
        const previewGenerated = await generatePreview();
        if (previewGenerated) {
          setCurrentStep('execute');
        }
        break;
      case 'execute':
        await executeAutoPropagation();
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'configure':
        setCurrentStep('detect');
        break;
      case 'preview':
        setCurrentStep('configure');
        break;
      case 'execute':
        setCurrentStep('preview');
        break;
    }
  };

  const getRegistrarConfig = () => {
    if (!stepData.registrarInfo) return null;
    return RegistrarDetectionService.getRegistrarConfig(stepData.registrarInfo.registrarCode);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'detect':
        return (
          <div className=\"space-y-6\">
            <div className=\"text-center space-y-4\">
              <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center\">
                {loading ? (
                  <Loader2 className=\"h-8 w-8 animate-spin text-blue-600\" />
                ) : (
                  <Globe className=\"h-8 w-8 text-blue-600\" />
                )}
              </div>
              <div>
                <h3 className=\"text-lg font-semibold\">Detecting Registrar</h3>
                <p className=\"text-gray-600\">
                  {loading 
                    ? `Analyzing DNS settings for ${domain.domain}...`
                    : stepData.registrarInfo
                      ? `Detected: ${stepData.registrarInfo.registrar}`
                      : 'Ready to analyze your domain'
                  }
                </p>
              </div>
            </div>

            {stepData.registrarInfo && (
              <div className=\"p-4 bg-gray-50 rounded-lg\">
                <div className=\"flex items-center justify-between mb-3\">
                  <h4 className=\"font-medium\">Detection Results</h4>
                  <Badge 
                    variant={stepData.registrarInfo.autoUpdateAvailable ? 'default' : 'secondary'}
                    className={stepData.registrarInfo.autoUpdateAvailable ? 'bg-green-100 text-green-800' : ''}
                  >
                    {stepData.registrarInfo.autoUpdateAvailable ? 'Auto-Update Supported' : 'Manual Setup Required'}
                  </Badge>
                </div>
                <div className=\"space-y-2 text-sm\">
                  <div><strong>Registrar:</strong> {stepData.registrarInfo.registrar}</div>
                  <div><strong>Nameservers:</strong> {stepData.registrarInfo.nameservers.join(', ') || 'Not detected'}</div>
                  {stepData.registrarInfo.autoUpdateAvailable && (
                    <div className=\"text-green-700 font-medium\">
                      ✅ Ready for automatic DNS propagation
                    </div>
                  )}
                </div>
              </div>
            )}

            {stepData.registrarInfo && !stepData.registrarInfo.autoUpdateAvailable && (
              <Alert>
                <AlertTriangle className=\"h-4 w-4\" />
                <AlertDescription>
                  <div className=\"space-y-2\">
                    <p className=\"font-medium\">Manual DNS Setup Required</p>
                    <p>Your registrar doesn't support automatic updates. You'll need to add DNS records manually.</p>
                    <div className=\"space-y-1 text-sm\">
                      {RegistrarDetectionService.getSetupInstructions(stepData.registrarInfo.registrarCode).map((instruction, index) => (
                        <div key={index}>• {instruction}</div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'configure':
        const config = getRegistrarConfig();
        return (
          <div className=\"space-y-6\">
            <div className=\"text-center space-y-4\">
              <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center\">
                <Settings className=\"h-8 w-8 text-blue-600\" />
              </div>
              <div>
                <h3 className=\"text-lg font-semibold\">Configure API Access</h3>
                <p className=\"text-gray-600\">
                  Enter your {stepData.registrarInfo?.registrar} API credentials
                </p>
              </div>
            </div>

            {config && (
              <div className=\"space-y-4\">
                <div className=\"p-4 bg-blue-50 border border-blue-200 rounded-lg\">
                  <div className=\"flex items-center gap-2 mb-2\">
                    <Badge variant=\"outline\">{config.name}</Badge>
                    <a
                      href={config.docsUrl}
                      target=\"_blank\"
                      rel=\"noopener noreferrer\"
                      className=\"text-blue-600 hover:underline text-sm flex items-center gap-1\"
                    >
                      <ExternalLink className=\"h-3 w-3\" />
                      API Docs
                    </a>
                  </div>
                  <div className=\"text-sm text-blue-700\">
                    <p className=\"font-medium mb-2\">Setup Instructions:</p>
                    <ol className=\"list-decimal list-inside space-y-1\">
                      {config.setupInstructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className=\"space-y-4\">
                  {config.authType === 'api_key' && (
                    <>
                      <div className=\"space-y-2\">
                        <Label htmlFor=\"apiKey\">API Key *</Label>
                        <Input
                          id=\"apiKey\"
                          type=\"password\"
                          value={tempCredentials.apiKey || ''}
                          onChange={(e) => setTempCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder=\"Enter your API key\"
                        />
                      </div>
                      
                      {config.code === 'godaddy' && (
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"apiSecret\">API Secret *</Label>
                          <Input
                            id=\"apiSecret\"
                            type=\"password\"
                            value={tempCredentials.apiSecret || ''}
                            onChange={(e) => setTempCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                            placeholder=\"Enter your API secret\"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {config.authType === 'oauth' && (
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"accessToken\">Access Token *</Label>
                      <Input
                        id=\"accessToken\"
                        type=\"password\"
                        value={tempCredentials.accessToken || ''}
                        onChange={(e) => setTempCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                        placeholder=\"Enter your access token\"
                      />
                    </div>
                  )}

                  {config.code === 'cloudflare' && (
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"zone\">Zone ID (Optional)</Label>
                      <Input
                        id=\"zone\"
                        value={tempCredentials.zone || ''}
                        onChange={(e) => setTempCredentials(prev => ({ ...prev, zone: e.target.value }))}
                        placeholder=\"Auto-detected if not provided\"
                      />
                    </div>
                  )}

                  {config.code === 'namecheap' && (
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"userId\">Username *</Label>
                      <Input
                        id=\"userId\"
                        value={tempCredentials.userId || ''}
                        onChange={(e) => setTempCredentials(prev => ({ ...prev, userId: e.target.value }))}
                        placeholder=\"Your Namecheap username\"
                      />
                    </div>
                  )}
                </div>

                <Alert>
                  <Shield className=\"h-4 w-4\" />
                  <AlertDescription>
                    Your credentials are encrypted before storage and used only for DNS management.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className=\"space-y-6\">
            <div className=\"text-center space-y-4\">
              <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center\">
                {loading ? (
                  <Loader2 className=\"h-8 w-8 animate-spin text-blue-600\" />
                ) : (
                  <Eye className=\"h-8 w-8 text-blue-600\" />
                )}
              </div>
              <div>
                <h3 className=\"text-lg font-semibold\">Preview Changes</h3>
                <p className=\"text-gray-600\">
                  {loading 
                    ? 'Analyzing current DNS settings...'
                    : 'Review the changes before applying them'
                  }
                </p>
              </div>
            </div>

            {stepData.preview && (
              <div className=\"space-y-4\">
                <div className=\"p-4 bg-gray-50 rounded-lg\">
                  <div className=\"flex items-center justify-between mb-3\">
                    <h4 className=\"font-medium\">Change Summary</h4>
                    <div className=\"text-sm text-gray-600\">
                      {stepData.preview.toCreate.length + stepData.preview.toUpdate.length} changes
                    </div>
                  </div>
                  
                  <div className=\"grid grid-cols-3 gap-4 text-center\">
                    <div className=\"p-3 bg-green-50 border border-green-200 rounded\">
                      <div className=\"text-2xl font-bold text-green-700\">{stepData.preview.toCreate.length}</div>
                      <div className=\"text-sm text-green-600\">To Create</div>
                    </div>
                    <div className=\"p-3 bg-blue-50 border border-blue-200 rounded\">
                      <div className=\"text-2xl font-bold text-blue-700\">{stepData.preview.toUpdate.length}</div>
                      <div className=\"text-sm text-blue-600\">To Update</div>
                    </div>
                    <div className=\"p-3 bg-gray-50 border border-gray-200 rounded\">
                      <div className=\"text-2xl font-bold text-gray-700\">{stepData.preview.toKeep.length}</div>
                      <div className=\"text-sm text-gray-600\">To Keep</div>
                    </div>
                  </div>
                </div>

                {stepData.preview.toCreate.length > 0 && (
                  <div className=\"space-y-2\">
                    <h4 className=\"font-medium text-green-700\">Records to Create</h4>
                    <div className=\"space-y-1\">
                      {stepData.preview.toCreate.map((record, index) => (
                        <div key={index} className=\"p-2 bg-green-50 border border-green-200 rounded text-sm\">
                          <strong>{record.type}</strong> {record.name} → {record.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stepData.preview.toUpdate.length > 0 && (
                  <div className=\"space-y-2\">
                    <h4 className=\"font-medium text-blue-700\">Records to Update</h4>
                    <div className=\"space-y-1\">
                      {stepData.preview.toUpdate.map((change, index) => (
                        <div key={index} className=\"p-2 bg-blue-50 border border-blue-200 rounded text-sm\">
                          <div><strong>{change.from.type}</strong> {change.from.name}</div>
                          <div className=\"text-red-600\">- {change.from.content}</div>
                          <div className=\"text-green-600\">+ {change.to.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'execute':
        return (
          <div className=\"space-y-6\">
            <div className=\"text-center space-y-4\">
              <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center\">
                {loading ? (
                  <Loader2 className=\"h-8 w-8 animate-spin text-blue-600\" />
                ) : (
                  <Zap className=\"h-8 w-8 text-blue-600\" />
                )}
              </div>
              <div>
                <h3 className=\"text-lg font-semibold\">
                  {loading ? 'Applying DNS Changes' : 'Ready to Execute'}
                </h3>
                <p className=\"text-gray-600\">
                  {loading 
                    ? 'Updating your DNS records via the registrar API...'
                    : 'Click \"Execute\" to apply the DNS changes to your domain'
                  }
                </p>
              </div>
            </div>

            {loading && (
              <div className=\"space-y-4\">
                <Progress value={progress} className=\"w-full\" />
                <div className=\"text-center text-sm text-gray-600\">
                  {progress < 30 && 'Connecting to registrar API...'}
                  {progress >= 30 && progress < 60 && 'Authenticating...'}
                  {progress >= 60 && progress < 90 && 'Updating DNS records...'}
                  {progress >= 90 && 'Finalizing changes...'}
                </div>
              </div>
            )}

            {!loading && stepData.preview && (
              <Alert>
                <AlertTriangle className=\"h-4 w-4\" />
                <AlertDescription>
                  <div className=\"space-y-2\">
                    <p className=\"font-medium\">Final Confirmation Required</p>
                    <p>This will modify your live DNS settings. Changes may take time to propagate.</p>
                    <ul className=\"text-sm space-y-1 list-disc list-inside\">
                      <li>{stepData.preview.toCreate.length} records will be created</li>
                      <li>{stepData.preview.toUpdate.length} records will be updated</li>
                      <li>Changes typically propagate within 1-48 hours</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className=\"space-y-6\">
            <div className=\"text-center space-y-4\">
              <div className=\"mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center\">
                <CheckCircle className=\"h-8 w-8 text-green-600\" />
              </div>
              <div>
                <h3 className=\"text-lg font-semibold text-green-900\">Auto-Propagation Complete!</h3>
                <p className=\"text-gray-600\">
                  Your DNS records have been successfully updated
                </p>
              </div>
            </div>

            {stepData.result && (
              <div className=\"space-y-4\">
                <div className=\"p-4 bg-green-50 border border-green-200 rounded-lg\">
                  <h4 className=\"font-medium text-green-900 mb-3\">Results Summary</h4>
                  <div className=\"grid grid-cols-2 gap-4 text-sm\">
                    <div>
                      <div className=\"font-medium\">Records Created:</div>
                      <div className=\"text-green-700\">{stepData.result.recordsCreated}</div>
                    </div>
                    <div>
                      <div className=\"font-medium\">Records Updated:</div>
                      <div className=\"text-blue-700\">{stepData.result.recordsUpdated}</div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Clock className=\"h-4 w-4\" />
                  <AlertDescription>
                    <div className=\"space-y-2\">
                      <p className=\"font-medium\">What happens next?</p>
                      <ul className=\"text-sm space-y-1 list-disc list-inside\">
                        <li>DNS changes are now live in your registrar</li>
                        <li>Propagation worldwide may take 1-48 hours</li>
                        <li>We'll automatically validate your domain once propagated</li>
                        <li>You'll receive notifications when validation completes</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'detect': return 1;
      case 'configure': return 2;
      case 'preview': return 3;
      case 'execute': return 4;
      case 'complete': return 5;
      default: return 1;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'detect':
        return stepData.registrarInfo?.autoUpdateAvailable;
      case 'configure':
        return tempCredentials.apiKey || tempCredentials.accessToken;
      case 'preview':
        return stepData.preview;
      case 'execute':
        return !loading;
      default:
        return false;
    }
  };

  const canGoPrev = () => {
    return currentStep !== 'detect' && currentStep !== 'complete' && !loading;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className=\"max-w-2xl max-h-[90vh] overflow-y-auto\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center gap-2\">
            <Wifi className=\"h-5 w-5\" />
            Auto DNS Propagation Wizard
          </DialogTitle>
          <DialogDescription>
            Step {getStepNumber()} of 5: Automatic DNS setup for {domain.domain}
          </DialogDescription>
        </DialogHeader>

        <div className=\"py-6\">
          {/* Progress indicator */}
          <div className=\"mb-8\">
            <div className=\"flex items-center justify-between mb-2\">
              <span className=\"text-sm text-gray-600\">Progress</span>
              <span className=\"text-sm text-gray-600\">{getStepNumber()}/5</span>
            </div>
            <Progress value={(getStepNumber() / 5) * 100} className=\"w-full\" />
          </div>

          {/* Step content */}
          {renderStepContent()}
        </div>

        <DialogFooter className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-2 text-sm text-gray-600\">
            <Lock className=\"h-4 w-4\" />
            <span>Secure connection</span>
          </div>
          <div className=\"flex gap-2\">
            {currentStep === 'complete' ? (
              <Button onClick={onClose} className=\"flex items-center gap-2\">
                <CheckCircle className=\"h-4 w-4\" />
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant=\"outline\"
                  onClick={canGoPrev() ? prevStep : onClose}
                  disabled={loading}
                  className=\"flex items-center gap-2\"
                >
                  <ArrowLeft className=\"h-4 w-4\" />
                  {canGoPrev() ? 'Previous' : 'Cancel'}
                </Button>
                <Button
                  onClick={currentStep === 'execute' ? executeAutoPropagation : nextStep}
                  disabled={!canGoNext() || loading}
                  className=\"flex items-center gap-2\"
                >
                  {loading ? (
                    <Loader2 className=\"h-4 w-4 animate-spin\" />
                  ) : currentStep === 'execute' ? (
                    <Zap className=\"h-4 w-4\" />
                  ) : (
                    <ArrowRight className=\"h-4 w-4\" />
                  )}
                  {currentStep === 'execute' 
                    ? (loading ? 'Executing...' : 'Execute') 
                    : 'Next'
                  }
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AutoPropagationWizard;