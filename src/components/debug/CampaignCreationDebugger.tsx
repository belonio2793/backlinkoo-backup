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
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'automation_campaigns')
        .eq('table_schema', 'public');

      if (error) {
        addLog(`Schema check failed: ${error.message}`, 'error');
        return false;
      }

      addLog(`Found ${columns?.length || 0} columns in automation_campaigns table`);
      
      const arrayColumns = columns?.filter(col => 
        col.column_name === 'keywords' || 
        col.column_name === 'anchor_texts' || 
        col.column_name === 'target_sites_used' ||
        col.column_name === 'published_articles'
      ) || [];

      addLog('Array columns found:');
      arrayColumns.forEach(col => {
        addLog(`  ${col.column_name}: ${col.data_type}`);
      });

      return true;
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
      // Create minimal campaign data for testing
      const testData = {
        name: campaignParams.name,
        engine_type: 'web2_platforms',
        keywords: campaignParams.keywords,
        anchor_texts: campaignParams.anchor_texts,
        target_url: campaignParams.target_url,
        user_id: campaignParams.user_id,
        status: 'draft',
        auto_start: false
      };

      addLog('Test data prepared:');
      addLog(`  name: ${typeof testData.name}`);
      addLog(`  keywords: ${Array.isArray(testData.keywords)} (${testData.keywords?.length || 0} items)`);
      addLog(`  anchor_texts: ${Array.isArray(testData.anchor_texts)} (${testData.anchor_texts?.length || 0} items)`);
      addLog(`  target_url: ${typeof testData.target_url}`);

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(testData)
        .select()
        .single();

      if (error) {
        addLog(`Direct insertion failed: ${error.message}`, 'error');
        addLog(`Error details: ${JSON.stringify({ details: error.details, hint: error.hint, code: error.code })}`);
        return false;
      }

      addLog(`✅ Direct insertion successful! ID: ${data.id}`, 'success');
      
      // Clean up test data
      await supabase.from('automation_campaigns').delete().eq('id', data.id);
      addLog('Test data cleaned up');
      
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
