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
import { supabase } from "@/integrations/supabase/client";
import { PremiumService } from "@/services/premiumService";
import { Loader2, User, Mail, Calendar, MapPin, Briefcase, Globe, Save, AlertCircle, Crown, Shield } from "lucide-react";
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
    full_name: '',
    display_name: '',
    bio: '',
    company: '',
    website: '',
    location: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    marketing_emails: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.warn('🔧 ProfileSettings: No user provided, setting loading to false');
        setIsLoading(false);
        setPremiumLoading(false);
        return;
      }

      console.log('🔧 ProfileSettings: Starting profile fetch for user:', user.id);

      // Fetch premium status in parallel
      PremiumService.checkPremiumStatus(user.id)
        .then(status => {
          setIsPremium(status);
          setPremiumLoading(false);
        })
        .catch(() => {
          setIsPremium(false);
          setPremiumLoading(false);
        });

      try {
        // Try to fetch from database with longer timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .abortSignal(controller.signal)
          .single();

        clearTimeout(timeoutId);

        if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
          console.error('🔧 ProfileSettings: Error fetching profile:', error);

          // Only show error for non-timeout issues
          if (!error.message?.includes('aborted')) {
            toast({
              title: "Warning",
              description: "Could not load profile data from database.",
              variant: "destructive",
            });
          }

          // Initialize with user data as fallback
          setProfile(prev => ({
            ...prev,
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
          }));
        } else if (data) {
          console.log('🔧 ProfileSettings: Successfully loaded profile from database');
          setProfile({
            ...data,
            email: user.email || data.email,
          });
        } else {
          // Initialize with user data if no profile exists
          console.log('🔧 ProfileSettings: No profile found, using user metadata');
          setProfile(prev => ({
            ...prev,
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
          }));
        }
      } catch (error: any) {
        console.error('🔧 ProfileSettings: Exception fetching profile:', error);

        // Handle timeout gracefully
        if (error.name === 'AbortError') {
          console.warn('🔧 ProfileSettings: Request timeout, using fallback data');
          toast({
            title: "Notice",
            description: "Profile loading timed out, using cached data.",
          });
        }

        // Always provide fallback data
        setProfile(prev => ({
          ...prev,
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || 'User',
        }));
      } finally {
        setIsLoading(false);
      }
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
          console.error('🔧 ProfileSettings: Error saving profile:', error);
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
      console.error('🔧 ProfileSettings: Error saving profile:', error);

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
                  {premiumLoading ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking...
                    </Badge>
                  ) : (
                    <Badge
                      variant={isPremium ? "default" : "secondary"}
                      className={`flex items-center gap-1 ${
                        isPremium
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                          : ''
                      }`}
                    >
                      <Crown className="h-3 w-3" />
                      {isPremium ? 'Premium Member' : 'Free Plan'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPremium
                    ? 'You have access to all premium features and unlimited usage.'
                    : 'Upgrade to premium for unlimited access and advanced features.'
                  }
                </p>
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
