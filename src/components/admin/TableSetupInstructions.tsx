/**
 * Table Setup Instructions Component
 * Guides users through creating the required Supabase table
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  RefreshCw,
  ExternalLink,
  Code,
  Play
} from 'lucide-react';
import { createAdminEnvironmentVariablesTable, getTableCreationStatus } from '@/utils/createSupabaseTable';
import { useToast } from '@/hooks/use-toast';

export function TableSetupInstructions() {
  const [tableStatus, setTableStatus] = useState<{
    exists: boolean;
    needsCreation: boolean;
    sqlScript: string;
    loading: boolean;
  }>({
    exists: false,
    needsCreation: false,
    sqlScript: '',
    loading: true
  });

  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkTableStatus = async () => {
    setIsChecking(true);
    try {
      const status = await getTableCreationStatus();
      setTableStatus({
        exists: status.tableExists,
        needsCreation: status.needsManualCreation,
        sqlScript: status.sqlScript,
        loading: false
      });
    } catch (error) {
      console.error('Failed to check table status:', error);
      setTableStatus(prev => ({ ...prev, loading: false }));
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkTableStatus();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'SQL script copied to clipboard'
    });
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  if (tableStatus.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Checking database status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tableStatus.exists) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          ✅ Database table is ready! The admin_environment_variables table exists and is accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <Database className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <span>Database Setup Required</span>
            <Badge className="ml-2 bg-orange-100 text-orange-800">Action Needed</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            The <code>admin_environment_variables</code> table needs to be created in your Supabase database.
            This table is required for real-time configuration synchronization.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Play className="h-4 w-4" />
            Setup Instructions:
          </h4>
          
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <div>
                <span>Open your Supabase Dashboard</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openSupabaseDashboard}
                  className="ml-2"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Dashboard
                </Button>
              </div>
            </li>
            
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Navigate to <strong>SQL Editor</strong> in the left sidebar</span>
            </li>
            
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Copy and run the SQL script below:</span>
            </li>
          </ol>
        </div>

        {/* SQL Script */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              SQL Script:
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(tableStatus.sqlScript)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Script
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {tableStatus.sqlScript}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">After running the script:</h4>
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li>4. Click "Run" in the SQL Editor</li>
            <li>5. Wait for the success confirmation</li>
            <li>6. Refresh this page to verify the setup</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={checkTableStatus} disabled={isChecking} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Again'}
          </Button>
          <Button onClick={openSupabaseDashboard} variant="default">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Supabase Dashboard
          </Button>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Note:</strong> Until the table is created, the system will work in localStorage mode. 
            Your configurations will be saved locally but won't sync across devices or sessions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
