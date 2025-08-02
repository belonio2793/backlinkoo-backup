import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, KeyIcon, ServerIcon, AlertTriangle } from 'lucide-react';

export function UserCreationSetupGuide() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5" />
          User Creation Setup Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            To create users through the admin interface, you need to configure the Supabase Service Role Key in your Netlify environment variables.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Required Environment Variables</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Service role key from your Supabase project settings
                  </p>
                </div>
                <Badge variant="destructive">Required</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">VITE_SUPABASE_URL</code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Supabase project URL (should already be configured)
                  </p>
                </div>
                <Badge variant="outline">Existing</Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Setup Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Get Service Role Key:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Settings → API</li>
                  <li>Copy the "service_role" key (not the anon key)</li>
                </ul>
              </li>
              
              <li>
                <strong>Add to Netlify Environment:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Go to your Netlify site dashboard</li>
                  <li>Navigate to Site settings → Environment variables</li>
                  <li>Add key: <code>SUPABASE_SERVICE_ROLE_KEY</code></li>
                  <li>Add the service role key as the value</li>
                </ul>
              </li>
              
              <li>
                <strong>Redeploy:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Deploy your site again to pick up the new environment variable</li>
                  <li>The user creation feature will then be fully functional</li>
                </ul>
              </li>
            </ol>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Warning:</strong> The service role key has full access to your database. 
              Only add it to trusted environments and never expose it in client-side code.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ServerIcon className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">How It Works</span>
            </div>
            <p className="text-sm text-blue-700">
              User creation uses a Netlify serverless function that runs with admin privileges. 
              This ensures secure user creation while maintaining proper access controls.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
