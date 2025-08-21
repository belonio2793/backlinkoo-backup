import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

interface SimpleDNSInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  dnsRecords: DNSRecord[];
}

export default function SimpleDNSInstructions({
  open,
  onOpenChange,
  domain,
  dnsRecords
}: SimpleDNSInstructionsProps) {
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            DNS Setup for {domain}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Add these DNS records at your domain registrar to complete the setup for your PBN domain.
            </p>
          </div>

          {dnsRecords.map((record, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {record.type}
                    </span>
                    <span className="text-sm text-gray-600">Record</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(record.value, `${record.type} record value`)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Value
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <div className="font-mono bg-gray-50 p-2 rounded mt-1">
                        {record.name}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Value:</span>
                      <div className="font-mono bg-gray-50 p-2 rounded mt-1 break-all">
                        {record.value}
                      </div>
                    </div>
                  </div>
                  {record.ttl && (
                    <div className="text-xs text-gray-500">
                      TTL: {record.ttl} seconds (or use your registrar's default)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Add these DNS records at your domain registrar</li>
                  <li>Wait 5-15 minutes for DNS propagation</li>
                  <li>Click "Validate" to verify your domain setup</li>
                  <li>Once validated, your domain will be active in your PBN</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
