import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function CampaignCreationTest() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testDirectInsert = async () => {
    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }

    setTesting(true);
    setLastResult(null);

    try {
      // Test the exact data structure the code is trying to insert
      const testCampaignData = {
        name: 'Debug Test Campaign',
        keywords: ['test', 'debug'],
        anchor_texts: ['test link', 'debug link'],
        target_url: 'https://example.com',
        user_id: user.id,
        status: 'draft',
        auto_start: false,
        links_built: 0,
        available_sites: 4,
        target_sites_used: [],
        published_articles: []
      };

      console.log('🧪 Testing direct campaign insertion:', testCampaignData);

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(testCampaignData)
        .select()
        .single();

      console.log('🧪 Direct insert result:', { data, error });

      if (error) {
        setLastResult({
          success: false,
          error: error,
          errorDetails: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          }
        });
        
        if (error.message.includes('expected JSON array')) {
          toast.error('❌ Still getting "expected JSON array" error');
        } else {
          toast.error(`Database error: ${error.message}`);
        }
      } else {
        setLastResult({
          success: true,
          data: data,
          campaignId: data.id
        });
        toast.success('✅ Direct database insert successful!');
        
        // Clean up test record
        await supabase
          .from('automation_campaigns')
          .delete()
          .eq('id', data.id);
        
        console.log('🧪 Cleaned up test campaign');
      }

    } catch (error) {
      console.error('🧪 Test failed:', error);
      setLastResult({
        success: false,
        error: error,
        errorDetails: {
          type: 'exception',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      toast.error('Test failed with exception');
    } finally {
      setTesting(false);
    }
  };

  const testRLSPolicies = async () => {
    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }

    try {
      // Test if we can read from the table
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .limit(1);

      if (error) {
        toast.error(`RLS Read Error: ${error.message}`);
        console.error('🧪 RLS read test failed:', error);
      } else {
        toast.success('✅ RLS read permissions working');
        console.log('🧪 RLS read test passed:', data);
      }
    } catch (error) {
      console.error('🧪 RLS test exception:', error);
      toast.error('RLS test failed');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Campaign Creation Debug Test
        </CardTitle>
        <CardDescription>
          Direct database testing to debug the "expected JSON array" error
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={testDirectInsert}
            disabled={testing || !user}
            size="sm"
          >
            {testing ? 'Testing...' : 'Test Direct Insert'}
          </Button>
          
          <Button
            onClick={testRLSPolicies}
            disabled={!user}
            size="sm"
            variant="outline"
          >
            Test RLS Policies
          </Button>
          
          {!user && (
            <Badge variant="destructive">Please sign in</Badge>
          )}
        </div>

        {lastResult && (
          <div className={`border rounded-lg p-4 ${
            lastResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>

            {lastResult.success ? (
              <div className="text-sm text-green-700">
                <p>✅ Database insert successful</p>
                <p>✅ Campaign ID: {lastResult.campaignId}</p>
                <p>✅ No JSON array errors</p>
              </div>
            ) : (
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Error Message:</strong> {lastResult.errorDetails?.message}</p>
                {lastResult.errorDetails?.details && (
                  <p><strong>Details:</strong> {lastResult.errorDetails.details}</p>
                )}
                {lastResult.errorDetails?.hint && (
                  <p><strong>Hint:</strong> {lastResult.errorDetails.hint}</p>
                )}
                {lastResult.errorDetails?.code && (
                  <p><strong>Code:</strong> {lastResult.errorDetails.code}</p>
                )}
                
                {lastResult.errorDetails?.message?.includes('expected JSON array') && (
                  <div className="mt-2 p-2 bg-red-100 rounded">
                    <p className="font-medium">❌ JSON Array Error Detected</p>
                    <p className="text-xs">The schema fix may not have been applied correctly.</p>
                  </div>
                )}
                
                {lastResult.errorDetails?.message?.includes('permission') && (
                  <div className="mt-2 p-2 bg-red-100 rounded">
                    <p className="font-medium">🔒 Permission Error Detected</p>
                    <p className="text-xs">RLS policies may be blocking the insert.</p>
                  </div>
                )}
              </div>
            )}

            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium">View Raw Result</summary>
              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-xs text-gray-600">
          <p>This test performs a direct database insert with the same data structure that's failing in the campaign manager.</p>
          <p>It will help identify if the issue is schema-related, RLS-related, or something else.</p>
        </div>
      </CardContent>
    </Card>
  );
}
