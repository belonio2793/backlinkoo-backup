import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Bug, Database, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { liveCampaignManager } from '@/services/liveCampaignManager';
import { toast } from 'sonner';

export const CampaignDebugger: React.FC = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const addResult = (test: string, result: boolean, details?: any) => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date() }]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Database connectivity
      addResult('Database Connection', true, 'Initial connection check');
      
      try {
        const { data, error } = await supabase.from('automation_campaigns').select('count').limit(1);
        if (error) {
          addResult('Database Query Test', false, error.message);
        } else {
          addResult('Database Query Test', true, 'Can query automation_campaigns table');
        }
      } catch (dbError: any) {
        addResult('Database Query Test', false, dbError.message);
      }

      // Test 2: User authentication
      if (!user) {
        addResult('User Authentication', false, 'No user logged in');
      } else {
        addResult('User Authentication', true, `User ID: ${user.id}`);
      }

      // Test 3: Check table schema
      try {
        const { data: columns, error: schemaError } = await supabase
          .rpc('check_table_columns', { table_name: 'automation_campaigns' })
          .catch(async () => {
            // Fallback to direct query if RPC doesn't exist
            return await supabase
              .from('information_schema.columns')
              .select('column_name')
              .eq('table_name', 'automation_campaigns')
              .eq('table_schema', 'public');
          });

        if (schemaError) {
          addResult('Table Schema Check', false, schemaError.message);
        } else {
          addResult('Table Schema Check', true, `Found ${columns?.length || 0} columns`);
        }
      } catch (schemaError: any) {
        addResult('Table Schema Check', false, schemaError.message);
      }

      // Test 4: Try creating a test campaign
      if (user) {
        try {
          const testCampaignData = {
            name: `Debug Test Campaign ${Date.now()}`,
            keywords: ['test keyword'],
            anchor_texts: ['test anchor'],
            target_url: 'https://example.com',
            user_id: user.id,
            auto_start: false
          };

          addResult('Campaign Data Validation', true, 'Test data prepared');

          // Test direct Supabase insert
          const { data: insertData, error: insertError } = await supabase
            .from('automation_campaigns')
            .insert({
              name: testCampaignData.name,
              keywords: testCampaignData.keywords,
              anchor_texts: testCampaignData.anchor_texts,
              target_url: testCampaignData.target_url,
              user_id: testCampaignData.user_id,
              status: 'draft',
              links_built: 0,
              available_sites: 4,
              target_sites_used: [],
              auto_start: testCampaignData.auto_start,
              published_articles: []
            })
            .select()
            .single();

          if (insertError) {
            addResult('Direct Database Insert', false, insertError.message);
          } else {
            addResult('Direct Database Insert', true, `Campaign created with ID: ${insertData.id}`);
            
            // Clean up test campaign
            await supabase.from('automation_campaigns').delete().eq('id', insertData.id);
            addResult('Test Cleanup', true, 'Test campaign deleted');
          }

        } catch (campaignError: any) {
          addResult('Campaign Creation Test', false, campaignError.message);
        }
      }

      // Test 5: Test campaign manager
      if (user) {
        try {
          const managerResult = await liveCampaignManager.createCampaign({
            name: `Manager Test ${Date.now()}`,
            keywords: ['test'],
            anchor_texts: ['test'],
            target_url: 'https://example.com',
            user_id: user.id,
            auto_start: false
          });

          if (managerResult.success) {
            addResult('Campaign Manager Test', true, `Campaign ID: ${managerResult.campaign?.id}`);
            // Clean up
            if (managerResult.campaign?.id) {
              await liveCampaignManager.deleteCampaign(managerResult.campaign.id, user.id);
              addResult('Manager Cleanup', true, 'Test campaign deleted via manager');
            }
          } else {
            addResult('Campaign Manager Test', false, managerResult.error);
          }
        } catch (managerError: any) {
          addResult('Campaign Manager Test', false, managerError.message);
        }
      }

    } catch (error: any) {
      addResult('Diagnostic Error', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Campaign Creation Debugger
        </CardTitle>
        <CardDescription>
          Run diagnostics to identify why campaign creation is failing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Run Campaign Diagnostics
            </>
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Diagnostic Results</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {result.result ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.test}</span>
                    <Badge variant={result.result ? "default" : "destructive"}>
                      {result.result ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                  {result.details && (
                    <p className="text-sm text-gray-600 mt-1">
                      {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {testResults.some(r => !r.result && r.test.includes('Database')) && (
                <li>• Database connection issues detected - check environment variables</li>
              )}
              {testResults.some(r => !r.result && r.test.includes('Authentication')) && (
                <li>• User authentication required - please sign in</li>
              )}
              {testResults.some(r => !r.result && r.test.includes('Schema')) && (
                <li>• Database schema issues - missing columns or table structure problems</li>
              )}
              {testResults.some(r => !r.result && r.test.includes('Campaign')) && (
                <li>• Campaign creation logic issues - check the error details above</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
