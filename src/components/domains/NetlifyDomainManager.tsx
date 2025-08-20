import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { safeFetch } from '@/utils/fullstoryWorkaround';

interface Domain {
  id: string;
  domain_name: string;
  status: string;
  ssl_enabled: boolean;
  dns_configured: boolean;
  created_at: string;
}

interface SyncResult {
  domain: string;
  success: boolean;
  netlify_added?: boolean;
  ssl_enabled?: boolean;
  dns_zone_created?: boolean;
  error?: string;
  steps: string[];
}

export function NetlifyDomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [bulkDomains, setBulkDomains] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [enableSSL, setEnableSSL] = useState(true);
  const [forceSSL, setForceSSL] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const response = await safeFetch('/.netlify/functions/list-domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const addSingleDomain = async () => {
    if (!newDomain.trim()) return;

    setLoading(true);
    try {
      // First sync to Netlify
      const syncResponse = await safeFetch('/.netlify/functions/sync-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          enable_ssl: enableSSL,
          force_ssl: forceSSL
        })
      });

      const syncResult = await syncResponse.json();
      setSyncResults([syncResult]);

      if (syncResult.success) {
        // Then add to our database
        const addResponse = await safeFetch('/.netlify/functions/add-domain-with-ssl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domains: [newDomain.trim()],
            enableSSL,
            forceSSL
          })
        });

        if (addResponse.ok) {
          setNewDomain('');
          await loadDomains();
        }
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      setSyncResults([{
        domain: newDomain,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: ['❌ Failed to add domain']
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addBulkDomains = async () => {
    const domainList = bulkDomains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d && !d.startsWith('#'));

    if (domainList.length === 0) return;

    setLoading(true);
    setSyncResults([]);

    try {
      const results: SyncResult[] = [];

      // Process domains in batches of 3 to avoid rate limits
      for (let i = 0; i < domainList.length; i += 3) {
        const batch = domainList.slice(i, i + 3);
        
        for (const domain of batch) {
          try {
            // Sync each domain to Netlify
            const syncResponse = await safeFetch('/.netlify/functions/sync-domain-to-netlify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                domain,
                enable_ssl: enableSSL,
                force_ssl: forceSSL
              })
            });

            const syncResult = await syncResponse.json();
            results.push(syncResult);

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            results.push({
              domain,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              steps: ['❌ Failed to sync domain']
            });
          }
        }

        // Update results after each batch
        setSyncResults([...results]);
        
        // Delay between batches
        if (i + 3 < domainList.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Now add successful domains to our database
      const successfulDomains = results
        .filter(r => r.success)
        .map(r => r.domain);

      if (successfulDomains.length > 0) {
        await safeFetch('/.netlify/functions/add-domain-with-ssl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domains: successfulDomains,
            enableSSL,
            forceSSL
          })
        });
      }

      setBulkDomains('');
      await loadDomains();
      
    } catch (error) {
      console.error('Error in bulk domain operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDomain = async (domainId: string) => {
    try {
      const response = await safeFetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId })
      });

      if (response.ok) {
        await loadDomains();
      }
    } catch (error) {
      console.error('Error validating domain:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'pending': 'secondary',
      'failed': 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Netlify Domain Management</CardTitle>
          <CardDescription>
            Add domains to your Netlify hosting with automatic SSL certificates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* SSL Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">SSL Configuration</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-ssl"
                  checked={enableSSL}
                  onCheckedChange={setEnableSSL}
                />
                <Label htmlFor="enable-ssl">Enable SSL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="force-ssl"
                  checked={forceSSL}
                  onCheckedChange={setForceSSL}
                  disabled={!enableSSL}
                />
                <Label htmlFor="force-ssl">Force HTTPS</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Single Domain */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Single Domain</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSingleDomain()}
              />
              <Button 
                onClick={addSingleDomain}
                disabled={loading || !newDomain.trim()}
              >
                Add Domain
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bulk Domains */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bulk Add Domains</Label>
            <Textarea
              placeholder="Enter domains, one per line:&#10;example.com&#10;test.org&#10;site.net"
              value={bulkDomains}
              onChange={(e) => setBulkDomains(e.target.value)}
              rows={6}
            />
            <Button 
              onClick={addBulkDomains}
              disabled={loading || !bulkDomains.trim()}
              className="w-full"
            >
              {loading ? 'Adding Domains...' : 'Add All Domains'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Netlify Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncResults.map((result, index) => (
                <Alert key={index} className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.domain}</span>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        {result.steps.map((step, stepIndex) => (
                          <div key={stepIndex}>{step}</div>
                        ))}
                      </div>
                      
                      {result.success && (
                        <div className="flex space-x-2 text-xs">
                          {result.netlify_added && <Badge variant="outline">Netlify Added</Badge>}
                          {result.ssl_enabled && <Badge variant="outline">SSL Enabled</Badge>}
                          {result.dns_zone_created && <Badge variant="outline">DNS Zone</Badge>}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domain List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Domains</CardTitle>
          <CardDescription>
            Domains currently configured in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No domains configured yet</p>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{domain.domain_name}</div>
                    <div className="text-sm text-gray-500">
                      Added: {new Date(domain.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(domain.status)}
                    {domain.ssl_enabled && <Badge variant="outline">SSL</Badge>}
                    {domain.dns_configured && <Badge variant="outline">DNS</Badge>}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => validateDomain(domain.id)}
                    >
                      Validate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
