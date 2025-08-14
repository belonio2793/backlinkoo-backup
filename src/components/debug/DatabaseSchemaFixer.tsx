import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DatabaseSchemaFixer() {
  const { user } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  const addStatus = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    setStatus(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const clearStatus = () => {
    setStatus([]);
  };

  const testAndFixSchema = async () => {
    if (!user) {
      toast.error('Please sign in to test schema');
      return;
    }

    setFixing(true);
    clearStatus();
    addStatus('🔧 Starting database schema test and fix...');

    try {
      // Step 1: Test basic table access
      addStatus('Testing basic table access...');
      const { data: basicTest, error: basicError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);

      if (basicError) {
        addStatus(`Basic table access failed: ${basicError.message}`, 'error');
        addStatus('The automation_campaigns table may not exist or you lack permissions', 'error');
        return;
      }

      addStatus('✅ Basic table access successful', 'success');

      // Step 2: Test individual required columns
      addStatus('Testing required columns...');
      const requiredColumns = [
        'name', 'engine_type', 'user_id', 'status', 'auto_start',
        'keywords', 'anchor_texts', 'target_url',
        'links_built', 'available_sites', 'target_sites_used', 'published_articles',
        'started_at', 'completed_at', 'current_platform', 'execution_progress'
      ];

      const missingColumns = [];
      
      for (const column of requiredColumns) {
        try {
          const { error: columnError } = await supabase
            .from('automation_campaigns')
            .select(column)
            .limit(1);

          if (columnError) {
            addStatus(`  ❌ ${column}: Missing or inaccessible`, 'error');
            missingColumns.push(column);
          } else {
            addStatus(`  ✅ ${column}: OK`);
          }
        } catch (error) {
          addStatus(`  ❌ ${column}: Error - ${error}`, 'error');
          missingColumns.push(column);
        }
      }

      if (missingColumns.length > 0) {
        addStatus(`Found ${missingColumns.length} missing columns`, 'error');
        addStatus('Attempting to create missing columns...', 'info');

        // Try to create missing columns using a direct SQL approach
        const sqlStatements = [];
        
        missingColumns.forEach(column => {
          switch (column) {
            case 'keywords':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS keywords TEXT[];');
              break;
            case 'anchor_texts':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS anchor_texts TEXT[];');
              break;
            case 'target_sites_used':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT \\'{}\\';');
              break;
            case 'published_articles':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT \\'[]\\';');
              break;
            case 'links_built':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;');
              break;
            case 'available_sites':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;');
              break;
            case 'started_at':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;');
              break;
            case 'completed_at':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;');
              break;
            case 'current_platform':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT;');
              break;
            case 'execution_progress':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT \\'{}\\';');
              break;
            case 'auto_start':
              sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
              break;
            default:
              if (!['name', 'engine_type', 'user_id', 'status', 'target_url'].includes(column)) {
                sqlStatements.push(`ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${column} TEXT;`);
              }
          }
        });

        if (sqlStatements.length > 0) {
          addStatus('SQL statements to execute:');
          sqlStatements.forEach(sql => addStatus(`  ${sql}`));
          
          addStatus('⚠️ These columns need to be added manually in your Supabase dashboard:', 'error');
          addStatus('1. Go to your Supabase dashboard', 'info');
          addStatus('2. Navigate to Table Editor > automation_campaigns', 'info');
          addStatus('3. Add the missing columns with the correct data types', 'info');
          addStatus('4. Or run the SQL statements above in the SQL Editor', 'info');
        }
      } else {
        addStatus('✅ All required columns present', 'success');
      }

      // Step 3: Test array insertion specifically
      addStatus('Testing array field insertion...');
      const testData = {
        name: 'Array Test - DELETE ME',
        engine_type: 'web2_platforms',
        user_id: user.id,
        status: 'draft',
        auto_start: false,
        keywords: ['test', 'keyword'],
        anchor_texts: ['test anchor', 'click here'],
        target_url: 'https://example.com',
        links_built: 0,
        available_sites: 2,
        target_sites_used: [],
        published_articles: []
      };

      addStatus('Attempting to insert test data with arrays...');
      const { data: testResult, error: testError } = await supabase
        .from('automation_campaigns')
        .insert(testData)
        .select('id, keywords, anchor_texts')
        .single();

      if (testError) {
        addStatus(`Array test insertion failed: ${testError.message}`, 'error');
        
        if (testError.message.includes('expected JSON array')) {
          addStatus('🎯 Found the "expected JSON array" issue!', 'error');
          addStatus('This suggests the columns exist but have wrong data types', 'error');
          addStatus('The keywords or anchor_texts columns may be TEXT instead of TEXT[]', 'error');
        }
        
        addStatus('Error details:', 'error');
        addStatus(`  Code: ${testError.code}`, 'error');
        addStatus(`  Details: ${testError.details}`, 'error');
        addStatus(`  Hint: ${testError.hint}`, 'error');
      } else {
        addStatus(`✅ Array test successful! ID: ${testResult.id}`, 'success');
        addStatus(`Retrieved keywords: ${JSON.stringify(testResult.keywords)}`);
        addStatus(`Retrieved anchor_texts: ${JSON.stringify(testResult.anchor_texts)}`);
        
        // Clean up
        await supabase.from('automation_campaigns').delete().eq('id', testResult.id);
        addStatus('Test data cleaned up');
      }

      // Step 4: Provide recommendations
      addStatus('📋 Schema Analysis Complete', 'info');
      if (missingColumns.length > 0 || testError) {
        addStatus('❌ Issues found that need manual attention', 'error');
        toast.error('Schema issues found - check the log for details');
      } else {
        addStatus('✅ Database schema appears to be working correctly', 'success');
        toast.success('Database schema is healthy!');
      }

    } catch (error) {
      addStatus(`Schema test failed: ${error}`, 'error');
      toast.error('Schema test encountered an error');
    } finally {
      setFixing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Database Schema Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            This tool tests and diagnoses the automation_campaigns table schema issues
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testAndFixSchema}
            disabled={fixing || !user}
            className="flex items-center gap-2"
          >
            {fixing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Test & Diagnose Schema
          </Button>
          <Button
            onClick={clearStatus}
            variant="outline"
            disabled={fixing}
          >
            Clear Log
          </Button>
        </div>

        {!user && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            Please sign in to test the database schema
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Schema Test Results:</h4>
          <div className="bg-white border rounded p-3 h-64 overflow-y-auto font-mono text-xs">
            {status.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click "Test & Diagnose Schema" to start.</div>
            ) : (
              status.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}