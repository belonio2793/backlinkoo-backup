import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Settings, 
  Edit, 
  Eye, 
  EyeOff, 
  Mail, 
  Calendar,
  Shield,
  Key,
  UserCircle,
  Save,
  X
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSettingsProps {
  user: SupabaseUser;
  userType: 'user' | 'admin';
  onUserUpdate?: (updatedUser: any) => void;
}

export function ProfileSettings({ user, userType, onUserUpdate }: ProfileSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    website: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      loadUserProfile();
    }
  }, [user, isOpen]);

  const loadUserProfile = async () => {
    try {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');
      
      if (isDev) {
        // Mock profile data for development
        setProfile({
          firstName: user.user_metadata?.first_name || 'Dev',
          lastName: user.user_metadata?.last_name || 'User',
          displayName: user.user_metadata?.display_name || 'Dev User',
          bio: 'Development user profile',
          website: 'https://example.com',
          phone: '+1-555-0123',
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          displayName: data.display_name || '',
          bio: data.bio || '',
          website: data.website || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');
      
      if (isDev) {
        // Mock save for development
        toast({
          title: "Profile updated! (Development Mode)",
          description: "Profile changes are simulated in development.",
        });
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          display_name: profile.displayName,
          bio: profile.bio,
          website: profile.website,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      
      setIsEditing(false);
      if (onUserUpdate) onUserUpdate({ ...user, user_metadata: { ...user.user_metadata, display_name: profile.displayName } });
      
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');
      
      if (isDev) {
        toast({
          title: "Password updated! (Development Mode)",
          description: "Password changes are simulated in development.",
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully!",
        description: "Your password has been changed.",
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile.displayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';

  // Safety check - if no user provided, don't render
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3">
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs sm:text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </div>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details and personal information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{displayName}</h3>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    <div className="flex gap-2">
                      <Badge variant={userType === 'admin' ? 'default' : 'secondary'}>
                        <Shield className="h-3 w-3 mr-1" />
                        {userType === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProfileSave}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
                <CardDescription>
                  View your account details and membership status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{userEmail}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{userType}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{user.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Password & Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter your new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
