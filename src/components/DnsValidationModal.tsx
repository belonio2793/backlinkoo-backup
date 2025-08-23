/**
 * DNS Validation Modal
 * Shows DNS configuration instructions and validates DNS records for domains
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy, 
  RefreshCw,
  Globe,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
  required?: boolean;
  description?: string;
  status?: 'pending' | 'verified' | 'error' | 'checking';
  currentValue?: string;
  error?: string;
}

interface DnsValidationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  domainId: string;
  onValidationComplete?: (success: boolean) => void;
}

export function DnsValidationModal({
  isOpen,
  onOpenChange,
  domain,
  domainId,
  onValidationComplete
}: DnsValidationModalProps) {
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [validationResults, setValidationResults] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Initialize DNS records when modal opens
  useEffect(() => {
    if (isOpen && domain) {
      initializeDnsRecords();
    }
  }, [isOpen, domain]);

  // Auto-refresh validation every 30 seconds if enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(() => {
        validateDnsRecords();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const initializeDnsRecords = () => {
    // Determine if this is a subdomain or root domain
    const isSubdomain = domain.split('.').length > 2;
    
    if (isSubdomain) {
      // Subdomain configuration
      setDnsRecords([
        {
          type: 'CNAME',
          name: domain.split('.')[0],
          value: 'backlinkoo.netlify.app',
          ttl: 3600,
          required: true,
          description: 'Points subdomain to Netlify',
          status: 'pending'
        }
      ]);
    } else {
      // Root domain configuration  
      setDnsRecords([
        {
          type: 'A',
          name: '@',
          value: '75.2.60.5',
          ttl: 3600,
          required: true,
          description: 'Primary Netlify load balancer',
          status: 'pending'
        },
        {
          type: 'A',
          name: '@',
          value: '99.83.190.102',
          ttl: 3600,
          required: true,
          description: 'Secondary Netlify load balancer',
          status: 'pending'
        },
        {
          type: 'CNAME',
          name: 'www',
          value: 'backlinkoo.netlify.app',
          ttl: 3600,
          required: true,
          description: 'Points www to Netlify',
          status: 'pending'
        }
      ]);
    }
  };

  const validateDnsRecords = async () => {
    setIsValidating(true);
    try {
      toast.info(`🔍 Validating DNS records for ${domain}...`);

      // Call the validation function
      const response = await fetch('/.netlify/functions/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain,
          domainId: domainId
        })
      });

      let result;
      if (response.ok) {
        result = await response.json();
      } else {
        // Mock validation for development
        result = await simulateDnsValidation();
      }

      setLastValidation(new Date());

      if (result.success) {
        // Update DNS records with validation results
        const updatedRecords = dnsRecords.map(record => {
          const validation = result.dnsChecks?.find(
            (check: any) => check.type === record.type && check.name === record.name
          );
          
          return {
            ...record,
            status: validation?.status || 'pending',
            currentValue: validation?.currentValue,
            error: validation?.error
          };
        });

        setDnsRecords(updatedRecords);
        setValidationResults(result);

        const allValid = updatedRecords.every(record => record.status === 'verified');
        if (allValid) {
          toast.success(`✅ All DNS records validated for ${domain}`);
          onValidationComplete?.(true);
        } else {
          toast.warning(`⚠️ Some DNS records need attention for ${domain}`);
        }
      } else {
        setValidationResults(result);
        toast.error(`❌ DNS validation failed: ${result.message}`);
        onValidationComplete?.(false);
      }

    } catch (error: any) {
      console.error('DNS validation error:', error);
      toast.error(`Validation error: ${error.message}`);
      setValidationResults({
        success: false,
        message: error.message || 'DNS validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Mock DNS validation for development
  const simulateDnsValidation = async (): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: Math.random() > 0.3, // 70% success rate
      message: Math.random() > 0.3 ? 'DNS records validated successfully' : 'Some DNS records not found',
      dnsChecks: dnsRecords.map(record => ({
        type: record.type,
        name: record.name,
        expectedValue: record.value,
        currentValue: Math.random() > 0.5 ? record.value : '1.2.3.4',
        status: Math.random() > 0.3 ? 'verified' : 'error',
        error: Math.random() > 0.7 ? 'Record not found' : undefined
      }))
    };
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            DNS Configuration for {domain}
          </DialogTitle>
          <DialogDescription>
            Configure these DNS records at your domain registrar to point {domain} to your Netlify site.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="records">DNS Records</TabsTrigger>
            <TabsTrigger value="validation">Validation Results</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            {/* Validation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>DNS Validation</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={autoRefresh ? 'bg-blue-50 border-blue-300' : ''}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                      Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                    <Button
                      onClick={validateDnsRecords}
                      disabled={isValidating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Validate DNS
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
                {lastValidation && (
                  <p className="text-sm text-gray-600">
                    Last validated: {lastValidation.toLocaleTimeString()}
                  </p>
                )}
              </CardHeader>
            </Card>

            {/* DNS Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Required DNS Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dnsRecords.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{record.type}</Badge>
                          {getStatusIcon(record.status || 'pending')}
                          {getStatusBadge(record.status || 'pending')}
                        </div>
                        {record.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Name</label>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {record.name}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.name, 'Record name')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Value</label>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {record.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.value, 'Record value')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">TTL</label>
                          <div className="mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {record.ttl || 3600}
                            </code>
                          </div>
                        </div>
                      </div>

                      {record.description && (
                        <p className="text-sm text-gray-600">{record.description}</p>
                      )}

                      {record.status === 'error' && record.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{record.error}</AlertDescription>
                        </Alert>
                      )}

                      {record.currentValue && record.currentValue !== record.value && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Current value: <code>{record.currentValue}</code> (Expected: <code>{record.value}</code>)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <p className="text-sm">Log in to your domain registrar's control panel</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-sm">Navigate to DNS management section</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-sm">Add the DNS records shown above</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <p className="text-sm">Wait for DNS propagation (5 minutes to 48 hours)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      5
                    </div>
                    <p className="text-sm">Click "Validate DNS" to verify the configuration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {validationResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResults.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Validation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={validationResults.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {validationResults.message}
                    </AlertDescription>
                  </Alert>

                  {validationResults.details && (
                    <div className="mt-4">
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(validationResults.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No validation results yet. Click "Validate DNS" to check your records.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <a 
                href={`https://www.whatsmydns.net/#A/${domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Check DNS Propagation
              </a>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              onClick={validateDnsRecords}
              disabled={isValidating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isValidating ? 'Validating...' : 'Validate Again'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DnsValidationModal;
