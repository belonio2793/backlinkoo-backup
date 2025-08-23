import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cloud
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

interface NetlifyDomain {
  domain: string;
  type: 'custom_domain' | 'domain_alias';
  ssl_status?: string;
  dns_configured?: boolean;
  created_at?: string;
  stored_in_db: boolean;
  db_id?: string;
}

interface NetlifySiteInfo {
  id: string;
  name: string;
  url: string;
  ssl_url?: string;
  custom_domain?: string;
  domain_aliases: string[];
  state: string;
}

const NetlifyDomainManager = () => {
  const { user } = useAuthState();
  const [domains, setDomains] = useState<NetlifyDomain[]>([]);
  const [siteInfo, setSiteInfo] = useState<NetlifySiteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [storageLoading, setStorageLoading] = useState<Set<string>>(new Set());
  const [netlifyConnected, setNetlifyConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      fetchDomainsFromNetlify();
    }
  }, [user]);

  const fetchDomainsFromNetlify = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching domains from Netlify...');

      // Fetch site info from Netlify API
      const siteResponse = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/netlify-domains', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!siteResponse.ok) {
        throw new Error(`Netlify API error: ${siteResponse.status} ${siteResponse.statusText}`);
      }

      const siteResult = await siteResponse.json();

      if (!siteResult.success) {
        throw new Error(siteResult.error || 'Failed to fetch from Netlify');
      }

      const siteData = siteResult.data;
      setSiteInfo(siteData);
      setNetlifyConnected(true);

      // Get existing domains from database
      const { data: dbDomains } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user?.id);

      const dbDomainMap = new Map(
        (dbDomains || []).map(d => [d.domain, { id: d.id, ...d }])
      );

      // Build domain list from Netlify data
      const netlifyDomains: NetlifyDomain[] = [];

      // Add custom domain if exists
      if (siteData.custom_domain) {
        const dbEntry = dbDomainMap.get(siteData.custom_domain);
        netlifyDomains.push({
          domain: siteData.custom_domain,
          type: 'custom_domain',
          stored_in_db: !!dbEntry,
          db_id: dbEntry?.id
        });
      }

      // Add domain aliases
      if (siteData.domain_aliases?.length > 0) {
        siteData.domain_aliases.forEach((domain: string) => {
          const dbEntry = dbDomainMap.get(domain);
          netlifyDomains.push({
            domain,
            type: 'domain_alias',
            stored_in_db: !!dbEntry,
            db_id: dbEntry?.id
          });
        });
      }

      setDomains(netlifyDomains);
      
      if (netlifyDomains.length === 0) {
        toast.info('No domains found in your Netlify account');
      } else {
        toast.success(`Found ${netlifyDomains.length} domain(s) in Netlify`);
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch from Netlify:', error);
      
      if (error.message.includes('not deployed')) {
        setNetlifyConnected(false);
        toast.error('Netlify functions not deployed. Cannot access domain data.');
      } else {
        setNetlifyConnected(false);
        toast.error(`Failed to connect to Netlify: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const storeDomainInDatabase = async (domain: NetlifyDomain) => {
    if (!user) return;

    setStorageLoading(prev => new Set(prev).add(domain.domain));

    try {
      const { data, error } = await supabase
        .from('domains')
        .insert({
          domain: domain.domain,
          user_id: user.id,
          netlify_verified: true,
          status: 'active',
          custom_domain: domain.type === 'custom_domain',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Domain already exists in database');
        }
        throw new Error(error.message);
      }

      // Update local state
      setDomains(prev => prev.map(d => 
        d.domain === domain.domain 
          ? { ...d, stored_in_db: true, db_id: data.id }
          : d
      ));

      toast.success(`${domain.domain} stored in database`);

    } catch (error: any) {
      console.error('❌ Failed to store domain:', error);
      toast.error(`Failed to store ${domain.domain}: ${error.message}`);
    } finally {
      setStorageLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(domain.domain);
        return newSet;
      });
    }
  };

  const removeDomainFromDatabase = async (domain: NetlifyDomain) => {
    if (!user || !domain.db_id) return;

    setStorageLoading(prev => new Set(prev).add(domain.domain));

    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domain.db_id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setDomains(prev => prev.map(d => 
        d.domain === domain.domain 
          ? { ...d, stored_in_db: false, db_id: undefined }
          : d
      ));

      toast.success(`${domain.domain} removed from database`);

    } catch (error: any) {
      console.error('❌ Failed to remove domain:', error);
      toast.error(`Failed to remove ${domain.domain}: ${error.message}`);
    } finally {
      setStorageLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(domain.domain);
        return newSet;
      });
    }
  };

  const storeAllDomains = async () => {
    const domainsToStore = domains.filter(d => !d.stored_in_db);
    
    if (domainsToStore.length === 0) {
      toast.info('All domains are already stored in database');
      return;
    }

    for (const domain of domainsToStore) {
      await storeDomainInDatabase(domain);
    }
  };

  const getDomainTypeBadge = (domain: NetlifyDomain) => {
    return domain.type === 'custom_domain' 
      ? <Badge className="bg-purple-600">Custom Domain</Badge>
      : <Badge variant="outline" className="border-blue-400 text-blue-600">Domain Alias</Badge>;
  };

  if (!user) {
    return (
      <Alert className="border-gray-200">
        <Globe className="h-4 w-4" />
        <AlertDescription>
          Please sign in to view your Netlify domains.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Netlify Domains</h2>
          <p className="text-gray-600">
            Domains from your Netlify account{siteInfo ? ` (${siteInfo.name})` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchDomainsFromNetlify}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh from Netlify
          </Button>
          
          {domains.some(d => !d.stored_in_db) && (
            <Button onClick={storeAllDomains}>
              <Database className="h-4 w-4 mr-2" />
              Store All in DB
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {netlifyConnected !== null && (
        <Alert className={netlifyConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {netlifyConnected ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={netlifyConnected ? "text-green-700" : "text-red-700"}>
            {netlifyConnected 
              ? `✅ Connected to Netlify account${siteInfo ? ` - Site: ${siteInfo.name}` : ''}`
              : '❌ Cannot connect to Netlify. Check if functions are deployed and NETLIFY_ACCESS_TOKEN is configured.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Site Info Card */}
      {siteInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Netlify Site Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Site Name</p>
                <p className="text-sm text-gray-600">{siteInfo.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Default URL</p>
                <a 
                  href={siteInfo.ssl_url || siteInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {siteInfo.ssl_url || siteInfo.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Site Status</p>
                <Badge className={siteInfo.state === 'ready' ? 'bg-green-600' : 'bg-yellow-600'}>
                  {siteInfo.state}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Domains ({domains.length})
            {domains.filter(d => d.stored_in_db).length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                • {domains.filter(d => d.stored_in_db).length} stored in database
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Fetching domains from Netlify...</p>
            </div>
          ) : netlifyConnected === false ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cannot Connect to Netlify
              </h3>
              <p className="text-gray-500 mb-4">
                Unable to fetch domains from your Netlify account
              </p>
              <Button onClick={fetchDomainsFromNetlify}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Domains Found
              </h3>
              <p className="text-gray-500 mb-4">
                No domains are configured in your Netlify account
              </p>
              <Button 
                variant="outline"
                onClick={fetchDomainsFromNetlify}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Database Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.domain}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{domain.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDomainTypeBadge(domain)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {domain.stored_in_db ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Stored</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Not Stored</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                        
                        {domain.stored_in_db ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeDomainFromDatabase(domain)}
                            disabled={storageLoading.has(domain.domain)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            {storageLoading.has(domain.domain) ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Database className="h-3 w-3 mr-1" />
                            )}
                            Remove from DB
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => storeDomainInDatabase(domain)}
                            disabled={storageLoading.has(domain.domain)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            {storageLoading.has(domain.domain) ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Database className="h-3 w-3 mr-1" />
                            )}
                            Store in DB
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetlifyDomainManager;
