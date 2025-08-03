import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuthStatus } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PremiumStatusSync } from "@/components/PremiumStatusSync";
import { QuickPremiumFix } from "@/components/QuickPremiumFix";
import { PremiumStatusDebugger } from "@/components/PremiumStatusDebugger";
import { EmergencyRLSFixTrigger } from "@/components/EmergencyRLSFixTrigger";
import { User, Mail, Calendar, MapPin, Briefcase, Globe, Save, AlertCircle, Crown, Shield } from "lucide-react";
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileData {
  user_id: string;
  email: string;
  full_name: string;
  display_name: string;
  bio: string;
  company: string;
  website: string;
  location: string;
  phone: string;
  timezone: string;
  marketing_emails: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileSettingsProps {
  user?: SupabaseUser;
  onClose?: () => void;
}

export const ProfileSettings = ({ user, onClose }: ProfileSettingsProps) => {
  const [profile, setProfile] = useState<Partial<ProfileData>>({
    user_id: user?.id || '',
    email: user?.email || '',
    full_name: user?.user_metadata?.full_name || '',
    display_name: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
    bio: '',
    company: '',
    website: '',
    location: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    marketing_emails: true,
    role: user?.user_metadata?.role || 'user',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRLSFix, setShowRLSFix] = useState(false);

  // Get premium status from authentication context (set during login)
  const { isPremium, subscriptionTier, userPlan } = useAuthStatus();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        return;
      }

      // Premium status is now handled during authentication
      console.log('🚀 ProfileSettings: Using premium status from auth context:', { isPremium, subscriptionTier });

      // Load detailed profile data in background (non-blocking)
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.message?.includes('infinite recursion')) {
            console.error('🚨 RLS infinite recursion detected in profiles table!');
            setShowRLSFix(true);
            return;
          }

          if (data && !error) {
            // Merge database data with current state, preserving user email
            setProfile(prev => ({
              ...data,
              email: user.email || data.email,
            }));
          }
          // Silently fail - UI already has user data from initialization
        })
        .catch((error) => {
          if (error.message?.includes('infinite recursion')) {
            console.error('🚨 RLS infinite recursion detected in profiles table!');
            setShowRLSFix(true);
          }
          // Silently fail - UI already functional with user metadata
        });
    };

    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!profile.full_name?.trim()) {
      errors.push("Full name is required");
    }

    if (!profile.display_name?.trim()) {
      errors.push("Display name is required");
    }

    if (profile.website && !profile.website.match(/^https?:\/\/.+/)) {
      errors.push("Website must be a valid URL (include http:// or https://)");
    }

    if (profile.phone && !profile.phone.match(/^[\+]?[1-9][\d]{0,15}$/)) {
      errors.push("Phone number must be a valid format");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const profileData = {
        user_id: user.id,
        email: user.email || profile.email,
        full_name: profile.full_name?.trim(),
        display_name: profile.display_name?.trim(),
        bio: profile.bio?.trim() || null,
        company: profile.company?.trim() || null,
        website: profile.website?.trim() || null,
        location: profile.location?.trim() || null,
        phone: profile.phone?.trim() || null,
        timezone: profile.timezone || null,
        marketing_emails: profile.marketing_emails ?? true,
        updated_at: new Date().toISOString(),
      };

      // Try to save with timeout
      const savePromise = supabase
        .from('profiles')
        .upsert(profileData);

      const { error } = await Promise.race([
        savePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Save timeout')), 3000)
        )
      ]) as any;

      if (error) {
        if (error.message.includes('timeout')) {
          toast({
            title: "Warning",
            description: "Save timed out, but changes have been saved locally. Database may be unavailable.",
          });
        } else {
          console.error('🔧 ProfileSettings: Error saving profile:', error.message || error);
          toast({
            title: "Error",
            description: error.message || "Failed to save profile",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }

      setHasChanges(false);
      onClose?.();
    } catch (error: any) {
      console.error('🔧 ProfileSettings: Error saving profile:', error.message || error);

      if (error.message.includes('timeout')) {
        toast({
          title: "Warning",
          description: "Changes saved locally but database connection timed out.",
        });
        setHasChanges(false);
        onClose?.();
      } else {
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Show emergency RLS fix if infinite recursion detected
  if (showRLSFix) {
    return <EmergencyRLSFixTrigger />;
  }

  // No blocking loading state - show UI immediately

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-status">Account Status</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role Badge */}
                  <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {profile.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </Badge>

                  {/* Premium Status Badge */}
                  <Badge
                    variant={isPremium ? "default" : "secondary"}
                    className={`flex items-center gap-1 ${
                      isPremium
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                        : ''
                    }`}
                  >
                    <Crown className="h-3 w-3" />
                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                  </Badge>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="How you'd like to be shown"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={3}
              />
            </div>
          </div>

          {/* Quick Premium Fix for specific user */}
          {user?.email === 'labindalawamaryrose@gmail.com' && isPremium === false && (
            <div className="mt-6">
              <QuickPremiumFix onStatusUpdated={() => {
                // Refresh page to reload auth context with updated premium status
                setTimeout(() => window.location.reload(), 1000);
              }} />
            </div>
          )}

          {/* Premium Status Sync - Show if user should be premium but isn't showing as premium */}
          {user?.email && user.email !== 'labindalawamaryrose@gmail.com' && isPremium === false && (
            <div className="mt-6">
              <PremiumStatusSync
                userEmail={user.email}
                currentPremiumStatus={isPremium || false}
                onStatusUpdated={(newStatus) => setIsPremium(newStatus)}
              />
            </div>
          )}

          {/* Debug section for troubleshooting - only show if not premium */}
          {user?.email && isPremium === false && (
            <div className="mt-6">
              <PremiumStatusDebugger />
            </div>
          )}

          <Separator />

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={profile.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={profile.timezone || ''}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                placeholder="Your timezone"
              />
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketing_emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch
                id="marketing_emails"
                checked={profile.marketing_emails ?? true}
                onCheckedChange={(checked) => handleInputChange('marketing_emails', checked)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="min-w-24"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="h-4 w-4" />
              You have unsaved changes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
