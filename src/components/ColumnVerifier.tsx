import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, Database } from 'lucide-react';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export function ColumnVerifier() {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredColumns = ['started_at', 'completed_at', 'auto_start'];

  const checkColumns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to query the columns directly
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'automation_campaigns')
        .eq('table_schema', 'public')
        .in('column_name', requiredColumns);

      if (error) {
        throw error;
      }

      setColumns(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Column check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testTableAccess = async () => {
    try {
      // Test if we can access the automation_campaigns table at all
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);

      if (error) {
        setError(`Table access failed: ${error.message}`);
      } else {
        setError(null);
        console.log('Table access successful');
      }
    } catch (err: any) {
      setError(`Table access error: ${err.message}`);
    }
  };

  useEffect(() => {
    checkColumns();
    testTableAccess();
  }, []);

  const existingColumns = columns.map(col => col.column_name);
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Column Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkColumns} disabled={loading}>
            {loading ? 'Checking...' : 'Check Columns'}
          </Button>
          <Button onClick={testTableAccess} variant="outline">
            Test Table Access
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 font-medium">Error:</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Required Columns Status:</h4>
          {requiredColumns.map(colName => {
            const exists = existingColumns.includes(colName);
            const columnInfo = columns.find(c => c.column_name === colName);
            
            return (
              <div key={colName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono">{colName}</span>
                  {columnInfo && (
                    <span className="text-xs text-gray-500">
                      ({columnInfo.data_type})
                    </span>
                  )}
                </div>
                <Badge variant={exists ? 'default' : 'destructive'}>
                  {exists ? 'EXISTS' : 'MISSING'}
                </Badge>
              </div>
            );
          })}
        </div>

        {missingColumns.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Missing {missingColumns.length} column(s): {missingColumns.join(', ')}
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Run the SQL fix script in Supabase to add these columns.
            </p>
          </div>
        )}

        {missingColumns.length === 0 && columns.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800 font-medium">
                All required columns exist!
              </span>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Found columns:</strong> {existingColumns.length > 0 ? existingColumns.join(', ') : 'None'}</p>
          <p><strong>Table:</strong> automation_campaigns</p>
          <p><strong>Schema:</strong> public</p>
        </div>
      </CardContent>
    </Card>
  );
}
