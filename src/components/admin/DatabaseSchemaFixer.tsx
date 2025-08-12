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
  ExternalLink,
  Wrench
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ColumnInfo {
  name: string;
  exists: boolean;
  dataType?: string;
  sqlType: string;
}

export function DatabaseSchemaFixer() {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [hasExecSql, setHasExecSql] = useState(false);

  const requiredColumns: ColumnInfo[] = [
    { name: 'started_at', exists: false, sqlType: 'TIMESTAMPTZ NULL' },
    { name: 'completed_at', exists: false, sqlType: 'TIMESTAMPTZ NULL' },
    { name: 'auto_start', exists: false, sqlType: 'BOOLEAN DEFAULT false' }
  ];

  const checkDatabaseSchema = async () => {
    setIsChecking(true);
    
    try {
      // Check if exec_sql function exists
      try {
        const { error: execSqlError } = await supabase.rpc('exec_sql', {
          query: 'SELECT 1 as test;'
        });
        
        setHasExecSql(!execSqlError);
        
        if (!execSqlError) {
          // Use exec_sql to check columns
          const { data: columnData, error } = await supabase.rpc('exec_sql', {
            query: `
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = 'automation_campaigns'
              AND table_schema = 'public'
              AND column_name IN ('started_at', 'completed_at', 'auto_start')
              ORDER BY column_name;
            `
          });

          if (error) throw error;

          const existingColumns = columnData || [];
          const updatedColumns = requiredColumns.map(req => {
            const existing = existingColumns.find(col => col.column_name === req.name);
            return {
              ...req,
              exists: !!existing,
              dataType: existing ? `${existing.data_type}${existing.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}` : undefined
            };
          });

          setColumns(updatedColumns);
        } else {
          throw new Error('exec_sql function not available');
        }
      } catch (execSqlError) {
        setHasExecSql(false);
        
        // Fallback: test each column by trying to select it
        const updatedColumns = await Promise.all(
          requiredColumns.map(async (req) => {
            try {
              const { error } = await supabase
                .from('automation_campaigns')
                .select(req.name)
                .limit(1);
              
              return {
                ...req,
                exists: !error,
                dataType: error ? undefined : 'unknown'
              };
            } catch {
              return {
                ...req,
                exists: false,
                dataType: undefined
              };
            }
          })
        );

        setColumns(updatedColumns);
      }

      setLastCheck(new Date());
      
    } catch (error: any) {
      console.error('Database check failed:', error);
      toast.error('Failed to check database schema', {
        description: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const attemptAutomaticFix = async () => {
    if (!hasExecSql) {
      toast.error('Cannot auto-fix', {
        description: 'exec_sql function is required for automatic fixes. Please use manual SQL method.'
      });
      return;
    }

    setIsFixing(true);
    
    try {
      const missingColumns = columns.filter(col => !col.exists);
      
      if (missingColumns.length === 0) {
        toast.info('No missing columns to fix');
        return;
      }

      // Build SQL statements
      const statements = [
        // Ensure exec_sql function exists first
        `CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    record_count integer;
BEGIN
    EXECUTE query;
    IF LOWER(TRIM(query)) LIKE 'select%' THEN
        EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::jsonb);
    ELSE
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RETURN jsonb_build_object('success', true, 'rows_affected', record_count);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM, 'success', false);
END;
$$;`,
        
        // Add missing columns
        ...missingColumns.map(col => 
          `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col.name} ${col.sqlType};`
        ),
        
        // Create indexes
        'CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);',
        'CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);'
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { query: statement });
          if (error) {
            console.error('Statement failed:', error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Statement execution failed:', err);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success('Database schema fixed successfully!', {
          description: `Added ${missingColumns.length} missing columns`
        });
      } else {
        toast.warning('Partial fix completed', {
          description: `${successCount} operations succeeded, ${errorCount} failed. Manual intervention may be required.`
        });
      }

      // Re-check to verify
      await checkDatabaseSchema();

    } catch (error: any) {
      console.error('Auto-fix failed:', error);
      toast.error('Auto-fix failed', {
        description: error.message
      });
    } finally {
      setIsFixing(false);
    }
  };

  const copyManualSQL = async () => {
    const missingColumns = columns.filter(col => !col.exists);
    
    const sql = `-- Emergency Database Schema Fix
-- Copy and paste this into your Supabase SQL Editor
-- https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/templates

-- Step 1: Create exec_sql function (if not exists)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    record_count integer;
BEGIN
    EXECUTE query;
    IF LOWER(TRIM(query)) LIKE 'select%' THEN
        EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::jsonb);
    ELSE
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RETURN jsonb_build_object('success', true, 'rows_affected', record_count);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM, 'success', false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- Step 2: Add missing columns
${missingColumns.map(col => 
  `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col.name} ${col.sqlType};`
).join('\n')}

-- Step 3: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);

-- Step 4: Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Step 5: Test exec_sql function
SELECT public.exec_sql('SELECT COUNT(*) as campaign_count FROM automation_campaigns');`;

    try {
      await navigator.clipboard.writeText(sql);
      toast.success('SQL copied to clipboard!', {
        description: 'Paste this into your Supabase SQL editor and run it'
      });
    } catch (error) {
      console.log('Manual SQL:', sql);
      toast.error('Failed to copy to clipboard', {
        description: 'Check the console for the SQL to copy manually'
      });
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkDatabaseSchema();
  }, []);

  const missingCount = columns.filter(col => !col.exists).length;
  const allColumnsExist = missingCount === 0 && columns.length > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Schema Fixer
          {allColumnsExist ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : missingCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : null}
        </CardTitle>
        <CardDescription>
          Fix missing columns in automation_campaigns table
          {lastCheck && (
            <span className="block text-xs text-gray-500 mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Issue Alert */}
        {missingCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">
                ❌ Missing columns: started_at, completed_at, auto_start
              </div>
              <div className="text-sm">
                These columns are required for automation campaigns to function properly.
                Campaign creation, tracking, and auto-start features will not work without them.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Column Status */}
        {columns.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Column Status:</h4>
            <div className="grid grid-cols-1 gap-3">
              {columns.map((col) => (
                <div key={col.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {col.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <span className="font-mono font-medium">{col.name}</span>
                      <div className="text-sm text-gray-600">
                        Expected: {col.sqlType}
                        {col.dataType && (
                          <span className="block">Current: {col.dataType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={col.exists ? 'default' : 'destructive'}>
                    {col.exists ? 'EXISTS' : 'MISSING'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {allColumnsExist && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ All required columns exist! Your automation system should work correctly.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={checkDatabaseSchema}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isChecking ? 'Checking...' : 'Check Schema'}
          </Button>

          {missingCount > 0 && hasExecSql && (
            <Button 
              onClick={attemptAutomaticFix}
              disabled={isFixing}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              {isFixing ? 'Fixing...' : 'Auto Fix'}
            </Button>
          )}

          <Button 
            variant="secondary"
            onClick={copyManualSQL}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Manual SQL
          </Button>

          <Button 
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/templates', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase
          </Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">exec_sql function:</span>
            <Badge variant={hasExecSql ? 'default' : 'secondary'}>
              {hasExecSql ? 'Available' : 'Missing'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Missing columns:</span>
            <Badge variant={missingCount === 0 ? 'default' : 'destructive'}>
              {missingCount}
            </Badge>
          </div>
        </div>

        {/* Instructions */}
        {missingCount > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">How to fix the missing columns:</div>
              <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                <li>Click "Copy Manual SQL" to get the fix script</li>
                <li>Click "Open Supabase" to access your database</li>
                <li>Go to SQL Editor and paste the copied SQL</li>
                <li>Run the SQL script</li>
                <li>Come back here and click "Check Schema" to verify</li>
              </ol>
              <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                <strong>💡 Tip:</strong> The manual SQL method is recommended as it provides the most reliable fix.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default DatabaseSchemaFixer;
