import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Globe,
  RefreshCw,
  Zap,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  syncAllDomainsFromNetlify,
  testNetlifyConnection,
  getDatabaseDomainCount,
  type DomainSyncResult
} from '@/services/netlifyDomainSync';
import { supabase } from '@/integrations/supabase/client';

interface ManualDomainSyncProps {
  onSyncComplete?: (domains: any[]) => void;
}

interface SyncProgress {
  phase: 'idle' | 'testing' | 'syncing' | 'complete' | 'error';
  message: string;
  progress: number;
  details?: DomainSyncResult;
}

const ManualDomainSync: React.FC<ManualDomainSyncProps> = ({ onSyncComplete }) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    phase: 'idle',
    message: 'Ready to sync domains from Netlify DNS',
    progress: 0
  });
  const [dbDomainCount, setDbDomainCount] = useState<number>(0);

  React.useEffect(() => {
    // Load initial database count
    loadDatabaseCount();
  }, []);

  const loadDatabaseCount = async () => {
    const count = await getDatabaseDomainCount();
    setDbDomainCount(count);
  };

  const performManualSync = async () => {
    console.log('🚀 Starting manual domain sync...');
    
    // Reset progress
    setSyncProgress({
      phase: 'testing',
      message: 'Testing Netlify API connection...',
      progress: 10
    });

    try {
      // Step 1: Test connection
      const connectionTest = await testNetlifyConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.message}`);
      }

      console.log('✅ Netlify connection verified');
      setSyncProgress({
        phase: 'syncing',
        message: 'Syncing all domains from Netlify DNS...',
        progress: 30
      });

      // Step 2: Comprehensive sync
      toast.loading('Syncing domains from Netlify...', { id: 'manual-sync' });
      
      const syncResult = await syncAllDomainsFromNetlify();
      
      setSyncProgress({
        phase: 'complete',
        message: syncResult.message,
        progress: 100,
        details: syncResult
      });

      if (syncResult.success) {
        toast.success(`✅ ${syncResult.message}`, { id: 'manual-sync' });
        console.log('✅ Manual sync successful:', syncResult);
        
        // Load updated domains from database
        const { data: domains } = await supabase
          .from('domains')
          .select('*')
          .order('created_at', { ascending: false });

        setDbDomainCount(domains?.length || 0);
        onSyncComplete?.(domains || []);

        if (syncResult.errors.length > 0) {
          console.warn('⚠️ Sync completed with errors:', syncResult.errors);
          toast.warning(`Sync completed with ${syncResult.errors.length} warnings`);
        }

      } else {
        throw new Error(syncResult.message);
      }

    } catch (error: any) {
      console.error('❌ Manual sync failed:', error);
      setSyncProgress({
        phase: 'error',
        message: `Sync failed: ${error.message}`,
        progress: 0
      });
      toast.error(`Manual sync failed: ${error.message}`, { id: 'manual-sync' });
    }
  };

  const testConnection = async () => {
    try {
      toast.loading('Testing Netlify connection...', { id: 'test-connection' });
      
      const testResult = await testNetlifyConnection();
      
      if (testResult.success) {
        toast.success(`✅ ${testResult.message}`, { id: 'test-connection' });
        console.log('✅ Connection test passed:', testResult.siteInfo);
      } else {
        toast.error(`❌ ${testResult.message}`, { id: 'test-connection' });
        console.error('❌ Connection test failed:', testResult.message);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`, { id: 'test-connection' });
    }
  };

  const refreshDatabaseCount = async () => {
    await loadDatabaseCount();
    toast.success('Database count refreshed');
  };

  const getPhaseIcon = () => {
    switch (syncProgress.phase) {
      case 'testing':
      case 'syncing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPhaseColor = () => {
    switch (syncProgress.phase) {
      case 'testing':
      case 'syncing':
        return 'border-blue-300 bg-blue-50';
      case 'complete':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const isProcessing = syncProgress.phase === 'testing' || syncProgress.phase === 'syncing';

  return (
    <Card className={`border-2 ${getPhaseColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPhaseIcon()}
          Manual Domain Sync
          <Badge variant="outline" className="ml-auto">
            {dbDomainCount} in database
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={syncProgress.progress} className="w-full" />
            <p className="text-sm text-gray-600">{syncProgress.message}</p>
          </div>
        )}

        {/* Status Message */}
        <Alert className={`${getPhaseColor()} border`}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Status:</strong> {syncProgress.message}
          </AlertDescription>
        </Alert>

        {/* Sync Results */}
        {syncProgress.details && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-white/50 rounded border">
            <div className="text-sm">
              <p><strong>Found:</strong> {syncProgress.details.totalFound} domains</p>
              <p><strong>New:</strong> {syncProgress.details.databaseOperations.inserted}</p>
            </div>
            <div className="text-sm">
              <p><strong>Updated:</strong> {syncProgress.details.databaseOperations.updated}</p>
              <p><strong>Failed:</strong> {syncProgress.details.databaseOperations.failed}</p>
            </div>
          </div>
        )}

        {/* Error Details */}
        {syncProgress.details?.errors && syncProgress.details.errors.length > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>Issues encountered:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                {syncProgress.details.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {syncProgress.details.errors.length > 3 && (
                  <li>...and {syncProgress.details.errors.length - 3} more (check console)</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={performManualSync}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sync All Domains
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isProcessing}
            title="Test Netlify API Connection"
          >
            <Zap className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={refreshDatabaseCount}
            disabled={isProcessing}
            title="Refresh Database Count"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open('https://app.netlify.com/teams/belonio2793/dns', '_blank')}
            title="Open Netlify DNS"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 p-3 bg-gray-100 rounded">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Fetches ALL domains from your Netlify DNS</li>
            <li>Pulls custom domains, aliases, and DNS zones</li>
            <li>Stores them in the Supabase domains table</li>
            <li>Updates the domains list automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualDomainSync;
