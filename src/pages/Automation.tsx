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
import AutomationReporting from '@/components/AutomationReporting';
import AutomationServiceStatus from '@/components/AutomationServiceStatus';
import CampaignProgressTracker, { CampaignProgress } from '@/components/CampaignProgressTracker';
import LiveCampaignStatus from '@/components/LiveCampaignStatus';
import CampaignManagerTabbed from '@/components/CampaignManagerTabbed';
import FormCompletionCelebration from '@/components/FormCompletionCelebration';
import InlineAuthForm from '@/components/InlineAuthForm';
import InlineProgressTracker from '@/components/InlineProgressTracker';
import InlineFeedMonitor from '@/components/InlineFeedMonitor';
import CampaignCreationModal from '@/components/CampaignCreationModal';
import { useAuthState } from '@/hooks/useAuthState';
import { useCampaignFormPersistence } from '@/hooks/useCampaignFormPersistence';
import { useSmartCampaignFlow } from '@/hooks/useSmartCampaignFlow';
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
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [pendingCampaignFromModal, setPendingCampaignFromModal] = useState(false);

  // State for inline components
  const [showInlineAuth, setShowInlineAuth] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
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

  // Handle pending campaign creation after modal auth success
  useEffect(() => {
    if (pendingCampaignFromModal && isAuthenticated) {
      setPendingCampaignFromModal(false);
      // Start campaign creation on main page
      setTimeout(() => {
        createCampaign();
      }, 500);
    }
  }, [pendingCampaignFromModal, isAuthenticated]);

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
      setNeedsAuth(true);
      setShowInlineAuth(true);
      saveFormData(formData);
      addStatusMessage('Please sign in to continue with your campaign', 'info');
      return;
    }

    await smartFlow.handleCampaignAction(
      formData,
      createCampaign,
      () => {} // Don't show auth modal - we'll handle auth inline
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
      
      // Handle specific authentication errors - keep inline
      if (error instanceof Error && error.message.includes('not authenticated')) {
        saveFormData(formData);
        addStatusMessage('Please sign in to continue with your campaign', 'error');
        return;
      }
      
      addStatusMessage(`Campaign creation failed: ${formatErrorMessage(error)}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowInlineAuth(false);
    setNeedsAuth(false);
    addStatusMessage('Successfully signed in! Starting your campaign...', 'success');

    // Use a small delay to let the user see the success message
    setTimeout(async () => {
      await smartFlow.handleSuccessfulAuth(createCampaign);
    }, 1000);
  };

  const handleModalAuthSuccess = () => {
    // Set flag to indicate we need to start campaign creation after modal closes
    setPendingCampaignFromModal(true);
    addStatusMessage('Successfully signed in! Preparing your campaign...', 'success');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Link Building Automation</h1>
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
                  onClick={() => setShowInlineAuth(true)}
                >
                  Sign In to Continue
                </Button>
              </div>
            </AlertDescription>
          </Alert>
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

        {/* Inline Authentication */}
        {showInlineAuth && !isAuthenticated && (
          <div className="mb-6">
            <InlineAuthForm
              onSuccess={handleAuthSuccess}
              campaignData={hasValidSavedData(savedFormData) ? savedFormData : formData}
              isVisible={showInlineAuth}
            />
          </div>
        )}

        {/* Inline Progress Tracker */}
        {campaignProgress && (
          <div className="mb-6">
            <InlineProgressTracker
              progress={campaignProgress}
              onRetry={handleRetryCampaign}
            />
          </div>
        )}

        {/* Main Content - Top Row: Campaign Creation, Live Monitor, Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Create New Campaign
                    </CardTitle>
                    <CardDescription>
                      Launch a new link building campaign with automated content generation and backlinks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Campaign Info */}
                    {(formData.targetUrl || formData.keyword || formData.anchorText) && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-900">Draft Campaign</h4>
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            {smartFlow.hasValidForm(formData) ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Ready to Launch</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{3 - smartFlow.analyzeFormData(formData).missingFields.length}/3 fields</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-blue-700">
                          {formData.targetUrl && <div><strong>Target:</strong> {formData.targetUrl}</div>}
                          {formData.keyword && <div><strong>Keyword:</strong> {formData.keyword}</div>}
                          {formData.anchorText && <div><strong>Anchor:</strong> {formData.anchorText}</div>}
                        </div>
                      </div>
                    )}

                    {/* Create Campaign Button */}
                    <Button
                      onClick={() => setShowCampaignModal(true)}
                      className="w-full h-12 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      size="lg"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      {(formData.targetUrl || formData.keyword || formData.anchorText) ? 'Edit & Launch Campaign' : 'Create New Campaign'}
                    </Button>

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

              <TabsContent value="status">
                <AutomationServiceStatus />
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Monitor (Middle Column) */}
          <div className="lg:col-span-1">
            <InlineFeedMonitor
              activeCampaigns={activeCampaigns}
              isVisible={isAuthenticated || activeCampaigns.length > 0}
            />
          </div>

          {/* Live Activity (Right Column) */}
          <div className="lg:col-span-1">
            {isAuthenticated && (
              <CampaignManagerTabbed
                onStatusUpdate={(message, type) => addStatusMessage(message, type)}
              />
            )}
          </div>
        </div>

        {/* Publishing Platforms - Full Width Second Row */}
        <div className="w-full">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Publishing Platforms
              </CardTitle>
              <CardDescription>
                Platforms for automatic rotation (1 post per platform per campaign)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Active Platform */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Telegraph.ph</div>
                      <div className="text-xs text-gray-600">Priority #1 • Auto-rotation</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-green-700">DR 91</div>
                    <div className="text-xs text-gray-500">High DA</div>
                  </div>
                </div>

                {/* Coming Soon Platforms */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Medium.com</div>
                      <div className="text-xs text-gray-600">Priority #2 • Coming soon</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">DR 96</div>
                    <div className="text-xs text-gray-500">Premium</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Dev.to</div>
                      <div className="text-xs text-gray-600">Priority #3 • Coming soon</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">DR 86</div>
                    <div className="text-xs text-gray-500">Tech focused</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">LinkedIn Articles</div>
                      <div className="text-xs text-gray-600">Professional network</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">DR 100</div>
                    <div className="text-xs text-gray-500">B2B focus</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Hashnode</div>
                      <div className="text-xs text-gray-600">Developer blogging</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">DR 75</div>
                    <div className="text-xs text-gray-500">Developer</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Substack</div>
                      <div className="text-xs text-gray-600">Newsletter platform</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">DR 88</div>
                    <div className="text-xs text-gray-500">Newsletter</div>
                  </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-xs text-gray-500">More platforms coming soon...</p>
                </div>

                {/* Additional future platform slots */}
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
                  <p className="text-xs text-gray-400">Platform slot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Creation Modal */}
        <CampaignCreationModal
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          formData={formData}
          onInputChange={handleInputChange}
          onCreateCampaign={handleCreateCampaign}
          isCreating={isCreating}
          isAuthenticated={isAuthenticated}
          smartFlow={smartFlow}
          addStatusMessage={addStatusMessage}
          onAuthSuccess={() => {
            addStatusMessage('Successfully signed in! Starting your campaign...', 'success');
          }}
        />

        {/* Form Completion Celebration */}
        <FormCompletionCelebration
          isVisible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />

      </div>
    </div>
  );
};

export default Automation;
