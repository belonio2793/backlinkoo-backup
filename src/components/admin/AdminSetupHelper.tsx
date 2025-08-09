import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Database,
  User,
  Settings
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  solution?: string;
}

export default function AdminSetupHelper() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const results: DiagnosticResult[] = [];

      // Check 1: User authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        results.push({
          check: 'User Authentication',
          status: 'fail',
          message: 'No authenticated user found',
          solution: 'Please ensure you are logged in'
        });
        setDiagnostics(results);
        return;
      }

      setCurrentUser(user);
      results.push({
        check: 'User Authentication',
        status: 'pass',
        message: `Authenticated as ${user.email}`
      });

      // Check 2: Profile existence
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          results.push({
            check: 'User Profile',
            status: 'fail',
            message: `Profile not found: ${profileError.message}`,
            solution: 'Create a profile entry for this user'
          });
        } else {
          results.push({
            check: 'User Profile',
            status: 'pass',
            message: `Profile found with role: ${profile.role || 'not set'}`
          });

          // Check 3: Admin role
          if (profile.role === 'admin') {
            results.push({
              check: 'Admin Role',
              status: 'pass',
              message: 'User has admin role'
            });
          } else {
            results.push({
              check: 'Admin Role',
              status: 'fail',
              message: `Current role: ${profile.role || 'not set'}`,
              solution: 'Update role to "admin" in profiles table'
            });
          }
        }
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        results.push({
          check: 'Profile Access',
          status: 'fail',
          message: `Cannot access profile: ${errorMsg}`,
          solution: 'Check RLS policies for profiles table'
        });
      }

      // Check 4: Profiles table read access
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact', head: true });

        if (error) {
          results.push({
            check: 'Profiles Table Access',
            status: 'fail',
            message: `Cannot read profiles table: ${error.message}`,
            solution: 'Check RLS policies - admin users should be able to read all profiles'
          });
        } else {
          results.push({
            check: 'Profiles Table Access',
            status: 'pass',
            message: `Can access profiles table (${data || 0} total records)`
          });
        }
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        results.push({
          check: 'Profiles Table Access',
          status: 'fail',
          message: `Table access error: ${errorMsg}`,
          solution: 'Ensure profiles table exists and has proper RLS policies'
        });
      }

      // Check 5: Profiles table write access
      try {
        // Try a harmless update to test write permissions
        const { error } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          results.push({
            check: 'Profiles Table Write Access',
            status: 'warning',
            message: `Cannot update profiles: ${error.message}`,
            solution: 'Ensure RLS policies allow admin users to update profiles'
          });
        } else {
          results.push({
            check: 'Profiles Table Write Access',
            status: 'pass',
            message: 'Can update profiles table'
          });
        }
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        results.push({
          check: 'Profiles Table Write Access',
          status: 'warning',
          message: `Write access error: ${errorMsg}`,
          solution: 'Check RLS policies for UPDATE operations'
        });
      }

      setDiagnostics(results);

    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || 'Unknown diagnostic error';
      toast({
        title: "Diagnostic Failed",
        description: errorMsg,
        variant: "destructive"
      });
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async () => {
    if (!currentUser) {
      toast({
        title: "No User",
        description: "No authenticated user found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Try to update current user to admin
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (error) {
        throw new Error(`Failed to update role: ${error.message}`);
      }

      toast({
        title: "Admin Role Applied",
        description: "Successfully updated your role to admin. Refresh the page to see changes.",
      });

      // Re-run diagnostics
      await runDiagnostics();

    } catch (error: any) {
      toast({
        title: "Failed to Set Admin Role",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">UNKNOWN</Badge>;
    }
  };

  const hasFailures = diagnostics.some(d => d.status === 'fail');
  const allPassed = diagnostics.length > 0 && diagnostics.every(d => d.status === 'pass');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Setup Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allPassed && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              ✅ All checks passed! Your admin setup is working correctly.
            </AlertDescription>
          </Alert>
        )}

        {hasFailures && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Some checks failed. User management may not work properly until these issues are resolved.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={runDiagnostics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          
          {currentUser && (
            <Button onClick={makeAdmin} variant="outline" size="sm" disabled={loading}>
              <User className="h-4 w-4 mr-2" />
              Make Me Admin
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(result.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{result.check}</h4>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                {result.solution && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    💡 <strong>Solution:</strong> {result.solution}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {diagnostics.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Click "Run Diagnostics" to check your admin setup</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
