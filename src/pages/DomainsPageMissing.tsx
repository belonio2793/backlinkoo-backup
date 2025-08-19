import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Database,
  AlertTriangle,
  ExternalLink,
  Terminal,
  Settings
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const DomainsPageMissing = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sqlScript = `-- Domains table for DNS management and validation
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'active', 'failed', 'expired')),
  
  -- DNS Configuration
  verification_token text NOT NULL DEFAULT 'blo-' || substr(gen_random_uuid()::text, 1, 12),
  required_a_record inet,
  required_cname text,
  hosting_provider text DEFAULT 'backlinkoo',
  
  -- Validation tracking
  dns_validated boolean DEFAULT false,
  txt_record_validated boolean DEFAULT false,
  a_record_validated boolean DEFAULT false,
  cname_validated boolean DEFAULT false,
  ssl_enabled boolean DEFAULT false,
  
  -- Metadata
  last_validation_attempt timestamptz,
  validation_error text,
  auto_retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 10,
  
  -- Blog integration
  blog_enabled boolean DEFAULT false,
  blog_subdirectory text DEFAULT 'blog',
  pages_published integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, domain)
);

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_validation ON domains(dns_validated, status);`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Domain Management Setup Required
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The domains table needs to be created in your Supabase database before you can manage domains.
          </p>
        </div>

        {/* Setup Alert */}
        <Alert className="mb-8 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium">Database Setup Required</p>
              <p>The domains table doesn't exist in your Supabase database. Please run the SQL script below to set it up.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Setup Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Manual Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Option 1: Manual Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Go to your Supabase dashboard
                </p>
                <p className="text-sm text-gray-600">
                  2. Navigate to SQL Editor
                </p>
                <p className="text-sm text-gray-600">
                  3. Run the SQL script below
                </p>
              </div>
              
              <Button 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Command Line Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Option 2: Command Line
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Configure your Supabase credentials
                </p>
                <p className="text-sm text-gray-600">
                  2. Run the setup script
                </p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">npm run setup:domains</code>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Settings className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Make sure your Supabase environment variables are configured in your .env file
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* SQL Script */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                SQL Script to Run
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(sqlScript)}
              >
                Copy SQL
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {sqlScript}
              </pre>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">What this script does:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Creates the <code className="bg-gray-100 px-1 rounded">domains</code> table with all required columns</li>
                <li>Sets up Row Level Security (RLS) policies for user data isolation</li>
                <li>Creates indexes for optimal query performance</li>
                <li>Adds automatic timestamp updates</li>
                <li>Configures DNS validation tracking</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* After Setup */}
        <Alert className="mt-8 border-green-200 bg-green-50">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">After running the SQL script:</p>
              <p>Refresh this page to access the full domain management interface.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DomainsPageMissing;
