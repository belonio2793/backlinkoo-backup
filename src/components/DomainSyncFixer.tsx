import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Globe,
  Database,
  Trash2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import NetlifyApiService from '@/services/netlifyApiService';

interface DomainMismatch {
  domain: string;
  id?: string;
  inDatabase: boolean;
  inNetlify: boolean;
  isCustomDomain: boolean;
  isAlias: boolean;
  error?: string;
  status?: string;
}

const DomainSyncFixer = ({ onSyncComplete }: { onSyncComplete?: () => void }) => {
  const { user } = useAuthState();
  const [scanning, setScanning] = useState(false);
  const [mismatches, setMismatches] = useState<DomainMismatch[]>([]);
  const [fixing, setFixing] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [functionsAvailable, setFunctionsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    scanForMismatches();
  }, [user]);

  const scanForMismatches = async () => {
    if (!user) return;

    setScanning(true);
    setMismatches([]);

    try {
      toast.info('Scanning for domain sync issues...');

      // Get domains from database
      const { data: dbDomains, error: dbError } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user.id);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Get domains from Netlify (handle case where functions aren't deployed)
      const netlifyResult = await NetlifyApiService.getSiteInfo();

      setFunctionsAvailable(netlifyResult.success);

      if (!netlifyResult.success) {
        // Don't throw error - just use empty data and continue
        console.warn('Netlify API not available:', netlifyResult.error);
        if (netlifyResult.error?.includes('not deployed')) {
          toast.warning('Netlify functions not deployed. Limited sync checking available.');
        }
      }

      const netlifyDomains = netlifyResult.success ? (netlifyResult.data?.domain_aliases || []) : [];
      const customDomain = netlifyResult.success ? netlifyResult.data?.custom_domain : undefined;

      // Create a set of all domains
      const allDomains = new Set([
        ...(dbDomains || []).map(d => d.domain),
        ...netlifyDomains,
        ...(customDomain ? [customDomain] : [])
      ]);

      const foundMismatches: DomainMismatch[] = [];

      // Check each domain for mismatches
      for (const domain of allDomains) {
        const dbDomain = dbDomains?.find(d => d.domain === domain);
        const inDatabase = !!dbDomain;
        const inNetlify = netlifyDomains.includes(domain) || customDomain === domain;
        const isCustomDomain = customDomain === domain;
        const isAlias = netlifyDomains.includes(domain);

        // Identify mismatches
        const isMismatch = (
          (inDatabase && !inNetlify) || // In DB but not Netlify
          (!inDatabase && inNetlify) || // In Netlify but not DB
          (inDatabase && dbDomain?.error_message?.includes('Domain not found')) // Has error
        );

        if (isMismatch) {
          foundMismatches.push({
            domain,
            id: dbDomain?.id,
            inDatabase,
            inNetlify,
            isCustomDomain,
            isAlias,
            error: dbDomain?.error_message,
            status: dbDomain?.status
          });
        }
      }

      setMismatches(foundMismatches);

      if (foundMismatches.length === 0) {
        if (netlifyResult.success) {
          toast.success('No domain sync issues found!');
        } else {
          toast.info('Local domains scanned. Deploy Netlify functions for full sync checking.');
        }
      } else {
        toast.warning(`Found ${foundMismatches.length} domain sync issue(s)`);
      }

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const fixMismatch = async (mismatch: DomainMismatch) => {
    setFixing(prev => new Set(prev).add(mismatch.domain));

    try {
      if (mismatch.inDatabase && !mismatch.inNetlify) {
        // Domain in DB but not Netlify - add to Netlify
        toast.info(`Adding ${mismatch.domain} to Netlify...`);

        const result = await NetlifyApiService.addDomainAlias(mismatch.domain);

        if (result.success) {
          // Update database status
          if (mismatch.id) {
            await supabase
              .from('domains')
              .update({
                netlify_verified: true,
                status: 'dns_ready',
                error_message: null
              })
              .eq('id', mismatch.id)
              .eq('user_id', user?.id);
          }

          toast.success(`${mismatch.domain} successfully added to Netlify`);
        } else {
          throw new Error(result.error || 'Failed to add to Netlify');
        }

      } else if (!mismatch.inDatabase && mismatch.inNetlify) {
        // Domain in Netlify but not DB - add to DB
        toast.info(`Adding ${mismatch.domain} to database...`);

        const { error } = await supabase
          .from('domains')
          .insert({
            domain: mismatch.domain,
            user_id: user?.id,
            netlify_verified: true,
            status: 'dns_ready'
          });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        toast.success(`${mismatch.domain} added to database`);

      } else if (mismatch.inDatabase && mismatch.error) {
        // Domain has error - retry addition to Netlify
        toast.info(`Retrying ${mismatch.domain} addition to Netlify...`);

        const result = await NetlifyApiService.addDomainAlias(mismatch.domain);

        if (result.success) {
          if (mismatch.id) {
            await supabase
              .from('domains')
              .update({
                netlify_verified: true,
                status: 'dns_ready',
                error_message: null
              })
              .eq('id', mismatch.id)
              .eq('user_id', user?.id);
          }

          toast.success(`${mismatch.domain} retry successful`);
        } else {
          throw new Error(result.error || 'Retry failed');
        }
      }

      // Re-scan after fix
      setTimeout(() => {
        scanForMismatches();
        onSyncComplete?.();
      }, 1000);

    } catch (error: any) {
      console.error('Fix error:', error);
      toast.error(`Failed to fix ${mismatch.domain}: ${error.message}`);
    } finally {
      setFixing(prev => {
        const newSet = new Set(prev);
        newSet.delete(mismatch.domain);
        return newSet;
      });
    }
  };

  const removeMismatch = async (mismatch: DomainMismatch) => {
    const confirmed = confirm(
      `Remove ${mismatch.domain}?\n\n` +
      `This will:\n` +
      `${mismatch.inDatabase ? '• Remove from your database\n' : ''}` +
      `${mismatch.inNetlify ? '• Remove from Netlify site\n' : ''}` +
      `\nContinue?`
    );

    if (!confirmed) return;

    setRemoving(prev => new Set(prev).add(mismatch.domain));

    try {
      // Remove from Netlify if it exists there
      if (mismatch.inNetlify) {
        toast.info(`Removing ${mismatch.domain} from Netlify...`);

        const removeResult = await fetch('/.netlify/functions/netlify-domain-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'removeDomainAlias',
            domain: mismatch.domain
          })
        });

        if (removeResult.ok) {
          const result = await removeResult.json();
          if (!result.success && !result.not_found) {
            console.warn('Netlify removal warning:', result.error);
          }
        }
      }

      // Remove from database if it exists there
      if (mismatch.inDatabase && mismatch.id) {
        const { error } = await supabase
          .from('domains')
          .delete()
          .eq('id', mismatch.id)
          .eq('user_id', user?.id);

        if (error) {
          throw new Error(`Database removal failed: ${error.message}`);
        }
      }

      toast.success(`${mismatch.domain} removed successfully`);

      // Re-scan after removal
      setTimeout(() => {
        scanForMismatches();
        onSyncComplete?.();
      }, 1000);

    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove ${mismatch.domain}: ${error.message}`);
    } finally {
      setRemoving(prev => {
        const newSet = new Set(prev);
        newSet.delete(mismatch.domain);
        return newSet;
      });
    }
  };

  const getMismatchType = (mismatch: DomainMismatch) => {
    if (mismatch.inDatabase && !mismatch.inNetlify) {
      return 'missing_netlify';
    } else if (!mismatch.inDatabase && mismatch.inNetlify) {
      return 'missing_database';
    } else if (mismatch.error) {
      return 'has_error';
    }
    return 'unknown';
  };

  const getMismatchBadge = (mismatch: DomainMismatch) => {
    const type = getMismatchType(mismatch);
    
    switch (type) {
      case 'missing_netlify':
        return <Badge variant="destructive" className="text-xs">Missing in Netlify</Badge>;
      case 'missing_database':
        return <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">Missing in Database</Badge>;
      case 'has_error':
        return <Badge variant="destructive" className="text-xs">Has Error</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown Issue</Badge>;
    }
  };

  const getFixAction = (mismatch: DomainMismatch) => {
    const type = getMismatchType(mismatch);
    
    switch (type) {
      case 'missing_netlify':
        return 'Add to Netlify';
      case 'missing_database':
        return 'Add to Database';
      case 'has_error':
        return 'Retry Addition';
      default:
        return 'Fix Issue';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
          Domain Sync Checker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Detects and fixes mismatches between your database and Netlify
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={scanForMismatches}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Again
                </>
              )}
            </Button>
          </div>

          {mismatches.length === 0 && !scanning && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                All domains are properly synchronized between your database and Netlify.
              </AlertDescription>
            </Alert>
          )}

          {mismatches.length > 0 && (
            <div className="space-y-3">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  Found {mismatches.length} domain sync issue(s) that need attention.
                </AlertDescription>
              </Alert>

              {mismatches.map((mismatch) => (
                <Card key={mismatch.domain} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium">{mismatch.domain}</h4>
                          {getMismatchBadge(mismatch)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Database className="h-3 w-3" />
                            <span className={mismatch.inDatabase ? 'text-green-600' : 'text-gray-400'}>
                              {mismatch.inDatabase ? 'In Database' : 'Not in Database'}
                            </span>
                            {mismatch.inDatabase && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            <span className={mismatch.inNetlify ? 'text-green-600' : 'text-gray-400'}>
                              {mismatch.inNetlify ? 'In Netlify' : 'Not in Netlify'}
                            </span>
                            {mismatch.inNetlify && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </div>

                        {mismatch.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            Error: {mismatch.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => fixMismatch(mismatch)}
                        disabled={fixing.has(mismatch.domain) || removing.has(mismatch.domain)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {fixing.has(mismatch.domain) ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {getFixAction(mismatch)}
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMismatch(mismatch)}
                        disabled={fixing.has(mismatch.domain) || removing.has(mismatch.domain)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {removing.has(mismatch.domain) ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainSyncFixer;
