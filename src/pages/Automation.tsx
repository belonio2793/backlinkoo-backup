import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, FileText, Link, BarChart3, CheckCircle, Info, Clock, Wand2, Activity } from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import { campaignMonitoringService } from '@/services/campaignMonitoringService';
import { realTimeFeedService } from '@/services/realTimeFeedService';
import { workingCampaignProcessor } from '@/services/workingCampaignProcessor';
import CampaignMonitoringErrorBoundary from '@/components/CampaignMonitoringErrorBoundary';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import AutomationReporting from '@/components/AutomationReporting';
import AutomationServiceStatus from '@/components/AutomationServiceStatus';
import CampaignProgressTracker, { CampaignProgress } from '@/components/CampaignProgressTracker';
import LiveCampaignStatus from '@/components/LiveCampaignStatus';
import CampaignManagerTabbed from '@/components/CampaignManagerTabbed';
import FormCompletionCelebration from '@/components/FormCompletionCelebration';
import InlineFeedMonitor from '@/components/InlineFeedMonitor';
import DevelopmentModeIndicator from '@/components/DevelopmentModeIndicator';
import BacklinkNotification from '@/components/BacklinkNotification';
import DatabaseSchemaFixer from '@/components/DatabaseSchemaFixer';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { useCampaignFormPersistence } from '@/hooks/useCampaignFormPersistence';
import { useSmartCampaignFlow } from '@/hooks/useSmartCampaignFlow';
import { useAuthModal } from '@/contexts/ModalContext';
// Enhanced feed hooks removed - using simpler state management

