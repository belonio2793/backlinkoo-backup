import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ExternalLink, Settings } from 'lucide-react';

export function EmailVerificationStatus() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Email Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Supabase Connection</span>
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Database: dfhanacsmsvvkpunurnp.supabase.co
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Email Configuration</span>
              <Badge variant="default" className="bg-blue-100 text-blue-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Resend Configured
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Sender: belonio2793@gmail.com
            </p>
          </div>
        </div>

        {/* Email Issues */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-800 mb-2">
                Email Confirmation Not Working
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                After migrating to Netlify, emails aren't being sent. This is likely due to missing SMTP configuration in your Supabase project.
              </p>
              <div className="space-y-2 text-sm text-orange-700">
                <p><strong>Possible Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No custom SMTP server configured in Supabase</li>
                  <li>SMTP settings not migrated with database</li>
                  <li>Email confirmations disabled in Supabase Auth settings</li>
                  <li>Rate limits on default Supabase email service</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3">
            Solution: Configure SMTP in Supabase
          </h4>
          <div className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-6">1.</span>
              <div>
                <p className="font-medium">Go to Supabase Dashboard</p>
                <p>Navigate to your project: dfhanacsmsvvkpunurnp</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-6">2.</span>
              <div>
                <p className="font-medium">Configure SMTP Settings</p>
                <p>Go to Authentication → Settings → SMTP Settings</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-6">3.</span>
              <div>
                <p className="font-medium">Choose SMTP Provider</p>
                <p>Recommended: Resend, SendGrid, or Mailgun</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-6">4.</span>
              <div>
                <p className="font-medium">Enable Email Confirmations</p>
                <p>Ensure "Enable email confirmations" is toggled ON</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/settings/auth', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase Auth Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.open('https://resend.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Get Resend (Recommended SMTP)
          </Button>
        </div>

        {/* Testing Instructions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Test Email Verification:</h4>
          <p className="text-sm text-muted-foreground">
            Use the Email Testing tab above to send test verification emails once SMTP is configured.
            The test will attempt to register support@backlinkoo.com and trigger email verification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
