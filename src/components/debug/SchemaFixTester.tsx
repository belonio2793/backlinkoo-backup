import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2, Wrench, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { fixedErrorResolver } from '@/services/fixedErrorResolver';
import { useAuth } from '@/hooks/useAuth';

export function SchemaFixTester() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
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

  const testArrayInsertion = async () => {
    if (!user) {
      toast.error('Please sign in to test array insertion');
      return;
    }

    setTesting(true);
    addStatus('🧪 Testing array insertion...');

    try {
      const success = await fixedErrorResolver.testArrayInsertion();
      
      if (success) {
        addStatus('✅ Array insertion test PASSED', 'success');
        toast.success('Schema is working correctly!');
      } else {
        addStatus('❌ Array insertion test FAILED', 'error');
        toast.error('Schema still has issues');
      }

    } catch (error) {
      addStatus(`❌ Test failed with exception: ${error}`, 'error');
      toast.error('Test encountered an error');
    } finally {
      setTesting(false);
    }
  };

  const fixArrayColumns = async () => {
    if (!user) {
      toast.error('Please sign in to fix columns');
      return;
    }

    setFixing(true);
    addStatus('🔧 Starting array column fix...');

    try {
      const resolved = await fixedErrorResolver.resolveSpecificError('expected JSON array');
      
      if (resolved) {
        addStatus('✅ Array columns fixed successfully', 'success');
        toast.success('Schema has been fixed!');
        
        // Run test after fix
        addStatus('🧪 Running post-fix test...');
        const testPassed = await fixedErrorResolver.testArrayInsertion();
        
        if (testPassed) {
          addStatus('✅ Post-fix test PASSED - schema is now working!', 'success');
        } else {
          addStatus('❌ Post-fix test FAILED - may need manual intervention', 'error');
        }
      } else {
        addStatus('❌ Failed to fix array columns', 'error');
        toast.error('Fix failed - check logs for details');
      }

    } catch (error) {
      addStatus(`❌ Fix failed with exception: ${error}`, 'error');
      toast.error('Fix encountered an error');
    } finally {
      setFixing(false);
    }
  };

  const quickDiagnosis = async () => {
    if (!user) {
      toast.error('Please sign in to run diagnosis');
      return;
    }

    addStatus('🔍 Running quick diagnosis...');
    
    try {
      // Try to resolve a generic "expected JSON array" error to see what happens
      addStatus('Checking if TEXT[] fix is needed...');
      
      const resolved = await fixedErrorResolver.resolveSpecificError('expected JSON array');
      
      if (resolved) {
        addStatus('✅ Schema appears to be correct or was fixed', 'success');
      } else {
        addStatus('⚠️ Schema may need manual intervention', 'error');
      }

      // Run test
      addStatus('Running test insertion...');
      const testPassed = await fixedErrorResolver.testArrayInsertion();
      
      if (testPassed) {
        addStatus('✅ Array insertion test PASSED', 'success');
      } else {
        addStatus('❌ Array insertion test FAILED', 'error');
      }

    } catch (error) {
      addStatus(`❌ Diagnosis failed: ${error}`, 'error');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Schema Fix Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test and fix "expected JSON array" errors in automation_campaigns table
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            This tool tests and fixes TEXT to TEXT[] column type mismatches
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={quickDiagnosis}
            disabled={testing || fixing || !user}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Quick Diagnosis
          </Button>
          
          <Button
            onClick={testArrayInsertion}
            disabled={testing || fixing || !user}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test Arrays
          </Button>
          
          <Button
            onClick={fixArrayColumns}
            disabled={testing || fixing || !user}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {fixing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            Fix Columns
          </Button>
          
          <Button
            onClick={clearStatus}
            variant="ghost"
            disabled={testing || fixing}
          >
            Clear Log
          </Button>
        </div>

        {!user && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            Please sign in to use the schema fix tools
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <div className="bg-white border rounded p-3 h-64 overflow-y-auto font-mono text-xs">
            {status.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click a button above to start.</div>
            ) : (
              status.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Quick Diagnosis:</strong> Checks and attempts to fix schema issues</p>
          <p><strong>Test Arrays:</strong> Tests if array insertion works without fixing</p>
          <p><strong>Fix Columns:</strong> Actively fixes TEXT to TEXT[] column type mismatches</p>
        </div>
      </CardContent>
    </Card>
  );
}
