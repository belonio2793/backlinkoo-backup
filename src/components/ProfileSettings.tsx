import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { userService, UserProfile } from '@/services/userService';
import { profileService, UserProfileData, UserSettings as ProfileUserSettings } from '@/services/profileService';
import { ProfileErrorDebugger } from '@/utils/profileErrorDebugger';
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
  const { user, isLoading: authLoading } = useAuth();
  const { userProfile, isPremium, isAdmin, userLimits, loading: premiumLoading, refresh: refreshPremium } = usePremium();

  // Debug logging
  console.log('ProfileSettings render:', {
    user: user ? { email: user.email, id: user.id } : null,
    authLoading,
    loading,
    hasUserProfile: !!userProfile
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Ensure profile exists in database
        await profileService.ensureProfileExists();

        // Load profile data from database
        const profile = await profileService.getUserProfile();
        const userSettings = await profileService.getUserSettings();

        setProfileData({
          displayName: profile?.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          bio: profile?.bio || user.user_metadata?.bio || '',
          website: profile?.website || user.user_metadata?.website || '',
          company: profile?.company || user.user_metadata?.company || '',
          location: profile?.location || user.user_metadata?.location || ''
        });

        setSettings({
          emailNotifications: userSettings.email_notifications ?? true,
          marketingEmails: userSettings.marketing_emails ?? false,
          weeklyReports: userSettings.weekly_reports ?? true,
          securityAlerts: userSettings.security_alerts ?? true
        });
      } catch (error: any) {
        console.error('Error loading profile data:', error);

        // Run debug check if we get a permission error
        if (error.message && error.message.includes('permission denied for table users')) {
          console.log('🔍 Running profile error debugger...');
          ProfileErrorDebugger.testProfileOperations();
        }

        toast({
          title: "Loading Error",
          description: "Failed to load profile data. Using defaults.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData: UserProfileData = {
        display_name: profileData.displayName,
        bio: profileData.bio,
        website: profileData.website,
        company: profileData.company,
        location: profileData.location
      };

      const result = await profileService.updateProfile(updateData);

      if (result.success) {
        toast({
          title: "Profile Updated",
          description: result.message,
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
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
      const settingsData: ProfileUserSettings = {
        email_notifications: settings.emailNotifications,
        marketing_emails: settings.marketingEmails,
        weekly_reports: settings.weeklyReports,
        security_alerts: settings.securityAlerts
      };

      const result = await profileService.updateSettings(settingsData);

      if (result.success) {
        toast({
          title: "Settings Updated",
          description: result.message,
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
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

  // Show loading if auth is still checking or user not loaded yet
  if (authLoading || (!user && loading)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="text-muted-foreground">Loading profile settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please log in to view your profile settings.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="text-muted-foreground">Loading profile settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const providerInfo = getProviderInfo(user.app_metadata?.providers);
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
                {user.email}
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
                {user.email_confirmed_at ? (
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
                    {formatDate(user.created_at)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Sign In:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">User ID:</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 font-mono">
                    {user.id}
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
                  <Button variant="outline" className="justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="justify-start">
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
              {premiumLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        You are currently on the {isPremium ? 'Premium' : 'Free'} plan
                      </p>
                    </div>
                    <Badge variant="default" className={`${roleInfo.color} text-white`}>
                      {roleInfo.icon}
                      {roleInfo.name}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Blog Posts</span>
                          <span className="text-sm text-muted-foreground">
                            {userLimits.hasUnlimitedClaims ? 'Unlimited' : `${userLimits.maxClaimedPosts} max`}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Advanced SEO</span>
                          <span className="text-sm">
                            {userLimits.hasAdvancedSEO ? (
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
                            {userLimits.hasAdvancedAnalytics ? (
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
                            {userLimits.hasPrioritySupport ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isPremium && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Upgrade to Premium</span>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Unlock unlimited blog posts, advanced SEO tools, and priority support.
                      </p>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
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
    </div>
  );
};

export default ProfileSettings;
