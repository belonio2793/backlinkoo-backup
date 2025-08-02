import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  Users,
  Wrench
} from 'lucide-react';
import { UserRegistrationService } from '@/services/userRegistrationService';
import { supabase } from '@/integrations/supabase/client';

export function UserRegistrationDiagnostic() {
  const [isTestingRegistration, setIsTestingRegistration] = useState(false);
  const [isTestingSchema, setIsTestingSchema] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const { toast } = useToast();

  const testRegistration = async () => {
    try {
      setIsTestingRegistration(true);
      setRegistrationResult(null);

      console.log('🧪 Testing user registration system...');

      const result = await UserRegistrationService.testRegistration();
      setRegistrationResult(result);

      if (result.success) {
        toast({
          title: "Registration Test Passed",
          description: "User registration is working properly",
        });
      } else {
        toast({
          title: "Registration Test Failed", 
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Registration test failed:', error);
      setRegistrationResult({
        success: false,
        error: error.message
      });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingRegistration(false);
    }
  };

  const testDatabaseSchema = async () => {
    try {
      setIsTestingSchema(true);
      setSchemaResult(null);

      console.log('🔍 Testing database schema...');

      const results = {
        profiles: null as any,
        userRoles: null as any,
        credits: null as any
      };

      // Test profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, role')
          .limit(1);
        
        results.profiles = {
          accessible: !error,
          error: error?.message,
          hasRoleColumn: data && data.length > 0 && 'role' in data[0]
        };
      } catch (error: any) {
        results.profiles = {
          accessible: false,
          error: error.message
        };
      }

      // Test user_roles table
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .limit(1);
        
        results.userRoles = {
          accessible: !error,
          error: error?.message
        };
      } catch (error: any) {
        results.userRoles = {
          accessible: false,
          error: error.message
        };
      }

      // Test credits table
      try {
        const { data, error } = await supabase
          .from('credits')
          .select('user_id, amount')
          .limit(1);
        
        results.credits = {
          accessible: !error,
          error: error?.message
        };
      } catch (error: any) {
        results.credits = {
          accessible: false,
          error: error.message
        };
      }

      setSchemaResult(results);

      const issues = [];
      if (!results.profiles.accessible) issues.push('profiles table');
      if (!results.userRoles.accessible) issues.push('user_roles table');
      if (!results.credits.accessible) issues.push('credits table');

      if (issues.length > 0) {
        toast({
          title: "Schema Issues Found",
          description: `Problems with: ${issues.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Schema Check Passed",
          description: "All required tables are accessible",
        });
      }

    } catch (error: any) {
      console.error('Schema test failed:', error);
      setSchemaResult({
        error: error.message
      });
      toast({
        title: "Schema Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingSchema(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            User Registration Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Use these tools to diagnose and fix "Database error saving new user" issues.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button
                onClick={testDatabaseSchema}
                disabled={isTestingSchema}
                className="w-full"
                variant="outline"
              >
                {isTestingSchema ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Test Database Schema
              </Button>
              
              <Button
                onClick={testRegistration}
                disabled={isTestingRegistration}
                className="w-full"
              >
                {isTestingRegistration ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Test User Registration
              </Button>
            </div>

            <div className="space-y-2">
              <Alert>
                <Wrench className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common Issue:</strong> The signup trigger function may be trying to insert into a non-existent user_roles table. 
                  We've enhanced the registration to handle this automatically.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Schema Test Results */}
          {schemaResult && (
            <div className="space-y-3">
              <h4 className="font-medium">Database Schema Results:</h4>
              
              {schemaResult.profiles && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>Profiles Table</span>
                  <div className="flex items-center gap-2">
                    {schemaResult.profiles.accessible ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accessible
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {schemaResult.userRoles && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>User Roles Table</span>
                  <div className="flex items-center gap-2">
                    {schemaResult.userRoles.accessible ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accessible
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {schemaResult.credits && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>Credits Table</span>
                  <div className="flex items-center gap-2">
                    {schemaResult.credits.accessible ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accessible
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!schemaResult.userRoles?.accessible && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Likely Issue Found:</strong> The user_roles table is not accessible. 
                    This is probably what's causing the "Database error saving new user" message. 
                    Our enhanced registration service handles this automatically by using the role column in the profiles table instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Registration Test Results */}
          {registrationResult && (
            <div className="space-y-3">
              <h4 className="font-medium">Registration Test Results:</h4>
              
              {registrationResult.success ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    ✅ User registration is working properly! The signup issue should be resolved.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Registration Test Failed:</strong> {registrationResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-900 mb-2">How the Fix Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enhanced registration service bypasses problematic database triggers</li>
              <li>• Creates user profiles manually if the trigger fails</li>
              <li>• Uses the profiles.role column instead of separate user_roles table</li>
              <li>• Gracefully handles missing tables (like credits)</li>
              <li>• Provides detailed error logging for troubleshooting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
