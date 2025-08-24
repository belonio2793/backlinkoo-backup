import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseDomain {
  id: string;
  domain: string;
  status: string;
  netlify_verified: boolean;
  created_at: string;
  user_id: string;
}

interface DatabaseStatus {
  tableExists: boolean;
  recordCount: number;
  domains: DatabaseDomain[];
  error?: string;
}

const DatabaseDomainChecker: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    tableExists: false,
    recordCount: 0,
    domains: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking database status...');
      
      // Test if table exists and get all domains
      const { data: domains, error, count } = await supabase
        .from('domains')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          setDbStatus({
            tableExists: false,
            recordCount: 0,
            domains: [],
            error: 'Domains table does not exist'
          });
        } else {
          setDbStatus({
            tableExists: true,
            recordCount: 0,
            domains: [],
            error: `Database error: ${error.message}`
          });
        }
      } else {
        setDbStatus({
          tableExists: true,
          recordCount: count || 0,
          domains: domains || [],
          error: undefined
        });
        console.log(`✅ Database check complete: ${count} domains found`);
      }

    } catch (error: any) {
      console.error('❌ Database check failed:', error);
      setDbStatus({
        tableExists: false,
        recordCount: 0,
        domains: [],
        error: `Check failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const createDomainsTable = async () => {
    try {
      toast.loading('Creating domains table...', { id: 'create-table' });
      
      // Use Supabase SQL to create table
      const { error } = await supabase.rpc('create_domains_table');
      
      if (error) {
        throw new Error(`Failed to create table: ${error.message}`);
      }
      
      toast.success('✅ Domains table created successfully!', { id: 'create-table' });
      await checkDatabase();
      
    } catch (error: any) {
      console.error('❌ Failed to create table:', error);
      toast.error(`Failed to create table: ${error.message}`, { id: 'create-table' });
    }
  };

  const clearAllDomains = async () => {
    if (!confirm('Are you sure you want to delete ALL domains from the database?')) {
      return;
    }

    try {
      toast.loading('Clearing all domains...', { id: 'clear-domains' });
      
      const { error } = await supabase
        .from('domains')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

      if (error) {
        throw new Error(`Failed to clear domains: ${error.message}`);
      }
      
      toast.success('✅ All domains cleared!', { id: 'clear-domains' });
      await checkDatabase();
      
    } catch (error: any) {
      console.error('❌ Failed to clear domains:', error);
      toast.error(`Failed to clear domains: ${error.message}`, { id: 'clear-domains' });
    }
  };

  const getStatusColor = () => {
    if (dbStatus.error) return 'border-red-300 bg-red-50';
    if (!dbStatus.tableExists) return 'border-yellow-300 bg-yellow-50';
    if (dbStatus.recordCount === 0) return 'border-blue-300 bg-blue-50';
    return 'border-green-300 bg-green-50';
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    if (dbStatus.error) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (!dbStatus.tableExists) return <Database className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Database Status
          <Badge variant="outline" className="ml-auto">
            {dbStatus.recordCount} domains
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Alert */}
        <Alert className={getStatusColor()}>
          <Database className="h-4 w-4" />
          <AlertDescription>
            {dbStatus.error ? (
              <>
                <strong>Error:</strong> {dbStatus.error}
              </>
            ) : dbStatus.tableExists ? (
              <>
                <strong>Table Status:</strong> Domains table exists with {dbStatus.recordCount} records
              </>
            ) : (
              <>
                <strong>Missing:</strong> Domains table needs to be created
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Domain List */}
        {dbStatus.domains.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Current Domains:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {dbStatus.domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <span className="font-medium">{domain.domain}</span>
                    <Badge variant={domain.netlify_verified ? "default" : "secondary"} className="ml-2 text-xs">
                      {domain.status}
                    </Badge>
                  </div>
                  {domain.netlify_verified && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={checkDatabase}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>

          {!dbStatus.tableExists && (
            <Button
              onClick={createDomainsTable}
              disabled={loading}
            >
              <Database className="h-4 w-4 mr-2" />
              Create Table
            </Button>
          )}

          {dbStatus.recordCount > 0 && (
            <Button
              variant="destructive"
              onClick={clearAllDomains}
              disabled={loading}
              title="Clear all domains"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-600 p-3 bg-gray-100 rounded">
          <p><strong>Debug Info:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Table exists: {dbStatus.tableExists ? 'Yes' : 'No'}</li>
            <li>Record count: {dbStatus.recordCount}</li>
            <li>Last check: {new Date().toLocaleTimeString()}</li>
            {dbStatus.error && <li>Error: {dbStatus.error}</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseDomainChecker;
