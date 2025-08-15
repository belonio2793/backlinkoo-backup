import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, CheckCircle, Clock, Info, Wand2, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CampaignCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    targetUrl: string;
    keyword: string;
    anchorText: string;
  };
  onInputChange: (field: string, value: string) => void;
  onCreateCampaign: () => void;
  isCreating: boolean;
  isAuthenticated: boolean;
  smartFlow: any; // Type this properly based on your smart flow hook
  addStatusMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  onAuthSuccess?: () => void;
  onAuthSuccessCloseModal?: () => void;
}

const CampaignCreationModal: React.FC<CampaignCreationModalProps> = ({
  isOpen,
  onClose,
  formData,
  onInputChange,
  onCreateCampaign,
  isCreating,
  isAuthenticated,
  smartFlow,
  addStatusMessage,
  onAuthSuccess
}) => {
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthInputChange = (field: string, value: string) => {
    setAuthFormData(prev => ({ ...prev, [field]: value }));
    setAuthError(null);
  };

  const validateAuthForm = () => {
    if (!authFormData.email || !authFormData.password) {
      setAuthError('Email and password are required');
      return false;
    }

    if (activeTab === 'signup') {
      if (!authFormData.name) {
        setAuthError('Name is required for sign up');
        return false;
      }
      if (authFormData.password !== authFormData.confirmPassword) {
        setAuthError('Passwords do not match');
        return false;
      }
      if (authFormData.password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return false;
      }
    }

    return true;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthForm()) return;

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (activeTab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authFormData.email,
          password: authFormData.password,
        });

        if (error) throw error;

        toast({
          title: 'Success!',
          description: 'Successfully signed in. Your campaign will start shortly.',
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email: authFormData.email,
          password: authFormData.password,
          options: {
            data: {
              name: authFormData.name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account, then sign in.',
        });
        setActiveTab('signin');
        return;
      }

      // Reset auth form
      setAuthFormData({ email: '', password: '', confirmPassword: '', name: '' });
      setShowAuth(false);

      // Call auth success callback
      if (onAuthSuccess) {
        onAuthSuccess();
      }

      // Close modal and delegate campaign creation to main page
      if (onAuthSuccessCloseModal) {
        onAuthSuccessCloseModal();
      }

      // Close modal immediately after successful auth
      onClose();

    } catch (error: any) {
      console.error('Authentication error:', error);
      setAuthError(error.message || 'Authentication failed');

      toast({
        title: 'Authentication failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateCampaignClick = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
    } else {
      onCreateCampaign();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
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
          </DialogTitle>
          <DialogDescription>
            Enter your target URL, keyword, and anchor text to generate and publish backlink content
          </DialogDescription>

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
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showAuth ? (
            /* Authentication Form */
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Sign In to Continue</h3>
                <p className="text-sm text-gray-600">
                  Sign in to your account to create campaigns with your saved data
                </p>
              </div>

              {/* Campaign Data Preview */}
              {(formData.targetUrl || formData.keyword || formData.anchorText) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 text-sm mb-2">Your Campaign Draft:</h4>
                  <div className="space-y-1 text-xs text-blue-700">
                    {formData.targetUrl && <div><strong>Target:</strong> {formData.targetUrl}</div>}
                    {formData.keyword && <div><strong>Keyword:</strong> {formData.keyword}</div>}
                    {formData.anchorText && <div><strong>Anchor:</strong> {formData.anchorText}</div>}
                  </div>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 mt-4">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={authFormData.email}
                          onChange={(e) => handleAuthInputChange('email', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={authFormData.password}
                          onChange={(e) => handleAuthInputChange('password', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    {authError && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {authError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isAuthLoading}>
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          Sign In & Start Campaign
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-4">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your full name"
                          value={authFormData.name}
                          onChange={(e) => handleAuthInputChange('name', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={authFormData.email}
                          onChange={(e) => handleAuthInputChange('email', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={authFormData.password}
                          onChange={(e) => handleAuthInputChange('password', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={authFormData.confirmPassword}
                          onChange={(e) => handleAuthInputChange('confirmPassword', e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    {authError && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {authError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isAuthLoading}>
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuth(false)}
                >
                  Back to Campaign Form
                </Button>
              </div>
            </div>
          ) : (
            /* Campaign Form */
            <>
              {/* Target URL Field */}
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="targetUrl"
                    placeholder="https://example.com or example.com"
                    value={formData.targetUrl}
                    onChange={(e) => onInputChange('targetUrl', e.target.value)}
                    onKeyDown={(e) => {
                      // Ctrl/Cmd + Enter to auto-format
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        const formattedUrl = smartFlow.autoFormatUrl(formData.targetUrl);
                        if (formattedUrl !== formData.targetUrl) {
                          onInputChange('targetUrl', formattedUrl);
                          addStatusMessage('URL formatted with Ctrl+Enter shortcut', 'success');
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Auto-format URL when user leaves the field
                      const formattedUrl = smartFlow.autoFormatUrl(e.target.value);
                      if (formattedUrl !== e.target.value) {
                        onInputChange('targetUrl', formattedUrl);
                        addStatusMessage('URL automatically formatted with https://', 'info');
                      }
                    }}
                    onPaste={(e) => {
                      // Auto-format pasted content after a short delay
                      setTimeout(() => {
                        const pastedValue = e.currentTarget.value;
                        const formattedUrl = smartFlow.autoFormatUrl(pastedValue);
                        if (formattedUrl !== pastedValue) {
                          onInputChange('targetUrl', formattedUrl);
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
                          onInputChange('targetUrl', formattedUrl);
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
                  onChange={(e) => onInputChange('keyword', e.target.value)}
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
                  onChange={(e) => onInputChange('anchorText', e.target.value)}
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

              {/* Authentication Warning */}
              {!isAuthenticated && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You'll need to sign in or create an account to start campaigns. Your form data will be saved automatically.
                  </AlertDescription>
                </Alert>
              )}

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
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!showAuth && (
          <>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreating || isAuthLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaignClick}
                disabled={(smartFlow.getButtonState(formData).disabled || isCreating) && isAuthenticated}
                className="transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
            </div>

            {/* Button description */}
            {smartFlow.getButtonState(formData).description && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {smartFlow.getButtonState(formData).description}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignCreationModal;
