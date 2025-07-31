/**
 * Database Initializer Component
 * Handles missing database tables and provides manual initialization
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Terminal,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
  description: string;
}

export function DatabaseInitializer() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const requiredTables = [
    {
      name: 'admin_environment_variables',
      description: 'Stores API keys and environment variables for admin configuration',
      checkQuery: 'SELECT 1 FROM admin_environment_variables LIMIT 1',
      createSQL: `
        CREATE TABLE IF NOT EXISTS admin_environment_variables (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          is_secret BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);
        ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow authenticated admin access" ON admin_environment_variables
          FOR ALL USING (true);
      `
    }
  ];

  const checkTables = async () => {
    setIsChecking(true);
    const statuses: TableStatus[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        statuses.push({
          name: table.name,
          exists: !error,
          error: error?.message,
          description: table.description
        });
      } catch (err) {
        statuses.push({
          name: table.name,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          description: table.description
        });
      }
    }

    setTableStatuses(statuses);
    setIsChecking(false);
  };

  const initializeTables = async () => {
    setIsInitializing(true);
    
    try {
      toast({
        title: 'Initializing Database',
        description: 'Creating required admin tables...'
      });

      // For missing tables, we'll create them using localStorage as fallback
      // since we can't execute DDL statements directly in the browser
      
      const missingTables = tableStatuses.filter(t => !t.exists);
      
      if (missingTables.length > 0) {
        // Initialize localStorage fallbacks
        for (const table of missingTables) {
          if (table.name === 'admin_environment_variables') {
            // Initialize with empty array if not exists
            if (!localStorage.getItem('admin_env_vars')) {
              localStorage.setItem('admin_env_vars', JSON.stringify([]));
            }
          }
        }

        toast({
          title: 'Fallback Initialized',
          description: `Initialized localStorage fallback for ${missingTables.length} missing tables. Database tables need to be created by admin.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Database Ready',
          description: 'All required tables are available'
        });
      }

      await checkTables();

    } catch (error) {
      console.error('Database initialization failed:', error);
      toast({
        title: 'Initialization Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusBadge = (exists: boolean) => {
    return exists 
      ? <Badge className="bg-green-100 text-green-800">Available</Badge>
      : <Badge className="bg-red-100 text-red-800">Missing</Badge>;
  };

  const getStatusIcon = (exists: boolean) => {
    return exists 
      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
      : <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const missingTablesCount = tableStatuses.filter(t => !t.exists).length;
  const allTablesExist = tableStatuses.length > 0 && missingTablesCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <span>Database Status</span>
            <p className="text-sm font-normal text-muted-foreground">
              Check and initialize required admin database tables
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkTables} 
            disabled={isChecking} 
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Tables'}
          </Button>
          
          {missingTablesCount > 0 && (
            <Button 
              onClick={initializeTables} 
              disabled={isInitializing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className={`h-4 w-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
              {isInitializing ? 'Initializing...' : 'Initialize Fallbacks'}
            </Button>
          )}
        </div>

        {tableStatuses.length === 0 ? (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Click "Check Tables" to verify database status
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {/* Overall Status */}
            <Alert className={allTablesExist ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {allTablesExist ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className={allTablesExist ? 'text-green-800' : 'text-red-800'}>
                {allTablesExist 
                  ? '✅ All required database tables are available'
                  : `❌ ${missingTablesCount} of ${tableStatuses.length} required tables are missing`
                }
              </AlertDescription>
            </Alert>

            {/* Individual Table Status */}
            <div className="space-y-2">
              {tableStatuses.map((table) => (
                <div key={table.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(table.exists)}
                      <span className="font-medium">{table.name}</span>
                    </div>
                    {getStatusBadge(table.exists)}
                  </div>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                  {table.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                      Error: {table.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Instructions for missing tables */}
            {missingTablesCount > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Terminal className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>Database tables missing:</strong> To fully resolve this, database tables need to be created via Supabase admin panel or migration scripts. 
                  Click "Initialize Fallbacks" to use localStorage as a temporary solution.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
