import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Globe,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DNSVerificationProps {
  onStatusChange: (status: 'pending' | 'verified' | 'failed') => void;
  currentStatus?: 'pending' | 'verified' | 'failed';
}

export function DNSVerification({ onStatusChange, currentStatus = 'pending' }: DNSVerificationProps) {
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed'>(currentStatus);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // DNS records to verify
  const dnsRecords = [
    {
      type: 'TXT',
      name: '@',
      value: 'v=spf1 include:_spf.google.com ~all',
      purpose: 'SPF Record',
      status: status === 'verified' ? 'verified' : 'pending'
    },
    {
      type: 'TXT',
      name: 'default._domainkey',
      value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
      purpose: 'DKIM Record',
      status: status === 'verified' ? 'verified' : 'pending'
    },
    {
      type: 'TXT',
      name: '_dmarc',
      value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
      purpose: 'DMARC Policy',
      status: status === 'verified' ? 'verified' : 'pending'
    }
  ];

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "DNS record value copied successfully",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const checkDNSRecords = async () => {
    setIsChecking(true);
    
    // Simulate DNS checking
    setTimeout(() => {
      const newStatus = Math.random() > 0.3 ? 'verified' : 'failed';
      setStatus(newStatus);
      onStatusChange(newStatus);
      setIsChecking(false);
      
      toast({
        title: newStatus === 'verified' ? "DNS Verification Complete" : "DNS Verification Failed",
        description: newStatus === 'verified' 
          ? "All DNS records have been verified successfully"
          : "Some DNS records could not be verified. Please check your configuration.",
        variant: newStatus === 'verified' ? "default" : "destructive",
      });
    }, 2000);
  };

  const getStatusIcon = (recordStatus: string) => {
    switch (recordStatus) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (recordStatus: string) => {
    switch (recordStatus) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            DNS Authentication Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure these DNS records in your domain provider to authenticate your emails and improve deliverability.
              SPF, DKIM, and DMARC records help verify your identity and prevent spam.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {dnsRecords.map((record, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{record.type}</Badge>
                        <span className="font-medium">{record.purpose}</span>
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          <strong>Name/Host:</strong> {record.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Value:</strong>
                        </div>
                        <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                          {record.value}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(record.value)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={checkDNSRecords}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking DNS Records...' : 'Verify DNS Records'}
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <ExternalLink className="h-3 w-3" />
              DNS Lookup Tool
            </Button>
          </div>

          {status === 'verified' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All DNS records have been verified successfully! Your domain is now authenticated for email sending.
              </AlertDescription>
            </Alert>
          )}

          {status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some DNS records could not be verified. Please ensure all records are correctly configured in your DNS provider.
                DNS changes can take up to 48 hours to propagate globally.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
