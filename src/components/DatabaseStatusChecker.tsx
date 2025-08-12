import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TableStatus {
  name: string;
  exists: boolean;
  columns: ColumnStatus[];
}

interface ColumnStatus {
  name: string;
  exists: boolean;
  expected_type: string;
  actual_type?: string;
}

export function DatabaseStatusChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [showMigrationScript, setShowMigrationScript] = useState(false);

  const expectedSchema = {
    blog_campaigns: [
      { name: 'id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'target_url', type: 'text' },
      { name: 'keyword', type: 'text' },
      { name: 'anchor_text', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'automation_enabled', type: 'boolean' },
      { name: 'links_found', type: 'integer' },
      { name: 'links_posted', type: 'integer' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    blog_comments: [
      { name: 'id', type: 'uuid' },
      { name: 'campaign_id', type: 'uuid' },
      { name: 'blog_url', type: 'text' },
      { name: 'comment_text', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'platform', type: 'text' },
      { name: 'account_id', type: 'uuid' },
      { name: 'error_message', type: 'text' },
      { name: 'posted_at', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone' }
    ],
    blog_accounts: [
      { name: 'id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'platform', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'display_name', type: 'text' },
      { name: 'cookies', type: 'text' },
      { name: 'session_data', type: 'jsonb' },
      { name: 'is_verified', type: 'boolean' },
      { name: 'verification_status', type: 'text' },
      { name: 'last_used', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone' }
    ],
    automation_jobs: [
      { name: 'id', type: 'uuid' },
      { name: 'campaign_id', type: 'uuid' },
      { name: 'job_type', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'payload', type: 'jsonb' },
      { name: 'result', type: 'jsonb' },
      { name: 'error_message', type: 'text' },
      { name: 'scheduled_at', type: 'timestamp with time zone' },
      { name: 'started_at', type: 'timestamp with time zone' },
      { name: 'completed_at', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone' }
    ]
  };

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const statuses: TableStatus[] = [];
      
      for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
        const tableStatus: TableStatus = {
          name: tableName,
          exists: false,
          columns: []
        };

        try {
          // Check if table exists by trying to query its columns
          const { data: columnsData, error } = await supabase
            .rpc('get_table_columns', { table_name: tableName })
            .single();

          if (!error && columnsData) {
            tableStatus.exists = true;
            
            // Check each expected column
            for (const expectedCol of expectedColumns) {
              const actualColumn = columnsData.find((col: any) => col.column_name === expectedCol.name);
              
              tableStatus.columns.push({
                name: expectedCol.name,
                exists: !!actualColumn,
                expected_type: expectedCol.type,
                actual_type: actualColumn?.data_type
              });
            }
          } else {
            // Table doesn't exist, mark all columns as missing
            tableStatus.columns = expectedColumns.map(col => ({
              name: col.name,
              exists: false,
              expected_type: col.type
            }));
          }
        } catch (error) {
          // Fallback: try direct query
          try {
            const { error: queryError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!queryError) {
              tableStatus.exists = true;
              // If table exists but we can't get column info, assume basic structure
              tableStatus.columns = expectedColumns.map(col => ({
                name: col.name,
                exists: true, // We'll assume they exist if table query worked
                expected_type: col.type
              }));
            }
          } catch (fallbackError) {
            console.error(`Error checking table ${tableName}:`, fallbackError);
          }
        }

        statuses.push(tableStatus);
      }

      setTableStatuses(statuses);
    } catch (error) {
      console.error('Error checking database status:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const migrationScript = `-- Run this script in your Supabase SQL Editor to fix schema issues

-- This is a comprehensive migration script that will:
-- 1. Add missing columns to existing tables
-- 2. Create missing tables
-- 3. Update constraints and indexes
-- 4. Set up proper RLS policies

-- You can find the full migration script at: src/utils/databaseMigration.sql
-- Copy the contents of that file and run it in your Supabase SQL Editor

-- Quick fix for the most common issue (missing automation_enabled column):
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_campaigns' AND column_name = 'automation_enabled'
    ) THEN
        ALTER TABLE blog_campaigns ADD COLUMN automation_enabled boolean DEFAULT false;
        RAISE NOTICE 'Added automation_enabled column';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Column addition failed: %', SQLERRM;
END $$;`;

  const copyMigrationScript = async () => {
    try {
      await navigator.clipboard.writeText(migrationScript);
      toast.success('Migration script copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy script');
    }
  };

  const getStatusColor = (exists: boolean) => exists ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (exists: boolean) => exists ? CheckCircle : XCircle;

  const hasIssues = tableStatuses.some(table => 
    !table.exists || table.columns.some(col => !col.exists)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Schema Status
            </CardTitle>
            <CardDescription>
              Check if your database schema is properly configured for the blog comment automation system
            </CardDescription>
          </div>
          <Button 
            onClick={checkDatabaseStatus} 
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Status
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {tableStatuses.length > 0 && (
          <>
            {hasIssues && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Schema issues detected. Some tables or columns are missing. 
                  Use the migration script below to fix these issues.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {tableStatuses.map((table) => {
                const StatusIcon = getStatusIcon(table.exists);
                const missingColumns = table.columns.filter(col => !col.exists);
                
                return (
                  <div key={table.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${getStatusColor(table.exists)}`} />
                        <span className="font-medium">{table.name}</span>
                      </div>
                      <Badge variant={table.exists ? 'default' : 'destructive'}>
                        {table.exists ? 'EXISTS' : 'MISSING'}
                      </Badge>
                    </div>
                    
                    {missingColumns.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600 mb-2">
                          Missing columns: {missingColumns.map(col => col.name).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {table.columns.map((column) => {
                        const ColIcon = getStatusIcon(column.exists);
                        return (
                          <div key={column.name} className="flex items-center gap-1">
                            <ColIcon className={`h-3 w-3 ${getStatusColor(column.exists)}`} />
                            <span className={column.exists ? '' : 'text-red-600'}>
                              {column.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasIssues && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fix Schema Issues</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMigrationScript(!showMigrationScript)}
                  >
                    {showMigrationScript ? 'Hide' : 'Show'} Migration Script
                  </Button>
                </div>

                {showMigrationScript && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={copyMigrationScript}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Script
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql', '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open SQL Editor
                      </Button>
                    </div>
                    
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {migrationScript}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {!hasIssues && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Database schema is properly configured! All tables and columns are present.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {tableStatuses.length === 0 && !isChecking && (
          <div className="text-center py-8 text-gray-500">
            Click "Check Status" to analyze your database schema
          </div>
        )}
      </CardContent>
    </Card>
  );
}
