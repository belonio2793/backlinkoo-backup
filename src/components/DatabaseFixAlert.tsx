import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DatabaseFixAlert() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- SIMPLE DATABASE FIX FOR AUTHENTICATION ISSUES
-- Run this in your Supabase SQL Editor

-- 1. Remove problematic functions
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Temporarily disable RLS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- 4. Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        'user'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;

-- 5. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_simple();

-- 6. Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Grant permissions
GRANT ALL ON public.profiles TO authenticated, anon;

SELECT 'Authentication fix completed!' as result;`;

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      toast({
        title: "SQL Script Copied!",
        description: "Paste this into your Supabase SQL Editor and run it.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the SQL script below.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Alert className="border-red-200 bg-red-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <div className="font-semibold">Database Configuration Required</div>
            <div>Your Supabase database has Row Level Security issues preventing authentication. This requires a simple SQL fix.</div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Quick Database Fix
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? 'Hide' : 'Show'} Instructions
            </Button>
          </CardTitle>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Step-by-step fix:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
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
                <li>Navigate to your project and open <strong>SQL Editor</strong></li>
                <li>Create a new query and paste the script below</li>
                <li>Click <strong>"Run"</strong> to execute the fix</li>
                <li>Refresh this page and try signing in again</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">fix-database-auth.sql</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyScript}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy SQL
                </Button>
              </div>
              
              <div className="bg-gray-100 border rounded-lg">
                <pre className="text-xs p-3 overflow-x-auto max-h-60 overflow-y-auto">
                  <code>{sqlScript}</code>
                </pre>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>What this does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Removes problematic RLS policies causing recursion</li>
                <li>Creates a simple, safe user profile trigger</li>
                <li>Re-enables security with basic policies</li>
                <li>Allows normal authentication to work for all users</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="mt-4 text-center">
        <Button
          variant="outline"
          asChild
        >
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Open Supabase Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
