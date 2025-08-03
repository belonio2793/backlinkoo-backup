import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  Copy,
  CheckCircle,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DatabaseGrantingUserFix() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sqlFix = `-- FIX FOR "Database error granting user" ISSUE
-- Run this in your Supabase SQL Editor

-- 1. Drop problematic functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Temporarily disable RLS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Grant permissions
GRANT ALL ON public.profiles TO authenticated, anon, service_role;

-- 5. Create safe trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;

-- 6. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_safe();

-- 7. Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

SELECT '✅ Database error granting user fix completed!' AS result;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlFix);
      setCopied(true);
      toast({
        title: "SQL Fix Copied!",
        description: "Paste this into your Supabase SQL Editor and run it.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the SQL script.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Alert className="border-red-200 bg-red-50 mb-6">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <div className="font-semibold">🚨 Specific Error Detected: "Database error granting user"</div>
            <div>This error occurs when Supabase Auth cannot create user profiles due to database trigger or RLS policy issues.</div>
          </div>
        </AlertDescription>
      </Alert>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-red-500" />
            Immediate Fix Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Critical Database Issue</h4>
                <p className="text-sm text-yellow-700">
                  Your Supabase database has a configuration problem that's preventing all user sign-ins. 
                  This must be fixed at the database level using SQL commands.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              Step-by-Step Fix:
            </h4>
            
            <ol className="list-decimal list-inside space-y-2 text-sm pl-4">
              <li>
                Go to your{' '}
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Open the <strong>SQL Editor</strong> (left sidebar)</li>
              <li>Create a new query and paste the fix script below</li>
              <li>Click <strong>"Run"</strong> to execute the fix</li>
              <li>Wait for confirmation message</li>
              <li>Refresh this page and try signing in again</li>
            </ol>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="destructive">Critical Fix Required</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Copied!" : "Copy SQL Fix"}
              </Button>
            </div>
            
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-60 overflow-y-auto">
              <code>{sqlFix}</code>
            </pre>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>What this fix does:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Removes the broken database function causing the error</li>
                <li>Creates a safe user profile creation trigger</li>
                <li>Fixes RLS policies that are blocking authentication</li>
                <li>Grants proper permissions for user sign-in</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="text-center space-y-3">
        <Button
          size="lg"
          asChild
          className="bg-blue-600 hover:bg-blue-700"
        >
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            <Database className="h-5 w-5" />
            Open Supabase Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          After running the fix, sign-in should work immediately for all users.
        </p>
      </div>
    </div>
  );
}
