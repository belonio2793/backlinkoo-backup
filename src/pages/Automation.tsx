import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, FileText, Link, BarChart3, CheckCircle, Info } from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import AutomationReporting from '@/components/AutomationReporting';
import AutomationServiceStatus from '@/components/AutomationServiceStatus';
import AutomationAuthModal from '@/components/AutomationAuthModal';
import CampaignProgressTracker, { CampaignProgress } from '@/components/CampaignProgressTracker';
import LiveCampaignStatus from '@/components/LiveCampaignStatus';
import CampaignManager from '@/components/CampaignManager';
import { useAuthState } from '@/hooks/useAuthState';
import { useCampaignFormPersistence } from '@/hooks/useCampaignFormPersistence';

const Automation = () => {
  const [statusMessages, setStatusMessages] = useState<Array<{message: string, type: 'success' | 'error' | 'info', id: string}>>([]);
  const { isAuthenticated, isLoading: authLoading, user } = useAuthState();
  const { savedFormData, saveFormData, clearFormData, hasValidSavedData } = useCampaignFormPersistence();
  
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
    if (hasValidSavedData(savedFormData)) {
      setFormData(savedFormData);
      addStatusMessage('Form data restored - you can continue with your campaign', 'info');
    }
  }, [savedFormData, hasValidSavedData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!validateForm()) return;

    // Check authentication first
    if (!isAuthenticated) {
      // Save form data before showing auth modal
      saveFormData(formData);
      setShowAuthModal(true);
      return;
    }

    await createCampaign();
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

  const handleAuthSuccess = () => {
    // After successful authentication, create the campaign
    if (hasValidSavedData(savedFormData)) {
      createCampaign();
    }
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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading automation system...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Creation (Left Column) */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Create Campaign
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Reports & Analytics
                </TabsTrigger>
                <TabsTrigger value="status" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Service Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                {/* Campaign Creation Form */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Create New Campaign
                </CardTitle>
                <CardDescription>
                  Enter your target URL, keyword, and anchor text to generate and publish backlink content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL *</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://example.com"
                    value={formData.targetUrl}
                    onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">The URL where your backlink will point</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword *</Label>
                  <Input
                    id="keyword"
                    placeholder="digital marketing"
                    value={formData.keyword}
                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">The main topic for content generation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anchorText">Anchor Text *</Label>
                  <Input
                    id="anchorText"
                    placeholder="best digital marketing tools"
                    value={formData.anchorText}
                    onChange={(e) => handleInputChange('anchorText', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">The clickable text for your backlink</p>
                </div>

                <Separator />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Generate a unique 1000-word article using AI (randomly selected style)</li>
                    <li>Format content with your anchor text linked to your target URL</li>
                    <li>Publish to Telegraph.ph automatically</li>
                    <li>Track published links in your reporting dashboard</li>
                  </ol>
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
                  disabled={isCreating}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      {isAuthenticated ? 'Start Link Building Campaign' : 'Continue with Campaign'}
                    </>
                  )}
                </Button>
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

                {/* Platform Info */}
                <Card>
              <CardHeader>
                <CardTitle>Publishing Platforms</CardTitle>
                <CardDescription>
                  Current and upcoming platforms for content publication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Telegraph.ph</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Anonymous publishing platform with instant publication
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="font-medium">More Platforms</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Additional platforms coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                {isAuthenticated ? (
                  <AutomationReporting />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
                      <p className="text-gray-600 mb-4">
                        Sign in to view your campaign reports and analytics.
                      </p>
                      <Button onClick={() => setShowAuthModal(true)}>
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="status">
                <AutomationServiceStatus />
              </TabsContent>
            </Tabs>
          </div>

          {/* Campaign Management (Right Column) */}
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
