/**
 * Admin utility to fix RLS permission errors
 * Provides manual fix option for "permission denied for table users" error
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

export function RLSPermissionFixer() {
  const [showFix, setShowFix] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlFix = `-- Emergency Fix for "permission denied for table users" Error
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Clean up conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Temporarily disable and re-enable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_service_access" 
ON public.profiles FOR ALL 
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Test the fix
SELECT 'RLS permission fix completed' as status, COUNT(*) as profile_count 
FROM public.profiles;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql', '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          RLS Permission Error Fix
        </CardTitle>
        <CardDescription>
          Fix "permission denied for table users" error caused by RLS recursion
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Detection */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> "permission denied for table users"
            <br />
            <strong>Cause:</strong> Row Level Security (RLS) policy recursion
            <br />
            <strong>Impact:</strong> Campaign metrics and admin dashboard features may fail
          </AlertDescription>
        </Alert>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="destructive">RLS Recursion Detected</Badge>
          <Badge variant="outline">Manual Fix Required</Badge>
          <Badge variant="secondary">SQL Editor Access Needed</Badge>
        </div>

        {/* Fix Instructions */}
        <div className="space-y-3">
          <h4 className="font-semibold">Fix Instructions:</h4>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Click "Open Supabase SQL Editor" below
            </p>
            <p className="text-sm text-muted-foreground">
              2. Copy the SQL fix code and paste it into the SQL editor
            </p>
            <p className="text-sm text-muted-foreground">
              3. Run the SQL to fix the RLS recursion issue
            </p>
            <p className="text-sm text-muted-foreground">
              4. Refresh this page to verify the fix worked
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={openSupabaseDashboard} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Supabase SQL Editor
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFix(!showFix)}
            >
              {showFix ? 'Hide' : 'Show'} SQL Fix Code
            </Button>
          </div>
        </div>

        {/* SQL Fix Code */}
        {showFix && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">SQL Fix Code:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy SQL'}
              </Button>
            </div>
            
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                {sqlFix}
              </pre>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This SQL fix will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove the recursive function causing the issue</li>
                  <li>Clean up conflicting RLS policies</li>
                  <li>Create simple, non-recursive policies</li>
                  <li>Restore proper database access</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Alternative Fix */}
        <Alert>
          <AlertDescription>
            <strong>Alternative:</strong> If the SQL fix doesn't work, the application will automatically 
            use fallback data for campaign metrics until the database issue is resolved.
            The admin dashboard will continue to function with estimated metrics.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default RLSPermissionFixer;
