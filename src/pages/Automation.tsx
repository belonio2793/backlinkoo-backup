import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, FileText, Link, BarChart3, CheckCircle, Info, Clock } from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import AutomationReporting from '@/components/AutomationReporting';
import AutomationServiceStatus from '@/components/AutomationServiceStatus';
import AutomationAuthModal from '@/components/AutomationAuthModal';
import CampaignProgressTracker, { CampaignProgress } from '@/components/CampaignProgressTracker';
import LiveCampaignStatus from '@/components/LiveCampaignStatus';
import CampaignManager from '@/components/CampaignManager';
import { useAuthState } from '@/hooks/useAuthState';
import { useCampaignFormPersistence } from '@/hooks/useCampaignFormPersistence';
import { useSmartCampaignFlow } from '@/hooks/useSmartCampaignFlow';

const Automation = () => {
  const [statusMessages, setStatusMessages] = useState<Array<{message: string, type: 'success' | 'error' | 'info', id: string}>>([]);
  const { isAuthenticated, isLoading: authLoading, user } = useAuthState();
  const { savedFormData, saveFormData, clearFormData, hasValidSavedData } = useCampaignFormPersistence();
  const smartFlow = useSmartCampaignFlow();

  const [isCreating, setIsCreating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null);
  const [progressUnsubscribe, setProgressUnsubscribe] = useState<(() => void) | null>(null);
  const [lastCreatedCampaign, setLastCreatedCampaign] = useState<any>(null);
  const [hasShownRestoreMessage, setHasShownRestoreMessage] = useState(false);
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
    }
  }, [savedFormData, hasValidSavedData, hasShownRestoreMessage]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Update smart flow state
    smartFlow.updateFlowState(newFormData);
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
    await smartFlow.handleCampaignAction(
      formData,
      createCampaign,
      () => setShowAuthModal(true)
    );
  };

  const createCampaign = async () => {
    setIsCreating(true);

    try {
      // Create new campaign using orchestrator
      const campaign = await orchestrator.createCampaign({
        target_url: formData.targetUrl,
        keyword: formData.keyword,
        anchor_text: formData.anchorText
      });

      // Subscribe to progress updates
      const unsubscribe = orchestrator.subscribeToProgress(campaign.id, (progress) => {
        setCampaignProgress(progress);
      });

      setProgressUnsubscribe(() => unsubscribe);
      setShowProgress(true);

      // Store the created campaign for live status
      setLastCreatedCampaign(campaign);

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
      
      // Handle specific authentication errors
      if (error instanceof Error && error.message.includes('not authenticated')) {
        saveFormData(formData);
        setShowAuthModal(true);
        return;
      }
      
      addStatusMessage(`Campaign creation failed: ${formatErrorMessage(error)}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAuthSuccess = async () => {
    await smartFlow.handleSuccessfulAuth(createCampaign);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setCampaignProgress(null);

    // Cleanup subscription
    if (progressUnsubscribe) {
      progressUnsubscribe();
      setProgressUnsubscribe(null);
    }
  };

  const handleRetryCampaign = () => {
    // Close progress tracker and allow user to create a new campaign
    handleProgressClose();
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

  // Show progress tracker if active
  if (showProgress && campaignProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <CampaignProgressTracker
          progress={campaignProgress}
          onClose={handleProgressClose}
          onRetry={handleRetryCampaign}
        />
      </div>
    );
  }
  }

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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have saved campaign details. Sign in to continue with your campaign for "<strong>{savedFormData.keyword}</strong>".
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                {/* Campaign Creation Form */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Create New Campaign
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {smartFlow.hasValidForm(formData) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{3 - smartFlow.analyzeFormData(formData).missingFields.length}/3</span>
                      </div>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Enter your target URL, keyword, and anchor text to generate and publish backlink content
                </CardDescription>

                {/* Form Completion Progress Bar */}
                <div className="mt-3">
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL *</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://example.com"
                    value={formData.targetUrl}
                    onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                    className={smartFlow.analyzeFormData(formData).missingFields.includes('Target URL') ||
                              smartFlow.analyzeFormData(formData).missingFields.includes('Valid Target URL') ?
                              'border-amber-300 focus:border-amber-500' : ''}
                  />
                  <p className="text-sm text-gray-500">The URL where your backlink will point</p>
                  {smartFlow.analyzeFormData(formData).missingFields.includes('Valid Target URL') && formData.targetUrl && (
                    <p className="text-sm text-amber-600">Please enter a valid URL (e.g., https://example.com)</p>
                  )}
                </div>

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


                {!isAuthenticated && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You'll need to sign in or create an account to start campaigns. Your form data will be saved automatically.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreateCampaign}
                  disabled={smartFlow.getButtonState(formData).disabled || isCreating}
                  className="w-full"
                  size="lg"
                  variant={smartFlow.getButtonState(formData).variant}
                >
                  {(isCreating || smartFlow.getButtonState(formData).icon === 'loader') ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {smartFlow.getButtonState(formData).text}
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      {smartFlow.getButtonState(formData).text}
                    </>
                  )}
                </Button>

                {/* Smart Flow Contextual Messages */}
                {smartFlow.getContextualMessages(formData).map((msg, index) => (
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
              </CardContent>
                </Card>

                {/* Live Campaign Status */}
                <LiveCampaignStatus
                  isCreating={isCreating}
                  lastCreatedCampaign={lastCreatedCampaign}
                  onCampaignUpdate={(campaign) => {
                    setLastCreatedCampaign(campaign);
                    addStatusMessage(`Campaign "${campaign.keyword}" status updated to ${campaign.status}`, 'info');
                  }}
                />

              </TabsContent>

              <TabsContent value="status">
                <AutomationServiceStatus />
              </TabsContent>
            </Tabs>
          </div>

          {/* Publishing Platforms (Middle Column) */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Publishing Platforms
                </CardTitle>
                <CardDescription>
                  Available platforms for content publication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {/* Active Platform */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Telegraph.ph</div>
                        <div className="text-xs text-gray-600">Anonymous publishing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-green-700">DR 91</div>
                      <div className="text-xs text-gray-500">High DA</div>
                    </div>
                  </div>

                  {/* Coming Soon Platforms */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Medium.com</div>
                        <div className="text-xs text-gray-600">Professional publishing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">DR 96</div>
                      <div className="text-xs text-gray-500">Premium</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Dev.to</div>
                        <div className="text-xs text-gray-600">Developer community</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">DR 86</div>
                      <div className="text-xs text-gray-500">Tech focused</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
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

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
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

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
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
                  <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-xs text-gray-500">More platforms coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Activity (Right Column) */}
          <div className="lg:col-span-1">
            {isAuthenticated && (
              <CampaignManager
                onStatusUpdate={(message, type) => addStatusMessage(message, type)}
              />
            )}
          </div>
        </div>

        {/* Authentication Modal */}
        <AutomationAuthModal
          isOpen={showAuthModal}
          onClose={handleAuthModalClose}
          onSuccess={handleAuthSuccess}
          campaignData={hasValidSavedData(savedFormData) ? savedFormData : undefined}
        />
      </div>
    </div>
  );
};

export default Automation;
