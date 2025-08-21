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
  const getStatusBadge = (domain: Domain) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      validating: { variant: 'default' as const, label: 'Validating' },
      active: { variant: 'default' as const, label: 'Active', className: 'bg-green-100 text-green-800' },
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

  return (
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
                  <div className="text-xs text-gray-500">
                    Added {new Date(domain.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </TableCell>
            
            <TableCell>
              {getStatusBadge(domain)}
            </TableCell>
            
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onValidate(domain.id)}
                disabled={validatingDomains.has(domain.id)}
              >
                {validatingDomains.has(domain.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
