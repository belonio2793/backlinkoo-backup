import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, ExternalLink, Settings, Mail, Database } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { 
  CONFIRMATION_EMAIL_TEMPLATE, 
  PASSWORD_RESET_EMAIL_TEMPLATE, 
  SUPABASE_CONFIGURATION_INSTRUCTIONS,
  testSupabaseEmailConfig
} from '../utils/supabaseEmailTemplateConfig';

export const SupabaseEmailTemplateGuide = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingConfig, setIsTestingConfig] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const runConfigTest = async () => {
    setIsTestingConfig(true);
    try {
      const results = await testSupabaseEmailConfig();
      setTestResults(results);
    } catch (error) {
      console.error('Config test failed:', error);
      toast({
        title: "Test failed",
        description: "Failed to run configuration test",
        variant: "destructive",
      });
    } finally {
      setIsTestingConfig(false);
    }
  };

  const ConfigStep = ({ step, title, description, action }: any) => (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline">Step {step}</Badge>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <p className="text-sm font-medium text-blue-600">{action}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Supabase Email Template Configuration
          </CardTitle>
          <CardDescription>
            Complete guide to configure email authentication templates in Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runConfigTest} 
              disabled={isTestingConfig}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {isTestingConfig ? 'Testing Configuration...' : 'Test Current Configuration'}
            </Button>

            {testResults && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Test Results:</strong></p>
                    <ul className="text-sm space-y-1">
                      <li>Environment: {testResults.environmentCheck ? '✅ Configured' : '❌ Missing variables'}</li>
                      <li>Auth Available: {testResults.authAvailable ? '✅ Working' : '❌ Issues detected'}</li>
                    </ul>
                    {testResults.recommendations?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Recommendations:</p>
                        <ul className="text-sm list-disc list-inside space-y-1 mt-1">
                          {testResults.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="configuration">Configuration Steps</TabsTrigger>
          <TabsTrigger value="environment">Environment Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Confirmation Email Template
              </CardTitle>
              <CardDescription>
                Copy this template to Supabase → Authentication → Email Templates → Confirm signup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Subject:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(CONFIRMATION_EMAIL_TEMPLATE.subject, 'Subject')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{CONFIRMATION_EMAIL_TEMPLATE.subject}</code>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">HTML Body:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(CONFIRMATION_EMAIL_TEMPLATE.body, 'HTML Body')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md max-h-40 overflow-auto">
                  <pre className="text-xs">{CONFIRMATION_EMAIL_TEMPLATE.body}</pre>
                </div>
              </div>

              <Alert>
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  <strong>Redirect URL:</strong> {CONFIRMATION_EMAIL_TEMPLATE.redirectTo}
                  <br />
                  Make sure this URL is added to your Supabase Auth → URL Configuration → Redirect URLs
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Password Reset Email Template
              </CardTitle>
              <CardDescription>
                Copy this template to Supabase → Authentication → Email Templates → Reset password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Subject:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(PASSWORD_RESET_EMAIL_TEMPLATE.subject, 'Subject')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{PASSWORD_RESET_EMAIL_TEMPLATE.subject}</code>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">HTML Body:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(PASSWORD_RESET_EMAIL_TEMPLATE.body, 'HTML Body')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md max-h-40 overflow-auto">
                  <pre className="text-xs">{PASSWORD_RESET_EMAIL_TEMPLATE.body}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Configuration</CardTitle>
              <CardDescription>
                Follow these steps to configure email templates in your Supabase project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {SUPABASE_CONFIGURATION_INSTRUCTIONS.steps.map((step) => (
                  <ConfigStep key={step.step} {...step} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Required environment variables for email functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Supabase Project Settings → Environment Variables:</h4>
                {Object.entries(SUPABASE_CONFIGURATION_INSTRUCTIONS.environment_variables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="space-y-1">
                      <code className="text-sm font-medium">{key}</code>
                      <p className="text-xs text-muted-foreground">{value}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${key}=${value}`, key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-medium">Redirect URLs Configuration:</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Add these URLs in Supabase → Authentication → URL Configuration:
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Site URL:</p>
                      <code className="text-xs">{SUPABASE_CONFIGURATION_INSTRUCTIONS.redirect_urls.site_url}</code>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Redirect URLs:</p>
                      <div className="space-y-1 mt-2">
                        {SUPABASE_CONFIGURATION_INSTRUCTIONS.redirect_urls.redirect_urls.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <code className="text-xs">{url}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(url, 'Redirect URL')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>After configuration:</strong> Test user registration with a real email address to verify the complete email authentication flow is working.
        </AlertDescription>
      </Alert>
    </div>
  );
};
