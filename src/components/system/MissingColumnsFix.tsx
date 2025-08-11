import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Database,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debugLog } from '@/services/activeErrorLogger';

interface ColumnStatus {
  name: string;
  exists: boolean;
  dataType?: string;
  isNullable?: boolean;
}

export function MissingColumnsFix() {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [columnStatus, setColumnStatus] = useState<ColumnStatus[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [hasExecSql, setHasExecSql] = useState(false);

  const requiredColumns = [
    { name: 'started_at', type: 'TIMESTAMPTZ NULL' },
    { name: 'completed_at', type: 'TIMESTAMPTZ NULL' },
    { name: 'auto_start', type: 'BOOLEAN DEFAULT false NOT NULL' }
  ];

  const checkColumns = async () => {
    setIsChecking(true);
    const metricId = debugLog.startOperation('database_fix', 'check_missing_columns');
    
    try {
      // First check if exec_sql function exists
      try {
        const { error: execSqlError } = await supabase.rpc('exec_sql', {
          query: 'SELECT 1;'
        });
        
        setHasExecSql(!execSqlError);
        
        if (!execSqlError) {
          // Use exec_sql to check columns
          const { data: columnData, error } = await supabase.rpc('exec_sql', {
            query: `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_name = 'automation_campaigns'
              AND table_schema = 'public'
              AND column_name IN ('started_at', 'completed_at', 'auto_start')
              ORDER BY column_name;
            `
          });

          if (error) throw error;

          const existingColumns = columnData || [];
          const status = requiredColumns.map(req => {
            const existing = existingColumns.find(col => col.column_name === req.name);
            return {
              name: req.name,
              exists: !!existing,
              dataType: existing?.data_type,
              isNullable: existing?.is_nullable === 'YES'
            };
          });

          setColumnStatus(status);
        } else {
          throw new Error('exec_sql function not available');
        }
      } catch (execSqlError) {
        debugLog.warn('database_fix', 'check_missing_columns', 'exec_sql not available, using fallback');
        setHasExecSql(false);
        
        // Fallback: test each column by trying to select it
        const status = await Promise.all(
          requiredColumns.map(async (req) => {
            try {
              const { error } = await supabase
                .from('automation_campaigns')
                .select(req.name)
                .limit(1);
              
              return {
                name: req.name,
                exists: !error,
                dataType: undefined,
                isNullable: undefined
              };
            } catch {
              return {
                name: req.name,
                exists: false,
                dataType: undefined,
                isNullable: undefined
              };
            }
          })
        );

        setColumnStatus(status);
      }

      setLastCheck(new Date());
      debugLog.endOperation(metricId, true, { 
        columnsChecked: columnStatus.length,
        missingCount: columnStatus.filter(c => !c.exists).length 
      });
      
    } catch (error: any) {
      debugLog.error('database_fix', 'check_missing_columns', error);
      debugLog.endOperation(metricId, false, { error: error.message });
      toast.error('Failed to check columns', {
        description: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const attemptAutoFix = async () => {
    if (!hasExecSql) {
      toast.error('Cannot auto-fix', {
        description: 'exec_sql function is required for automatic fixes'
      });
      return;
    }

    setIsFixing(true);
    const metricId = debugLog.startOperation('database_fix', 'auto_fix_columns');
    
    try {
      const missingColumns = columnStatus.filter(col => !col.exists);
      
      if (missingColumns.length === 0) {
        toast.info('No missing columns to fix');
        return;
      }

      const alterStatements = missingColumns.map(col => {
        const reqCol = requiredColumns.find(r => r.name === col.name);
        return `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col.name} ${reqCol?.type};`;
      }).join('\n');

      const { error } = await supabase.rpc('exec_sql', {
        query: alterStatements
      });

      if (error) throw error;

      debugLog.info('database_fix', 'auto_fix_columns', 'Columns added successfully', {
        addedColumns: missingColumns.map(c => c.name)
      });

      toast.success('Columns added successfully!', {
        description: `Added ${missingColumns.length} missing columns`
      });

      // Re-check to verify
      await checkColumns();
      debugLog.endOperation(metricId, true, { columnsAdded: missingColumns.length });

    } catch (error: any) {
      debugLog.error('database_fix', 'auto_fix_columns', error);
      debugLog.endOperation(metricId, false, { error: error.message });
      toast.error('Auto-fix failed', {
        description: error.message
      });
    } finally {
      setIsFixing(false);
    }
  };

  const copyManualSql = async () => {
    const missingColumns = columnStatus.filter(col => !col.exists);
    
    if (missingColumns.length === 0) {
      toast.info('No missing columns to fix');
      return;
    }

    const sql = `-- Fix Missing Columns
-- Run this in your Supabase SQL Editor

${!hasExecSql ? `-- Step 1: Create exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('rows_affected', result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

` : ''}-- Step ${hasExecSql ? '1' : '2'}: Add missing columns
${missingColumns.map(col => {
  const reqCol = requiredColumns.find(r => r.name === col.name);
  return `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col.name} ${reqCol?.type};`;
}).join('\n')}

-- Step ${hasExecSql ? '2' : '3'}: Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;`;

    try {
      await navigator.clipboard.writeText(sql);
      toast.success('SQL copied to clipboard!', {
        description: 'Paste this into your Supabase SQL editor'
      });
      debugLog.info('database_fix', 'copy_manual_sql', 'SQL copied to clipboard');
    } catch (error) {
      debugLog.error('database_fix', 'copy_manual_sql', error);
      toast.error('Failed to copy SQL', {
        description: 'Please copy the SQL manually from the console'
      });
      console.log('SQL to run manually:', sql);
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkColumns();
  }, []);

  const missingCount = columnStatus.filter(col => !col.exists).length;
  const allColumnsExist = missingCount === 0 && columnStatus.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Missing Database Columns
          {allColumnsExist ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : missingCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : null}
        </CardTitle>
        <CardDescription>
          Check and fix missing columns in automation_campaigns table
          {lastCheck && (
            <span className="block text-xs text-gray-500 mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Column Status */}
        {columnStatus.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Column Status:</h4>
            <div className="grid grid-cols-1 gap-2">
              {columnStatus.map((col) => (
                <div key={col.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {col.exists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-mono text-sm">{col.name}</span>
                    {col.dataType && (
                      <span className="text-xs text-gray-500">({col.dataType})</span>
                    )}
                  </div>
                  <Badge variant={col.exists ? 'default' : 'destructive'}>
                    {col.exists ? 'EXISTS' : 'MISSING'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Alert */}
        {allColumnsExist ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All required columns exist! Your automation system should work correctly.
            </AlertDescription>
          </Alert>
        ) : missingCount > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">
                {missingCount} column{missingCount > 1 ? 's' : ''} missing from automation_campaigns table
              </div>
              <div className="text-sm">
                Campaign functionality will not work until these columns are added.
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={checkColumns}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isChecking ? 'Checking...' : 'Check Columns'}
          </Button>

          {missingCount > 0 && hasExecSql && (
            <Button 
              onClick={attemptAutoFix}
              disabled={isFixing}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isFixing ? 'Fixing...' : 'Auto Fix'}
            </Button>
          )}

          {missingCount > 0 && (
            <Button 
              variant="secondary"
              onClick={copyManualSql}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy SQL Fix
            </Button>
          )}

          <Button 
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase
          </Button>
        </div>

        {/* Instructions */}
        {missingCount > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">How to fix:</div>
              <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                {hasExecSql ? (
                  <li>Click "Auto Fix" to add columns automatically</li>
                ) : (
                  <li>Click "Copy SQL Fix" and run the SQL in Supabase SQL editor</li>
                )}
                <li>Click "Check Columns" to verify the fix</li>
                <li>Refresh your automation page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Exec SQL Status */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>exec_sql function:</span>
          <Badge variant={hasExecSql ? 'default' : 'secondary'}>
            {hasExecSql ? 'Available' : 'Missing'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default MissingColumnsFix;
