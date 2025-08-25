import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Database, Code, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import { DomainsTableManager } from '@/utils/ensureDomainsTable';

interface TableStatus {
  exists: boolean;
  hasRLS: boolean;
  hasIndexes: boolean;
  hasFunction: boolean;
  columns: string[];
  error?: string;
}

const DomainTableDiagnostic: React.FC = () => {
  const { user } = useAuthState();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  useEffect(() => {
    checkTableStatus();
  }, []);

  const checkTableStatus = async () => {
    setLoading(true);
    try {
      const status = await DomainsTableManager.checkTableStatus();
      setTableStatus(status);
      
      if (!status.exists) {
        toast.warning('Domains table does not exist. Please create it to use domain management.');
      } else {
        toast.success('Domains table is available!');
      }
    } catch (error: any) {
      console.error('Failed to check table status:', error);
      toast.error(`Failed to check table status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setCreating(true);
    try {
      const result = await DomainsTableManager.createDomainsTable();
      
      if (result.success) {
        toast.success('Domains table created successfully!');
        await checkTableStatus(); // Refresh status
      } else {
        toast.error(`Failed to create table: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Failed to create table:', error);
      toast.error(`Failed to create table: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const testOperations = async () => {
    if (!user?.id) {
      toast.error('Please sign in to test domain operations');
      return;
    }

    setTesting(true);
    try {
      const result = await DomainsTableManager.testDomainOperations(user.id);
      setTestResult(result);
      
      if (result.success) {
        toast.success('All domain operations are working correctly!');
      } else {
        toast.error(`Domain operations test failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Failed to test operations:', error);
      toast.error(`Failed to test operations: ${error.message}`);
      setTestResult({
        success: false,
        message: 'Test failed with exception',
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | undefined, trueText: string, falseText: string) => {
    if (status === true) return <Badge className="bg-green-600">{trueText}</Badge>;
    if (status === false) return <Badge variant="destructive">{falseText}</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('SQL copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Table Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Table Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Table Status:</span>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getStatusIcon(tableStatus?.exists)
                )}
                {tableStatus ? (
                  getStatusBadge(tableStatus.exists, 'Exists', 'Missing')
                ) : (
                  <Badge variant="secondary">Checking...</Badge>
                )}
              </div>
            </div>

            {tableStatus && tableStatus.exists && (
              <>
                <div className="flex items-center justify-between">
                  <span>Row Level Security:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tableStatus.hasRLS)}
                    {getStatusBadge(tableStatus.hasRLS, 'Enabled', 'Disabled')}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Performance Indexes:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tableStatus.hasIndexes)}
                    {getStatusBadge(tableStatus.hasIndexes, 'Created', 'Missing')}
                  </div>
                </div>

                {tableStatus.columns.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Columns:</span> {tableStatus.columns.join(', ')}
                  </div>
                )}
              </>
            )}

            {tableStatus?.error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{tableStatus.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkTableStatus}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Status
              </Button>

              {!tableStatus?.exists && (
                <Button
                  onClick={createTable}
                  disabled={creating}
                  size="sm"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Create Table
                </Button>
              )}

              {tableStatus?.exists && user && (
                <Button
                  variant="outline"
                  onClick={testOperations}
                  disabled={testing}
                  size="sm"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Test Operations
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Operation Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Test Status:</span>
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'All Tests Passed' : 'Tests Failed'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {testResult.message}
              </div>
              {testResult.error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{testResult.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Manual Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="sql">SQL Script</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions" className="mt-4">
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    If automatic table creation fails, you can manually create the domains table using the SQL script below.
                  </AlertDescription>
                </Alert>
                
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Copy the SQL script from the "SQL Script" tab</li>
                  <li>Paste and run the script in the SQL Editor</li>
                  <li>Come back here and click "Refresh Status" to verify</li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="sql" className="mt-4">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {DomainsTableManager.getManualSetupSQL()}
                  </pre>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(DomainsTableManager.getManualSetupSQL())}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Copy SQL to Clipboard
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">Table doesn't exist?</h4>
              <p className="text-gray-600">Use the "Create Table" button or run the manual SQL script.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Permission errors?</h4>
              <p className="text-gray-600">Ensure your Supabase project has proper RLS policies and user authentication is working.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Operations failing?</h4>
              <p className="text-gray-600">Check that you're signed in and have proper user permissions. Run the operations test to diagnose issues.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Still having issues?</h4>
              <p className="text-gray-600">Check your browser console for detailed error messages and ensure your Supabase configuration is correct.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainTableDiagnostic;
