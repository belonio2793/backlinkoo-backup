import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Database, Settings } from 'lucide-react';
import { AffiliateTableSetup } from '../utils/affiliateTableSetup';

interface AffiliateSystemSetupProps {
  onSystemReady?: () => void;
}

export const AffiliateSystemSetup: React.FC<AffiliateSystemSetupProps> = ({
  onSystemReady
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    tableExists: boolean;
    hasPermissions: boolean;
    recordCount: number;
    errors: string[];
  } | null>(null);

  const checkSystemStatus = async () => {
    setIsChecking(true);
    try {
      const status = await AffiliateTableSetup.getDiagnosticInfo();
      setSystemStatus(status);
      
      if (status.tableExists && status.hasPermissions) {
        onSystemReady?.();
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const setupSystem = async () => {
    setIsSettingUp(true);
    try {
      const result = await AffiliateTableSetup.createAffiliateTables();
      if (result.success) {
        await checkSystemStatus(); // Recheck after setup
      } else {
        console.error('Setup failed:', result.message);
      }
    } catch (error) {
      console.error('Error setting up system:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  if (isChecking) {
    return (
      <Card className=\"w-full max-w-2xl mx-auto\">
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Database className=\"h-5 w-5\" />
            Checking Affiliate System
          </CardTitle>
          <CardDescription>
            Verifying database setup and permissions...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"flex items-center justify-center p-8\">
            <Loader2 className=\"h-8 w-8 animate-spin\" />
            <span className=\"ml-2\">Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemStatus) {
    return (
      <Alert variant=\"destructive\">
        <AlertTriangle className=\"h-4 w-4\" />
        <AlertDescription>
          Failed to check affiliate system status. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const isSystemReady = systemStatus.tableExists && systemStatus.hasPermissions;

  if (isSystemReady) {
    return (
      <Alert>
        <CheckCircle className=\"h-4 w-4\" />
        <AlertDescription>
          Affiliate system is ready! Found {systemStatus.recordCount} existing affiliate accounts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className=\"w-full max-w-2xl mx-auto\">
      <CardHeader>
        <CardTitle className=\"flex items-center gap-2\">
          <Settings className=\"h-5 w-5\" />
          Affiliate System Setup Required
        </CardTitle>
        <CardDescription>
          The affiliate system needs to be configured before you can join the program.
        </CardDescription>
      </CardHeader>
      <CardContent className=\"space-y-4\">
        {/* System Status */}
        <div className=\"space-y-2\">
          <h4 className=\"font-medium\">System Status:</h4>
          <div className=\"flex flex-wrap gap-2\">
            <Badge variant={systemStatus.tableExists ? \"default\" : \"destructive\"}>
              Database Tables: {systemStatus.tableExists ? \"✓ Ready\" : \"✗ Missing\"}
            </Badge>
            <Badge variant={systemStatus.hasPermissions ? \"default\" : \"destructive\"}>
              Permissions: {systemStatus.hasPermissions ? \"✓ Ready\" : \"✗ Missing\"}
            </Badge>
          </div>
        </div>

        {/* Errors */}
        {systemStatus.errors.length > 0 && (
          <Alert variant=\"destructive\">
            <AlertTriangle className=\"h-4 w-4\" />
            <AlertDescription>
              <div className=\"space-y-1\">
                <p className=\"font-medium\">Issues found:</p>
                <ul className=\"list-disc list-inside space-y-1\">
                  {systemStatus.errors.map((error, index) => (
                    <li key={index} className=\"text-sm\">{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Instructions */}
        <div className=\"space-y-3\">
          <h4 className=\"font-medium\">Setup Instructions:</h4>
          
          {!systemStatus.tableExists && (
            <Alert>
              <Database className=\"h-4 w-4\" />
              <AlertDescription>
                <div className=\"space-y-2\">
                  <p className=\"font-medium\">Database Setup Required</p>
                  <p className=\"text-sm\">
                    The affiliate_programs table needs to be created. This requires administrator access.
                  </p>
                  <div className=\"space-y-1 text-xs\">
                    <p><strong>For Administrators:</strong></p>
                    <p>• Run the SQL migration: <code>supabase/migrations/20241223000000_create_affiliate_tables_final.sql</code></p>
                    <p>• Or use the Supabase dashboard to execute the migration</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className=\"flex gap-2\">
            <Button 
              onClick={setupSystem}
              disabled={isSettingUp}
              className=\"flex items-center gap-2\"
            >
              {isSettingUp && <Loader2 className=\"h-4 w-4 animate-spin\" />}
              {isSettingUp ? 'Setting up...' : 'Try Auto-Setup'}
            </Button>
            
            <Button 
              variant=\"outline\"
              onClick={checkSystemStatus}
              disabled={isChecking}
            >
              Refresh Status
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <p className=\"text-sm\">
                <strong>Need help?</strong> Contact your system administrator or support team to set up the affiliate system.
                The database migration files contain all the necessary SQL to create the required tables and permissions.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};