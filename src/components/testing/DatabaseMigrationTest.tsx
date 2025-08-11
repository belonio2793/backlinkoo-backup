import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export function DatabaseMigrationTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);

  const updateResult = (step: string, status: MigrationResult['status'], message?: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { step, status, message, data }];
      }
    });
  };

  const runMigrationTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Check if exec_sql function exists
      updateResult('check_exec_sql', 'running', 'Checking if exec_sql function exists...');
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: "SELECT 'exec_sql function is working' as status" 
        });
        
        if (error) {
          updateResult('check_exec_sql', 'error', `exec_sql function missing: ${error.message}`);
          
          // Step 2: Check columns directly
          updateResult('check_columns', 'running', 'Checking automation_campaigns columns...');
          
          const { data: columns, error: columnError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'automation_campaigns')
            .in('column_name', ['started_at', 'completed_at', 'auto_start']);

          if (columnError) {
            updateResult('check_columns', 'error', `Column check failed: ${columnError.message}`);
          } else {
            const columnNames = columns?.map(c => c.column_name) || [];
            const missingColumns = ['started_at', 'completed_at', 'auto_start'].filter(
              col => !columnNames.includes(col)
            );
            
            if (missingColumns.length > 0) {
              updateResult('check_columns', 'error', `Missing columns: ${missingColumns.join(', ')}`);
            } else {
              updateResult('check_columns', 'success', 'All required columns exist', { columns });
            }
          }
        } else {
          updateResult('check_exec_sql', 'success', 'exec_sql function is working', data);
          
          // Step 2: Check columns using exec_sql
          updateResult('check_columns', 'running', 'Checking columns with exec_sql...');
          
          const { data: columnData, error: columnError } = await supabase.rpc('exec_sql', {
            query: `
              SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'automation_campaigns' 
              AND column_name IN ('started_at', 'completed_at', 'auto_start')
              ORDER BY column_name
            `
          });
          
          if (columnError) {
            updateResult('check_columns', 'error', `Column check failed: ${columnError.message}`);
          } else {
            const columnNames = columnData?.map((c: any) => c.column_name) || [];
            const missingColumns = ['started_at', 'completed_at', 'auto_start'].filter(
              col => !columnNames.includes(col)
            );
            
            if (missingColumns.length > 0) {
              updateResult('check_columns', 'error', `Missing columns: ${missingColumns.join(', ')}`, { 
                existing: columnNames,
                missing: missingColumns 
              });
            } else {
              updateResult('check_columns', 'success', 'All required columns exist', { columns: columnData });
            }
          }
        }
      } catch (error: any) {
        updateResult('check_exec_sql', 'error', `Function check failed: ${error.message}`);
      }

      // Step 3: Test campaign table access
      updateResult('test_campaigns', 'running', 'Testing campaign table access...');
      
      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from('automation_campaigns')
          .select('id, name, target_url, keywords, anchor_texts, created_at')
          .limit(1);

        if (campaignError) {
          updateResult('test_campaigns', 'error', `Campaign table access failed: ${campaignError.message}`);
        } else {
          updateResult('test_campaigns', 'success', 'Campaign table accessible', { 
            recordCount: campaignData?.length || 0,
            sampleRecord: campaignData?.[0] || null
          });
        }
      } catch (error: any) {
        updateResult('test_campaigns', 'error', `Campaign table test failed: ${error.message}`);
      }

      // Step 4: Create a test campaign to verify functionality
      updateResult('test_creation', 'running', 'Testing campaign creation...');
      
      try {
        const testCampaign = {
          name: `Migration Test ${Date.now()}`,
          engine_type: 'blog_comments',
          target_url: 'https://example.com/test',
          keywords: ['test'],
          anchor_texts: ['test link'],
          status: 'draft',
          daily_limit: 1,
          auto_start: false
        };

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          updateResult('test_creation', 'error', 'No authenticated user for test creation');
        } else {
          const { data: createdCampaign, error: createError } = await supabase
            .from('automation_campaigns')
            .insert({ ...testCampaign, user_id: userData.user.id })
            .select()
            .single();

          if (createError) {
            updateResult('test_creation', 'error', `Campaign creation failed: ${createError.message}`);
          } else {
            updateResult('test_creation', 'success', 'Campaign creation successful', {
              campaignId: createdCampaign.id,
              name: createdCampaign.name,
              hasStartedAt: 'started_at' in createdCampaign,
              hasCompletedAt: 'completed_at' in createdCampaign,
              hasAutoStart: 'auto_start' in createdCampaign
            });

            // Clean up test campaign
            await supabase
              .from('automation_campaigns')
              .delete()
              .eq('id', createdCampaign.id);
          }
        }
      } catch (error: any) {
        updateResult('test_creation', 'error', `Campaign creation test failed: ${error.message}`);
      }

      toast.success('Migration test completed');

    } catch (error: any) {
      updateResult('general_error', 'error', `Test execution failed: ${error.message}`);
      toast.error('Migration test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: MigrationResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MigrationResult['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      running: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700'
    };

    return (
      <Badge className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration Test
        </CardTitle>
        <CardDescription>
          Test database schema and function availability for campaign management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end">
          <Button 
            onClick={runMigrationTest}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRunning ? 'Running Tests...' : 'Run Migration Test'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">
                        {result.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  {result.message && (
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  )}
                  
                  {result.data && (
                    <div className="bg-gray-50 rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Migration Test" to check database schema and functionality</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
