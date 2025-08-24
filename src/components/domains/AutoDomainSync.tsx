import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Zap,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { syncDomainsFromNetlify, testNetlifyConnection } from '@/services/netlifyDomainSync';
import { supabase } from '@/integrations/supabase/client';

interface AutoDomainSyncProps {
  onSyncComplete?: (domains: any[]) => void;
}

interface SyncStatus {
  isConnecting: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSync?: string;
  domainCount: number;
  errors: string[];
  netlifyInfo?: any;
}

const AutoDomainSync: React.FC<AutoDomainSyncProps> = ({ onSyncComplete }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnecting: false,
    isConnected: false,
    isSyncing: false,
    domainCount: 0,
    errors: []
  });

  useEffect(() => {
    // Auto-start sync on component mount
    performInitialSync();
  }, []);

  const performInitialSync = async () => {
    console.log('🚀 Starting auto domain sync...');
    
    setSyncStatus(prev => ({ 
      ...prev, 
      isConnecting: true, 
      errors: [] 
    }));

    try {
      // Step 1: Test connection
      console.log('🧪 Testing Netlify connection...');
      const connectionTest = await testNetlifyConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.message}`);
      }

      console.log('✅ Netlify connection successful');
      setSyncStatus(prev => ({ 
        ...prev, 
        isConnected: true,
        netlifyInfo: connectionTest.details
      }));

      // Step 2: Sync domains
      console.log('🔄 Syncing domains from Netlify...');
      setSyncStatus(prev => ({ 
        ...prev, 
        isConnecting: false,
        isSyncing: true 
      }));

      const syncResult = await syncDomainsFromNetlify();
      
      if (syncResult.success) {
        console.log(`✅ Auto-sync successful: ${syncResult.synced} domains`);
        toast.success(`🚀 Auto-synced ${syncResult.synced} domains from Netlify!`);
        
        // Load domains from database
        const { data: domains } = await supabase
          .from('domains')
          .select('*')
          .order('created_at', { ascending: false });

        setSyncStatus(prev => ({ 
          ...prev,
          isSyncing: false,
          domainCount: domains?.length || 0,
          lastSync: new Date().toISOString(),
          errors: syncResult.errors
        }));

        // Notify parent component
        onSyncComplete?.(domains || []);

        if (syncResult.errors.length > 0) {
          console.warn('⚠️ Sync completed with errors:', syncResult.errors);
          toast.warning(`Sync completed with ${syncResult.errors.length} warnings`);
        }

      } else {
        throw new Error(`Sync failed: ${syncResult.errors.join(', ')}`);
      }

    } catch (error: any) {
      console.error('❌ Auto-sync failed:', error);
      setSyncStatus(prev => ({ 
        ...prev,
        isConnecting: false,
        isSyncing: false,
        errors: [error.message]
      }));
      toast.error(`Auto-sync failed: ${error.message}`);
    }
  };

  const manualSync = async () => {
    await performInitialSync();
  };

  const getStatusColor = () => {
    if (syncStatus.isConnecting || syncStatus.isSyncing) return 'bg-blue-100 border-blue-300';
    if (syncStatus.errors.length > 0) return 'bg-yellow-100 border-yellow-300';
    if (syncStatus.isConnected && syncStatus.domainCount > 0) return 'bg-green-100 border-green-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getStatusIcon = () => {
    if (syncStatus.isConnecting || syncStatus.isSyncing) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
    if (syncStatus.errors.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    if (syncStatus.isConnected && syncStatus.domainCount > 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Globe className="h-5 w-5 text-gray-600" />;
  };

  const getStatusMessage = () => {
    if (syncStatus.isConnecting) return 'Connecting to Netlify...';
    if (syncStatus.isSyncing) return 'Syncing domains from Netlify...';
    if (syncStatus.errors.length > 0) return `Sync completed with ${syncStatus.errors.length} issues`;
    if (syncStatus.isConnected && syncStatus.domainCount > 0) {
      return `Successfully synced ${syncStatus.domainCount} domains`;
    }
    return 'Ready to sync domains';
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Netlify Domain Sync</span>
                {syncStatus.isConnected && (
                  <Badge variant="outline" className="text-green-700 bg-green-50">
                    Connected
                  </Badge>
                )}
                {syncStatus.domainCount > 0 && (
                  <Badge variant="default">
                    {syncStatus.domainCount} domains
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{getStatusMessage()}</p>
              {syncStatus.lastSync && (
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {syncStatus.netlifyInfo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://app.netlify.com/teams/belonio2793/dns', '_blank')}
                title="Open Netlify DNS"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={manualSync}
              disabled={syncStatus.isConnecting || syncStatus.isSyncing}
            >
              {syncStatus.isConnecting || syncStatus.isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </div>

        {/* Netlify Site Info */}
        {syncStatus.netlifyInfo && (
          <div className="mt-3 p-3 bg-white/50 rounded border">
            <div className="text-sm">
              <p><strong>Site:</strong> {syncStatus.netlifyInfo.siteName}</p>
              <p><strong>URL:</strong> {syncStatus.netlifyInfo.url}</p>
              {syncStatus.netlifyInfo.customDomain && (
                <p><strong>Custom Domain:</strong> {syncStatus.netlifyInfo.customDomain}</p>
              )}
              {syncStatus.netlifyInfo.domainAliases?.length > 0 && (
                <p><strong>Aliases:</strong> {syncStatus.netlifyInfo.domainAliases.length} configured</p>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {syncStatus.errors.length > 0 && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sync Issues:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                {syncStatus.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {syncStatus.errors.length > 3 && (
                  <li>...and {syncStatus.errors.length - 3} more (check console)</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoDomainSync;
