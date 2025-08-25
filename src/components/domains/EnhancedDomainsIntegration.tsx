/**
 * Enhanced Domains Integration Example
 * 
 * This component demonstrates how to integrate the ChatGPT conversation
 * implementation into the existing domains page. It can be used as a
 * reference or directly imported into EnhancedDomainManager.tsx
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Plus, Sync, Trash2, Database, ExternalLink } from 'lucide-react';
import { DomainsApiHelper, Domain, NetlifyDomain } from '@/utils/domainsApiHelper';
import { toast } from 'sonner';

export function EnhancedDomainsIntegration() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [netlifyDomains, setNetlifyDomains] = useState<NetlifyDomain[]>([]);
  const [newDomainName, setNewDomainName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load domains from database on component mount
  useEffect(() => {
    loadDomainsFromDatabase();
  }, []);

  const loadDomainsFromDatabase = async () => {
    try {
      setIsLoading(true);
      const dbDomains = await DomainsApiHelper.fetchDomainsFromDatabase();
      setDomains(dbDomains);
    } catch (error) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load domains from database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromNetlify = async () => {
    try {
      setIsSyncing(true);
      toast.info('Syncing domains from Netlify...');
      
      const netlifyDomains = await DomainsApiHelper.syncDomains();
      setNetlifyDomains(netlifyDomains);
      setLastSync(new Date());
      
      // Refresh database domains to show synced data
      await loadDomainsFromDatabase();
      
      toast.success(`Synced ${netlifyDomains.length} domains from Netlify`);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setIsLoading(true);
      toast.info(`Adding domain: ${newDomainName}`);
      
      await DomainsApiHelper.addDomain(newDomainName);
      setNewDomainName('');
      
      // Refresh the domains list
      await loadDomainsFromDatabase();
      
      toast.success(`Domain ${newDomainName} added successfully`);
    } catch (error) {
      console.error('Add domain failed:', error);
      toast.error(`Failed to add domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManualDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setIsLoading(true);
      toast.info(`Adding manual domain: ${newDomainName}`);
      
      await DomainsApiHelper.addManualDomain(newDomainName);
      setNewDomainName('');
      
      // Refresh the domains list
      await loadDomainsFromDatabase();
      
      toast.success(`Manual domain ${newDomainName} added successfully`);
    } catch (error) {
      console.error('Add manual domain failed:', error);
      toast.error(`Failed to add manual domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async (domainName: string, source: string) => {
    if (!confirm(`Are you sure you want to delete ${domainName}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      toast.info(`Deleting domain: ${domainName}`);
      
      if (source === 'netlify') {
        await DomainsApiHelper.deleteDomain(domainName);
      } else {
        // For manual domains, just remove from database
        // Implementation would depend on your database schema
        toast.warn('Manual domain deletion not implemented yet');
        return;
      }
      
      // Refresh the domains list
      await loadDomainsFromDatabase();
      
      toast.success(`Domain ${domainName} deleted successfully`);
    } catch (error) {
      console.error('Delete domain failed:', error);
      toast.error(`Failed to delete domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      toast.info('Testing connection to netlify-domains function...');
      
      const isWorking = await DomainsApiHelper.testConnection();
      
      if (isWorking) {
        toast.success('✅ Connection test successful');
      } else {
        toast.error('❌ Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('❌ Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return 'default';
      case 'active':
        return 'secondary';
      case 'unverified':
      case 'pending':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Automation Link Building Domains</h2>
        <p className="text-gray-600">Add domains for publishing across diversified backlink profile using our content generation and campaigns management system</p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Connection
            </Button>
            {lastSync && (
              <span className="text-sm text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Domain Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleAddDomain}
              disabled={!newDomainName.trim() || isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Netlify
            </Button>
            <Button 
              onClick={handleAddManualDomain}
              disabled={!newDomainName.trim() || isLoading}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              Add Manual
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              Add domains to Netlify for automated hosting setup, or add manually for external domains.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            Netlify Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleSyncFromNetlify}
              disabled={isSyncing}
              className="w-full"
            >
              <Sync className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync from Netlify'}
            </Button>
            
            <Alert>
              <AlertDescription>
                Fetch all domains from your Netlify site and sync them to the database.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Your Domains ({domains.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && domains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading domains...
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No domains found. Add a domain or sync from Netlify to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div 
                  key={domain.id || domain.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{domain.name}</div>
                      <div className="text-sm text-gray-500">
                        Source: {domain.source} • Added: {domain.created_at ? new Date(domain.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(domain.status || 'unknown')}>
                      {domain.status || 'unknown'}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://${domain.name}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDomain(domain.name, domain.source || 'manual')}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Netlify Domains (if synced) */}
      {netlifyDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Latest Netlify Sync ({netlifyDomains.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {netlifyDomains.map((domain) => (
                <div 
                  key={domain.id}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{domain.name}</div>
                      <div className="text-sm text-gray-500">
                        State: {domain.state} • ID: {domain.id}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={domain.state === 'verified' ? 'default' : 'outline'}>
                    {domain.state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedDomainsIntegration;
