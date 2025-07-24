import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
  Globe,
  Key,
  Search,
  ExternalLink
} from 'lucide-react';

interface DNSVerificationProps {
  onStatusChange: (status: 'pending' | 'verified' | 'failed') => void;
  currentStatus: string;
}

export function DNSVerification({ onStatusChange, currentStatus }: DNSVerificationProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [domain, setDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState({
    spf: {
      status: 'pending' as 'pending' | 'verified' | 'failed',
      record: 'v=spf1 include:_spf.google.com include:amazonses.com ~all',
      found: ''
    },
    dkim: {
      status: 'pending' as 'pending' | 'verified' | 'failed',
      selector: 'default',
      record: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
      found: ''
    },
    dmarc: {
      status: 'pending' as 'pending' | 'verified' | 'failed',
      record: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
      found: ''
    }
  });
  const { toast } = useToast();

  const checkDNSRecords = async () => {
    if (!domain) {
      toast({
        title: 'Domain Required',
        description: 'Please enter a domain to check DNS records.',
        variant: 'destructive'
      });
      return;
    }

    setIsChecking(true);

    try {
      // Simulate DNS lookup
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock DNS verification results
      const mockResults = {
        spf: Math.random() > 0.3 ? 'verified' : 'failed',
        dkim: Math.random() > 0.4 ? 'verified' : 'failed',
        dmarc: Math.random() > 0.5 ? 'verified' : 'failed'
      };

      setDnsRecords(prev => ({
        spf: {
          ...prev.spf,
          status: mockResults.spf as any,
          found: mockResults.spf === 'verified' ? prev.spf.record : 'Record not found'
        },
        dkim: {
          ...prev.dkim,
          status: mockResults.dkim as any,
          found: mockResults.dkim === 'verified' ? prev.dkim.record : 'Record not found'
        },
        dmarc: {
          ...prev.dmarc,
          status: mockResults.dmarc as any,
          found: mockResults.dmarc === 'verified' ? prev.dmarc.record : 'Record not found'
        }
      }));

      // Update overall status
      if (mockResults.spf === 'verified' && mockResults.dkim === 'verified') {
        onStatusChange('verified');
        toast({
          title: 'DNS Verification Successful',
          description: 'All required DNS records are properly configured.',
        });
      } else {
        onStatusChange('failed');
        toast({
          title: 'DNS Verification Issues',
          description: 'Some DNS records need to be configured. Check the details below.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'DNS Check Failed',
        description: 'Failed to check DNS records. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyRecord = (record: string, type: string) => {
    navigator.clipboard.writeText(record);
    toast({
      title: 'Copied to Clipboard',
      description: `${type.toUpperCase()} record copied to clipboard.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DNS Verification</h2>
          <p className="text-muted-foreground">
            Verify SPF, DKIM, and DMARC records for email deliverability
          </p>
        </div>
        
        <Badge 
          variant={currentStatus === 'verified' ? 'default' : 'secondary'}
          className="gap-1"
        >
          {getStatusIcon(currentStatus)}
          {currentStatus === 'verified' ? 'Verified' : 'Not Verified'}
        </Badge>
      </div>

      {/* Domain Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Your Domain</Label>
              <Input
                id="domain"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={checkDNSRecords}
                disabled={isChecking || !domain}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check DNS
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SPF Record */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SPF Record
            </div>
            <Badge className={`gap-1 ${getStatusColor(dnsRecords.spf.status)}`}>
              {getStatusIcon(dnsRecords.spf.status)}
              {dnsRecords.spf.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Required SPF Record</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                value={dnsRecords.spf.record}
                readOnly
                className="flex-1 font-mono text-sm"
                rows={2}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyRecord(dnsRecords.spf.record, 'SPF')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">How to add SPF record:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Log in to your DNS provider (Cloudflare, GoDaddy, etc.)</li>
              <li>Create a new TXT record for your domain</li>
              <li>Set the name/host to "@" or leave blank</li>
              <li>Paste the SPF record above as the value</li>
              <li>Save the record and wait for DNS propagation (up to 24 hours)</li>
            </ol>
          </div>

          {dnsRecords.spf.found && (
            <div>
              <Label>Current Record Found</Label>
              <Textarea
                value={dnsRecords.spf.found}
                readOnly
                className="mt-2 font-mono text-sm"
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* DKIM Record */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              DKIM Record
            </div>
            <Badge className={`gap-1 ${getStatusColor(dnsRecords.dkim.status)}`}>
              {getStatusIcon(dnsRecords.dkim.status)}
              {dnsRecords.dkim.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>DKIM Selector</Label>
            <Input
              value={dnsRecords.dkim.selector}
              onChange={(e) => setDnsRecords(prev => ({
                ...prev,
                dkim: { ...prev.dkim, selector: e.target.value }
              }))}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Host: {dnsRecords.dkim.selector}._domainkey.{domain || 'yourdomain.com'}
            </p>
          </div>

          <div>
            <Label>Required DKIM Record</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                value={dnsRecords.dkim.record}
                readOnly
                className="flex-1 font-mono text-sm"
                rows={3}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyRecord(dnsRecords.dkim.record, 'DKIM')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">How to add DKIM record:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Create a new TXT record in your DNS</li>
              <li>Set the name/host to: {dnsRecords.dkim.selector}._domainkey</li>
              <li>Paste the DKIM record above as the value</li>
              <li>Save and wait for DNS propagation</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* DMARC Record */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              DMARC Record (Recommended)
            </div>
            <Badge className={`gap-1 ${getStatusColor(dnsRecords.dmarc.status)}`}>
              {getStatusIcon(dnsRecords.dmarc.status)}
              {dnsRecords.dmarc.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Required DMARC Record</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                value={dnsRecords.dmarc.record}
                onChange={(e) => setDnsRecords(prev => ({
                  ...prev,
                  dmarc: { ...prev.dmarc, record: e.target.value }
                }))}
                className="flex-1 font-mono text-sm"
                rows={2}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyRecord(dnsRecords.dmarc.record, 'DMARC')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Host: _dmarc.{domain || 'yourdomain.com'}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium mb-2">DMARC Policy Options:</h4>
            <div className="text-sm space-y-1">
              <p><strong>p=none</strong> - Monitor only (recommended for testing)</p>
              <p><strong>p=quarantine</strong> - Mark suspicious emails as spam</p>
              <p><strong>p=reject</strong> - Reject unauthorized emails</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DNS Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Helpful DNS Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <a href="https://mxtoolbox.com/spf.aspx" target="_blank" rel="noopener noreferrer">
                <Search className="mr-2 h-4 w-4" />
                Check SPF Record
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a href="https://mxtoolbox.com/dkim.aspx" target="_blank" rel="noopener noreferrer">
                <Key className="mr-2 h-4 w-4" />
                Check DKIM Record
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a href="https://mxtoolbox.com/dmarc.aspx" target="_blank" rel="noopener noreferrer">
                <Shield className="mr-2 h-4 w-4" />
                Check DMARC Record
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a href="https://www.mail-tester.com" target="_blank" rel="noopener noreferrer">
                <CheckCircle className="mr-2 h-4 w-4" />
                Test Email Score
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
