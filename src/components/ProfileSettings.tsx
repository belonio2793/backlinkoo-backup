import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { userService, UserProfile } from '@/services/userService';
import { profileService, UserProfileData, UserSettings as ProfileUserSettings } from '@/services/profileService';
import { ProfileErrorDebugger } from '@/utils/profileErrorDebugger';
import { ProfileErrorHandler } from '@/utils/profileErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { PremiumCheckoutModal } from '@/components/PremiumCheckoutModal';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  Settings,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  ExternalLink,
  Key,
  CreditCard,
  Bell,
  Lock
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSettingsProps {
  onClose?: () => void;
}

export const ProfileSettings = ({ onClose }: ProfileSettingsProps) => {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isPremium: authIsPremium, subscriptionTier: authSubscriptionTier } = useAuth();
  const { userProfile, isPremium, isAdmin, userLimits, loading: premiumLoading, refresh: refreshPremium } = usePremium();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPremiumCheckout, setShowPremiumCheckout] = useState(false);
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile form data
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
    website: '',
    company: '',
    location: ''
  });

  // Settings data
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    securityAlerts: true
  });


  // If we have user data from context but no profile data yet, initialize immediately
  useEffect(() => {
    if (user && !profileData.email) {
      console.log('🔄 Initializing profile data from auth context');
      setProfileData({
        displayName: user.user_metadata?.display_name ||
                    user.user_metadata?.full_name ||
                    user.email?.split('@')[0] ||
                    'User',
        email: user.email || '',
        bio: user.user_metadata?.bio || '',
        website: user.user_metadata?.website || '',
        company: user.user_metadata?.company || '',
        location: user.user_metadata?.location || ''
      });
    }
  }, [user, profileData.email]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get fresh user data from auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Auth error:', authError);
          toast({
            title: "Authentication Error",
            description: "Failed to get user data. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }

        if (!authUser) {
          console.log('No authenticated user found');
          return;
        }

        console.log('🔄 Loading profile data for user:', authUser.email);

        // Initialize with auth user data immediately
        const initialData = {
          displayName: authUser.user_metadata?.display_name ||
                      authUser.user_metadata?.full_name ||
                      authUser.email?.split('@')[0] ||
                      'User',
          email: authUser.email || '',
          bio: authUser.user_metadata?.bio || '',
          website: authUser.user_metadata?.website || '',
          company: authUser.user_metadata?.company || '',
          location: authUser.user_metadata?.location || ''
        };

        setProfileData(initialData);

        // Set default settings
        setSettings({
          emailNotifications: true,
          marketingEmails: false,
          weeklyReports: true,
          securityAlerts: true
        });

        // Ensure profile exists in database
        console.log('🔄 Ensuring profile exists in database...');
        const ensureResult = await profileService.ensureProfileExists();
        if (!ensureResult.success) {
          console.warn('Failed to ensure profile exists:', ensureResult.message);
          // Don't let this block the UI - continue with auth user data
        }

        // Load profile data from database and merge with auth data
        console.log('🔄 Loading profile from database...');
        try {
          const profile = await ProfileErrorHandler.safeGetProfile();
          const userSettings = await profileService.getUserSettings();

          if (profile) {
            console.log('✅ Profile loaded from database:', profile);
            setProfileData({
              displayName: profile.display_name || initialData.displayName,
              email: authUser.email || profileData.email || '', // Always prioritize auth email
              bio: profile.bio || initialData.bio,
              website: profile.website || initialData.website,
              company: profile.company || initialData.company,
              location: profile.location || initialData.location
            });
          } else {
            console.log('ℹ️ No profile found in database, using auth data');
          }

          if (userSettings) {
            console.log('✅ Settings loaded from database:', userSettings);
            setSettings({
              emailNotifications: userSettings.email_notifications ?? true,
              marketingEmails: userSettings.marketing_emails ?? false,
              weeklyReports: userSettings.weekly_reports ?? true,
              securityAlerts: userSettings.security_alerts ?? true
            });
          }
        } catch (dbError: any) {
          console.warn('⚠️ Database error, continuing with auth data only:', dbError.message);
          // Continue using the initialData we already set
        }

      } catch (error: any) {
        console.error('❌ Error loading profile data:', error);

        toast({
          title: "Loading Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadProfileData();
  }, [toast]);

  // Force refresh premium status when component loads
  useEffect(() => {
    if (user && refreshPremium) {
      refreshPremium();
    }
  }, [user, refreshPremium]);

  // Aggressive fallback - use auth data immediately if premium hook is loading
  const [useFallbackData, setUseFallbackData] = useState(false);
  const [directProfileData, setDirectProfileData] = useState<any>(null);

  // Start with fallback if loading takes more than 2 seconds
  useEffect(() => {
    if (premiumLoading) {
      const timeout = setTimeout(() => {
        setUseFallbackData(true);
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      setUseFallbackData(false);
    }
  }, [premiumLoading]);

  // Direct Supabase query as ultimate fallback
  useEffect(() => {
    const getDirectProfileData = async () => {
      if (user && (premiumLoading || useFallbackData)) {
        try {
          console.log('🔄 Direct profile query fallback...');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_tier, role, subscription_status')
            .eq('user_id', user.id)
            .single();

          if (!error && profile) {
            console.log('✅ Direct profile data loaded:', profile);
            setDirectProfileData(profile);
          }
        } catch (error) {
          console.warn('❌ Direct profile query failed:', error);
        }
      }
    };

    getDirectProfileData();
  }, [user, premiumLoading, useFallbackData]);

  // Use most reliable data source available
  const getEffectiveData = () => {
    // Priority: Direct profile data > Auth data > usePremium data
    if (directProfileData) {
      return {
        isPremium: directProfileData.subscription_tier === 'premium' ||
                  directProfileData.subscription_tier === 'monthly' ||
                  directProfileData.role === 'admin',
        subscriptionTier: directProfileData.subscription_tier,
        source: 'direct'
      };
    }

    if (useFallbackData || premiumLoading) {
      return {
        isPremium: authIsPremium,
        subscriptionTier: authSubscriptionTier,
        source: 'auth'
      };
    }

    return {
      isPremium: isPremium,
      subscriptionTier: userProfile?.subscription_tier || null,
      source: 'premium'
    };
  };

  const effectiveData = getEffectiveData();
  const effectiveIsPremium = effectiveData.isPremium;
  const effectiveSubscriptionTier = effectiveData.subscriptionTier;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Get fresh user data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to save your profile.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Saving profile for user:', authUser.email);

      const updateData: UserProfileData = {
        display_name: profileData.displayName,
        bio: profileData.bio,
        website: profileData.website,
        company: profileData.company,
        location: profileData.location
      };

      console.log('📝 Updating profile with data:', updateData);

      const result = await ProfileErrorHandler.safeUpdateProfile(updateData);

      if (result.success) {
        console.log('✅ Profile updated successfully');
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully!",
        });
      } else {
        console.error('❌ Profile update failed:', result.message);
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Profile save error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      console.log('🔄 Saving settings:', settings);

      const settingsData: ProfileUserSettings = {
        email_notifications: settings.emailNotifications,
        marketing_emails: settings.marketingEmails,
        weekly_reports: settings.weeklyReports,
        security_alerts: settings.securityAlerts
      };

      const result = await profileService.updateSettings(settingsData);

      if (result.success) {
        console.log('✅ Settings updated successfully');
        toast({
          title: "Settings Updated",
          description: "Your preferences have been saved successfully!",
        });
      } else {
        console.error('❌ Settings update failed:', result.message);
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Settings save error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderInfo = (providers: any) => {
    if (!providers || providers.length === 0) {
      return { name: 'Email', icon: '📧', color: 'bg-gray-500' };
    }

    const provider = providers[0];
    const providerMap = {
      google: { name: 'Google', icon: '🔍', color: 'bg-red-500' },
      facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
      linkedin_oidc: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
      twitter: { name: 'X (Twitter)', icon: '🐦', color: 'bg-black' },
    };

    return providerMap[provider] || { name: provider, icon: '🔐', color: 'bg-gray-500' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = () => {
    return profileData.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.photo_url;
  };

  const getRoleInfo = () => {
    if (isAdmin) return { name: 'Admin', color: 'bg-red-500', icon: <Shield className="h-3 w-3" /> };
    if (isPremium) return { name: 'Premium', color: 'bg-purple-500', icon: <Crown className="h-3 w-3" /> };
    return { name: 'Free', color: 'bg-gray-500', icon: <User className="h-3 w-3" /> };
  };

  // Initialize new email with current email when modal opens
  useEffect(() => {
    if (showUpdateEmail && user?.email) {
      setNewEmail(user.email);
    }
  }, [showUpdateEmail, user?.email]);

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "No Change",
        description: "Please enter a different email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email Update Requested",
        description: "Please check both your old and new email for confirmation links.",
      });

      setShowUpdateEmail(false);
      setNewEmail('');
    } catch (error: any) {
      console.error('Email update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  // If user is missing but we're not loading, show the interface anyway
  // (the user clicked Profile Settings from the dashboard, so they must be logged in)



  const providerInfo = getProviderInfo(user?.app_metadata?.providers);
  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl();
  const roleInfo = getRoleInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {(() => {
                  const email = user?.email || profileData.email;
                  console.log('Email display check:', { userEmail: user?.email, profileEmail: profileData.email, finalEmail: email });
                  return email || 'No email available';
                })()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-4 h-4 rounded-full ${providerInfo.color} flex items-center justify-center text-xs`}>
                  {providerInfo.icon}
                </div>
                <Badge variant="outline">
                  {providerInfo.name} Account
                </Badge>
                <Badge variant="default" className={`${roleInfo.color} text-white`}>
                  {roleInfo.icon}
                  {roleInfo.name}
                </Badge>
                {user?.email_confirmed_at ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different settings sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Account Created:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Sign In:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">User ID:</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 font-mono">
                    {user?.id || 'No ID available'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Authentication:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {providerInfo.name}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Security Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setShowUpdateEmail(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Update Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Always show content - no more infinite loading */}
              {(premiumLoading && !useFallbackData && !directProfileData && !authIsPremium) ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading subscription details...</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      setUseFallbackData(true);
                      if (refreshPremium) refreshPremium();
                    }}
                  >
                    Show Data Now
                  </Button>
                </div>
              ) : (
                <>
                  {effectiveData.source !== 'premium' && (
                    <div className={`p-3 border rounded-lg ${
                      effectiveData.source === 'direct' ? 'bg-blue-50 border-blue-200' :
                      effectiveData.source === 'auth' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <p className={`text-sm ${
                        effectiveData.source === 'direct' ? 'text-blue-800' :
                        effectiveData.source === 'auth' ? 'text-yellow-800' :
                        'text-gray-800'
                      }`}>
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {effectiveData.source === 'direct' && 'Using direct database query (premium service bypassed)'}
                        {effectiveData.source === 'auth' && 'Using cached authentication data (premium service unavailable)'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        You are currently on the {effectiveIsPremium ? 'Premium' : 'Free'} plan
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Subscription tier: {effectiveSubscriptionTier || 'Not set'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="default" className={`${effectiveIsPremium ? 'bg-purple-500' : 'bg-gray-500'} text-white`}>
                        {effectiveIsPremium ? <Crown className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {effectiveIsPremium ? 'Premium' : 'Free'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setUseFallbackData(false);
                          setDirectProfileData(null);
                          if (refreshPremium) await refreshPremium();
                          setTimeout(() => setUseFallbackData(true), 100);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Reload
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Blog Posts</span>
                          <span className="text-sm text-muted-foreground">
                            {useFallbackData ? (effectiveIsPremium ? 'Unlimited' : '3 max') : (userLimits.hasUnlimitedClaims ? 'Unlimited' : `${userLimits.maxClaimedPosts} max`)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Advanced SEO</span>
                          <span className="text-sm">
                            {(useFallbackData ? effectiveIsPremium : userLimits.hasAdvancedSEO) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Analytics</span>
                          <span className="text-sm">
                            {(useFallbackData ? effectiveIsPremium : userLimits.hasAdvancedAnalytics) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Priority Support</span>
                          <span className="text-sm">
                            {(useFallbackData ? effectiveIsPremium : userLimits.hasPrioritySupport) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!effectiveIsPremium && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Upgrade to Premium</span>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Unlock unlimited blog posts, advanced SEO tools, and priority support.
                      </p>
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={() => setShowPremiumCheckout(true)}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  )}

                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications about your account activity</p>
                  </div>
                  <Button
                    variant={settings.emailNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  >
                    {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                  </div>
                  <Button
                    variant={settings.marketingEmails ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                  >
                    {settings.marketingEmails ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Reports</h4>
                    <p className="text-sm text-muted-foreground">Get weekly summaries of your blog performance</p>
                  </div>
                  <Button
                    variant={settings.weeklyReports ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, weeklyReports: !prev.weeklyReports }))}
                  >
                    {settings.weeklyReports ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Alerts</h4>
                    <p className="text-sm text-muted-foreground">Important security notifications for your account</p>
                  </div>
                  <Button
                    variant={settings.securityAlerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, securityAlerts: !prev.securityAlerts }))}
                  >
                    {settings.securityAlerts ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PremiumCheckoutModal
        isOpen={showPremiumCheckout}
        onClose={() => setShowPremiumCheckout(false)}
        onSuccess={() => {
          setShowPremiumCheckout(false);
          refreshPremium(); // Refresh premium status
          toast({
            title: "Welcome to Premium!",
            description: "Your account has been upgraded successfully!",
          });
        }}
      />

      {/* Update Email Modal */}
      <Dialog open={showUpdateEmail} onOpenChange={setShowUpdateEmail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Email Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-email">Current Email</Label>
              <Input
                id="current-email"
                value={user?.email || 'No email available'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUpdateEmail(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateEmail}
                disabled={loading || !newEmail || newEmail === user?.email}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  'Update Email'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangePassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettings;
