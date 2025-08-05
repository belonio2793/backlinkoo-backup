import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const UserProfile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { user } = await AuthService.getCurrentSession();
        setUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      // Do actual sign out first
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
      }

      // Navigate after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Still navigate even if sign out fails
      window.location.href = '/';
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

  const getDisplayName = (user: SupabaseUser) => {
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.display_name ||
           user.user_metadata?.first_name ||
           user.email?.split('@')[0] ||
           'User';
  };

  const getAvatarUrl = (user: SupabaseUser) => {
    return user.user_metadata?.avatar_url || 
           user.user_metadata?.picture ||
           user.user_metadata?.photo_url;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No user logged in
          </div>
        </CardContent>
      </Card>
    );
  }

  const providerInfo = getProviderInfo(user.app_metadata?.providers);
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{displayName}</h3>
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

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* User Metadata */}
        {Object.keys(user.user_metadata || {}).length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Social Profile Data
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(user.user_metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* App Metadata */}
        {Object.keys(user.app_metadata || {}).length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              App Metadata
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(user.app_metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
