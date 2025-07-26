import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Settings,
  Key,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SocialAuthSetupGuide = () => {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const redirectUrl = `${window.location.origin}/auth/callback`;

  const providers = [
    {
      id: 'google',
      name: 'Google',
      color: 'bg-red-500',
      icon: '🔍',
      consoleUrl: 'https://console.cloud.google.com/',
      steps: [
        'Go to Google Cloud Console',
        'Create a new project or select existing',
        'Enable Google+ API',
        'Go to Credentials → Create OAuth 2.0 Client ID',
        'Set Application Type to "Web Application"',
        `Add Authorized Redirect URI: ${redirectUrl}`,
        'Copy Client ID and Client Secret'
      ],
      scopes: 'email profile',
      additionalConfig: {
        'Site URL': window.location.origin,
        'Redirect URL': redirectUrl
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      color: 'bg-blue-600',
      icon: '📘',
      consoleUrl: 'https://developers.facebook.com/',
      steps: [
        'Go to Facebook for Developers',
        'Create a new app or select existing',
        'Add Facebook Login product',
        'Go to Facebook Login → Settings',
        `Add OAuth Redirect URI: ${redirectUrl}`,
        'Copy App ID and App Secret from Settings → Basic'
      ],
      scopes: 'email public_profile',
      additionalConfig: {
        'Site URL': window.location.origin,
        'Redirect URL': redirectUrl
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      color: 'bg-blue-700',
      icon: '💼',
      consoleUrl: 'https://www.linkedin.com/developers/',
      steps: [
        'Go to LinkedIn Developer Portal',
        'Create a new app',
        'Add "Sign In with LinkedIn" product',
        'Go to Auth tab',
        `Add Authorized Redirect URL: ${redirectUrl}`,
        'Copy Client ID and Client Secret'
      ],
      scopes: 'r_liteprofile r_emailaddress',
      additionalConfig: {
        'Site URL': window.location.origin,
        'Redirect URL': redirectUrl
      }
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      color: 'bg-black',
      icon: '🐦',
      consoleUrl: 'https://developer.twitter.com/',
      steps: [
        'Go to Twitter Developer Portal',
        'Create a new app',
        'Go to App Settings → Authentication settings',
        'Enable "3-legged OAuth"',
        `Add Callback URL: ${redirectUrl}`,
        'Copy API Key and API Secret Key'
      ],
      scopes: 'tweet.read users.read',
      additionalConfig: {
        'Website URL': window.location.origin,
        'Callback URL': redirectUrl
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Social Authentication Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Important Configuration URLs</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-medium">Site URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{window.location.origin}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(window.location.origin, 'Site URL')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-medium">Redirect URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{redirectUrl}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(redirectUrl, 'Redirect URL')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="supabase" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="supabase">Supabase Setup</TabsTrigger>
              <TabsTrigger value="providers">Provider Setup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="supabase" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Supabase Configuration Steps</h4>
                      <ol className="mt-2 space-y-2 text-sm text-green-800 list-decimal list-inside">
                        <li>Go to your Supabase Dashboard</li>
                        <li>Navigate to Authentication → Providers</li>
                        <li>Enable the providers you want to use</li>
                        <li>Add the Client ID and Client Secret from each provider</li>
                        <li>Configure the redirect URLs as shown above</li>
                        <li>Save the settings</li>
                      </ol>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                          className="text-green-700 border-green-200 hover:bg-green-100"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Supabase Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Required Environment Variables</h4>
                      <p className="mt-2 text-sm text-yellow-800">
                        Make sure these are properly configured in your Supabase project:
                      </p>
                      <div className="mt-2 space-y-1 text-sm font-mono">
                        <div>VITE_SUPABASE_URL</div>
                        <div>VITE_SUPABASE_ANON_KEY</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="providers" className="space-y-4">
              <div className="space-y-4">
                {providers.map((provider) => (
                  <Collapsible 
                    key={provider.id}
                    open={openSections[provider.id]}
                    onOpenChange={() => toggleSection(provider.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center text-white text-lg`}>
                                {provider.icon}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{provider.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  OAuth 2.0 Configuration
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">OAuth 2.0</Badge>
                              <ChevronDown className={`h-4 w-4 transition-transform ${openSections[provider.id] ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Setup Steps
                              </h4>
                              <ol className="space-y-2 text-sm list-decimal list-inside">
                                {provider.steps.map((step, index) => (
                                  <li key={index} className="text-muted-foreground">{step}</li>
                                ))}
                              </ol>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Configuration Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                  <span className="text-sm font-medium">Scopes:</span>
                                  <code className="text-xs bg-white px-2 py-1 rounded border">{provider.scopes}</code>
                                </div>
                                {Object.entries(provider.additionalConfig).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                    <span className="text-sm font-medium">{key}:</span>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs bg-white px-2 py-1 rounded border">{value}</code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(value, key)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(provider.consoleUrl, '_blank')}
                                className="w-full"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open {provider.name} Developer Console
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing Social Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Test the Integration</h4>
              <ol className="space-y-1 text-sm text-blue-800 list-decimal list-inside">
                <li>Complete the provider setup above</li>
                <li>Configure the provider in Supabase Dashboard</li>
                <li>Go to the login page and test each social login button</li>
                <li>Verify users are created correctly in Supabase Auth</li>
                <li>Check that email verification is bypassed for social logins</li>
              </ol>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Benefits of Social Authentication</h4>
              <ul className="space-y-1 text-sm text-green-800 list-disc list-inside">
                <li>Reduced friction - users don't need to create new passwords</li>
                <li>Higher conversion rates - faster signup process</li>
                <li>Better security - leverages provider's security measures</li>
                <li>Automatic email verification - no need for confirmation emails</li>
                <li>Rich user data - access to profile information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialAuthSetupGuide;
