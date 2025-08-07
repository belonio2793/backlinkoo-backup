import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Database, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AffiliateSetupGuide: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'unknown' | 'missing' | 'ready'>('unknown');
  const { toast } = useToast();

  const checkAffiliateSetup = async () => {
    setIsChecking(true);
    try {
      // Try to call the setup function we created
      const response = await fetch('/.netlify/functions/setup-affiliate-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSetupStatus('ready');
          toast({
            title: "Setup Complete",
            description: "Affiliate database has been set up successfully.",
          });
        } else {
          setSetupStatus('missing');
          toast({
            title: "Setup Required",
            description: "Affiliate database setup is needed.",
            variant: "destructive",
          });
        }
      } else {
        setSetupStatus('missing');
      }
    } catch (error) {
      console.error('Setup check failed:', error);
      setSetupStatus('missing');
      toast({
        title: "Setup Check Failed",
        description: "Please try the manual setup steps below.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "SQL code copied to clipboard",
    });
  };

  const setupSQL = `-- Affiliate Database Setup
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  tier TEXT NOT NULL DEFAULT 'bronze',
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registration_data JSONB
);

-- Enable Row Level Security
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "affiliate_profiles_select_own"
ON public.affiliate_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "affiliate_profiles_insert_own"
ON public.affiliate_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-generate affiliate IDs
CREATE OR REPLACE FUNCTION generate_affiliate_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BL' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_affiliate_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.affiliate_id IS NULL OR NEW.affiliate_id = '' THEN
    NEW.affiliate_id := generate_affiliate_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_affiliate_id
BEFORE INSERT ON public.affiliate_profiles
FOR EACH ROW
EXECUTE FUNCTION set_affiliate_id();`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Affiliate Program Setup
          </h1>
          <p className="text-gray-600">
            Set up the affiliate database to enable the affiliate program
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Check if the affiliate database tables are set up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={checkAffiliateSetup}
                  disabled={isChecking}
                  className="flex items-center gap-2"
                >
                  {isChecking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  {isChecking ? 'Checking...' : 'Check & Setup Database'}
                </Button>

                {setupStatus === 'ready' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                )}

                {setupStatus === 'missing' && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Setup Required
                  </Badge>
                )}
              </div>

              {setupStatus === 'ready' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Great! The affiliate program is ready to use. You can now{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => window.location.href = '/affiliate'}
                    >
                      access the affiliate page
                    </Button>
                    .
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Manual Setup Instructions */}
          {setupStatus === 'missing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Manual Setup Instructions
                </CardTitle>
                <CardDescription>
                  If automatic setup doesn't work, follow these manual steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Access Supabase Dashboard
                  </h4>
                  <p className="text-gray-600 ml-8">
                    Go to your Supabase project dashboard and navigate to the SQL Editor.
                  </p>
                  <Button 
                    variant="outline" 
                    className="ml-8"
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Run Setup SQL
                  </h4>
                  <p className="text-gray-600 ml-8">
                    Copy and run the following SQL in your Supabase SQL Editor:
                  </p>
                  
                  <div className="ml-8 relative">
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{setupSQL}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(setupSQL)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Verify Setup
                  </h4>
                  <p className="text-gray-600 ml-8">
                    After running the SQL, click the "Check & Setup Database" button above to verify the setup.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                After setting up the affiliate database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">For Users</h4>
                  <p className="text-sm text-gray-600">
                    Users can now register for the affiliate program and start earning commissions.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">For Administrators</h4>
                  <p className="text-sm text-gray-600">
                    Configure commission rates, manage affiliates, and track performance through the admin dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AffiliateSetupGuide;
