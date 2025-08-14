import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { liveCampaignManager } from '@/services/liveCampaignManager';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';

export function CampaignCreationFix() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    campaignId?: string;
    error?: any;
  } | null>(null);

  const runCampaignCreationTest = async () => {
    if (!user) {
      toast.error('Please sign in to test campaign creation');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing campaign creation with fixed array handling...');

      // Test data that matches the expected format
      const testParams = {
        name: `Test Campaign (${new Date().toISOString().slice(0, 16)})`,
        keywords: ['test seo', 'link building', 'digital marketing'],
        anchor_texts: ['click here', 'learn more', 'best tools'],
        target_url: 'https://example.com/test-page',
        user_id: user.id,
        auto_start: false
      };

      console.log('🔍 Test params:', testParams);

      const result = await liveCampaignManager.createCampaign(testParams);
      
      console.log('🔍 Campaign creation result:', result);

      if (result.success && result.campaign) {
        setTestResult({
          success: true,
          message: `Campaign created successfully! ID: ${result.campaign.id}`,
          campaignId: result.campaign.id
        });
        toast.success('✅ Campaign creation test passed!');
      } else {
        // Check for specific "expected JSON array" error
        const errorMessage = result.error || 'Campaign creation failed';
        const isJsonArrayError = errorMessage.includes('expected JSON array');

        setTestResult({
          success: false,
          message: isJsonArrayError
            ? '❌ "Expected JSON array" error detected - Database schema needs fixing'
            : errorMessage,
          error: result
        });

        if (isJsonArrayError) {
          toast.error('❌ Schema Error: Missing database columns. Check AUTOMATION_SCHEMA_FIX_IMMEDIATE.md for fix.');
        } else {
          toast.error('❌ Campaign creation test failed');
        }
      }
    } catch (error) {
      console.error('❌ Campaign creation test error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      toast.error('❌ Campaign creation test failed with exception');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Campaign Creation Fix Test
        </CardTitle>
        <CardDescription>
          Tests the fixed campaign creation functionality to ensure the "expected JSON array" error is resolved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Please sign in to test campaign creation</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                This test will attempt to create a campaign with the fixed array handling
              </div>
              <Button 
                onClick={runCampaignCreationTest}
                disabled={testing}
                className="flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant={testResult.success ? "secondary" : "destructive"}>
                    {testResult.success ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
                
                <p className="text-sm font-medium mb-2">
                  {testResult.message}
                </p>

                {testResult.campaignId && (
                  <p className="text-xs text-gray-600">
                    Campaign ID: {testResult.campaignId}
                  </p>
                )}

                {!testResult.success && testResult.error && (
                  <>
                    {testResult.message.includes('"Expected JSON array"') && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-orange-800 mb-2">🔧 Quick Fix Required</h4>
                        <p className="text-xs text-orange-700 mb-2">
                          This error means the database is missing required columns. Run this SQL in your Supabase Dashboard:
                        </p>
                        <code className="text-xs bg-orange-100 px-2 py-1 rounded">
                          ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
                        </code>
                        <p className="text-xs text-orange-600 mt-1">
                          See <strong>AUTOMATION_SCHEMA_FIX_IMMEDIATE.md</strong> for complete fix.
                        </p>
                      </div>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-gray-500">
                        View Error Details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(testResult.error, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Test Criteria:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Creates campaign with valid keyword and anchor text arrays</li>
                <li>Ensures proper JSONB array handling for published_articles</li>
                <li>Validates that no "expected JSON array" errors occur</li>
                <li>Confirms campaign is created in database successfully</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
