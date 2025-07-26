import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mail, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

export const SupabaseEmailGuide = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Supabase Email Configuration Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Steps to ensure your Supabase email system is properly configured with Resend SMTP.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Implementation Status */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Current Implementation Status
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✅ Removed custom Resend API integration</li>
            <li>✅ Simplified to use only Supabase's built-in email system</li>
            <li>✅ Signup flow now relies on Supabase SMTP configuration</li>
            <li>✅ Resend confirmation uses Supabase resend functionality</li>
          </ul>
        </div>

        {/* Required Supabase Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Required Supabase Dashboard Configuration:</h3>
          
          <div className="grid gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Step 1</span>
                  SMTP Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  Configure Resend SMTP in your Supabase dashboard:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Go to Supabase Dashboard → Authentication → Settings</li>
                  <li>• Navigate to "SMTP Settings"</li>
                  <li>• Configure Resend SMTP:</li>
                  <li className="ml-4">- Host: <code className="bg-gray-100 px-1 rounded">smtp.resend.com</code></li>
                  <li className="ml-4">- Port: <code className="bg-gray-100 px-1 rounded">465</code> (SSL) or <code className="bg-gray-100 px-1 rounded">587</code> (TLS)</li>
                  <li className="ml-4">- Username: <code className="bg-gray-100 px-1 rounded">resend</code></li>
                  <li className="ml-4">- Password: Your Resend API key</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Step 2</span>
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  Customize email templates in Supabase:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Go to Authentication → Email Templates</li>
                  <li>• Configure templates for:</li>
                  <li className="ml-4">- Confirm signup</li>
                  <li className="ml-4">- Reset password</li>
                  <li className="ml-4">- Change email address</li>
                  <li>• Use your custom branding and styling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Step 3</span>
                  Site URL Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  Ensure proper redirect URLs are configured:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Go to Authentication → URL Configuration</li>
                  <li>• Set Site URL: <code className="bg-gray-100 px-1 rounded">https://backlinkoo.com</code></li>
                  <li>• Add Redirect URLs:</li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1 rounded">https://backlinkoo.com/auth/confirm</code></li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1 rounded">https://backlinkoo.com/auth/reset-password</code></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Testing Your Configuration
          </h3>
          <ol className="text-sm text-blue-700 space-y-2">
            <li><strong>1. Use the Test Tool Above:</strong> Run the "Supabase Email System Test" with a real email address</li>
            <li><strong>2. Check Email Delivery:</strong> Verify emails arrive in inbox (check spam folder too)</li>
            <li><strong>3. Test Complete Flow:</strong> Try signing up with a new email and confirming the account</li>
            <li><strong>4. Verify Templates:</strong> Ensure emails use your custom templates and branding</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Common Issues & Solutions
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <div>
              <strong>Emails not sending:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Verify Resend API key is correct and active</li>
                <li>• Check SMTP settings match Resend requirements exactly</li>
                <li>• Ensure "Enable SMTP" is turned on in Supabase</li>
              </ul>
            </div>
            <div>
              <strong>Emails going to spam:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Verify your domain with Resend</li>
                <li>• Set up proper SPF/DKIM records</li>
                <li>• Use a verified sender email address</li>
              </ul>
            </div>
            <div>
              <strong>Confirmation links not working:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Check Site URL and Redirect URLs are correct</li>
                <li>• Ensure <code className="bg-yellow-100 px-1 rounded">/auth/confirm</code> route exists</li>
                <li>• Verify email templates use correct confirmation URL format</li>
              </ul>
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="p-2">
            <ExternalLink className="h-3 w-3 mr-1" />
            <a href="https://supabase.com/docs/guides/auth/auth-smtp" target="_blank" rel="noopener noreferrer" className="text-xs">
              Supabase SMTP Docs
            </a>
          </Badge>
          <Badge variant="outline" className="p-2">
            <ExternalLink className="h-3 w-3 mr-1" />
            <a href="https://resend.com/docs/send-with-smtp" target="_blank" rel="noopener noreferrer" className="text-xs">
              Resend SMTP Guide
            </a>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
