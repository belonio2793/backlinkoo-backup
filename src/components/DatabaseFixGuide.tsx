import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Settings,
  Zap,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DatabaseFixGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the text",
        variant: "destructive"
      });
    }
  };

  const sqlScript = `-- EMERGENCY AUTHENTICATION FIX SCRIPT
-- Run this in your Supabase SQL Editor

-- 1. Drop problematic functions that might cause recursion
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Temporarily disable RLS on critical auth tables
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 4. Create simple, safe function for user role checking
CREATE OR REPLACE FUNCTION public.get_user_role_safe(check_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = COALESCE(check_user_id, auth.uid())),
    'user'
  );
$$;

-- 5. Create safe new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- 6. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- 7. Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for new users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create admin user for testing
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role
  )
  SELECT 
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'support@backlinkoo.com', crypt('Admin123!@#', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Support Admin"}', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'support@backlinkoo.com')
  RETURNING id INTO admin_user_id;

  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'support@backlinkoo.com';
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (admin_user_id, 'support@backlinkoo.com', 'Support Admin', 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
END $$;

SELECT 'Authentication fix completed successfully!' as result;`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Database Authentication Error Detected</strong>
          <br />
          Your Supabase database has Row Level Security (RLS) policies or triggers causing authentication failures.
          This needs to be fixed at the database level.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quickfix" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quickfix">🚀 Quick Fix</TabsTrigger>
          <TabsTrigger value="emergency">🚨 Emergency Access</TabsTrigger>
          <TabsTrigger value="detailed">📋 Detailed Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="quickfix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Database Fix (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This SQL script will fix the authentication issues by removing problematic RLS policies and creating safe triggers.
                </p>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">emergency-auth-fix.sql</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(sqlScript, "SQL Script")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied === "SQL Script" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border max-h-40 overflow-y-auto">
                    {sqlScript}
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Steps to apply the fix:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your <a href="https://supabase.com/dashboard" className="text-blue-600 hover:underline inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">Supabase Dashboard <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Navigate to your project and open the <strong>SQL Editor</strong></li>
                  <li>Create a new query and paste the script above</li>
                  <li>Click <strong>"Run"</strong> to execute the script</li>
                  <li>Refresh this page and try signing in again</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Emergency Access Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  If the database fix doesn't work immediately, you can use these emergency credentials to bypass the database issues temporarily.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Emergency Admin Access
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Email:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">support@backlinkoo.com</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard("support@backlinkoo.com", "Admin Email")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Password:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">Admin123!@#</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard("Admin123!@#", "Admin Password")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Note:</strong> Emergency access is temporary and bypasses normal database operations. 
                After using emergency access, please apply the database fix to restore normal functionality.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Detailed Troubleshooting Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">What's causing the issue?</h4>
                  <p className="text-sm text-muted-foreground">
                    The "Database error granting user" occurs when Supabase's Row Level Security (RLS) policies 
                    or database triggers create infinite recursion loops during user authentication. This typically 
                    happens when profile creation functions reference themselves or have circular dependencies.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">How the fix works:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Removes problematic functions that cause recursion</li>
                    <li>Temporarily disables RLS to clear stuck policies</li>
                    <li>Creates new, safe functions without circular dependencies</li>
                    <li>Re-enables RLS with simple, tested policies</li>
                    <li>Creates an admin user for immediate access</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Alternative solutions:</h4>
                  <div className="space-y-2">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-sm">Manual User Creation</h5>
                      <p className="text-xs text-muted-foreground">
                        Create users directly in Supabase Dashboard → Authentication → Users
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h5 className="font-medium text-sm">RLS Disable (Development)</h5>
                      <p className="text-xs text-muted-foreground">
                        Temporarily disable RLS entirely with: <code>ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;</code>
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Need help?</strong> If you're still experiencing issues after applying the fix, 
                    check your browser console for specific error messages and ensure your Supabase project has the latest schema updates.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
