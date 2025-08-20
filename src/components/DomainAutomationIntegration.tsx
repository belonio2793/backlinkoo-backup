/**
 * Domain Automation Integration Component
 * Provides seamless integration between domain management and campaign automation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Globe,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Palette,
  Zap,
  Target,
  Link,
  BarChart3,
  Play,
  Pause,
  Info,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import NetlifyDNSManager from '@/services/netlifyDNSManager';
import AutoDomainBlogThemeService from '@/services/autoDomainBlogThemeService';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'active' | 'failed' | 'expired';
  blog_enabled: boolean;
  ssl_enabled: boolean;
  netlify_synced?: boolean;
  blog_theme_config?: any;
  created_at: string;
}

interface AutomationConfig {
  autoConfigureDNS: boolean;
  autoConfigureThemes: boolean;
  enableCampaignIntegration: boolean;
  themeRotation: boolean;
  batchProcessing: boolean;
}

interface ProcessingStatus {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  currentDomain: string;
  results: Array<{
    domain: string;
    success: boolean;
    actions: string[];
    errors: string[];
  }>;
}

interface DomainAutomationIntegrationProps {
  domains: Domain[];
  onDomainsUpdated: () => void;
}

export function DomainAutomationIntegration({ domains, onDomainsUpdated }: DomainAutomationIntegrationProps) {
  const { user } = useAuthState();
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    autoConfigureDNS: true,
    autoConfigureThemes: true,
    enableCampaignIntegration: true,
    themeRotation: false,
    batchProcessing: true
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    currentStep: '',
    progress: 0,
    currentDomain: '',
    results: []
  });
  const [netlifyConfigured, setNetlifyConfigured] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Check Netlify configuration on mount
  useEffect(() => {
    const configStatus = NetlifyDNSManager.getConfigStatus();
    setNetlifyConfigured(configStatus.configured);
  }, []);

  // Filter domains for different categories
  const unprocessedDomains = domains.filter(d => 
    !d.blog_enabled || !d.netlify_synced || d.status === 'pending'
  );
  const blogEnabledDomains = domains.filter(d => d.blog_enabled);
  const campaignReadyDomains = domains.filter(d => 
    d.blog_enabled && d.status === 'active' && d.netlify_synced
  );

  /**
   * Process domains with full automation
   */
  const processDomainsWithAutomation = async (selectedDomains?: Domain[]) => {
    const domainsToProcess = selectedDomains || unprocessedDomains;
    
    if (domainsToProcess.length === 0) {
      toast.info('No domains need processing');
      return;
    }

    if (!netlifyConfigured && automationConfig.autoConfigureDNS) {
      toast.error('NETLIFY_ACCESS_TOKEN required for DNS automation. Please configure in environment variables.');
      return;
    }

    setProcessingStatus({
      isProcessing: true,
      currentStep: 'Starting automation...',
      progress: 0,
      currentDomain: '',
      results: []
    });

    try {
      let dnsManager: NetlifyDNSManager | null = null;
      
      if (automationConfig.autoConfigureDNS && netlifyConfigured) {
        dnsManager = NetlifyDNSManager.getInstance();
      }

      const totalSteps = domainsToProcess.length * (
        (automationConfig.autoConfigureDNS ? 2 : 0) + 
        (automationConfig.autoConfigureThemes ? 1 : 0) + 
        (automationConfig.enableCampaignIntegration ? 1 : 0)
      );
      let completedSteps = 0;

      for (const domain of domainsToProcess) {
        const domainResults = {
          domain: domain.domain,
          success: true,
          actions: [] as string[],
          errors: [] as string[]
        };

        setProcessingStatus(prev => ({
          ...prev,
          currentDomain: domain.domain,
          currentStep: `Processing ${domain.domain}...`
        }));

        try {
          // Step 1: Auto-configure DNS if enabled
          if (automationConfig.autoConfigureDNS && dnsManager) {
            setProcessingStatus(prev => ({
              ...prev,
              currentStep: `Configuring DNS for ${domain.domain}...`
            }));

            try {
              // Add domain to Netlify
              await dnsManager.addDomain(domain.domain, { autoSSL: true });
              domainResults.actions.push('Added to Netlify');

              // Configure DNS records
              const dnsResult = await dnsManager.autoConfigureBlogDNS(domain.domain);
              if (dnsResult.success) {
                domainResults.actions.push('DNS configured automatically');
                
                // Update domain status
                await supabase
                  .from('domains')
                  .update({ 
                    netlify_synced: true,
                    status: 'validating',
                    verification_token: dnsResult.verificationToken
                  })
                  .eq('id', domain.id);
              } else {
                domainResults.errors.push(`DNS config failed: ${dnsResult.message}`);
              }
            } catch (error) {
              domainResults.errors.push(`DNS setup failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            completedSteps += 2;
            setProcessingStatus(prev => ({
              ...prev,
              progress: (completedSteps / totalSteps) * 100
            }));
          }

          // Step 2: Auto-configure blog theme
          if (automationConfig.autoConfigureThemes) {
            setProcessingStatus(prev => ({
              ...prev,
              currentStep: `Configuring blog theme for ${domain.domain}...`
            }));

            try {
              const themeResult = await AutoDomainBlogThemeService.autoConfigureDomainBlogTheme(
                domain.id,
                domain.domain,
                {
                  enableCampaignIntegration: automationConfig.enableCampaignIntegration
                }
              );

              if (themeResult.success) {
                domainResults.actions.push(`Blog theme configured: ${themeResult.message}`);
              } else {
                domainResults.errors.push(`Theme config failed: ${themeResult.message}`);
              }
            } catch (error) {
              domainResults.errors.push(`Theme setup failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            completedSteps += 1;
            setProcessingStatus(prev => ({
              ...prev,
              progress: (completedSteps / totalSteps) * 100
            }));
          }

          // Step 3: Campaign integration
          if (automationConfig.enableCampaignIntegration) {
            setProcessingStatus(prev => ({
              ...prev,
              currentStep: `Setting up campaign integration for ${domain.domain}...`
            }));

            try {
              // Create or update campaign blog settings
              const { error } = await supabase
                .from('campaign_blog_settings')
                .upsert({
                  domain_id: domain.id,
                  domain_name: domain.domain,
                  enabled: true,
                  posts_per_campaign: 2,
                  rotation_enabled: true,
                  auto_publish: true,
                  seo_optimized: true
                });

              if (!error) {
                domainResults.actions.push('Campaign integration enabled');
              } else {
                domainResults.errors.push(`Campaign integration failed: ${error.message}`);
              }
            } catch (error) {
              domainResults.errors.push(`Campaign setup failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            completedSteps += 1;
            setProcessingStatus(prev => ({
              ...prev,
              progress: (completedSteps / totalSteps) * 100
            }));
          }

        } catch (error) {
          domainResults.success = false;
          domainResults.errors.push(`Processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        setProcessingStatus(prev => ({
          ...prev,
          results: [...prev.results, domainResults]
        }));

        // Small delay between domains
        if (domainsToProcess.indexOf(domain) < domainsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Final status update
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        currentStep: 'Automation completed',
        progress: 100,
        currentDomain: ''
      }));

      const successful = processingStatus.results.filter(r => r.success).length;
      const failed = processingStatus.results.filter(r => !r.success).length;

      toast.success(`Automation completed: ${successful} successful, ${failed} failed`);
      
      // Refresh domains
      onDomainsUpdated();

    } catch (error) {
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        currentStep: 'Automation failed',
        currentDomain: ''
      }));
      toast.error(`Automation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Quick setup for specific domain
   */
  const quickSetupDomain = async (domain: Domain) => {
    await processDomainsWithAutomation([domain]);
  };

  /**
   * Test automation configuration
   */
  const testAutomationConfig = async () => {
    if (!netlifyConfigured) {
      toast.warning('NETLIFY_ACCESS_TOKEN not configured. DNS automation will be skipped.');
      return;
    }

    try {
      const dnsManager = NetlifyDNSManager.getInstance();
      const testResult = await dnsManager.testConnection();
      
      if (testResult.connected) {
        toast.success(`✅ Automation ready! Permissions: ${testResult.permissions.join(', ')}`);
      } else {
        toast.error(`❌ Automation test failed: ${testResult.error}`);
      }
    } catch (error) {
      toast.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment Status */}
      <Alert className={`border-2 ${netlifyConfigured ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <Globe className={`h-4 w-4 ${netlifyConfigured ? 'text-green-600' : 'text-amber-600'}`} />
        <AlertDescription className={netlifyConfigured ? 'text-green-800' : 'text-amber-800'}>
          <div className="space-y-2">
            <p className="font-medium">
              {netlifyConfigured 
                ? '🚀 NETLIFY_ACCESS_TOKEN configured - Full automation available'
                : '⚠️ NETLIFY_ACCESS_TOKEN not found - Limited automation mode'
              }
            </p>
            <div className="flex gap-3 text-sm">
              <span>✅ Theme Configuration</span>
              <span>✅ Campaign Integration</span>
              <span className={netlifyConfigured ? 'text-green-600' : 'text-amber-600'}>
                {netlifyConfigured ? '✅' : '⚠️'} DNS Automation
              </span>
            </div>
            {!netlifyConfigured && (
              <p className="text-xs mt-2">
                To enable DNS automation, set NETLIFY_ACCESS_TOKEN in your environment variables. 
                Manual DNS configuration is still available.
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{domains.length}</div>
            <div className="text-sm text-gray-600">Total Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{unprocessedDomains.length}</div>
            <div className="text-sm text-gray-600">Need Setup</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{blogEnabledDomains.length}</div>
            <div className="text-sm text-gray-600">Blog Enabled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{campaignReadyDomains.length}</div>
            <div className="text-sm text-gray-600">Campaign Ready</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Automation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Domain Automation
          </CardTitle>
          <CardDescription>
            Automatically configure DNS, themes, and campaign integration for your domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automation Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-configure DNS</Label>
                <Switch
                  checked={automationConfig.autoConfigureDNS}
                  onCheckedChange={(checked) => 
                    setAutomationConfig(prev => ({ ...prev, autoConfigureDNS: checked }))
                  }
                  disabled={!netlifyConfigured}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-configure Themes</Label>
                <Switch
                  checked={automationConfig.autoConfigureThemes}
                  onCheckedChange={(checked) => 
                    setAutomationConfig(prev => ({ ...prev, autoConfigureThemes: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Campaign Integration</Label>
                <Switch
                  checked={automationConfig.enableCampaignIntegration}
                  onCheckedChange={(checked) => 
                    setAutomationConfig(prev => ({ ...prev, enableCampaignIntegration: checked }))
                  }
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Theme Rotation</Label>
                <Switch
                  checked={automationConfig.themeRotation}
                  onCheckedChange={(checked) => 
                    setAutomationConfig(prev => ({ ...prev, themeRotation: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Batch Processing</Label>
                <Switch
                  checked={automationConfig.batchProcessing}
                  onCheckedChange={(checked) => 
                    setAutomationConfig(prev => ({ ...prev, batchProcessing: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => processDomainsWithAutomation()}
              disabled={processingStatus.isProcessing || unprocessedDomains.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingStatus.isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Auto-Setup {unprocessedDomains.length} Domains
            </Button>

            <Button
              variant="outline"
              onClick={testAutomationConfig}
              disabled={processingStatus.isProcessing}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Test Configuration
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>

            <Button
              variant="outline"
              asChild
            >
              <a href="/automation">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Automation Dashboard
              </a>
            </Button>
          </div>

          {/* Processing Status */}
          {processingStatus.isProcessing && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">{processingStatus.currentStep}</span>
                <span className="text-sm text-blue-700">{processingStatus.progress.toFixed(0)}%</span>
              </div>
              <Progress value={processingStatus.progress} className="w-full" />
              {processingStatus.currentDomain && (
                <p className="text-sm text-blue-700">
                  Current: {processingStatus.currentDomain}
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {processingStatus.results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Processing Results:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {processingStatus.results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.domain}</span>
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    {result.actions.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Actions:</p>
                        <ul className="text-xs space-y-1">
                          {result.actions.map((action, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.errors.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
                        <ul className="text-xs space-y-1">
                          {result.errors.map((error, i) => (
                            <li key={i} className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Domain Actions */}
      {unprocessedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Domains Needing Setup</CardTitle>
            <CardDescription>
              Configure individual domains or use bulk automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unprocessedDomains.slice(0, 5).map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium">{domain.domain}</span>
                      <div className="flex gap-2 mt-1">
                        {!domain.blog_enabled && (
                          <Badge variant="outline" className="text-xs">No Theme</Badge>
                        )}
                        {!domain.netlify_synced && (
                          <Badge variant="outline" className="text-xs">No DNS</Badge>
                        )}
                        {domain.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => quickSetupDomain(domain)}
                    disabled={processingStatus.isProcessing}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Quick Setup
                  </Button>
                </div>
              ))}
              {unprocessedDomains.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ...and {unprocessedDomains.length - 5} more domains
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Integration Status */}
      {campaignReadyDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    {campaignReadyDomains.length} domains ready for campaigns
                  </h4>
                  <p className="text-sm text-green-800 mb-3">
                    These domains are fully configured and will automatically receive blog posts when you run campaigns.
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm" asChild className="bg-green-600 hover:bg-green-700">
                      <a href="/automation">
                        <Play className="h-3 w-3 mr-1" />
                        Create Campaign
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/blog">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        View Blog Posts
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DomainAutomationIntegration;
