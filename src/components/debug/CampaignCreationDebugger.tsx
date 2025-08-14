import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { liveCampaignManager } from '@/services/liveCampaignManager';
import { supabase } from '@/integrations/supabase/client';

export function CampaignCreationDebugger() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    keywords: 'SEO tools, link building',
    anchor_texts: 'best SEO tools, click here',
    target_url: 'https://example.com'
  });

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    setDebugLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const testDatabaseSchema = async () => {
    addLog('Testing database schema...');

    try {
      // Test 1: Check if the automation_campaigns table exists by trying to select from it
      addLog('Checking if automation_campaigns table exists...');
      const { data: tableTest, error: tableError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);

      if (tableError) {
        addLog(`Table test failed: ${tableError.message}`, 'error');
        return false;
      }

      addLog('✅ automation_campaigns table exists and is accessible');

      // Test 2: Check for specific columns by trying to select them
      addLog('Testing for required columns...');
      const columnsToTest = ['keywords', 'anchor_texts', 'target_sites_used', 'published_articles', 'name', 'engine_type', 'user_id', 'status'];
      const columnResults = [];

      for (const columnName of columnsToTest) {
        try {
          const { error: columnError } = await supabase
            .from('automation_campaigns')
            .select(columnName)
            .limit(1);

          if (columnError) {
            addLog(`  ❌ ${columnName}: ${columnError.message}`, 'error');
            columnResults.push({ name: columnName, exists: false, error: columnError.message });
          } else {
            addLog(`  ✅ ${columnName}: exists`);
            columnResults.push({ name: columnName, exists: true });
          }
        } catch (error) {
          addLog(`  ❌ ${columnName}: ${error}`, 'error');
          columnResults.push({ name: columnName, exists: false, error: String(error) });
        }
      }

      const missingColumns = columnResults.filter(col => !col.exists);
      if (missingColumns.length > 0) {
        addLog(`⚠️ Found ${missingColumns.length} missing or problematic columns`, 'error');
        missingColumns.forEach(col => {
          addLog(`  Missing: ${col.name} - ${col.error}`, 'error');
        });
      } else {
        addLog('✅ All required columns found and accessible', 'success');
      }

      // Test 3: Test a basic insert/delete to verify write permissions
      addLog('Testing write permissions...');
      try {
        const testData = {
          name: 'Schema Test - DELETE ME',
          engine_type: 'web2_platforms',
          user_id: 'test-schema-check',
          status: 'draft',
          auto_start: false
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('automation_campaigns')
          .insert(testData)
          .select('id')
          .single();

        if (insertError) {
          addLog(`Write test failed: ${insertError.message}`, 'error');
          addLog('This might indicate missing columns or permission issues', 'error');
        } else {
          addLog('✅ Write permissions confirmed');
          // Clean up test record
          await supabase.from('automation_campaigns').delete().eq('id', insertResult.id);
          addLog('Test record cleaned up');
        }
      } catch (error) {
        addLog(`Write test error: ${error}`, 'error');
      }

      return missingColumns.length === 0;
    } catch (error) {
      addLog(`Schema test error: ${error}`, 'error');
      return false;
    }
  };

  const testArrayProcessing = () => {
    addLog('Testing array processing...');
    
    try {
      // Simulate the exact processing from AutomationLive.tsx
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k && k.length > 0);
      
      const anchorTextsArray = formData.anchor_texts
        .split(',')
        .map(a => a.trim())
        .filter(a => a && a.length > 0);

      addLog(`Keywords processed: [${keywordsArray.join(', ')}]`);
      addLog(`Keywords validation: isArray=${Array.isArray(keywordsArray)}, length=${keywordsArray.length}, allStrings=${keywordsArray.every(k => typeof k === 'string')}`);
      
      addLog(`Anchor texts processed: [${anchorTextsArray.join(', ')}]`);
      addLog(`Anchor texts validation: isArray=${Array.isArray(anchorTextsArray)}, length=${anchorTextsArray.length}, allStrings=${anchorTextsArray.every(a => typeof a === 'string')}`);

      if (keywordsArray.length === 0) {
        addLog('❌ No valid keywords after processing', 'error');
        return null;
      }
      
      if (anchorTextsArray.length === 0) {
        addLog('❌ No valid anchor texts after processing', 'error');
        return null;
      }

      const cleanTargetUrl = formData.target_url.trim();
      if (!cleanTargetUrl) {
        addLog('❌ Target URL is empty', 'error');
        return null;
      }

      const campaignParams = {
        name: `Debug Test - ${new Date().toLocaleTimeString()}`,
        keywords: keywordsArray,
        anchor_texts: anchorTextsArray,
        target_url: cleanTargetUrl,
        user_id: user?.id || 'test-user-id',
        auto_start: false
      };

      addLog('✅ Array processing successful', 'success');
      return campaignParams;
    } catch (error) {
      addLog(`Array processing error: ${error}`, 'error');
      return null;
    }
  };

  const testDirectInsertion = async (campaignParams: any) => {
    addLog('Testing direct database insertion...');

    try {
      // Start with minimal data and progressively add more complex fields
      addLog('Step 1: Testing minimal insertion...');
      const minimalData = {
        name: `${campaignParams.name} - Minimal`,
        engine_type: 'web2_platforms',
        user_id: campaignParams.user_id,
        status: 'draft',
        auto_start: false
      };

      const { data: minimalResult, error: minimalError } = await supabase
        .from('automation_campaigns')
        .insert(minimalData)
        .select('id')
        .single();

      if (minimalError) {
        addLog(`Minimal insertion failed: ${minimalError.message}`, 'error');
        addLog(`This indicates basic table/permission issues`, 'error');
        return false;
      }

      addLog(`✅ Minimal insertion successful! ID: ${minimalResult.id}`);
      await supabase.from('automation_campaigns').delete().eq('id', minimalResult.id);

      // Step 2: Test with arrays
      addLog('Step 2: Testing with array fields...');
      const arrayData = {
        name: `${campaignParams.name} - Arrays`,
        engine_type: 'web2_platforms',
        keywords: campaignParams.keywords,
        anchor_texts: campaignParams.anchor_texts,
        target_url: campaignParams.target_url,
        user_id: campaignParams.user_id,
        status: 'draft',
        auto_start: false
      };

      addLog('Array test data:');
      addLog(`  keywords: ${Array.isArray(arrayData.keywords)} - ${JSON.stringify(arrayData.keywords)}`);
      addLog(`  anchor_texts: ${Array.isArray(arrayData.anchor_texts)} - ${JSON.stringify(arrayData.anchor_texts)}`);

      const { data: arrayResult, error: arrayError } = await supabase
        .from('automation_campaigns')
        .insert(arrayData)
        .select('id, keywords, anchor_texts')
        .single();

      if (arrayError) {
        addLog(`Array insertion failed: ${arrayError.message}`, 'error');
        addLog(`Error details: ${JSON.stringify({ details: arrayError.details, hint: arrayError.hint, code: arrayError.code })}`);

        // This is likely the "expected JSON array" error
        if (arrayError.message.includes('expected JSON array')) {
          addLog('🎯 This is the "expected JSON array" error we\'re trying to fix!', 'error');
        }

        return false;
      }

      addLog(`✅ Array insertion successful! ID: ${arrayResult.id}`, 'success');
      addLog(`Retrieved keywords: ${JSON.stringify(arrayResult.keywords)}`);
      addLog(`Retrieved anchor_texts: ${JSON.stringify(arrayResult.anchor_texts)}`);

      // Clean up test data
      await supabase.from('automation_campaigns').delete().eq('id', arrayResult.id);
      addLog('Array test data cleaned up');

      return true;
    } catch (error) {
      addLog(`Direct insertion error: ${error}`, 'error');
      return false;
    }
  };

  const testCampaignManager = async (campaignParams: any) => {
    addLog('Testing liveCampaignManager.createCampaign...');
    
    try {
      const result = await liveCampaignManager.createCampaign(campaignParams);
      
      if (result.success) {
        addLog(`✅ Campaign manager test successful! ID: ${result.campaign?.id}`, 'success');
        
        // Clean up test campaign
        if (result.campaign?.id) {
          await liveCampaignManager.deleteCampaign(result.campaign.id, campaignParams.user_id);
          addLog('Test campaign cleaned up');
        }
        
        return true;
      } else {
        addLog(`Campaign manager test failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      addLog(`Campaign manager error: ${error}`, 'error');
      return false;
    }
  };

  const runFullTest = async () => {
    if (!user) {
      toast.error('Please sign in to run tests');
      return;
    }

    setTesting(true);
    clearLogs();
    addLog('🚀 Starting comprehensive campaign creation debug test...');

    try {
      // Step 1: Test database schema
      const schemaOk = await testDatabaseSchema();
      if (!schemaOk) {
        addLog('❌ Database schema test failed, stopping', 'error');
        return;
      }

      // Step 2: Test array processing
      const campaignParams = testArrayProcessing();
      if (!campaignParams) {
        addLog('❌ Array processing test failed, stopping', 'error');
        return;
      }

      // Step 3: Test direct database insertion
      const directOk = await testDirectInsertion(campaignParams);
      if (!directOk) {
        addLog('❌ Direct insertion test failed, but continuing...', 'error');
      }

      // Step 4: Test campaign manager
      const managerOk = await testCampaignManager(campaignParams);
      if (!managerOk) {
        addLog('❌ Campaign manager test failed', 'error');
      }

      if (directOk && managerOk) {
        addLog('🎉 All tests passed! Campaign creation should work normally.', 'success');
        toast.success('All tests passed!');
      } else {
        addLog('⚠️ Some tests failed. Check logs for details.', 'error');
        toast.error('Some tests failed. Check debug logs.');
      }

    } catch (error) {
      addLog(`Test suite error: ${error}`, 'error');
      toast.error('Test suite encountered an error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Campaign Creation Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="debug-keywords">Test Keywords</Label>
            <Textarea
              id="debug-keywords"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="debug-anchors">Test Anchor Texts</Label>
            <Textarea
              id="debug-anchors"
              value={formData.anchor_texts}
              onChange={(e) => setFormData(prev => ({ ...prev, anchor_texts: e.target.value }))}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="debug-url">Test Target URL</Label>
            <Input
              id="debug-url"
              value={formData.target_url}
              onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runFullTest}
            disabled={testing || !user}
            className="flex items-center gap-2"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            Run Debug Test
          </Button>
          <Button
            onClick={clearLogs}
            variant="outline"
            disabled={testing}
          >
            Clear Logs
          </Button>
        </div>

        {!user && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            Please sign in to run campaign creation tests
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Debug Logs:</h4>
          <div className="bg-white border rounded p-3 h-64 overflow-y-auto font-mono text-xs">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a test to see debug information.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