const Automation = () => {
  const [statusMessages, setStatusMessages] = useState<Array<{message: string, type: 'success' | 'error' | 'info', id: string}>>([]);
  const { isAuthenticated, isLoading: authLoading, user } = useAuthState();
  const { savedFormData, saveFormData, clearFormData, hasValidSavedData } = useCampaignFormPersistence();
  const smartFlow = useSmartCampaignFlow();
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null);
  const [progressUnsubscribe, setProgressUnsubscribe] = useState<(() => void) | null>(null);
  const [lastCreatedCampaign, setLastCreatedCampaign] = useState<any>(null);
  const [hasShownRestoreMessage, setHasShownRestoreMessage] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastFormValidState, setLastFormValidState] = useState(false);

  // Modal state for authentication
  const { openLoginModal } = useAuthModal();
  const [formData, setFormData] = useState({
    targetUrl: '',
    keyword: '',
    anchorText: ''
  });

  const orchestrator = getOrchestrator();

  // Add status message helper
  const addStatusMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setStatusMessages(prev => [...prev.slice(-4), { message, type, id }]); // Keep last 5 messages

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setStatusMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  };

  // Load saved form data when component mounts or when saved data changes
  useEffect(() => {
    if (hasValidSavedData(savedFormData) && !hasShownRestoreMessage) {
      setFormData(savedFormData);
      addStatusMessage('Form data restored - you can continue with your campaign', 'info');
      setHasShownRestoreMessage(true);

      // Update smart flow with restored data
      smartFlow.updateFlowState(savedFormData);
    }
  }, [savedFormData, hasValidSavedData, hasShownRestoreMessage, smartFlow]);

  // Initialize smart flow on mount
  useEffect(() => {
    smartFlow.updateFlowState(formData);
  }, []);

  // Start campaign monitoring when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Load active campaigns for Live Monitor
      const loadActiveCampaigns = async () => {
        try {
          const campaigns = await orchestrator.getUserCampaigns();
          const active = campaigns.filter(c => c.status === 'active');
          setActiveCampaigns(active);

          if (active.length > 0) {
            addStatusMessage(`Found ${active.length} active campaign(s)`, 'info');
          }
        } catch (error) {
          console.error('Error loading active campaigns:', error);
        }
      };

      // Start monitoring with a small delay to ensure other services are ready
      const startMonitoring = setTimeout(async () => {
        campaignMonitoringService.startMonitoring();
        addStatusMessage('Campaign monitoring service started', 'info');

        // Load campaigns and check immediately
        await loadActiveCampaigns();

        // Force an immediate check for stuck campaigns
        setTimeout(async () => {
          await campaignMonitoringService.forceCheck();
          addStatusMessage('Initial campaign health check completed', 'info');
        }, 1000);
      }, 2000);

      return () => {
        clearTimeout(startMonitoring);
      };
    } else {
      // Stop monitoring when user logs out
      campaignMonitoringService.stopMonitoring();
      setActiveCampaigns([]);
    }
  }, [isAuthenticated]);


  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Update smart flow state
    smartFlow.updateFlowState(newFormData);

    // Check if form just became valid for celebration
    const isNowValid = smartFlow.hasValidForm(newFormData);
    if (isNowValid && !lastFormValidState && !isAuthenticated) {
      setShowCelebration(true);
    }
    setLastFormValidState(isNowValid);
  };

  const validateForm = () => {
    if (!formData.targetUrl || !formData.keyword || !formData.anchorText) {
      addStatusMessage('Please fill in all required fields', 'error');
      return false;
    }

    // Basic URL validation
    try {
      new URL(formData.targetUrl);
    } catch {
      addStatusMessage('Please enter a valid target URL', 'error');
      return false;
    }

    return true;
  };

  const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      // Handle Supabase error objects
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      // Handle error objects with details
      if ('details' in error && typeof error.details === 'string') {
        return error.details;
      }
      // Handle PostgreSQL error objects
      if ('hint' in error && typeof error.hint === 'string') {
        return error.hint;
      }
      // Try to extract meaningful information
      try {
        return JSON.stringify(error, null, 2);
      } catch {
        return Object.prototype.toString.call(error);
      }
    }
    return 'An unknown error occurred';
  };

  const handleCreateCampaign = async () => {
    // Check if user needs authentication first
    if (!isAuthenticated) {
      saveFormData(formData);
      addStatusMessage('Please sign in to continue with your campaign', 'info');

      // Open authentication modal with campaign context
      openLoginModal({
        onAuthSuccess: handleAuthSuccess,
        pendingAction: `your ${formData.keyword || 'link building'} campaign`
      });
      return;
    }

    await smartFlow.handleCampaignAction(
      formData,
      createCampaign,
      () => {} // Auth is handled via modal
    );
  };

  const createCampaign = async () => {
    setIsCreating(true);

    // Don't open Enhanced Feed popup - keep it inline
    // setShowEnhancedFeed(true);

    try {
      // Ensure URL is properly formatted before creating campaign
      const formattedUrl = smartFlow.autoFormatUrl(formData.targetUrl);

      // Update form data if URL was auto-formatted
      if (formattedUrl !== formData.targetUrl) {
        setFormData(prev => ({ ...prev, targetUrl: formattedUrl }));
        addStatusMessage('URL auto-formatted for campaign creation', 'info');
      }

      // Create new campaign using orchestrator
      const campaign = await orchestrator.createCampaign({
        target_url: formattedUrl,
        keyword: formData.keyword,
        anchor_text: formData.anchorText
      });

      // Subscribe to progress updates
      const unsubscribe = orchestrator.subscribeToProgress(campaign.id, (progress) => {
        setCampaignProgress(progress);
      });

      setProgressUnsubscribe(() => unsubscribe);
      // Don't show full screen progress - keep inline progress
      // setShowProgress(true);

      // Store the created campaign for live status
      setLastCreatedCampaign(campaign);

      // Add campaign to active campaigns for enhanced feed
      setActiveCampaigns(prev => [...prev, campaign]);

      // Emit real-time feed event for campaign creation
      realTimeFeedService.emitCampaignCreated(
        campaign.id,
        campaign.name || formData.keyword,
        formData.keyword,
        formattedUrl,
        user?.id
      );

      // Clear saved form data since campaign was created successfully
      clearFormData();
      setHasShownRestoreMessage(false);

      // Reset form
      setFormData({
        targetUrl: '',
        keyword: '',
        anchorText: ''
      });

      addStatusMessage('Campaign created successfully! Check the status below.', 'success');

    } catch (error) {
      console.error('Campaign creation error:', error);
      
      // Handle specific authentication errors - open modal
      if (error instanceof Error && error.message.includes('not authenticated')) {
        saveFormData(formData);
        addStatusMessage('Please sign in to continue with your campaign', 'error');
        openLoginModal({
          onAuthSuccess: handleAuthSuccess,
          pendingAction: `your ${formData.keyword || 'link building'} campaign`
        });
        return;
      }
      
      addStatusMessage(`Campaign creation failed: ${formatErrorMessage(error)}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    console.log('🎯 Auth success for automation, user:', user?.email);
    addStatusMessage('Successfully signed in! Starting your campaign...', 'success');

    // Use a small delay to let the user see the success message
    setTimeout(async () => {
      await smartFlow.handleSuccessfulAuth(createCampaign);
    }, 1000);
  };


  const handleRetryCampaign = () => {
    // Reset campaign progress and allow user to create a new campaign
    setCampaignProgress(null);

    // Cleanup subscription
    if (progressUnsubscribe) {
      progressUnsubscribe();
      setProgressUnsubscribe(null);
    }

    addStatusMessage('Ready to create a new campaign', 'info');
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (progressUnsubscribe) {
        progressUnsubscribe();
      }
    };
  }, [progressUnsubscribe]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <div>
            <p className="text-gray-900 font-medium">Loading automation system...</p>
            {hasValidSavedData(savedFormData) && (
              <p className="text-sm text-blue-600 mt-2">
                Restoring your saved campaign for "{savedFormData.keyword}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Don't show full screen progress tracker - we'll show inline progress instead

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto space-y-6">

          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900">Link Building Automation</h1>
              <NetworkStatusIndicator />
            </div>
            <p className="text-lg text-gray-600">
              Automatically generate and publish high-quality content with backlinks to your target URL
            </p>
            {user && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Signed in as {user.email}</span>
              </div>
            )}
          </div>

        {/* Saved form data notification */}
        {hasValidSavedData(savedFormData) && !isAuthenticated && (
          <Alert className="border-blue-200 bg-blue-50">
            <Target className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  You have a saved campaign ready: <strong>"{savedFormData.keyword}"</strong>
                  <div className="text-sm mt-1 opacity-90">
                    Target: {savedFormData.targetUrl} • Anchor: {savedFormData.anchorText}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => openLoginModal({
                    onAuthSuccess: handleAuthSuccess,
                    pendingAction: `your ${savedFormData.keyword || 'saved'} campaign`
                  })}
                >
                  Sign In to Continue
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Development Mode Indicator */}
        <DevelopmentModeIndicator />

        {/* Database Schema Fixer - Show if there are HTTP errors related to missing columns */}
        {statusMessages.some(msg => msg.message.includes('column') || msg.message.includes('schema')) && (
          <DatabaseSchemaFixer />
        )}

        {/* Status Messages */}
        {statusMessages.length > 0 && (
          <div className="space-y-2">
            {statusMessages.map(msg => (
              <Alert key={msg.id} className={msg.type === 'error' ? 'border-red-200 bg-red-50' : msg.type === 'success' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
                <Info className="h-4 w-4" />
                <AlertDescription className={msg.type === 'error' ? 'text-red-700' : msg.type === 'success' ? 'text-green-700' : 'text-blue-700'}>
                  {msg.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}


        {/* Main Content - Top Row: Campaign Creation, Activity, Live Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 lg:gap-6">
          {/* Campaign Creation (Left Column) */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  New Campaign
                </TabsTrigger>
                <TabsTrigger value="status" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                {/* Campaign Creation Card with Modal Trigger */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5" />
                      Create a New Campaign
                    </CardTitle>
                    <CardDescription>
                      Launch a new link building campaign with automated content generation and backlinks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-8 py-6">
                    {/* Form Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Form Progress</span>
                        <span>{Math.round(((3 - smartFlow.analyzeFormData(formData).missingFields.length) / 3) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            smartFlow.hasValidForm(formData) ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${((3 - smartFlow.analyzeFormData(formData).missingFields.length) / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Target URL Field */}
                    <div className="space-y-2">
                      <Label htmlFor="targetUrl">Target URL *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="targetUrl"
                          placeholder="https://example.com or example.com"
                          value={formData.targetUrl}
                          onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                          onKeyDown={(e) => {
                            // Ctrl/Cmd + Enter to auto-format
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              const formattedUrl = smartFlow.autoFormatUrl(formData.targetUrl);
                              if (formattedUrl !== formData.targetUrl) {
                                handleInputChange('targetUrl', formattedUrl);
                                addStatusMessage('URL formatted with Ctrl+Enter shortcut', 'success');
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // Auto-format URL when user leaves the field
                            const formattedUrl = smartFlow.autoFormatUrl(e.target.value);
                            if (formattedUrl !== e.target.value) {
                              handleInputChange('targetUrl', formattedUrl);
                              addStatusMessage('URL automatically formatted with https://', 'info');
                            }
                          }}
                          onPaste={(e) => {
                            // Auto-format pasted content after a short delay
                            setTimeout(() => {
                              const pastedValue = e.currentTarget.value;
                              const formattedUrl = smartFlow.autoFormatUrl(pastedValue);
                              if (formattedUrl !== pastedValue) {
                                handleInputChange('targetUrl', formattedUrl);
                                addStatusMessage('Pasted URL automatically formatted with https://', 'info');
                              }
                            }, 10);
                          }}
                          className={`flex-1 ${smartFlow.analyzeFormData(formData).missingFields.includes('Target URL') ||
                                    smartFlow.analyzeFormData(formData).missingFields.includes('Valid Target URL') ?
                                    'border-amber-300 focus:border-amber-500' : ''}`}
                        />
                        {formData.targetUrl && !formData.targetUrl.startsWith('http') && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const formattedUrl = smartFlow.autoFormatUrl(formData.targetUrl);
                              if (formattedUrl !== formData.targetUrl) {
                                handleInputChange('targetUrl', formattedUrl);
                                addStatusMessage('URL formatted with https://', 'success');
                              }
                            }}
                            className="px-3"
                            title="Add https:// to URL"
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        The URL where your backlink will point
                      </p>
                      {formData.targetUrl && !formData.targetUrl.startsWith('http') && formData.targetUrl.includes('.') && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <Wand2 className="h-3 w-3" />
                          Will auto-format to: {smartFlow.autoFormatUrl(formData.targetUrl)}
                        </p>
                      )}
                      {smartFlow.analyzeFormData(formData).missingFields.includes('Valid Target URL') && formData.targetUrl &&
                       !formData.targetUrl.includes('.') && (
                        <p className="text-sm text-amber-600">
                          Please enter a valid domain (e.g., example.com)
                        </p>
                      )}
                    </div>

                    {/* Keyword Field */}
                    <div className="space-y-2">
                      <Label htmlFor="keyword">Keyword *</Label>
                      <Input
                        id="keyword"
                        placeholder="digital marketing"
                        value={formData.keyword}
                        onChange={(e) => handleInputChange('keyword', e.target.value)}
                        className={smartFlow.analyzeFormData(formData).missingFields.includes('Keyword') ?
                                  'border-amber-300 focus:border-amber-500' : ''}
                      />
                      <p className="text-sm text-gray-500">The main topic for content generation</p>
                      {formData.keyword && formData.keyword.length > 50 && (
                        <p className="text-sm text-amber-600">Consider using a shorter, more focused keyword</p>
                      )}
                    </div>

                    {/* Anchor Text Field */}
                    <div className="space-y-2">
                      <Label htmlFor="anchorText">Anchor Text *</Label>
                      <Input
                        id="anchorText"
                        placeholder="best digital marketing tools"
                        value={formData.anchorText}
                        onChange={(e) => handleInputChange('anchorText', e.target.value)}
                        className={smartFlow.analyzeFormData(formData).missingFields.includes('Anchor Text') ?
                                  'border-amber-300 focus:border-amber-500' : ''}
                      />
                      <p className="text-sm text-gray-500">The clickable text for your backlink</p>
                      {formData.anchorText && (
                        <div className="flex justify-between text-xs">
                          <span className={formData.anchorText.length > 60 ? 'text-amber-600' : 'text-gray-500'}>
                            {formData.anchorText.length} characters
                          </span>
                          {formData.anchorText.length > 60 && (
                            <span className="text-amber-600">Consider shorter anchor text for better SEO</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Smart Flow Contextual Messages */}
                    {smartFlow.getContextualMessages(formData).map((msg: any, index: number) => (
                      <Alert key={index} className={
                        msg.type === 'success' ? 'border-green-200 bg-green-50' :
                        msg.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                      }>
                        <Info className="h-4 w-4" />
                        <AlertDescription className={
                          msg.type === 'success' ? 'text-green-700' :
                          msg.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }>
                          {msg.message}
                        </AlertDescription>
                      </Alert>
                    ))}

                    {/* Create Campaign Button */}
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={(smartFlow.getButtonState(formData).disabled || isCreating) && isAuthenticated}
                      className="w-full h-12 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      size="lg"
                      variant={smartFlow.getButtonState(formData).variant}
                    >
                      <div className="flex items-center justify-center transition-all duration-200">
                        {(isCreating || smartFlow.getButtonState(formData).icon === 'loader') ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="animate-pulse">{smartFlow.getButtonState(formData).text}</span>
                          </>
                        ) : (
                          <>
                            <Target className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                              smartFlow.hasValidForm(formData) ? 'rotate-0' : 'rotate-45'
                            }`} />
                            <span>
                              {!isAuthenticated && smartFlow.hasValidForm(formData)
                                ? 'Sign In & Create Campaign'
                                : smartFlow.getButtonState(formData).text
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </Button>

                    {/* Button description */}
                    {smartFlow.getButtonState(formData).description && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        {smartFlow.getButtonState(formData).description}
                      </p>
                    )}

                    {!isAuthenticated && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          You'll need to sign in or create an account to start campaigns. Your form data will be saved automatically.
                        </AlertDescription>
                      </Alert>
                    )}


                    {/* Campaign Status Summary */}
                    {lastCreatedCampaign && (
                      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-900">Campaign Active</h4>
                            <p className="text-sm text-green-700">
                              "{lastCreatedCampaign.keywords?.[0] || lastCreatedCampaign.name}" is running
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Monitoring live</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <AutomationServiceStatus />
                <DatabaseSchemaFixer />
              </TabsContent>
            </Tabs>
          </div>

          {/* Activity (Middle Column) */}
          <div className="lg:col-span-1">
            <CampaignManagerTabbed
              onStatusUpdate={(message, type) => addStatusMessage(message, type)}
              currentCampaignProgress={campaignProgress}
              onRetryProgress={handleRetryCampaign}
            />
          </div>

          {/* Live Monitor (Right Column) */}
          <div className="lg:col-span-1">
            <InlineFeedMonitor
              activeCampaigns={activeCampaigns}
              isVisible={true}
            />
          </div>
        </div>

        {/* Publishing Platforms - Full Width Second Row */}
        <div className="w-full">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="w-5 h-5" />
                Publishing Platforms
              </CardTitle>
              <CardDescription>
                Available platforms for automatic content publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-900">Active Platforms</h3>
                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">1 Available</div>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">telegraph.ph</div>
                          <div className="text-xs text-gray-600">High authority publishing</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-green-700">DR 91</div>
                        <div className="text-xs text-gray-500">Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-900">Coming Soon</h3>
                    <div className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">5 Planned</div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">medium.com</div>
                          <div className="text-xs text-gray-600">Professional publishing</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">DR 96</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">dev.to</div>
                          <div className="text-xs text-gray-600">Developer community</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">DR 86</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">linkedin.com</div>
                          <div className="text-xs text-gray-600">Professional articles</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">DR 100</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">hashnode.com</div>
                          <div className="text-xs text-gray-600">Developer blogging</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">DR 75</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">substack.com</div>
                          <div className="text-xs text-gray-600">Newsletter platform</div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">DR 88</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Form Completion Celebration */}
        <FormCompletionCelebration
          isVisible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />

        </div>
      </main>


      <Footer />

      {/* Backlink Publication Notifications */}
      <BacklinkNotification isVisible={isAuthenticated} />
    </div>
  );
};

export default Automation;
