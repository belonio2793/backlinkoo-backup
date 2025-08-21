import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2, Info, CheckCircle } from 'lucide-react';
import SimpleDNSInstructions from './SimpleDNSInstructions';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'active' | 'failed' | 'expired';
  created_at: string;
  dns_records?: string;
  is_publishing_platform?: boolean;
  pages_published?: number;
}

interface MinimalDomainsTableProps {
  domains: Domain[];
  validatingDomains: Set<string>;
  onValidate: (domainId: string) => void;
}

export default function MinimalDomainsTable({
  domains,
  validatingDomains,
  onValidate
}: MinimalDomainsTableProps) {
  const [showDNSInstructions, setShowDNSInstructions] = useState<{
    domain: string;
    records: any[];
  } | null>(null);
  const getStatusBadge = (domain: Domain) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending DNS' },
      validating: { variant: 'default' as const, label: 'Validating' },
      active: {
        variant: 'default' as const,
        label: domain.is_publishing_platform ? 'PBN Active' : 'Active',
        className: 'bg-green-100 text-green-800'
      },
      failed: { variant: 'destructive' as const, label: 'Failed' },
      expired: { variant: 'outline' as const, label: 'Expired' }
    };

    const config = statusConfig[domain.status];
    return (
      <Badge
        variant={config.variant}
        className={config.className}
      >
        {config.label}
      </Badge>
    );
  };

  const showDNS = (domain: Domain) => {
    if (domain.dns_records) {
      try {
        const records = JSON.parse(domain.dns_records);
        setShowDNSInstructions({
          domain: domain.domain,
          records
        });
      } catch (error) {
        console.error('Failed to parse DNS records:', error);
      }
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{domain.domain}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                      {domain.is_publishing_platform && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          PBN Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  {getStatusBadge(domain)}
                  {domain.pages_published && domain.pages_published > 0 && (
                    <div className="text-xs text-gray-500">
                      {domain.pages_published} posts published
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex gap-1">
                  {domain.dns_records && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showDNS(domain)}
                      className="text-xs"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      DNS
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onValidate(domain.id)}
                    disabled={validatingDomains.has(domain.id) || domain.status === 'active'}
                  >
                    {validatingDomains.has(domain.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : domain.status === 'active' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      'Validate'
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* DNS Instructions Modal */}
      {showDNSInstructions && (
        <SimpleDNSInstructions
          open={!!showDNSInstructions}
          onOpenChange={() => setShowDNSInstructions(null)}
          domain={showDNSInstructions.domain}
          dnsRecords={showDNSInstructions.records}
        />
      )}
    </>
  );
}
