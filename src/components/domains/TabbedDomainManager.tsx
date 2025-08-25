import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Upload, 
  Loader2, 
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import NetlifyDomainAPI from '@/services/netlifyDomainAPI';

interface BulkOperationResult {
  domain: string;
  success: boolean;
  status: 'added' | 'exists' | 'failed';
  error?: string;
  netlifyId?: string;
}

interface TabbedDomainManagerProps {
  newDomain: string;
  setNewDomain: (value: string) => void;
  addingDomain: boolean;
  onAddSingleDomain: () => void;
  onRefreshDomains: () => void;
}

export const TabbedDomainManager: React.FC<TabbedDomainManagerProps> = ({
  newDomain,
  setNewDomain,
  addingDomain,
  onAddSingleDomain,
  onRefreshDomains
}) => {
  const { user } = useAuthState();
  
  // Bulk domain states
  const [bulkDomains, setBulkDomains] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [currentBulkDomain, setCurrentBulkDomain] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkOperationResult[]>([]);
  const [activeTab, setActiveTab] = useState('single');

  // Parse domains from text input
  const parseDomains = (text: string): string[] => {
    return text
      .split(/[\n,\s]+/)
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0)
      .filter(domain => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain));
  };

  // Process bulk domain addition
  const processBulkDomains = async () => {
    if (!user) {
      toast.error('Please sign in to add domains');
      return;
    }

    const domains = parseDomains(bulkDomains);
    if (domains.length === 0) {
      toast.error('Please enter valid domains (one per line or comma-separated)');
      return;
    }

    if (domains.length > 50) {
      toast.error('Maximum 50 domains allowed per batch');
      return;
    }

    setIsProcessingBulk(true);
    setBulkProgress(0);
    setBulkResults([]);

    const results: BulkOperationResult[] = [];

    try {
      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        setCurrentBulkDomain(domain);
        setBulkProgress(Math.round(((i + 1) / domains.length) * 100));

        try {
          // First, check if domain already exists in our database
          const { data: existingDomain } = await supabase
            .from('domains')
            .select('id')
            .eq('domain', domain)
            .eq('user_id', user.id)
            .single();

          if (existingDomain) {
            results.push({
              domain,
              success: false,
              status: 'exists',
              error: 'Domain already exists'
            });
            continue;
          }

          // Insert domain into our database
          const { data: dbDomain, error: dbError } = await supabase
            .from('domains')
            .insert({
              domain: domain,
              user_id: user.id,
              status: 'pending',
              netlify_verified: false
            })
            .select()
            .single();

          if (dbError) {
            results.push({
              domain,
              success: false,
              status: 'failed',
              error: `Database error: ${dbError.message}`
            });
            continue;
          }

          // Add to Netlify via our function
          const response = await fetch('/netlify/functions/add-domain-to-netlify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              domain: domain,
              domainId: dbDomain.id
            })
          });

          if (response.ok) {
            const netlifyResult = await response.json();
            
            // Update domain with Netlify info
            await supabase
              .from('domains')
              .update({
                netlify_verified: true,
                status: 'dns_ready',
                netlify_site_id: netlifyResult.siteId,
                dns_records: netlifyResult.dnsRecords
              })
              .eq('id', dbDomain.id);

            results.push({
              domain,
              success: true,
              status: 'added',
              netlifyId: netlifyResult.siteId
            });
          } else {
            const errorData = await response.json();
            results.push({
              domain,
              success: false,
              status: 'failed',
              error: errorData.error || 'Failed to add to Netlify'
            });
          }
        } catch (error) {
          results.push({
            domain,
            success: false,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Small delay between domains to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setBulkResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} domain(s)${failureCount > 0 ? ` (${failureCount} failed)` : ''}`);
        onRefreshDomains(); // Refresh the domains list
      } else {
        toast.error(`Failed to add all ${failureCount} domain(s)`);
      }

      // Clear the bulk domains input on success
      if (successCount > 0) {
        setBulkDomains('');
      }

    } catch (error) {
      toast.error(`Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingBulk(false);
      setCurrentBulkDomain('');
      setBulkProgress(0);
    }
  };

  const getResultIcon = (result: BulkOperationResult) => {
    if (result.success) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (result.status === 'exists') {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getResultBadge = (result: BulkOperationResult) => {
    if (result.success) {
      return <Badge className="bg-green-600">Added</Badge>;
    } else if (result.status === 'exists') {
      return <Badge variant="secondary">Exists</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Domain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Add Single Domain
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Add Bulk Domains
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !addingDomain && onAddSingleDomain()}
                disabled={addingDomain}
                className="flex-1 text-lg py-3"
              />
              <Button
                onClick={onAddSingleDomain}
                disabled={addingDomain || !newDomain.trim()}
                size="lg"
                className="min-w-[120px]"
              >
                {addingDomain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Domain will be added to Netlify and you'll receive DNS setup instructions
            </p>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Enter multiple domains (one per line or comma-separated):&#10;example1.com&#10;example2.com&#10;subdomain.example3.com"
                value={bulkDomains}
                onChange={(e) => setBulkDomains(e.target.value)}
                disabled={isProcessingBulk}
                className="min-h-[120px] text-sm"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {parseDomains(bulkDomains).length} valid domain(s) detected (max 50)
                </div>
                <Button
                  onClick={processBulkDomains}
                  disabled={isProcessingBulk || parseDomains(bulkDomains).length === 0}
                  className="min-w-[140px]"
                >
                  {isProcessingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Add All Domains
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isProcessingBulk && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing: {currentBulkDomain}</span>
                  <span>{bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} className="w-full" />
              </div>
            )}

            {bulkResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Bulk Operation Results</h4>
                  <Badge variant="outline">
                    {bulkResults.filter(r => r.success).length}/{bulkResults.length} successful
                  </Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {bulkResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {getResultIcon(result)}
                        <span className="font-medium">{result.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getResultBadge(result)}
                        {result.error && (
                          <span className="text-red-600 text-xs max-w-[200px] truncate" title={result.error}>
                            {result.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Bulk Domain Tips:</strong>
                <ul className="mt-1 text-sm space-y-1">
                  <li>• Separate domains with commas or new lines</li>
                  <li>• Each domain will be added to Netlify and the domains table</li>
                  <li>• You'll receive DNS setup instructions for each domain</li>
                  <li>• Maximum 50 domains per batch operation</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TabbedDomainManager;
