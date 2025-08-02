import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { realAdminUserService } from '@/services/realAdminUserService';
import { useToast } from '@/hooks/use-toast';
import { Database, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function DatabaseTestComponent() {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    profileCount: number;
    error?: string;
  } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const { toast } = useToast();

  const testConnection = async () => {
    try {
      setTesting(true);
      console.log('🔍 Testing database connection...');
      
      const result = await realAdminUserService.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        toast({
          title: "Database Connected!",
          description: `Successfully connected! Found ${result.profileCount} user profiles.`,
        });
        
        // If connected, try to fetch some profiles
        try {
          const profilesResult = await realAdminUserService.getAllProfiles();
          setProfiles(profilesResult.slice(0, 5)); // Show first 5 profiles
          console.log('✅ Sample profiles fetched:', profilesResult.length);
        } catch (error: any) {
          console.warn('⚠️ Could not fetch profiles:', error.message);
        }
      } else {
        toast({
          title: "Database Connection Failed",
          description: result.error || "Unable to connect to database",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus({
        connected: false,
        profileCount: 0,
        error: error.message
      });
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Test the connection to your Supabase database and verify user profile access.
            </p>
          </div>
          <Button onClick={testConnection} disabled={testing}>
            {testing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>

        {connectionStatus && (
          <div className={`p-4 rounded-lg border ${
            connectionStatus.connected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {connectionStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  connectionStatus.connected ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionStatus.connected ? 'Database Connected' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${
                  connectionStatus.connected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionStatus.connected 
                    ? `Found ${connectionStatus.profileCount} user profiles in database`
                    : connectionStatus.error || 'Unknown error occurred'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Sample User Profiles (First 5)</p>
            </div>
            <div className="space-y-2">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{profile.display_name || 'No Name'}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={profile.role === 'admin' ? 'destructive' : 'outline'}>
                      {profile.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
